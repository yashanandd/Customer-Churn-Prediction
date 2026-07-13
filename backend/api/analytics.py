from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
import pandas as pd
import numpy as np
import os
from typing import Optional, List

from models.database import get_db, User
from api.auth import get_current_user
from ml.trainer import predictor

router = APIRouter()
UPLOAD_DIR = "data/uploads"

@router.get("/kpi")
async def get_kpis(current_user: User = Depends(get_current_user)):
    file_path = os.path.join(UPLOAD_DIR, f"user_{current_user.id}_active.csv")
    if not os.path.exists(file_path):
        return {
            "total_customers": 0,
            "churn_rate": 0,
            "revenue_impact": 0,
            "retention_rate": 0
        }
        
    try:
        df = pd.read_csv(file_path)
        total_customers = len(df)
        
        churn_col = 'Churn' if 'Churn' in df.columns else None
        charges_col = 'TotalCharges' if 'TotalCharges' in df.columns else None
        
        churn_rate = 0
        revenue_impact = 0
        retention_rate = 100
        
        if churn_col:
            churn_series = df[churn_col].astype(str).str.strip().str.lower().map({
                'yes': 1, 'no': 0, 'true': 1, 'false': 0, '1': 1, '0': 0, '1.0': 1, '0.0': 0
            }).fillna(0)
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
    except Exception as e:
        return {
            "total_customers": 0,
            "churn_rate": 0,
            "revenue_impact": 0,
            "retention_rate": 0,
            "error": str(e)
        }

@router.get("/trends")
async def get_trends(current_user: User = Depends(get_current_user)):
    file_path = os.path.join(UPLOAD_DIR, f"user_{current_user.id}_active.csv")
    default_trends = [
        {"month": "Jan", "churn_rate": 2.5, "retention_rate": 97.5},
        {"month": "Feb", "churn_rate": 2.8, "retention_rate": 97.2},
        {"month": "Mar", "churn_rate": 3.1, "retention_rate": 96.9},
        {"month": "Apr", "churn_rate": 2.9, "retention_rate": 97.1},
        {"month": "May", "churn_rate": 2.4, "retention_rate": 97.6},
        {"month": "Jun", "churn_rate": 2.2, "retention_rate": 97.8},
    ]
    if not os.path.exists(file_path):
        return default_trends
        
    try:
        df = pd.read_csv(file_path)
        if 'tenure' in df.columns and 'Churn' in df.columns:
            df['Churn_val'] = df['Churn'].astype(str).str.strip().str.lower().map({
                'yes': 1, 'no': 0, 'true': 1, 'false': 0, '1': 1, '0': 0, '1.0': 1, '0.0': 0
            }).fillna(0)
            
            # Map tenure to bins to act as lifetime trends
            bins = [0, 12, 24, 36, 48, 60, 100]
            labels = ["0-12m", "13-24m", "25-36m", "37-48m", "49-60m", "60m+"]
            df['tenure_group'] = pd.cut(df['tenure'], bins=bins, labels=labels)
            
            trend_data = []
            grouped = df.groupby('tenure_group', observed=False)
            for name, group in grouped:
                if len(group) > 0:
                    c_rate = (group['Churn_val'].mean()) * 100
                    trend_data.append({
                        "month": str(name),
                        "churn_rate": round(c_rate, 2),
                        "retention_rate": round(100 - c_rate, 2)
                    })
            if len(trend_data) > 0:
                return trend_data
        return default_trends
    except Exception:
        return default_trends

@router.get("/departments")
async def get_department_churn(current_user: User = Depends(get_current_user)):
    file_path = os.path.join(UPLOAD_DIR, f"user_{current_user.id}_active.csv")
    default_depts = [
        {"department": "Sales", "churn": 12},
        {"department": "Support", "churn": 25},
        {"department": "Engineering", "churn": 5},
        {"department": "Marketing", "churn": 8},
        {"department": "Finance", "churn": 2},
    ]
    if not os.path.exists(file_path):
        return default_depts
        
    try:
        df = pd.read_csv(file_path)
        # Check Contract or InternetService to use as segments
        segment_col = None
        for col in ['Contract', 'InternetService', 'PaymentMethod']:
            if col in df.columns:
                segment_col = col
                break
                
        if segment_col and 'Churn' in df.columns:
            df['Churn_val'] = df['Churn'].astype(str).str.strip().str.lower().map({
                'yes': 1, 'no': 0, 'true': 1, 'false': 0, '1': 1, '0': 0, '1.0': 1, '0.0': 0
            }).fillna(0)
            
            # Sum churns per category
            grouped = df.groupby(segment_col)['Churn_val'].sum().reset_index()
            depts = []
            for _, row in grouped.iterrows():
                depts.append({
                    "department": str(row[segment_col]),
                    "churn": int(row['Churn_val'])
                })
            return depts
        return default_depts
    except Exception:
        return default_depts

@router.get("/customers")
async def get_customers(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
    search: str = Query("", description="Search by customer ID"),
    risk_segment: str = Query("", description="Filter by Low, Medium, High risk"),
    churn_status: str = Query("", description="Filter by Yes, No"),
    current_user: User = Depends(get_current_user)
):
    file_path = os.path.join(UPLOAD_DIR, f"user_{current_user.id}_active.csv")
    if not os.path.exists(file_path):
        return {"customers": [], "total": 0, "page": page, "limit": limit}
        
    try:
        df = pd.read_csv(file_path)
        
        # Ensure customerID exists, or create placeholder
        if 'customerID' not in df.columns:
            df['customerID'] = [f"CUST-{1000 + i}" for i in range(len(df))]
            
        # Get ML predictions in a batch
        try:
            predictions = predictor.predict_batch(df, user_id=current_user.id)
        except Exception:
            # Fallback if model not trained yet
            predictions = []
            for i in range(len(df)):
                prob = 0.15
                if 'Contract' in df.columns and df.iloc[i]['Contract'] == 'Month-to-month':
                    prob = 0.55
                if 'tenure' in df.columns and df.iloc[i]['tenure'] < 6:
                    prob = 0.75
                
                risk = "Low" if prob < 0.3 else "Medium" if prob < 0.7 else "High"
                predictions.append({
                    "probability": prob,
                    "prediction": 1 if prob >= 0.5 else 0,
                    "risk_segment": risk
                })
                
        # Merge predictions into df
        df['probability'] = [p['probability'] for p in predictions]
        df['prediction'] = [p['prediction'] for p in predictions]
        df['risk_segment'] = [p['risk_segment'] for p in predictions]
        
        # Filter by search term (customer ID)
        if search:
            df = df[df['customerID'].astype(str).str.contains(search.strip(), case=False)]
            
        # Filter by risk segment
        if risk_segment:
            df = df[df['risk_segment'] == risk_segment]
            
        # Filter by original churn label
        if churn_status:
            if 'Churn' in df.columns:
                df = df[df['Churn'].astype(str).str.lower() == churn_status.lower().strip()]
            else:
                status_int = 1 if churn_status.lower() == 'yes' else 0
                df = df[df['prediction'] == status_int]
                
        total_count = len(df)
        
        # Paginate
        start_idx = (page - 1) * limit
        end_idx = start_idx + limit
        paginated_df = df.iloc[start_idx:end_idx]
        
        customers = []
        for idx, row in paginated_df.iterrows():
            cust_dict = {
                "id": str(row['customerID']),
                "tenure": int(row['tenure']) if 'tenure' in row else 0,
                "monthly_charges": float(row['MonthlyCharges']) if 'MonthlyCharges' in row else 0.0,
                "total_charges": float(row['TotalCharges']) if 'TotalCharges' in row else 0.0,
                "contract": str(row['Contract']) if 'Contract' in row else "Unknown",
                "payment_method": str(row['PaymentMethod']) if 'PaymentMethod' in row else "Unknown",
                "probability": float(row['probability']),
                "prediction": int(row['prediction']),
                "risk_segment": str(row['risk_segment'])
            }
            # Add other dynamic columns if they exist
            if 'Churn' in row:
                cust_dict["actual_churn"] = str(row['Churn'])
            customers.append(cust_dict)
            
        return {
            "customers": customers,
            "total": total_count,
            "page": page,
            "limit": limit
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating customers list: {str(e)}")
