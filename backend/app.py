from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
from flask_bcrypt import Bcrypt
import jwt
import os
import datetime
import time  
from functools import wraps
import certifi
import razorpay  # NEW: Required for processing digital payments

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
orders_collection = db.orders 

# Initialize Razorpay Client
razorpay_client = razorpay.Client(auth=(os.getenv('RAZORPAY_KEY_ID'), os.getenv('RAZORPAY_KEY_SECRET')))

# ─── SECURITY MIDDLEWARE (The Bouncer) ─────────────────────────
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1] 
        
        if not token:
            return jsonify({'message': 'Token is missing! VIP wristband required.'}), 401

        try:
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

    if users_collection.find_one({'email': email}):
        return jsonify({"success": False, "message": "User already exists!"}), 400

    hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')

    new_user = {
        "name": name,
        "email": email,
        "password": hashed_password,
        "role": "user" 
    }
    users_collection.insert_one(new_user)
    
    return jsonify({"success": True, "message": "Account created successfully!"}), 201


@app.route('/api/login', methods=['POST'])
def login_user():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = users_collection.find_one({'email': email})

    if user and bcrypt.check_password_hash(user['password'], password):
        token = jwt.encode({
            'email': user['email'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24) 
        }, os.getenv('JWT_SECRET'), algorithm="HS256")

        return jsonify({
            "success": True, 
            "message": "Logged in successfully!",
            "token": token,
            "user": {"name": user['name'], "email": user['email']}
        }), 200

    return jsonify({"success": False, "message": "Invalid email or password!"}), 401


# ─── USER PROFILE ROUTES (Requires JWT) ────────────────────────

@app.route('/api/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    full_name = current_user.get('name', '')
    name_parts = full_name.split(' ')
    
    user_data = {
        "first_name": current_user.get('first_name', name_parts[0] if name_parts else ''),
        "middle_name": current_user.get('middle_name', ''),
        "last_name": current_user.get('last_name', ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''),
        "email": current_user.get('email'),
        "country_code": current_user.get('country_code', '+91'),
        "phone": current_user.get('phone', ''),
        "alt_phone": current_user.get('alt_phone', ''),
        "dob": current_user.get('dob', ''),
        "gender": current_user.get('gender', ''),
        "addresses": current_user.get('addresses', [])
    }
    return jsonify({"success": True, "user": user_data}), 200


@app.route('/api/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    data = request.get_json()
    
    combined_name = f"{data.get('first_name', '')} {data.get('last_name', '')}".strip()
    
    users_collection.update_one(
        {'_id': current_user['_id']},
        {'$set': {
            'name': combined_name,
            'first_name': data.get('first_name'),
            'middle_name': data.get('middle_name'),
            'last_name': data.get('last_name'),
            'country_code': data.get('country_code'),
            'phone': data.get('phone'),
            'alt_phone': data.get('alt_phone'),
            'dob': data.get('dob'),
            'gender': data.get('gender'),
            'addresses': data.get('addresses', [])
        }}
    )
    
    return jsonify({"success": True, "message": "Profile updated!", "name": combined_name}), 200


# ─── CART SYSTEM ROUTES (Requires JWT) ─────────────────────────

@app.route('/api/cart', methods=['GET'])
@token_required
def get_cart(current_user):
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
    
    users_collection.update_one(
        {'_id': current_user['_id']},
        {'$set': {'cart': new_cart}}
    )
    
    return jsonify({
        "success": True,
        "message": "Cart saved to database!"
    }), 200


# ─── PAYMENT & ORDER ROUTES (Requires JWT) ─────────────────────

@app.route('/api/orders/cod', methods=['POST'])
@token_required
def place_cod_order(current_user):
    data = request.get_json()
    
    cart_items = data.get('items', [])
    total_amount = data.get('total', 0)
    shipping_info = data.get('shipping', {})

    order_number = f"COD-{int(time.time())}"
    new_order = {
        "order_number": order_number,
        "user_email": current_user['email'],
        "items": cart_items,
        "total_amount": total_amount,
        "shipping_info": shipping_info,
        "payment_id": "Cash on Delivery",
        "status": "Processing (Unpaid)",
        "date": datetime.datetime.utcnow()
    }
    
    orders_collection.insert_one(new_order)
    users_collection.update_one({'_id': current_user['_id']}, {'$set': {'cart': []}})
    
    return jsonify({"success": True, "order_number": order_number}), 201


@app.route('/api/payment/create-order', methods=['POST'])
@token_required
def create_payment_order(current_user):
    data = request.get_json()
    amount_in_rupees = data.get('total', 0)
    amount_in_paise = int(amount_in_rupees * 100)
    
    try:
        order_data = {
            "amount": amount_in_paise,
            "currency": "INR",
            "receipt": f"receipt_{int(time.time())}",
            "notes": {"email": current_user['email']}
        }
        razorpay_order = razorpay_client.order.create(data=order_data)
        
        return jsonify({
            "success": True, 
            "razorpay_order_id": razorpay_order['id'],
            "amount": amount_in_paise,
            "key_id": os.getenv('RAZORPAY_KEY_ID') 
        }), 200
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/api/orders/verify-and-save', methods=['POST'])
@token_required
def verify_and_save_order(current_user):
    data = request.get_json()
    
    razorpay_payment_id = data.get('razorpay_payment_id')
    razorpay_order_id = data.get('razorpay_order_id')
    razorpay_signature = data.get('razorpay_signature')
    
    cart_items = data.get('items', [])
    total_amount = data.get('total', 0)
    shipping_info = data.get('shipping', {})

    try:
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        })
    except razorpay.errors.SignatureVerificationError:
        return jsonify({"success": False, "message": "Payment verification failed! Hacker alert!"}), 400

    order_number = f"DD-{int(time.time())}"
    new_order = {
        "order_number": order_number,
        "user_email": current_user['email'],
        "items": cart_items,
        "total_amount": total_amount,
        "shipping_info": shipping_info,
        "payment_id": razorpay_payment_id,
        "status": "Paid & Processing",
        "date": datetime.datetime.utcnow()
    }
    
    orders_collection.insert_one(new_order)
    users_collection.update_one({'_id': current_user['_id']}, {'$set': {'cart': []}})
    
    return jsonify({"success": True, "order_number": order_number}), 201


@app.route('/api/orders', methods=['GET'])
@token_required
def get_orders(current_user):
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
