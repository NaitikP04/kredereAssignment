from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from database import get_session
from models import Job, JobStatus
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
    status: JobStatus = None, # Optional query param: ?status=pending
    limit: int = 10,          # Pagination: how many to show
    offset: int = 0,          # Pagination: where to start
    session: AsyncSession = Depends(get_session)
):
    """
    List jobs with optional filtering by status and pagination.
    """
    # Start building the query
    query = select(Job)
    
    # If the user provided a status (e.g., /jobs?status=pending), add that filter
    if status:
        query = query.where(Job.status == status)
        
    # Add pagination and ordering (newest first)
    query = query.offset(offset).limit(limit).order_by(Job.created_at.desc())
    
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