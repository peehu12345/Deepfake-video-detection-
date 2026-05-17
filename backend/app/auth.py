from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer

try:
    import firebase_admin
    from firebase_admin import auth as firebase_auth
    from firebase_admin import credentials, firestore
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    firebase_admin = None
    firebase_auth = None
    credentials = None
    firestore = None

from datetime import datetime, timedelta

import jwt
from passlib.context import CryptContext

import os
import os

# ----------------- Firebase Setup -----------------
try:
    cred_path = os.path.join(os.getcwd(), "deepfakedetection-5e78b-firebase-adminsdk-fbsvc-ab67392f65.json")
    print(f"CWD: {os.getcwd()}")
    print(f"Cred path: {cred_path}")
    cred = credentials.Certificate(cred_path)
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("Firebase initialized successfully")
except Exception as e:
    print(f"Firebase initialization failed: {e}")
    db = None

# ----------------- JWT Setup -----------------
SECRET_KEY = "AMRITA@2136"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

# ----------------- Password Hashing -----------------
# Use only argon2 to avoid bcrypt errors
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def hash_password(password: str) -> str:
    # Debug: print password length before truncation
    print(f"Original password length: {len(password)}")
    if len(password) > 72:
        password = password[:72]
    # Debug: print password length after truncation
    print(f"Truncated password length: {len(password)}")
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# ----------------- JWT Helpers -----------------
def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str = Depends(oauth2_scheme)):
    """
    Dependency to verify JWT token and fetch user info from Firestore.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

        #fetch user info from Firestore
        user_doc = db.collection("users").document(user_id).get()
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found")

        return user_doc.to_dict()

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

#Mock Auth Functions (when Firebase is not available)
import json
MOCK_USERS_FILE = "mock_users.json"

def load_mock_users():
    try:
        with open(MOCK_USERS_FILE, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return {}

def save_mock_users():
    with open(MOCK_USERS_FILE, "w") as f:
        json.dump(mock_users, f)

mock_users = load_mock_users()

# ----------------- Auth Functions -----------------
def register_user(name: str, email: str, password: str):
    """
    Register user - stores user in Firestore if available, else in memory.
    """
    if db:
        user_ref = db.collection("users").document(email)
        if user_ref.get().exists:
            raise HTTPException(status_code=400, detail="Email already exists")
        hashed_pw = hash_password(password)
        user_data = {
            "uid": email,
            "name": name,
            "email": email,
            "password": hashed_pw,
            "created_at": str(datetime.utcnow())
        }
        user_ref.set(user_data)
        return email
    else:
        if email in mock_users:
            raise HTTPException(status_code=400, detail="Email already exists")
        hashed_pw = hash_password(password)
        user_id = str(len(mock_users) + 1)#ID generation
        mock_users[email] = {
            "uid": user_id,
            "name": name,
            "email": email,
            "password": hashed_pw,
            "created_at": str(datetime.utcnow())
        }
        save_mock_users()
        return user_id

def login_user(email: str, password: str):
    """
    Login user - checks credentials in Firestore if available, else in memory.
    """
    print(f"Login attempt for email: {email}")
    if db:
        print("Using Firestore")
        user_ref = db.collection("users").document(email)
        user_doc = user_ref.get()
        if not user_doc.exists:
            print("User not found in Firestore")
            raise HTTPException(status_code=404, detail="User not found")
        user_data = user_doc.to_dict()
        print(f"User data: {user_data}")
        if not verify_password(password, user_data["password"]):
            print("Invalid password")
            raise HTTPException(status_code=400, detail="Invalid password")
        token = create_access_token({
            "sub": user_data["uid"],
            "email": user_data["email"],
            "name": user_data["name"]
        })
        print("Login successful")
        return token
    else:
        print("Using mock users")
        if email not in mock_users:
            print("User not found in mock")
            raise HTTPException(status_code=404, detail="User not found")
        user_data = mock_users[email]
        if not verify_password(password, user_data["password"]):
            print("Invalid password in mock")
            raise HTTPException(status_code=400, detail="Invalid password")
        token = create_access_token({
            "sub": user_data["uid"],
            "email": user_data["email"],
            "name": user_data["name"]
        })
        print("Login successful in mock")
        return token
