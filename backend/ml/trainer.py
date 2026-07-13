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
        self.metrics = None

    def preprocess_data(self, df: pd.DataFrame, is_training: bool = True) -> pd.DataFrame:
        df = df.copy()
        
        # Basic cleaning - drop customer ID if exists
        if 'customerID' in df.columns:
            df = df.drop('customerID', axis=1)
            
        # Convert TotalCharges to numeric, coerce errors to NaN and fill with 0
        if 'TotalCharges' in df.columns:
            df['TotalCharges'] = pd.to_numeric(df['TotalCharges'], errors='coerce').fillna(0)

        # Handle missing values
        num_cols = df.select_dtypes(include=[np.number]).columns
        for col in num_cols:
            mean_val = df[col].mean()
            df[col] = df[col].fillna(mean_val if not pd.isna(mean_val) else 0)
            
        cat_cols = df.columns.difference(num_cols)
        for col in cat_cols:
            mode_vals = df[col].mode()
            default_val = mode_vals[0] if len(mode_vals) > 0 else 'Unknown'
            df[col] = df[col].fillna(default_val)

        target_col = 'Churn'
        if is_training and target_col in df.columns:
            # Map various true/false text or numeric formats case-insensitively
            churn_mapped = df[target_col].astype(str).str.strip().str.lower()
            y = churn_mapped.map({
                'yes': 1, 'no': 0,
                'true': 1, 'false': 0,
                '1': 1, '0': 0,
                '1.0': 1, '0.0': 0
            })
            y = y.fillna(0).astype(int)
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

    def train(self, df: pd.DataFrame, model_type: str = "rf", user_id: int = None) -> TrainingMetrics:
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
        
        # Save metrics dictionary alongside model
        metrics_dict = {
            "accuracy": float(metrics.accuracy),
            "precision": float(metrics.precision),
            "recall": float(metrics.recall),
            "f1_score": float(metrics.f1_score),
            "model_type": str(metrics.model_type)
        }
        self.save_model(user_id, metrics_dict)
        return metrics

    def predict(self, data: dict, user_id: int = None) -> dict:
        self.load_model(user_id)
            
        df = pd.DataFrame([data])
        X = self.preprocess_data(df, is_training=False)
        
        prob = self.model.predict_proba(X)[0][1]
        pred = int(self.model.predict(X)[0])
        
        if prob < 0.3:
            risk = "Low"
            explanation = "Subscriber exhibits high profile stability, longer contract duration, and steady payment records."
        elif prob < 0.7:
            risk = "Medium"
            reasons = []
            if data.get('Contract') == 'Month-to-month':
                reasons.append("Month-to-month contract model")
            if float(data.get('MonthlyCharges', 0)) > 70:
                reasons.append(f"moderate billing rates (${data.get('MonthlyCharges')}/mo)")
            if int(data.get('tenure', 0)) < 12:
                reasons.append(f"short tenure ({data.get('tenure')} months)")
            explanation = "Moderate churn risk. Primary drivers: " + (", ".join(reasons) if reasons else "standard subscriber variables") + "."
        else:
            risk = "High"
            reasons = []
            if data.get('Contract') == 'Month-to-month':
                reasons.append("Month-to-month flexible plan")
            if float(data.get('MonthlyCharges', 0)) > 80:
                reasons.append(f"high billing charges (${data.get('MonthlyCharges')}/mo)")
            if int(data.get('tenure', 0)) < 6:
                reasons.append(f"very short tenure lifespan ({data.get('tenure')} months)")
            if data.get('TechSupport') == 'No':
                reasons.append("lack of tech support options")
            explanation = "High cancel hazard detected. Key churn indicators: " + (", ".join(reasons) if reasons else "tenure or billing attributes") + "."
            
        return {
            "probability": prob,
            "prediction": pred,
            "risk_segment": risk,
            "explanation": explanation
        }

    def predict_batch(self, df: pd.DataFrame, user_id: int = None) -> list:
        if self.model is None:
            self.load_model(user_id)
            
        X = self.preprocess_data(df, is_training=False)
        
        # Batch predict
        probs = self.model.predict_proba(X)[:, 1]
        preds = self.model.predict(X)
        
        results = []
        for i in range(len(df)):
            prob = float(probs[i])
            pred = int(preds[i])
            if prob < 0.3:
                risk = "Low"
            elif prob < 0.7:
                risk = "Medium"
            else:
                risk = "High"
            results.append({
                "probability": prob,
                "prediction": pred,
                "risk_segment": risk
            })
        return results

    def save_model(self, user_id: int = None, metrics: dict = None):
        filename = f"user_{user_id}_churn_model.joblib" if user_id else "churn_model.joblib"
        joblib.dump({
            'model': self.model,
            'scaler': self.scaler,
            'encoders': self.label_encoders,
            'features': self.features,
            'metrics': metrics
        }, os.path.join(MODEL_DIR, filename))

    def load_model(self, user_id: int = None):
        filename = f"user_{user_id}_churn_model.joblib" if user_id else "churn_model.joblib"
        path = os.path.join(MODEL_DIR, filename)
        if os.path.exists(path):
            data = joblib.load(path)
            self.model = data['model']
            self.scaler = data['scaler']
            self.label_encoders = data['encoders']
            self.features = data['features']
            self.metrics = data.get('metrics', None)
        else:
            raise Exception("Model not trained yet.")

# Global instance
predictor = ChurnPredictor()
