from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, status
from sqlalchemy.orm import Session
import pandas as pd
import io
import os
import shutil

from models.database import get_db, UploadRecord, User
from api.auth import get_current_user

router = APIRouter()

UPLOAD_DIR = "data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/")
async def upload_dataset(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed.")
        
    contents = await file.read()
    try:
        # Validate CSV contents
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        if len(df) == 0:
            raise HTTPException(status_code=400, detail="CSV file is empty.")
            
        # Clean filename to prevent path traversal
        safe_filename = os.path.basename(file.filename)
        
        # Save file specifically for this user
        user_file_path = os.path.join(UPLOAD_DIR, f"user_{current_user.id}_{safe_filename}")
        df.to_csv(user_file_path, index=False)
        
        # Copy to active dataset for this user
        active_file_path = os.path.join(UPLOAD_DIR, f"user_{current_user.id}_active.csv")
        shutil.copyfile(user_file_path, active_file_path)
        
        # Save upload history record in database
        record = UploadRecord(
            user_id=current_user.id,
            filename=safe_filename,
            row_count=len(df)
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        
        return {
            "message": "File uploaded and activated successfully",
            "record_id": record.id,
            "filename": safe_filename,
            "columns": list(df.columns),
            "rows": len(df),
            "preview": df.head(5).to_dict(orient="records")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@router.get("/history")
def get_upload_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = db.query(UploadRecord).filter(UploadRecord.user_id == current_user.id).order_by(UploadRecord.timestamp.desc()).all()
    return [
        {
            "id": r.id,
            "filename": r.filename,
            "row_count": r.row_count,
            "timestamp": r.timestamp.isoformat()
        }
        for r in records
    ]

@router.post("/select/{record_id}")
def select_active_dataset(
    record_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch record
    record = db.query(UploadRecord).filter(
        UploadRecord.id == record_id, 
        UploadRecord.user_id == current_user.id
    ).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Upload record not found.")
        
    user_file_path = os.path.join(UPLOAD_DIR, f"user_{current_user.id}_{record.filename}")
    active_file_path = os.path.join(UPLOAD_DIR, f"user_{current_user.id}_active.csv")
    
    if not os.path.exists(user_file_path):
        raise HTTPException(status_code=404, detail="Underlying file has been deleted from disk.")
        
    try:
        shutil.copyfile(user_file_path, active_file_path)
        return {"message": f"Activated dataset: {record.filename}", "filename": record.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to activate dataset: {str(e)}")
