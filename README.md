# CyberShield AI - Task Scam & Fake Job Offer Detector
**CT BuildFest 2.0 | Problem Statement: CTBF-AI-11**
**Track:** AI & Intelligent Systems | **Theme:** Consumer Protection & Public Safety

## Team
| Member | Role | Branch |
|--------|------|--------|
| Prabhat | Backend Lead (Express + MongoDB + Gemini) | `feat/backend` |
| Member 2 | Frontend Lead (React + UI) | `feat/frontend` |
| Member 3 | Verification & Integrations | `feat/verification` |
| Member 4 | Data, QA & Presentation | `feat/data-qa` |

## Tech Stack
- **Frontend:** React 18, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas
- **AI Engine:** Google Gemini API + Python Microservice
- **Version Control:** Git (Branch Strategy: `main` → `dev` → `feat/*`)

## Branch Strategy
```
main          ← Protected. Working demo-ready code only.
dev           ← Integration branch. Merge feat/* here first.
feat/backend        ← Prabhat: Express API + MongoDB + Gemini
feat/frontend       ← Member 2: React dashboard
feat/verification   ← Member 3: MCA check + 1930 dossier
feat/data-qa        ← Member 4: Test datasets + QA
```

## Setup Instructions
```bash
git clone https://github.com/Prabhat-d/Task-Scam-Fake-Job-detector.git
cd Task-Scam-Fake-Job-detector
git checkout dev

# Switch to your branch
git checkout feat/backend   # or your assigned branch
```

## Running Locally
```bash
# Backend
cd backend
npm install
npm run dev    # Starts on http://localhost:5000

# Frontend
cd frontend
npm install
npm start      # Starts on http://localhost:3000
```

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/scan` | Analyze chat text or offer letter |
| GET | `/api/reports` | Get scan history from MongoDB |
| POST | `/api/dossier/generate` | Generate 1930 cybercrime dossier |
| GET | `/api/health` | Server health check |

## CT BuildFest Rules Compliance
- ✅ AI tools cited in documentation (Gemini API)
- ✅ Regular commits with meaningful messages
- ✅ `.env` excluded from repository (`.gitignore`)
