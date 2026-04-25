import os
from pymongo import MongoClient
from dotenv import load_dotenv

# 1. Load the secret MONGO_URI from the .env file
load_dotenv()
MONGO_URI = os.getenv("MONGO_URI")

# 2. Connect to the MongoDB Cluster
client = MongoClient(MONGO_URI)
db = client.desideal_db           # This creates/selects a database named 'desideal_db'
products_collection = db.products # This creates/selects a collection named 'products'

# 3. Create our sample data (Python Dictionaries)
sample_products = [
    {
        "id": 1, "category": "electronics", "emoji": "💻", 
        "title": 'UltraBook Pro 15" Laptop – Intel i9, 32GB RAM, 1TB SSD',
        "price": 89999.00, "originalPrice": 119999.00, "rating": 4.7, "reviews": 2341,
        "badge": "sale", "prime": True, "freeShipping": True, "inStock": True,
        "description": "Powerful laptop featuring the latest Intel Core i9 processor."
    },
    {
        "id": 2, "category": "clothing", "emoji": "👗", 
        "title": 'Designer Silk Blend Kurta Set',
        "price": 1499.00, "originalPrice": 2999.00, "rating": 4.8, "reviews": 5678,
        "badge": "hot", "prime": True, "freeShipping": True, "inStock": True,
        "description": "Beautiful traditional wear perfect for festivals and weddings."
    },
    {
        "id": 3, "category": "home", "emoji": "🛋️", 
        "title": 'Modern Velvet Sofa - 3 Seater',
        "price": 14999.00, "originalPrice": 19999.00, "rating": 4.5, "reviews": 890,
        "badge": "new", "prime": False, "freeShipping": False, "inStock": True,
        "description": "Premium velvet sofa with high-density foam cushions."
    }
]

# 4. Clear old data and insert the new data
print("Connecting to database and clearing old products...")
products_collection.drop()

print("Inserting new products...")
products_collection.insert_many(sample_products)

print("✅ Database successfully seeded! You can now check MongoDB Atlas.")