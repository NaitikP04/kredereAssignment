import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Optional, Any
from sqlmodel import SQLModel, Field
from sqlalchemy import JSON, Column, DateTime

# 1. Define our Enums (The allowed options)
class JobType(str, Enum):
    email = "email"
    report = "report"
    notification = "notification"

class JobStatus(str, Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"

# 2. Define the Table Model
class Job(SQLModel, table=True):
    # UUID is safer than integer IDs (1, 2, 3) for distributed systems
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    
    # We use sa_column for JSON because SQLModel needs a hint for complex types
    payload: dict = Field(default={}, sa_column=Column(JSON))
    
    # Priority 1-5
    priority: int = Field(default=1, index=True) 
    
    # Enums for strict type checking
    type: JobType = Field(index=True)
    status: JobStatus = Field(default=JobStatus.pending, index=True)
    
    # Output fields (nullable because they don't exist when job is created)
    result: Optional[dict] = Field(default=None, sa_column=Column(JSON))
    error: Optional[str] = Field(default=None)
    
    # Tracking fields
    attempts: int = Field(default=0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_column=Column(DateTime(timezone=True)))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), sa_column=Column(DateTime(timezone=True)))
    completed_at: Optional[datetime] = Field(default=None, sa_column=Column(DateTime(timezone=True)))
    
    # This might be null if the job isn't scheduled for the future
    scheduled_for: Optional[datetime] = Field(default=None, sa_column=Column(DateTime(timezone=True)))