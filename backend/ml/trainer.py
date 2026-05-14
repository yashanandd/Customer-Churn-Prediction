import pandas as pd
import numpy as np
import os
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from models.schema import TrainingMetrics

MODEL_DIR = "data/models"
os.makedirs(MODEL_DIR, exist_ok=True)

class ChurnPredictor:
    def __init__(self):
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.features = []

    def preprocess_data(self, df: pd.DataFrame, is_training: bool = True) -> pd.DataFrame:
        df = df.copy()
        
        # Basic cleaning - drop customer ID if exists
        if 'customerID' in df.columns:
            df = df.drop('customerID', axis=1)
            
        # Convert TotalCharges to numeric, coerce errors to NaN and fill with 0
        if 'TotalCharges' in df.columns:
            df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce').fillna(0)

        # Handle missing values
        for col in df.select_dtypes(include=['float64', 'int64']).columns:
            df[col] = df[col].fillna(df[col].mean())
            
        for col in df.select_dtypes(include=['object']).columns:
            df[col] = df[col].fillna(df[col].mode()[0])

        target_col = 'Churn'
        if is_training and target_col in df.columns:
            # Map Yes/No to 1/0
            df[target_col] = df[target_col].map({'Yes': 1, 'No': 0, 1: 1, 0: 0})
            y = df[target_col]
            X = df.drop(target_col, axis=1)
        else:
            X = df
            y = None

        # Encode categorical variables
        for col in X.select_dtypes(include=['object']).columns:
            if is_training:
                le = LabelEncoder()
                X[col] = le.fit_transform(X[col].astype(str))
                self.label_encoders[col] = le
            else:
                if col in self.label_encoders:
                    # Handle unseen categories by using a default or transforming carefully
                    le = self.label_encoders[col]
                    X[col] = X[col].map(lambda s: s if s in le.classes_ else le.classes_[0])
                    X[col] = le.transform(X[col].astype(str))
                else:
                    X[col] = 0 # Default if unknown column

        if is_training:
            self.features = list(X.columns)
            X_scaled = self.scaler.fit_transform(X)
        else:
            # Reorder features to match training
            for col in self.features:
                if col not in X.columns:
                    X[col] = 0
            X = X[self.features]
            X_scaled = self.scaler.transform(X)

        if is_training:
            return X_scaled, y
        return X_scaled

    def train(self, df: pd.DataFrame, model_type: str = "rf") -> TrainingMetrics:
        X, y = self.preprocess_data(df, is_training=True)
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        if model_type == "lr":
            self.model = LogisticRegression(random_state=42)
        else:
            self.model = RandomForestClassifier(n_estimators=100, random_state=42)
            
        self.model.fit(X_train, y_train)
        
        y_pred = self.model.predict(X_test)
        
        metrics = TrainingMetrics(
            accuracy=accuracy_score(y_test, y_pred),
            precision=precision_score(y_test, y_pred, zero_division=0),
            recall=recall_score(y_test, y_pred, zero_division=0),
            f1_score=f1_score(y_test, y_pred, zero_division=0),
            model_type=model_type
        )
        
        self.save_model()
        return metrics

    def predict(self, data: dict) -> dict:
        if self.model is None:
            self.load_model()
            
        df = pd.DataFrame([data])
        X = self.preprocess_data(df, is_training=False)
        
        prob = self.model.predict_proba(X)[0][1]
        pred = int(self.model.predict(X)[0])
        
        if prob < 0.3:
            risk = "Low"
        elif prob < 0.7:
            risk = "Medium"
        else:
            risk = "High"
            
        return {
            "probability": prob,
            "prediction": pred,
            "risk_segment": risk
        }

    def save_model(self):
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'encoders': self.label_encoders,
            'features': self.features
        }, os.path.join(MODEL_DIR, "churn_model.joblib"))

    def load_model(self):
        path = os.path.join(MODEL_DIR, "churn_model.joblib")
        if os.path.exists(path):
            data = joblib.load(path)
            self.model = data['model']
            self.scaler = data['scaler']
            self.label_encoders = data['encoders']
            self.features = data['features']
        else:
            raise Exception("Model not trained yet.")

# Global instance
predictor = ChurnPredictor()
try:
    predictor.load_model()
except:
    pass
