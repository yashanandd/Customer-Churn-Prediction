from fastapi import APIRouter, HTTPException
import pandas as pd
import os
from models.schema import TrainingMetrics, PredictionRequest, PredictionResponse, InsightsResponse
from ml.trainer import predictor

router = APIRouter()
UPLOAD_DIR = "data/uploads"

@router.post("/train", response_model=TrainingMetrics)
async def train_model(model_type: str = "rf"):
    file_path = os.path.join(UPLOAD_DIR, "dataset.csv")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=400, detail="No dataset uploaded. Please upload a dataset first.")
        
    try:
        df = pd.read_csv(file_path)
        metrics = predictor.train(df, model_type=model_type)
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

@router.post("/predict", response_model=PredictionResponse)
async def predict_churn(request: PredictionRequest):
    try:
        result = predictor.predict(request.features)
        
        # Simple rule-based explanation
        explanation = "Customer shows typical retention patterns."
        if result["prediction"] == 1:
            explanation = "High risk of churn due to recent feature usage and tenure."
            
        return PredictionResponse(
            probability=result["probability"],
            prediction=result["prediction"],
            risk_segment=result["risk_segment"],
            explanation=explanation
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@router.get("/insights", response_model=InsightsResponse)
async def get_insights():
    # Placeholder for AI Insights, normally this would call an LLM API
    return InsightsResponse(
        reasons=[
            "High monthly charges compared to competitors.",
            "Lack of engagement in the last 30 days.",
            "Customer support tickets unresolved for over 48 hours."
        ],
        strategies=[
            "Offer a 15% discount on the next billing cycle.",
            "Proactively reach out via a customer success manager.",
            "Suggest downgrading to a more suitable plan to reduce costs."
        ]
    )
