from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

from api import upload, ml_pipeline, analytics
from models.database import engine, Base

# Create the database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Customer Churn Prediction API",
    description="API for uploading customer data and predicting churn.",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://customer-churn-prediction-plum-pi.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(upload.router, prefix="/api/upload", tags=["Upload"])
app.include_router(ml_pipeline.router, prefix="/api/ml", tags=["ML Pipeline"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Customer Churn Prediction API"}
