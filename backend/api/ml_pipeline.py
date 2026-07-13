from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import pandas as pd
import os
from models.schema import TrainingMetrics, PredictionRequest, PredictionResponse, InsightsResponse
from models.database import User, PredictionRecord, get_db
from api.auth import get_current_user
from ml.trainer import predictor

router = APIRouter()
UPLOAD_DIR = "data/uploads"

@router.post("/train", response_model=TrainingMetrics)
async def train_model(
    model_type: str = "rf",
    current_user: User = Depends(get_current_user)
):
    file_path = os.path.join(UPLOAD_DIR, f"user_{current_user.id}_active.csv")
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=400, 
            detail="No active dataset found. Please upload a dataset on the upload page first."
        )
        
    try:
        df = pd.read_csv(file_path)
        metrics = predictor.train(df, model_type=model_type, user_id=current_user.id)
        return metrics
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")

@router.post("/predict", response_model=PredictionResponse)
async def predict_churn(
    request: PredictionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        result = predictor.predict(request.features, user_id=current_user.id)
        
        # Save prediction record to database history
        customer_id = str(request.features.get('customerID', 'SIM-CUST')).strip()
        record = PredictionRecord(
            user_id=current_user.id,
            customer_id=customer_id,
            probability=float(result["probability"]),
            prediction=int(result["prediction"]),
            risk_segment=str(result["risk_segment"])
        )
        db.add(record)
        db.commit()
            
        return PredictionResponse(
            probability=result["probability"],
            prediction=result["prediction"],
            risk_segment=result["risk_segment"],
            explanation=result.get("explanation", "Assessment calculated successfully.")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@router.get("/predictions")
def get_prediction_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = db.query(PredictionRecord).filter(
        PredictionRecord.user_id == current_user.id
    ).order_by(PredictionRecord.timestamp.desc()).limit(5).all()
    
    return [
        {
            "id": r.id,
            "timestamp": r.timestamp.isoformat(),
            "customer_id": r.customer_id,
            "probability": r.probability,
            "prediction": r.prediction,
            "risk_segment": r.risk_segment
        }
        for r in records
    ]

@router.get("/insights", response_model=InsightsResponse)
async def get_insights(current_user: User = Depends(get_current_user)):
    # Build somewhat dynamic insights if dataset is uploaded
    file_path = os.path.join(UPLOAD_DIR, f"user_{current_user.id}_active.csv")
    reasons = [
        "High monthly charges compared to competitors.",
        "Lack of contract lock-in (Month-to-month contracts).",
        "No tech support or online security services added."
    ]
    strategies = [
        "Offer a 15% discount on the next billing cycle.",
        "Proactively reach out to transition Month-to-month contracts to 1-Year plans.",
        "Bundle Tech Support and Online Security services at a discounted rate."
    ]
    
    if os.path.exists(file_path):
        try:
            df = pd.read_csv(file_path)
            if 'MonthlyCharges' in df.columns and 'Churn' in df.columns:
                df['Churn_numeric'] = df['Churn'].map({'Yes': 1, 'No': 0, 1: 1, 0: 0}).fillna(0)
                # Compute churn rates for Month-to-month vs others if Contract exists
                if 'Contract' in df.columns:
                    m2m_churn = df[df['Contract'] == 'Month-to-month']['Churn_numeric'].mean()
                    other_churn = df[df['Contract'] != 'Month-to-month']['Churn_numeric'].mean()
                    if m2m_churn > other_churn:
                        reasons[1] = f"Month-to-month contract churn is {round(m2m_churn * 100, 1)}% vs {round(other_churn * 100, 1)}% for longer contracts."
                        strategies[1] = "Target high-risk Month-to-month contracts with incentive-based annual lock-ins."
                
                # Check monthly charges
                mean_charges_churn = df[df['Churn_numeric'] == 1]['MonthlyCharges'].mean()
                mean_charges_active = df[df['Churn_numeric'] == 0]['MonthlyCharges'].mean()
                if mean_charges_churn > mean_charges_active:
                    reasons[0] = f"Churned customers pay higher average monthly charges (${round(mean_charges_churn, 2)}) than retained ones (${round(mean_charges_active, 2)})."
                    strategies[0] = "Trigger automatic review for customers whose monthly bills exceed $80 to suggest cost-effective plan adjustments."
        except Exception:
            pass # fallback to default insights

    return InsightsResponse(
        reasons=reasons,
        strategies=strategies
    )

@router.get("/metrics")
async def get_model_metrics(current_user: User = Depends(get_current_user)):
    try:
        predictor.load_model(user_id=current_user.id)
        if predictor.metrics:
            return predictor.metrics
        return {
            "accuracy": 0.8,
            "precision": 0.8,
            "recall": 0.8,
            "f1_score": 0.8,
            "model_type": "rf",
            "message": "Default fallback metrics. Re-train the model to capture fresh stats."
        }
    except Exception as e:
        # Fallback if no model exists yet
        return {
            "accuracy": 0.0,
            "precision": 0.0,
            "recall": 0.0,
            "f1_score": 0.0,
            "model_type": "None",
            "message": "No model has been trained for this account."
        }
