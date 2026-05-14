from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd
import io
import os

router = APIRouter()

UPLOAD_DIR = "data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/")
async def upload_dataset(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed.")
        
    contents = await file.read()
    try:
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        
        # Basic validation
        if len(df) == 0:
            raise HTTPException(status_code=400, detail="CSV file is empty.")
            
        file_path = os.path.join(UPLOAD_DIR, "dataset.csv")
        df.to_csv(file_path, index=False)
        
        return {
            "message": "File uploaded successfully",
            "columns": list(df.columns),
            "rows": len(df),
            "preview": df.head(5).to_dict(orient="records")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")
