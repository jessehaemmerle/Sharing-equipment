from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import bcrypt
import jwt
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = "toala_secret_key_2024"
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# Create the main app without a prefix
app = FastAPI(title="Toala.at Equipment Lending API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Enums
class RequestStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    declined = "declined"
    completed = "completed"

class EquipmentCategory(str, Enum):
    power_tools = "power_tools"
    lawn_equipment = "lawn_equipment"
    welding_equipment = "welding_equipment"
    construction_tools = "construction_tools"
    automotive = "automotive"
    household = "household"
    other = "other"

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    password_hash: str
    phone: Optional[str] = None
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    avatar: Optional[str] = None  # base64 image

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    phone: Optional[str] = None
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    phone: Optional[str] = None
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime
    avatar: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class Equipment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    owner_id: str
    title: str
    description: str
    category: EquipmentCategory
    price_per_day: float
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    images: List[str] = []  # base64 images, max 10
    availability_calendar: Dict[str, bool] = {}  # date string -> available
    min_rental_days: int = 1
    max_rental_days: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_available: bool = True

class EquipmentCreate(BaseModel):
    title: str
    description: str
    category: EquipmentCategory
    price_per_day: float
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    images: List[str] = []
    min_rental_days: int = 1
    max_rental_days: Optional[int] = None

class EquipmentResponse(BaseModel):
    id: str
    owner_id: str
    owner_name: str
    title: str
    description: str
    category: EquipmentCategory
    price_per_day: float
    location: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    images: List[str] = []
    min_rental_days: int
    max_rental_days: Optional[int] = None
    created_at: datetime
    is_available: bool

class RentalRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    equipment_id: str
    requester_id: str
    owner_id: str
    start_date: datetime
    end_date: datetime
    total_price: float
    message: str
    status: RequestStatus = RequestStatus.pending
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class RentalRequestCreate(BaseModel):
    equipment_id: str
    start_date: datetime
    end_date: datetime
    message: str

class RentalRequestResponse(BaseModel):
    id: str
    equipment_id: str
    equipment_title: str
    requester_id: str
    requester_name: str
    owner_id: str
    owner_name: str
    start_date: datetime
    end_date: datetime
    total_price: float
    message: str
    status: RequestStatus
    created_at: datetime
    updated_at: datetime

class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str
    recipient_id: str
    request_id: str
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    read: bool = False

class MessageCreate(BaseModel):
    recipient_id: str
    request_id: str
    content: str

class MessageResponse(BaseModel):
    id: str
    sender_id: str
    sender_name: str
    recipient_id: str
    recipient_name: str
    request_id: str
    content: str
    timestamp: datetime
    read: bool

# Utility functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user)

# Authentication routes
@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user = User(
        email=user_data.email,
        name=user_data.name,
        password_hash=hash_password(user_data.password),
        phone=user_data.phone,
        location=user_data.location,
        latitude=user_data.latitude,
        longitude=user_data.longitude
    )
    
    await db.users.insert_one(user.dict())
    
    # Create access token
    access_token = create_access_token(data={"sub": user.id})
    user_response = UserResponse(**user.dict())
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@api_router.post("/auth/login", response_model=Token)
async def login(login_data: UserLogin):
    user = await db.users.find_one({"email": login_data.email})
    if not user or not verify_password(login_data.password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    access_token = create_access_token(data={"sub": user["id"]})
    user_response = UserResponse(**user)
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return UserResponse(**current_user.dict())

# Equipment routes
@api_router.post("/equipment", response_model=EquipmentResponse)
async def create_equipment(equipment_data: EquipmentCreate, current_user: User = Depends(get_current_user)):
    # Validate images (max 10)
    if len(equipment_data.images) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 images allowed")
    
    equipment = Equipment(
        owner_id=current_user.id,
        **equipment_data.dict()
    )
    
    await db.equipment.insert_one(equipment.dict())
    
    return EquipmentResponse(
        **equipment.dict(),
        owner_name=current_user.name
    )

@api_router.get("/equipment", response_model=List[EquipmentResponse])
async def get_equipment(
    category: Optional[EquipmentCategory] = None,
    location: Optional[str] = None,
    max_price: Optional[float] = None,
    skip: int = 0,
    limit: int = 20
):
    query = {"is_available": True}
    
    if category:
        query["category"] = category
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    if max_price:
        query["price_per_day"] = {"$lte": max_price}
    
    equipment_list = await db.equipment.find(query).skip(skip).limit(limit).to_list(limit)
    
    # Add owner names
    result = []
    for equipment in equipment_list:
        owner = await db.users.find_one({"id": equipment["owner_id"]})
        equipment_response = EquipmentResponse(
            **equipment,
            owner_name=owner["name"] if owner else "Unknown"
        )
        result.append(equipment_response)
    
    return result

@api_router.get("/equipment/{equipment_id}", response_model=EquipmentResponse)
async def get_equipment_by_id(equipment_id: str):
    equipment = await db.equipment.find_one({"id": equipment_id})
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    owner = await db.users.find_one({"id": equipment["owner_id"]})
    return EquipmentResponse(
        **equipment,
        owner_name=owner["name"] if owner else "Unknown"
    )

@api_router.get("/my-equipment", response_model=List[EquipmentResponse])
async def get_my_equipment(current_user: User = Depends(get_current_user)):
    equipment_list = await db.equipment.find({"owner_id": current_user.id}).to_list(100)
    
    result = []
    for equipment in equipment_list:
        equipment_response = EquipmentResponse(
            **equipment,
            owner_name=current_user.name
        )
        result.append(equipment_response)
    
    return result

# Rental request routes
@api_router.post("/requests", response_model=RentalRequestResponse)
async def create_rental_request(request_data: RentalRequestCreate, current_user: User = Depends(get_current_user)):
    # Get equipment details
    equipment = await db.equipment.find_one({"id": request_data.equipment_id})
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")
    
    if equipment["owner_id"] == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot request your own equipment")
    
    # Calculate total price
    days = (request_data.end_date - request_data.start_date).days + 1
    total_price = days * equipment["price_per_day"]
    
    rental_request = RentalRequest(
        equipment_id=request_data.equipment_id,
        requester_id=current_user.id,
        owner_id=equipment["owner_id"],
        start_date=request_data.start_date,
        end_date=request_data.end_date,
        total_price=total_price,
        message=request_data.message
    )
    
    await db.rental_requests.insert_one(rental_request.dict())
    
    # Get owner and equipment details for response
    owner = await db.users.find_one({"id": equipment["owner_id"]})
    
    return RentalRequestResponse(
        **rental_request.dict(),
        equipment_title=equipment["title"],
        requester_name=current_user.name,
        owner_name=owner["name"] if owner else "Unknown"
    )

@api_router.get("/requests/received", response_model=List[RentalRequestResponse])
async def get_received_requests(current_user: User = Depends(get_current_user)):
    requests = await db.rental_requests.find({"owner_id": current_user.id}).to_list(100)
    
    result = []
    for request in requests:
        equipment = await db.equipment.find_one({"id": request["equipment_id"]})
        requester = await db.users.find_one({"id": request["requester_id"]})
        
        request_response = RentalRequestResponse(
            **request,
            equipment_title=equipment["title"] if equipment else "Unknown",
            requester_name=requester["name"] if requester else "Unknown",
            owner_name=current_user.name
        )
        result.append(request_response)
    
    return result

@api_router.get("/requests/sent", response_model=List[RentalRequestResponse])
async def get_sent_requests(current_user: User = Depends(get_current_user)):
    requests = await db.rental_requests.find({"requester_id": current_user.id}).to_list(100)
    
    result = []
    for request in requests:
        equipment = await db.equipment.find_one({"id": request["equipment_id"]})
        owner = await db.users.find_one({"id": request["owner_id"]})
        
        request_response = RentalRequestResponse(
            **request,
            equipment_title=equipment["title"] if equipment else "Unknown",
            requester_name=current_user.name,
            owner_name=owner["name"] if owner else "Unknown"
        )
        result.append(request_response)
    
    return result

@api_router.put("/requests/{request_id}/status")
async def update_request_status(request_id: str, status: RequestStatus, current_user: User = Depends(get_current_user)):
    request = await db.rental_requests.find_one({"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    # Only owner can update status
    if request["owner_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this request")
    
    await db.rental_requests.update_one(
        {"id": request_id},
        {"$set": {"status": status, "updated_at": datetime.utcnow()}}
    )
    
    return {"message": f"Request status updated to {status}"}

# Message routes
@api_router.post("/messages", response_model=MessageResponse)
async def send_message(message_data: MessageCreate, current_user: User = Depends(get_current_user)):
    # Verify request exists and user is part of it
    request = await db.rental_requests.find_one({"id": message_data.request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if current_user.id not in [request["owner_id"], request["requester_id"]]:
        raise HTTPException(status_code=403, detail="Not authorized to message in this request")
    
    message = Message(
        sender_id=current_user.id,
        recipient_id=message_data.recipient_id,
        request_id=message_data.request_id,
        content=message_data.content
    )
    
    await db.messages.insert_one(message.dict())
    
    # Get recipient details
    recipient = await db.users.find_one({"id": message_data.recipient_id})
    
    return MessageResponse(
        **message.dict(),
        sender_name=current_user.name,
        recipient_name=recipient["name"] if recipient else "Unknown"
    )

@api_router.get("/messages/{request_id}", response_model=List[MessageResponse])
async def get_messages(request_id: str, current_user: User = Depends(get_current_user)):
    # Verify user is part of the request
    request = await db.rental_requests.find_one({"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if current_user.id not in [request["owner_id"], request["requester_id"]]:
        raise HTTPException(status_code=403, detail="Not authorized to view these messages")
    
    messages = await db.messages.find({"request_id": request_id}).sort("timestamp", 1).to_list(1000)
    
    result = []
    for message in messages:
        sender = await db.users.find_one({"id": message["sender_id"]})
        recipient = await db.users.find_one({"id": message["recipient_id"]})
        
        message_response = MessageResponse(
            **message,
            sender_name=sender["name"] if sender else "Unknown",
            recipient_name=recipient["name"] if recipient else "Unknown"
        )
        result.append(message_response)
    
    return result

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
