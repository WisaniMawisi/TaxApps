import os
import certifi
from pymongo import MongoClient

MONGO_URI = os.environ["MONGO_URI"]  # set this in your environment
client = MongoClient(MONGO_URI, tls=True, tlsCAFile=certifi.where())

if __name__ == "__main__":
    print(client.admin.command("ping"))
