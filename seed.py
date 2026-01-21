import requests
import random
import time

API_URL = "http://localhost:8000/jobs"
JOB_TYPES = ["email", "report", "notification"]

def seed_data():
    print(f"🌱 Seeding data to {API_URL}...")
    
    # Create 20 jobs to really test the queue
    for i in range(20): 
        payload = {
            "type": random.choice(JOB_TYPES),
            "priority": random.randint(1, 5),
            "payload": {
                "user_id": random.randint(1000, 9999),
                "message": f"This is test job #{i+1} created by the seed script"
            }
        }
        
        try:
            response = requests.post(API_URL, json=payload)
            response.raise_for_status()
            data = response.json()
            print(f"Created Job {data['id']} [Priority {data['priority']}]")
        except Exception as e:
            print(f"Failed to create job: {e}")

    print("\nSeeding complete. Check http://localhost:3000/stats to see their status.")

if __name__ == "__main__":
    seed_data()