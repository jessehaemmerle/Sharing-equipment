import requests
import json
import logging
import random
import string
import uuid
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Get the backend URL from frontend/.env
BACKEND_URL = "https://a4e6d873-fc1c-4eea-aa30-99dd4e9837fe.preview.emergentagent.com/api"

# Helper functions
def random_string(length=8):
    """Generate a random string of fixed length"""
    letters = string.ascii_lowercase
    return ''.join(random.choice(letters) for _ in range(length))

def random_email():
    """Generate a random email"""
    return f"{random_string()}@example.com"

def random_location():
    """Generate a random location"""
    locations = ["Vienna", "Graz", "Linz", "Salzburg", "Innsbruck"]
    return random.choice(locations)

def random_category():
    """Generate a random equipment category"""
    categories = ["power_tools", "lawn_equipment", "welding_equipment", "construction_tools", "automotive", "household", "other"]
    return random.choice(categories)

def random_price():
    """Generate a random price"""
    return round(random.uniform(5.0, 100.0), 2)

def random_image():
    """Generate a random base64 image placeholder"""
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="

def print_separator(title):
    """Print a separator with a title"""
    logger.info("=" * 80)
    logger.info(f" {title} ".center(80, "="))
    logger.info("=" * 80)

def debug_frontend_form_submission():
    print_separator("DEBUGGING FRONTEND FORM SUBMISSION ISSUE")
    
    # Step 1: Create a test user
    logger.info("Step 1: Creating a test user...")
    
    user_data = {
        "email": random_email(),
        "name": f"Frontend Debug User {random_string()}",
        "password": "Password123!",
        "location": random_location()
    }
    
    response = requests.post(f"{BACKEND_URL}/auth/register", json=user_data)
    
    if response.status_code != 200:
        logger.error(f"❌ User registration failed: {response.status_code} - {response.text}")
        return False
    
    user_response = response.json()
    user_token = user_response["access_token"]
    user_id = user_response["user"]["id"]
    logger.info(f"✅ User created with ID: {user_id}")
    
    # Step 2: Create equipment with exact same format as frontend form
    logger.info("Step 2: Creating equipment with frontend form format...")
    
    # This matches the frontend form data structure exactly
    equipment_data = {
        "title": f"Frontend Test Equipment {random_string()}",
        "description": "This is a test equipment simulating frontend form submission.",
        "category": random_category(),
        "price_per_day": random_price(),
        "location": random_location(),
        "images": [random_image()],
        "min_rental_days": 1,
        "max_rental_days": 7
    }
    
    headers = {"Authorization": f"Bearer {user_token}"}
    
    # Log the request details
    logger.info(f"POST Request to: {BACKEND_URL}/equipment")
    logger.info(f"Headers: {headers}")
    logger.info(f"Request Body: {json.dumps(equipment_data, indent=2)}")
    
    response = requests.post(f"{BACKEND_URL}/equipment", json=equipment_data, headers=headers)
    
    # Log the response details
    logger.info(f"Response Status Code: {response.status_code}")
    logger.info(f"Response Headers: {response.headers}")
    
    try:
        response_json = response.json()
        logger.info(f"Response Body: {json.dumps(response_json, indent=2)}")
    except:
        logger.info(f"Response Text: {response.text}")
    
    if response.status_code != 200:
        logger.error(f"❌ Equipment creation failed: {response.status_code} - {response.text}")
        return False
    
    equipment_id = response.json()["id"]
    logger.info(f"✅ Equipment created with ID: {equipment_id}")
    
    # Step 3: Verify equipment in my-equipment endpoint immediately
    logger.info("Step 3: Verifying equipment in my-equipment endpoint immediately...")
    
    response = requests.get(f"{BACKEND_URL}/my-equipment", headers=headers)
    
    # Log the response details
    logger.info(f"GET /my-equipment Response Status Code: {response.status_code}")
    
    try:
        my_equipment = response.json()
        logger.info(f"Number of equipment found: {len(my_equipment)}")
        
        if len(my_equipment) > 0:
            logger.info(f"Equipment IDs found: {[eq['id'] for eq in my_equipment]}")
            
            # Check if our created equipment is in the list
            created_equipment = next((eq for eq in my_equipment if eq["id"] == equipment_id), None)
            
            if created_equipment:
                logger.info(f"✅ Created equipment found in my-equipment endpoint")
                logger.info(f"Equipment details: {json.dumps(created_equipment, indent=2)}")
            else:
                logger.error(f"❌ Created equipment NOT found in my-equipment endpoint despite successful creation")
                return False
        else:
            logger.error(f"❌ No equipment found in my-equipment endpoint")
            return False
    except Exception as e:
        logger.error(f"❌ Error parsing my-equipment response: {e}")
        logger.error(f"Response Text: {response.text}")
        return False
    
    # Step 4: Check if equipment appears in public equipment list
    logger.info("Step 4: Checking if equipment appears in public equipment list...")
    
    response = requests.get(f"{BACKEND_URL}/equipment")
    
    if response.status_code != 200:
        logger.error(f"❌ Failed to get public equipment: {response.status_code} - {response.text}")
    else:
        public_equipment = response.json()
        created_equipment = next((eq for eq in public_equipment if eq["id"] == equipment_id), None)
        
        if created_equipment:
            logger.info(f"✅ Created equipment found in public equipment endpoint")
        else:
            logger.error(f"❌ Created equipment NOT found in public equipment endpoint")
    
    return True

if __name__ == "__main__":
    debug_frontend_form_submission()