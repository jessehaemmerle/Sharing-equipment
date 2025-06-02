import requests
import json
import logging
import random
import string
import uuid
from datetime import datetime
import time

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

def test_equipment_workflow():
    print_separator("TESTING COMPLETE EQUIPMENT WORKFLOW")
    
    # Step 1: Create a test user
    logger.info("Step 1: Creating a test user...")
    
    user_data = {
        "email": random_email(),
        "name": f"Test User {random_string()}",
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
    
    # Step 2: Create multiple equipment items
    logger.info("Step 2: Creating multiple equipment items...")
    
    headers = {"Authorization": f"Bearer {user_token}"}
    equipment_ids = []
    
    for i in range(3):
        equipment_data = {
            "title": f"Test Equipment {i+1} - {random_string()}",
            "description": f"This is test equipment #{i+1} for workflow testing.",
            "category": random_category(),
            "price_per_day": random_price(),
            "location": random_location(),
            "images": [random_image()],
            "min_rental_days": 1,
            "max_rental_days": 7
        }
        
        logger.info(f"Creating equipment #{i+1}...")
        response = requests.post(f"{BACKEND_URL}/equipment", json=equipment_data, headers=headers)
        
        if response.status_code != 200:
            logger.error(f"❌ Equipment #{i+1} creation failed: {response.status_code} - {response.text}")
            continue
        
        equipment_id = response.json()["id"]
        equipment_ids.append(equipment_id)
        logger.info(f"✅ Equipment #{i+1} created with ID: {equipment_id}")
        
        # Small delay to ensure sequential creation
        time.sleep(1)
    
    if not equipment_ids:
        logger.error("❌ Failed to create any equipment")
        return False
    
    logger.info(f"Created {len(equipment_ids)} equipment items")
    
    # Step 3: Verify equipment in my-equipment endpoint
    logger.info("Step 3: Verifying equipment in my-equipment endpoint...")
    
    response = requests.get(f"{BACKEND_URL}/my-equipment", headers=headers)
    
    if response.status_code != 200:
        logger.error(f"❌ Failed to get my equipment: {response.status_code} - {response.text}")
        return False
    
    my_equipment = response.json()
    logger.info(f"Number of equipment found in my-equipment: {len(my_equipment)}")
    
    if len(my_equipment) < len(equipment_ids):
        logger.error(f"❌ Not all created equipment found in my-equipment endpoint")
        logger.info(f"Created IDs: {equipment_ids}")
        logger.info(f"Found IDs: {[eq['id'] for eq in my_equipment]}")
    else:
        logger.info(f"✅ All created equipment found in my-equipment endpoint")
    
    # Step 4: Verify equipment in public equipment endpoint
    logger.info("Step 4: Verifying equipment in public equipment endpoint...")
    
    response = requests.get(f"{BACKEND_URL}/equipment")
    
    if response.status_code != 200:
        logger.error(f"❌ Failed to get public equipment: {response.status_code} - {response.text}")
        return False
    
    public_equipment = response.json()
    logger.info(f"Number of equipment found in public endpoint: {len(public_equipment)}")
    
    # Check if our equipment is in the public list
    found_count = 0
    for eq_id in equipment_ids:
        if any(eq["id"] == eq_id for eq in public_equipment):
            found_count += 1
    
    logger.info(f"Found {found_count} of our equipment items in the public endpoint")
    
    # Step 5: Get individual equipment by ID
    logger.info("Step 5: Getting individual equipment by ID...")
    
    for i, eq_id in enumerate(equipment_ids):
        response = requests.get(f"{BACKEND_URL}/equipment/{eq_id}")
        
        if response.status_code != 200:
            logger.error(f"❌ Failed to get equipment #{i+1} by ID: {response.status_code} - {response.text}")
            continue
        
        equipment = response.json()
        logger.info(f"✅ Successfully retrieved equipment #{i+1}: {equipment['title']}")
    
    # Step 6: Test filtering
    logger.info("Step 6: Testing equipment filtering...")
    
    # Get a category from one of our equipment
    if my_equipment:
        test_category = my_equipment[0]["category"]
        logger.info(f"Testing filter by category: {test_category}")
        
        response = requests.get(f"{BACKEND_URL}/equipment?category={test_category}")
        
        if response.status_code != 200:
            logger.error(f"❌ Failed to filter by category: {response.status_code} - {response.text}")
        else:
            filtered_equipment = response.json()
            logger.info(f"✅ Found {len(filtered_equipment)} equipment with category {test_category}")
    
    # Summary
    print_separator("EQUIPMENT WORKFLOW TEST SUMMARY")
    logger.info(f"Created {len(equipment_ids)} equipment items")
    logger.info(f"Found {len(my_equipment)} equipment items in my-equipment endpoint")
    logger.info(f"Found {found_count} of our equipment items in the public endpoint")
    
    return len(equipment_ids) > 0 and len(my_equipment) > 0

if __name__ == "__main__":
    test_equipment_workflow()