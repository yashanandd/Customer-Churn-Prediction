from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
import datetime
import os

# Create data directory if it doesn't exist
os.makedirs("data", exist_ok=True)

SQLALCHEMY_DATABASE_URL = "sqlite:///./data/churn.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# We can define models here if we want to store individual predictions
class PredictionRecord(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    # We could store JSON of features here
    customer_id = Column(String, index=True)
    probability = Column(Float)
    prediction = Column(Integer) # 0 for No Churn, 1 for Churn
    risk_segment = Column(String) # Low, Medium, High

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
