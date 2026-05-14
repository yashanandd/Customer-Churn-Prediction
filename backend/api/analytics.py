from fastapi import APIRouter
import pandas as pd
import os
import random

router = APIRouter()
UPLOAD_DIR = "data/uploads"

@router.get("/kpi")
async def get_kpis():
    file_path = os.path.join(UPLOAD_DIR, "dataset.csv")
    if not os.path.exists(file_path):
        return {
            "total_customers": 0,
            "churn_rate": 0,
            "revenue_impact": 0,
            "retention_rate": 0
        }
        
    df = pd.read_csv(file_path)
    total_customers = len(df)
    
    # Assuming 'Churn' and 'TotalCharges' columns exist, adjust accordingly
    churn_col = 'Churn' if 'Churn' in df.columns else None
    charges_col = 'TotalCharges' if 'TotalCharges' in df.columns else None
    
    churn_rate = 0
    revenue_impact = 0
    retention_rate = 100
    
    if churn_col:
        # Normalize churn to 1/0
        churn_series = df[churn_col].map({'Yes': 1, 'No': 0, 1: 1, 0: 0}).fillna(0)
        churned_customers = churn_series.sum()
        churn_rate = (churned_customers / total_customers) * 100 if total_customers > 0 else 0
        retention_rate = 100 - churn_rate
        
        if charges_col:
            df[charges_col] = pd.to_numeric(df[charges_col], errors='coerce').fillna(0)
            revenue_impact = df[churn_series == 1][charges_col].sum()
            
    return {
        "total_customers": total_customers,
        "churn_rate": round(churn_rate, 2),
        "revenue_impact": round(revenue_impact, 2),
        "retention_rate": round(retention_rate, 2)
    }

@router.get("/trends")
async def get_trends():
    # Mock data for demonstration purposes
    return [
        {"month": "Jan", "churn_rate": 2.5, "retention_rate": 97.5},
        {"month": "Feb", "churn_rate": 2.8, "retention_rate": 97.2},
        {"month": "Mar", "churn_rate": 3.1, "retention_rate": 96.9},
        {"month": "Apr", "churn_rate": 2.9, "retention_rate": 97.1},
        {"month": "May", "churn_rate": 2.4, "retention_rate": 97.6},
        {"month": "Jun", "churn_rate": 2.2, "retention_rate": 97.8},
    ]

@router.get("/departments")
async def get_department_churn():
    # Mock data for demonstration purposes
    return [
        {"department": "Sales", "churn": 12},
        {"department": "Support", "churn": 25},
        {"department": "Engineering", "churn": 5},
        {"department": "Marketing", "churn": 8},
        {"department": "Finance", "churn": 2},
    ]
