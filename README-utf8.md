# 🚀 Project Setup Guide
1. Clone the Repository
git clone https://github.com/peehu12345/Deepfake-video-detection-.git
cd Deepfake-video-detection-
## 🧠 Backend Setup (FastAPI)

### 1️⃣ Go to Backend Folder
```bash
cd backend
2️⃣ Create Virtual Environment

Windows:

python -m venv venv


Mac / Linux:

python3 -m venv venv

3️⃣ Activate Virtual Environment

Windows:

.\venv\Scripts\activate


Mac / Linux:

source venv/bin/activate

4️⃣ Install Dependencies
pip install -r requirements.txt


If you don’t have a requirements.txt yet, install manually:

pip install fastapi uvicorn

5️⃣ Run Backend Server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000


Backend will run on 👉 http://localhost:8000

💻 Frontend Setup (React + Vite + Tailwind)
1️⃣ Go to Frontend Folder
cd cryptoflow-1.0.0

2️⃣ Install Dependencies
npm install

3️⃣ Run Development Server
npm run dev


Frontend will run on 👉 http://localhost:5173
