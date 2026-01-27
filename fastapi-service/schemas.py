from sqlmodel import SQLModel
from typing import Dict, Any
from pydantic import field_validator, Field
from models import JobType


# This is the "Input" model
# We only ask for the things we need to start a job.
class JobCreate(SQLModel):
    type: JobType
    priority: int  # We will validate 1-5 in the logic later, or here with validators
    payload: Dict[str, Any]

    # This function automatically runs whenever data is sent
    @field_validator('priority')
    @classmethod
    def validate_priority(cls, v: int) -> int:
        if not (1 <= v <= 5):
            raise ValueError('Priority must be between 1 and 5')
        return v
    
class JobUpdate(SQLModel):
    priority: int = Field(ge=1, le=5, description="New priority level (1-5)")
