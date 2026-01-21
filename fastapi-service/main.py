from contextlib import asynccontextmanager
from fastapi import FastAPI
from sqlmodel import SQLModel
from database import engine
from routes import router
# We import models so SQLModel "knows" about the Job class before creating tables
import models 

# 1. The Lifespan Context Manager
# This runs code before the app starts accepting requests
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Startup: Creating database tables...")
    async with engine.begin() as conn:
        # This looks at all SQLModel classes imported and creates tables for them
        await conn.run_sync(SQLModel.metadata.create_all)
    print("Startup: Tables created successfully!")
    yield
    # (Code here would run when the app shuts down)

# 2. Initialize the App
app = FastAPI(
    title="Job Queue Manager",
    description="API for submitting and tracking jobs",
    lifespan=lifespan
)

app.include_router(router)

# 3. A Simple Health Check Endpoint
@app.get("/")
async def root():
    return {"status": "System is Online", "service": "FastAPI Manager"}