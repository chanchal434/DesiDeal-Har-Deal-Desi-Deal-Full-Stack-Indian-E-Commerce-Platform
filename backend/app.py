from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
from flask_bcrypt import Bcrypt
import jwt
import os
import datetime
import time  # NEW: We need this to generate unique order numbers
from functools import wraps
import certifi



# 1. Initialization
load_dotenv()
app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app) # Initialize password hasher

# Database Connection
client = MongoClient(os.getenv("MONGO_URI"), tlsCAFile=certifi.where())
db = client.desideal_db
products_collection = db.products
users_collection = db.users
orders_collection = db.orders # NEW: Collection for our orders

# ─── SECURITY MIDDLEWARE (The Bouncer) ─────────────────────────
# This function acts as a guard. If a route has @token_required, 
# this checks if the user has a valid JWT wristband before letting them in.
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # Check if the token is in the headers
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1] # Usually "Bearer <token>"
        
        if not token:
            return jsonify({'message': 'Token is missing! VIP wristband required.'}), 401

        try:
            # Try to decode the wristband using our secret key
            data = jwt.decode(token, os.getenv('JWT_SECRET'), algorithms=["HS256"])
            current_user = users_collection.find_one({'email': data['email']})
        except:
            return jsonify({'message': 'Token is invalid or expired!'}), 401

        return f(current_user, *args, **kwargs)
    return decorated


# ─── PUBLIC API ROUTES ─────────────────────────────────────────

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "success": True, 
        "message": "Welcome to the DesiDeal API! Try visiting /api/products"
    })

@app.route('/api/test', methods=['GET'])
def test_api():
    return jsonify({"success": True, "message": "Backend is running securely!"})

@app.route('/api/products', methods=['GET'])
def get_products():
    try:
        products = list(products_collection.find({}, {'_id': 0}))
        return jsonify({"success": True, "count": len(products), "data": products}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ─── AUTHENTICATION ROUTES (Register & Login) ──────────────────

@app.route('/api/register', methods=['POST'])
def register_user():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')

    # Check if user already exists
    if users_collection.find_one({'email': email}):
        return jsonify({"success": False, "message": "User already exists!"}), 400

    # Scramble (hash) the password
    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    # Save to database
    new_user = {
        "name": name,
        "email": email,
        "password": hashed_password,
        "role": "user" # Default role
    }
    users_collection.insert_one(new_user)
    
    return jsonify({"success": True, "message": "Account created successfully!"}), 201


@app.route('/api/login', methods=['POST'])
def login_user():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    # Find the user by email
    user = users_collection.find_one({'email': email})

    # If user exists AND the password matches the hashed password
    if user and bcrypt.check_password_hash(user['password'], password):
        # Generate the VIP Wristband (JWT)
        token = jwt.encode({
            'email': user['email'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24) # Expires in 24 hours
        }, os.getenv('JWT_SECRET'), algorithm="HS256")

        return jsonify({
            "success": True, 
            "message": "Logged in successfully!",
            "token": token,
            "user": {"name": user['name'], "email": user['email']}
        }), 200

    return jsonify({"success": False, "message": "Invalid email or password!"}), 401


# ─── PROTECTED ROUTE (Requires JWT) ────────────────────────────

@app.route('/api/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    # This route only runs if the @token_required guard lets them through!
    return jsonify({
        "success": True,
        "message": f"Welcome to your private profile, {current_user['name']}!",
        "email": current_user['email']
    })


# ─── CART SYSTEM ROUTES (Requires JWT) ─────────────────────────

@app.route('/api/cart', methods=['GET'])
@token_required
def get_cart(current_user):
    # Fetch the user's cart from their database profile (default to empty array)
    user_cart = current_user.get('cart', [])
    return jsonify({
        "success": True,
        "cart": user_cart
    }), 200

@app.route('/api/cart', methods=['POST'])
@token_required
def update_cart(current_user):
    data = request.get_json()
    new_cart = data.get('cart', [])
    
    # Update the user's document in MongoDB with the new cart
    users_collection.update_one(
        {'_id': current_user['_id']},
        {'$set': {'cart': new_cart}}
    )
    
    return jsonify({
        "success": True,
        "message": "Cart saved to database!"
    }), 200


# ─── ORDER SYSTEM ROUTES (Requires JWT) ────────────────────────────

@app.route('/api/orders', methods=['POST'])
@token_required
def place_order(current_user):
    data = request.get_json()
    cart_items = data.get('items', [])
    total_amount = data.get('total', 0)
    shipping_info = data.get('shipping', {})
    
    if not cart_items:
        return jsonify({"success": False, "message": "Your cart is empty!"}), 400
        
    # Generate a unique order number using the current timestamp
    order_number = f"DD-{int(time.time())}"
    
    new_order = {
        "order_number": order_number,
        "user_email": current_user['email'],
        "items": cart_items,
        "total_amount": total_amount,
        "shipping_info": shipping_info,
        "status": "Processing", # Other statuses could be Shipped, Delivered, etc.
        "date": datetime.datetime.utcnow()
    }
    
    # Save the order to the database
    orders_collection.insert_one(new_order)
    
    # Clear the user's cart in the database now that they bought the items
    users_collection.update_one(
        {'_id': current_user['_id']},
        {'$set': {'cart': []}}
    )
    
    return jsonify({
        "success": True,
        "message": "Order placed successfully!",
        "order_number": order_number
    }), 201

@app.route('/api/orders', methods=['GET'])
@token_required
def get_orders(current_user):
    # Fetch all orders belonging to the logged-in user
    # We sort by date descending (-1) so the newest orders are at the top
    user_orders = list(orders_collection.find({'user_email': current_user['email']}, {'_id': 0}).sort("date", -1))
    
    return jsonify({
        "success": True, 
        "count": len(user_orders),
        "orders": user_orders
    }), 200


# ─── RUN SERVER ────────────────────────────────────────────────
if __name__ == '__main__':
    print("🚀 Secure Flask Server is running on http://localhost:5000")
    app.run(debug=True, port=5000)
