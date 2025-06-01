import requests
import json
import time
from datetime import datetime, timedelta
import logging
import random
import string
import uuid

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Get the backend URL from frontend/.env
BACKEND_URL = "https://a4e6d873-fc1c-4eea-aa30-99dd4e9837fe.preview.emergentagent.com/api"

# Test data
test_users = []
test_equipment = []
test_requests = []
test_messages = []

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
    locations = ["Vienna", "Graz", "Linz", "Salzburg", "Innsbruck", "Klagenfurt", "Villach", "Wels", "Dornbirn"]
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

# Test functions
def test_user_authentication():
    print_separator("TESTING USER AUTHENTICATION SYSTEM")
    
    # Test user registration
    logger.info("Testing user registration...")
    
    # Create test user data
    user_data = {
        "email": random_email(),
        "name": f"Test User {random_string()}",
        "password": "Password123!",
        "location": random_location(),
        "latitude": random.uniform(47.0, 48.5),
        "longitude": random.uniform(13.0, 16.5)
    }
    
    # Register user
    response = requests.post(f"{BACKEND_URL}/auth/register", json=user_data)
    
    if response.status_code == 200:
        logger.info("✅ User registration successful")
        user_response = response.json()
        logger.info(f"User ID: {user_response['user']['id']}")
        logger.info(f"Access Token: {user_response['access_token'][:20]}...")
        
        # Save user data for later tests
        test_users.append({
            "id": user_response["user"]["id"],
            "email": user_data["email"],
            "password": user_data["password"],
            "name": user_data["name"],
            "token": user_response["access_token"]
        })
        
        # Test JWT token validation
        logger.info("Testing JWT token validation...")
        headers = {"Authorization": f"Bearer {user_response['access_token']}"}
        me_response = requests.get(f"{BACKEND_URL}/auth/me", headers=headers)
        
        if me_response.status_code == 200:
            logger.info("✅ JWT token validation successful")
            logger.info(f"User data: {me_response.json()}")
        else:
            logger.error(f"❌ JWT token validation failed: {me_response.status_code} - {me_response.text}")
            return False
        
        # Test login
        logger.info("Testing user login...")
        login_data = {
            "email": user_data["email"],
            "password": user_data["password"]
        }
        
        login_response = requests.post(f"{BACKEND_URL}/auth/login", json=login_data)
        
        if login_response.status_code == 200:
            logger.info("✅ User login successful")
            logger.info(f"Access Token: {login_response.json()['access_token'][:20]}...")
            return True
        else:
            logger.error(f"❌ User login failed: {login_response.status_code} - {login_response.text}")
            return False
    else:
        logger.error(f"❌ User registration failed: {response.status_code} - {response.text}")
        return False

def test_equipment_crud():
    print_separator("TESTING EQUIPMENT LISTING CRUD OPERATIONS")
    
    if not test_users:
        logger.error("❌ No test users available. Please run user authentication test first.")
        return False
    
    # Get the first test user
    user = test_users[0]
    headers = {"Authorization": f"Bearer {user['token']}"}
    
    # Test creating equipment
    logger.info("Testing equipment creation...")
    
    equipment_data = {
        "title": f"Test Equipment {random_string()}",
        "description": f"This is a test equipment for automated testing.",
        "category": random_category(),
        "price_per_day": random_price(),
        "location": user["name"].split()[2] if len(user["name"].split()) > 2 else random_location(),
        "latitude": random.uniform(47.0, 48.5),
        "longitude": random.uniform(13.0, 16.5),
        "images": [random_image()],
        "min_rental_days": 1,
        "max_rental_days": 30
    }
    
    response = requests.post(f"{BACKEND_URL}/equipment", json=equipment_data, headers=headers)
    
    if response.status_code == 200:
        logger.info("✅ Equipment creation successful")
        equipment_response = response.json()
        logger.info(f"Equipment ID: {equipment_response['id']}")
        
        # Save equipment data for later tests
        test_equipment.append({
            "id": equipment_response["id"],
            "title": equipment_data["title"],
            "owner_id": user["id"]
        })
        
        # Test get equipment by ID
        logger.info("Testing get equipment by ID...")
        get_response = requests.get(f"{BACKEND_URL}/equipment/{equipment_response['id']}")
        
        if get_response.status_code == 200:
            logger.info("✅ Get equipment by ID successful")
            logger.info(f"Equipment data: {get_response.json()['title']}")
        else:
            logger.error(f"❌ Get equipment by ID failed: {get_response.status_code} - {get_response.text}")
            return False
        
        # Test get all equipment
        logger.info("Testing get all equipment...")
        all_response = requests.get(f"{BACKEND_URL}/equipment")
        
        if all_response.status_code == 200:
            logger.info("✅ Get all equipment successful")
            logger.info(f"Number of equipment: {len(all_response.json())}")
        else:
            logger.error(f"❌ Get all equipment failed: {all_response.status_code} - {all_response.text}")
            return False
        
        # Test get my equipment
        logger.info("Testing get my equipment...")
        my_response = requests.get(f"{BACKEND_URL}/my-equipment", headers=headers)
        
        if my_response.status_code == 200:
            logger.info("✅ Get my equipment successful")
            logger.info(f"Number of my equipment: {len(my_response.json())}")
        else:
            logger.error(f"❌ Get my equipment failed: {my_response.status_code} - {my_response.text}")
            return False
        
        # Test search and filter functionality
        logger.info("Testing equipment search and filter...")
        
        # Filter by category
        category_response = requests.get(f"{BACKEND_URL}/equipment?category={equipment_data['category']}")
        if category_response.status_code == 200:
            logger.info(f"✅ Filter by category successful: {len(category_response.json())} results")
        else:
            logger.error(f"❌ Filter by category failed: {category_response.status_code} - {category_response.text}")
            return False
        
        # Filter by location
        location_response = requests.get(f"{BACKEND_URL}/equipment?location={equipment_data['location']}")
        if location_response.status_code == 200:
            logger.info(f"✅ Filter by location successful: {len(location_response.json())} results")
        else:
            logger.error(f"❌ Filter by location failed: {location_response.status_code} - {location_response.text}")
            return False
        
        # Filter by price
        price_response = requests.get(f"{BACKEND_URL}/equipment?max_price={equipment_data['price_per_day'] + 10}")
        if price_response.status_code == 200:
            logger.info(f"✅ Filter by price successful: {len(price_response.json())} results")
        else:
            logger.error(f"❌ Filter by price failed: {price_response.status_code} - {price_response.text}")
            return False
        
        return True
    else:
        logger.error(f"❌ Equipment creation failed: {response.status_code} - {response.text}")
        return False

def test_rental_request_system():
    print_separator("TESTING RENTAL REQUEST SYSTEM")
    
    if not test_users or not test_equipment:
        logger.error("❌ No test users or equipment available. Please run previous tests first.")
        return False
    
    # Create a second test user if not already available
    if len(test_users) < 2:
        logger.info("Creating a second test user for rental requests...")
        
        user_data = {
            "email": random_email(),
            "name": f"Test User {random_string()}",
            "password": "Password123!",
            "location": random_location(),
            "latitude": random.uniform(47.0, 48.5),
            "longitude": random.uniform(13.0, 16.5)
        }
        
        response = requests.post(f"{BACKEND_URL}/auth/register", json=user_data)
        
        if response.status_code == 200:
            user_response = response.json()
            test_users.append({
                "id": user_response["user"]["id"],
                "email": user_data["email"],
                "password": user_data["password"],
                "name": user_data["name"],
                "token": user_response["access_token"]
            })
            logger.info(f"✅ Created second test user: {user_data['email']}")
        else:
            logger.error(f"❌ Failed to create second test user: {response.status_code} - {response.text}")
            return False
    
    # Get the second test user (requester) and first equipment
    requester = test_users[1]
    equipment = test_equipment[0]
    headers = {"Authorization": f"Bearer {requester['token']}"}
    
    # Test creating rental request
    logger.info("Testing rental request creation...")
    
    start_date = datetime.now() + timedelta(days=1)
    end_date = start_date + timedelta(days=3)
    
    request_data = {
        "equipment_id": equipment["id"],
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "message": "I would like to rent this equipment for a project."
    }
    
    response = requests.post(f"{BACKEND_URL}/requests", json=request_data, headers=headers)
    
    if response.status_code == 200:
        logger.info("✅ Rental request creation successful")
        request_response = response.json()
        logger.info(f"Request ID: {request_response['id']}")
        
        # Save request data for later tests
        test_requests.append({
            "id": request_response["id"],
            "equipment_id": equipment["id"],
            "requester_id": requester["id"],
            "owner_id": equipment["owner_id"]
        })
        
        # Test get sent requests
        logger.info("Testing get sent requests...")
        sent_response = requests.get(f"{BACKEND_URL}/requests/sent", headers=headers)
        
        if sent_response.status_code == 200:
            logger.info("✅ Get sent requests successful")
            logger.info(f"Number of sent requests: {len(sent_response.json())}")
        else:
            logger.error(f"❌ Get sent requests failed: {sent_response.status_code} - {sent_response.text}")
            return False
        
        # Test get received requests (from owner's perspective)
        logger.info("Testing get received requests...")
        owner = test_users[0]  # The equipment owner
        owner_headers = {"Authorization": f"Bearer {owner['token']}"}
        
        received_response = requests.get(f"{BACKEND_URL}/requests/received", headers=owner_headers)
        
        if received_response.status_code == 200:
            logger.info("✅ Get received requests successful")
            logger.info(f"Number of received requests: {len(received_response.json())}")
        else:
            logger.error(f"❌ Get received requests failed: {received_response.status_code} - {received_response.text}")
            return False
        
        # Test update request status
        logger.info("Testing update request status...")
        
        # Only the owner can update the status
        status_response = requests.put(
            f"{BACKEND_URL}/requests/{request_response['id']}/status?status=approved", 
            headers=owner_headers
        )
        
        if status_response.status_code == 200:
            logger.info("✅ Update request status successful")
            logger.info(f"Status response: {status_response.json()}")
        else:
            logger.error(f"❌ Update request status failed: {status_response.status_code} - {status_response.text}")
            return False
        
        return True
    else:
        logger.error(f"❌ Rental request creation failed: {response.status_code} - {response.text}")
        return False

def test_messaging_system():
    print_separator("TESTING MESSAGING SYSTEM")
    
    if not test_users or not test_requests:
        logger.error("❌ No test users or requests available. Please run previous tests first.")
        return False
    
    # Get the first request, requester, and owner
    request = test_requests[0]
    requester = test_users[1]
    owner = test_users[0]
    
    # Test sending message from requester to owner
    logger.info("Testing sending message from requester to owner...")
    
    requester_headers = {"Authorization": f"Bearer {requester['token']}"}
    message_data = {
        "recipient_id": owner["id"],
        "request_id": request["id"],
        "content": "Hello! I'm interested in renting your equipment."
    }
    
    response = requests.post(f"{BACKEND_URL}/messages", json=message_data, headers=requester_headers)
    
    if response.status_code == 200:
        logger.info("✅ Sending message from requester to owner successful")
        message_response = response.json()
        logger.info(f"Message ID: {message_response['id']}")
        
        # Save message data for later tests
        test_messages.append({
            "id": message_response["id"],
            "request_id": request["id"]
        })
        
        # Test sending message from owner to requester
        logger.info("Testing sending message from owner to requester...")
        
        owner_headers = {"Authorization": f"Bearer {owner['token']}"}
        reply_data = {
            "recipient_id": requester["id"],
            "request_id": request["id"],
            "content": "Thanks for your interest! When would you like to pick it up?"
        }
        
        reply_response = requests.post(f"{BACKEND_URL}/messages", json=reply_data, headers=owner_headers)
        
        if reply_response.status_code == 200:
            logger.info("✅ Sending message from owner to requester successful")
            reply_message = reply_response.json()
            logger.info(f"Reply Message ID: {reply_message['id']}")
            
            test_messages.append({
                "id": reply_message["id"],
                "request_id": request["id"]
            })
        else:
            logger.error(f"❌ Sending message from owner to requester failed: {reply_response.status_code} - {reply_response.text}")
            return False
        
        # Test getting messages for a request
        logger.info("Testing getting messages for a request...")
        
        # Both requester and owner should be able to see the messages
        messages_response = requests.get(f"{BACKEND_URL}/messages/{request['id']}", headers=requester_headers)
        
        if messages_response.status_code == 200:
            logger.info("✅ Getting messages for a request successful")
            messages = messages_response.json()
            logger.info(f"Number of messages: {len(messages)}")
            
            # Verify message content
            for message in messages:
                logger.info(f"Message from {message['sender_name']} to {message['recipient_name']}: {message['content']}")
            
            return True
        else:
            logger.error(f"❌ Getting messages for a request failed: {messages_response.status_code} - {messages_response.text}")
            return False
    else:
        logger.error(f"❌ Sending message from requester to owner failed: {response.status_code} - {response.text}")
        return False

def test_location_based_search():
    print_separator("TESTING LOCATION-BASED SEARCH")
    
    if not test_users:
        logger.error("❌ No test users available. Please run user authentication test first.")
        return False
    
    # Get the first test user
    user = test_users[0]
    headers = {"Authorization": f"Bearer {user['token']}"}
    
    # Create equipment with specific location for testing
    logger.info("Creating equipment with specific location for testing...")
    
    test_location = "Vienna"
    equipment_data = {
        "title": f"Vienna Test Equipment {random_string()}",
        "description": f"This is a test equipment in Vienna for location-based search testing.",
        "category": random_category(),
        "price_per_day": random_price(),
        "location": test_location,
        "latitude": 48.2082,
        "longitude": 16.3738,
        "images": [random_image()],
        "min_rental_days": 1,
        "max_rental_days": 30
    }
    
    response = requests.post(f"{BACKEND_URL}/equipment", json=equipment_data, headers=headers)
    
    if response.status_code == 200:
        logger.info("✅ Created equipment with location: Vienna")
        
        # Test location-based search
        logger.info("Testing location-based search...")
        
        search_response = requests.get(f"{BACKEND_URL}/equipment?location={test_location}")
        
        if search_response.status_code == 200:
            results = search_response.json()
            logger.info(f"✅ Location-based search successful: {len(results)} results")
            
            # Verify that at least one result has the correct location
            location_matches = [item for item in results if test_location.lower() in item["location"].lower()]
            if location_matches:
                logger.info(f"✅ Found {len(location_matches)} equipment in {test_location}")
                return True
            else:
                logger.error(f"❌ No equipment found in {test_location} despite creating one")
                return False
        else:
            logger.error(f"❌ Location-based search failed: {search_response.status_code} - {search_response.text}")
            return False
    else:
        logger.error(f"❌ Failed to create equipment with specific location: {response.status_code} - {response.text}")
        return False

def run_all_tests():
    print_separator("STARTING BACKEND API TESTS")
    
    # Dictionary to track test results
    test_results = {}
    
    # Run all tests
    test_results["User Authentication System"] = test_user_authentication()
    test_results["Equipment Listing CRUD Operations"] = test_equipment_crud()
    test_results["Rental Request System"] = test_rental_request_system()
    test_results["Messaging System"] = test_messaging_system()
    test_results["Location-based Search"] = test_location_based_search()
    
    # Print summary
    print_separator("TEST RESULTS SUMMARY")
    
    all_passed = True
    for test_name, result in test_results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        if not result:
            all_passed = False
        logger.info(f"{test_name}: {status}")
    
    if all_passed:
        logger.info("🎉 All tests passed successfully!")
    else:
        logger.error("❗ Some tests failed. Please check the logs for details.")
    
    return test_results

if __name__ == "__main__":
    run_all_tests()