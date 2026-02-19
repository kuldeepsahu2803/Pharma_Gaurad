# PharmaGuard AI 🧬

PharmaGuard AI is an AI-powered pharmacogenomic risk prediction system that transforms raw VCF files into actionable clinical decision support.

## 🏗 Architecture
```
VCF Upload (React) → FastAPI (Python) → cyvcf2 (Parsing) → 
CPIC Rules Engine → Gemini 3 (Reasoning) → JSON Response
```

## 🛠 Tech Stack
- **Frontend:** React + Vite + TypeScript + Tailwind
- **Backend:** FastAPI (Python 3.11)
- **Genomics:** cyvcf2 for high-speed VCF processing
- **AI:** Google Gemini 3 Flash

## 🚀 Deployment

### Backend (Render)
- **Root Directory:** `backend`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Frontend (Vercel)
- **Framework:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

## 🔐 Privacy
PharmaGuard AI follows a zero-retention policy. Genomic data is processed in-memory and never stored.
