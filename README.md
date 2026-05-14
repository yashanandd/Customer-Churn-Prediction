# AI Customer Churn Prediction Dashboard

A full-stack, AI-powered customer churn prediction dashboard with a premium modern UI/UX, built with React, FastAPI, and Scikit-Learn.

## Tech Stack
- **Frontend:** React (Vite), Tailwind CSS, Framer Motion, Recharts, Lucide Icons
- **Backend:** FastAPI, Python 3
- **Machine Learning:** Scikit-learn, Pandas
- **Database:** SQLite (via SQLAlchemy)

## Features
- 📊 Premium Dashboard with Glassmorphism UI
- 📈 Real-time Analytics and Recharts Visualizations
- 🤖 Scikit-Learn Machine Learning Pipeline (Random Forest / Logistic Regression)
- 📁 Drag-and-drop CSV dataset upload
- 💡 Automated AI Insights for Churn Prevention

## Setup Instructions

### 1. Backend Setup

Open a terminal and navigate to the backend directory:
```bash
cd "Customer Churn Prediction/backend"
```

Activate the virtual environment:
```bash
.\venv\Scripts\activate  # On Windows
# source venv/bin/activate  # On Mac/Linux
```

Start the FastAPI server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
The backend API will be running at `http://localhost:8000`.

### 2. Frontend Setup

Open a new terminal and navigate to the frontend directory:
```bash
cd "Customer Churn Prediction/frontend"
```

Start the Vite development server:
```bash
npm run dev
```
The application will be accessible at `http://localhost:5173`.

## Usage
1. Open the application in your browser.
2. Go to the **Data Upload** tab and drag & drop a customer churn dataset (e.g., Telco Customer Churn CSV).
3. Wait for the file to upload and the ML model to train. The accuracy metrics will be displayed.
4. Navigate back to the **Dashboard** to view the KPIs, trends, and AI-generated insights based on the uploaded data.
