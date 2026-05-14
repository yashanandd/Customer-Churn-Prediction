from pydantic import BaseModel
from typing import Optional, Dict, Any, List

class PredictionRequest(BaseModel):
    features: Dict[str, Any]

class PredictionResponse(BaseModel):
    probability: float
    prediction: int
    risk_segment: str
    explanation: Optional[str] = None

class TrainingMetrics(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    model_type: str

class InsightsResponse(BaseModel):
    reasons: List[str]
    strategies: List[str]
