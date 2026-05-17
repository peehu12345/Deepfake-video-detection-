from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
import os

try:
    from .auth import register_user, login_user, verify_token
    AUTH_AVAILABLE = True
except ImportError as e:
    print(f"Auth module import failed: {e}")
    AUTH_AVAILABLE = False
    register_user = None
    login_user = None
    verify_token = None

from .routes import router

app = FastAPI(root_path="/cryptoflow", title="Image+Audio+Video API", version="1.0.0")
origins = ["http://localhost:5173", "http://localhost:3000", "http://localhost:8080", "http://localhost:8081"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create media directory if not exists
os.makedirs("media/frames", exist_ok=True)
app.mount("/media", StaticFiles(directory="media"), name="media")

app.include_router(router)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

class UserRegister(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

@app.post("/register", tags=["Authentication"])
def register(user: UserRegister):
    if not AUTH_AVAILABLE:
        raise HTTPException(status_code=503, detail="Authentication service unavailable")
    try:
        uid = register_user(user.name, user.email, user.password)
        return {"message": "User registered", "uid": uid}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/login", tags=["Authentication"])
def login(user: UserLogin):
    if not AUTH_AVAILABLE:
        raise HTTPException(status_code=503, detail="Authentication service unavailable")
    try:
        token = login_user(user.email, user.password)
        return {"access_token": token, "token_type": "bearer"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/me", tags=["Authentication"])
def read_current_user(user_data: dict = Depends(verify_token)):
    if not AUTH_AVAILABLE:
        raise HTTPException(status_code=503, detail="Authentication service unavailable")
    return {"user": user_data}
