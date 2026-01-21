from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from typing import AsyncGenerator

# 1. The Connection String
# For now, we point to "localhost". Later, when we use Docker, 
# we will change this to point to the docker container name.
# Format: postgresql+asyncpg://user:password@host:port/database_name
DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/taskqueue"

# 2. Create the Async Engine
# echo=True prints the raw SQL to the terminal (great for debugging/learning)
engine = create_async_engine(DATABASE_URL, echo=True)

# 3. Create the Session Factory
# This produces the "sessions" (temporary connections) we use in every request
async_session = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

# 4. The Dependency Function
# In FastAPI, we don't open one global connection.
# Instead, every single request gets its own fresh session, 
# uses it, and then closes it automatically.
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session