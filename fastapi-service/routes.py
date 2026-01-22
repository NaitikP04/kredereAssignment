from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import String
from sqlmodel import Session, select, col, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import cast, String
from typing import List, Optional
from datetime import datetime

from database import get_session
from models import Job, JobStatus, JobType
from schemas import JobCreate

# Create the router
router = APIRouter()

@router.post("/jobs", response_model=Job, status_code=201)
async def create_job(
    job_data: JobCreate, 
    session: AsyncSession = Depends(get_session)
):
    """
    Create a new job with type, payload, and priority.
    """
    # Create the DB model from the Input model
    # "model_dump()" converts the Pydantic model to a standard dictionary
    new_job = Job(
        type=job_data.type,
        priority=job_data.priority,
        payload=job_data.payload,
        status=JobStatus.pending, # Force status to pending
    )
    
    # Add to the "staging area"
    session.add(new_job)
    
    # Commit (Save to DB)
    await session.commit()
    
    # Refresh (Update our object with ID and Timestamps from DB)
    await session.refresh(new_job)
    
    return new_job

@router.get("/jobs", response_model=List[Job])
async def list_jobs(
    status: Optional[List[JobStatus]] = Query(default=None), # Optional query param: ?status=pending
    type: Optional[List[JobType]] = Query(default=None),     # Optional query param: ?type=type_a
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    search: Optional[str] = None,     # Optional query param: ?search=keyword
    sort_by: Optional[str] = Query(default="created_at"),    # Sort column
    sort_order: Optional[str] = Query(default="desc"),       # Sort direction: asc or desc
    limit: int = Query(default=10, le=100),          # limit results to 10 by default, max 100
    offset: int = 0,          # Pagination: where to start
    session: AsyncSession = Depends(get_session)
):
    """
    List jobs with filtering by status, type, search keyword, and pagination.
    """
    # Start building the query
    query = select(Job)
    
    # If the user provided a status (e.g., /jobs?status=pending), add that filter
    if status:
        query = query.where(Job.status.in_(status))

    # If the user provided a type (e.g., /jobs?type=type_a), add that filter
    if type:
        query = query.where(Job.type.in_(type))
    
    # If the user provided a search keyword, filter by ID or payload content
    if search:
        # We cast the JSON payload to text to search inside it
        query = query.where(
            or_(
                cast(Job.id, String).ilike(f"%{search}%"),
                cast(Job.payload, String).ilike(f"%{search}%")
            )
        )
    
    if start_date:
        query = query.where(Job.created_at >= start_date)
    
    if end_date:
        query = query.where(Job.created_at <= end_date)
    
    # Dynamic sorting
    sort_column_map = {
        "created_at": Job.created_at,
        "priority": Job.priority,
        "status": Job.status,
        "type": Job.type,
    }
    sort_column = sort_column_map.get(sort_by, Job.created_at)
    if sort_order == "asc":
        query = query.order_by(sort_column.asc())
    else:
        query = query.order_by(sort_column.desc())
        
    query = query.offset(offset).limit(limit)
    
    # Execute the query
    result = await session.execute(query)
    return result.scalars().all()

@router.get("/jobs/{job_id}", response_model=Job)
async def get_job(
    job_id: str, # We use str because UUIDs come in as strings in the URL
    session: AsyncSession = Depends(get_session)
):
    """
    Get detailed information about a specific job.
    """
    # Need to convert string ID to UUID object for the DB lookup
    # We use .get() which is a shortcut for "find by primary key"
    job = await session.get(Job, job_id)
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    return job

@router.delete("/jobs/{job_id}", status_code=204)
async def cancel_job(
    job_id: str,
    session: AsyncSession = Depends(get_session)
):
    """
    Cancel a pending job.
    """
    job = await session.get(Job, job_id)
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    # Business Logic Rule: Can only cancel if PENDING
    if job.status != JobStatus.pending:
        raise HTTPException(
            status_code=400, 
            detail="Cannot cancel job that is already processing or completed"
        )
        
    await session.delete(job)
    await session.commit()
    return None