import os
import certifi
from dotenv import load_dotenv
from pymongo import MongoClient

# Load environment variables from your .env file
load_dotenv()

# Read the variable matching your FastAPI backend setup
MONGO_URL = os.getenv("MONGO_URL")

if not MONGO_URL:
    print("❌ Error: MONGO_URL not found in your environment or .env file!")
    exit(1)

# Initialize the MongoClient with the correct variable
# Change this line in your script:
client = MongoClient(
    MONGO_URL,
    tls=True,
    tlsAllowInvalidCertificates=True,  # Bypasses local network handshake interference
)


if __name__ == "__main__":
    try:
        print("Testing database connection...")
        # Execute ping command
        response = client.admin.command("ping")
        print(f"✅ Success! Database response: {response}")
    except Exception as e:
        print(f"❌ Connection failed: {e}")
