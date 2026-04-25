/* ============================================================
   Products Data – ShopZone
   ============================================================ */

const PRODUCTS = [
  /* ── ELECTRONICS ── */
  {
    id: 1, category: 'electronics', emoji: '💻',
    title: 'UltraBook Pro 15" Laptop – Intel i9, 32GB RAM, 1TB SSD',
    brand: 'TechMaster',
    price: 1299.99, originalPrice: 1799.99,
    rating: 4.7, reviews: 2341,
    badge: 'sale', prime: true, inStock: true, isNew: false,
    description: 'Powerful laptop featuring the latest Intel Core i9 processor, 32GB DDR5 RAM, and 1TB NVMe SSD. Perfect for professionals and gamers alike. Features a stunning 4K OLED display with 120Hz refresh rate.',
    features: ['Intel Core i9-13900H Processor', '32GB DDR5 RAM', '1TB PCIe NVMe SSD', '15.6" 4K OLED Display', 'NVIDIA RTX 4070 8GB GPU', 'Up to 12hrs battery life'],
    freeShipping: true
  },
  {
    id: 2, category: 'electronics', emoji: '📱',
    title: 'Galaxy S Ultra 5G Smartphone – 256GB, Titanium Black',
    brand: 'SamTech',
    price: 899.99, originalPrice: 1199.99,
    rating: 4.8, reviews: 5678,
    badge: 'hot', prime: true, inStock: true, isNew: false,
    description: 'Flagship smartphone with an incredible 200MP camera system, 6.8" Dynamic AMOLED 2X display, and blazing-fast Snapdragon 8 Gen 3 processor. Experience the future of mobile photography.',
    features: ['200MP Main Camera + 50MP Telephoto', '6.8" Dynamic AMOLED 2X 120Hz', 'Snapdragon 8 Gen 3 Processor', '5000mAh Battery with 65W charging', '12GB RAM + 256GB Storage', 'IP68 Water Resistance'],
    freeShipping: true
  },
  {
    id: 3, category: 'electronics', emoji: '🎧',
    title: 'NoiseBlock Pro Wireless Headphones – ANC, 40hr Battery',
    brand: 'AudioMax',
    price: 249.99, originalPrice: 349.99,
    rating: 4.6, reviews: 8932,
    badge: 'sale', prime: true, inStock: true, isNew: false,
    description: 'Industry-leading noise cancellation meets exceptional audio quality. 40-hour battery life keeps you listening all day. Comfortable memory foam earcups for extended wear.',
    features: ['Active Noise Cancellation (ANC)', '40-hour battery life', 'Hi-Res Audio Certified', 'Multipoint Bluetooth 5.3', 'Touch controls', 'Foldable design for travel'],
    freeShipping: true
  },
  {
    id: 4, category: 'electronics', emoji: '📺',
    title: '65" 4K QLED Smart TV – 120Hz, Dolby Vision',
    brand: 'VistaView',
    price: 799.99, originalPrice: 1299.99,
    rating: 4.5, reviews: 1234,
    badge: 'sale', prime: true, inStock: true, isNew: false,
    description: 'Immerse yourself in stunning 4K QLED picture quality with Dolby Vision HDR. Built-in smart features give you access to all your favorite streaming services.',
    features: ['4K QLED Display', '120Hz Refresh Rate', 'Dolby Vision & Atmos', 'Smart TV with built-in streaming', 'HDMI 2.1 x4, USB 3.0 x2', '4 years warranty'],
    freeShipping: true
  },
  {
    id: 5, category: 'electronics', emoji: '⌚',
    title: 'SmartWatch Series X – Health Monitor, GPS, 3-Day Battery',
    brand: 'TimeTech',
    price: 349.99, originalPrice: 499.99,
    rating: 4.7, reviews: 3456,
    badge: 'new', prime: true, inStock: true, isNew: true,
    description: 'Advanced health monitoring including ECG, SpO2, and continuous heart rate. Built-in GPS tracks all your outdoor activities. Water-resistant to 50 meters.',
    features: ['ECG & SpO2 monitoring', 'Built-in GPS + GLONASS', '3-day battery life', '45mm AMOLED Always-On Display', 'Sleep tracking + smart alarm', 'Water resistant 50m'],
    freeShipping: true
  },
  {
    id: 6, category: 'electronics', emoji: '🖥️',
    title: '27" 4K Monitor IPS – 144Hz, HDR600, USB-C 65W',
    brand: 'ClearView',
    price: 449.99, originalPrice: 599.99,
    rating: 4.6, reviews: 892,
    badge: 'sale', prime: true, inStock: true, isNew: false,
    description: 'Professional-grade 4K IPS monitor perfect for designers, photographers, and gamers. Features USB-C power delivery, allowing you to charge your laptop directly.',
    features: ['27" 4K UHD IPS Panel', '144Hz Refresh Rate', 'HDR600 certified', 'USB-C 65W Power Delivery', 'DCI-P3 98% Color Accuracy', 'Ergonomic stand with tilt/pivot'],
    freeShipping: true
  },
  {
    id: 7, category: 'electronics', emoji: '🎮',
    title: 'GameStation 5 Controller – Wireless, Haptic Feedback',
    brand: 'GamePro',
    price: 69.99, originalPrice: 89.99,
    rating: 4.8, reviews: 12045,
    badge: 'hot', prime: true, inStock: true, isNew: false,
    description: 'Next-gen gaming controller with revolutionary haptic feedback and adaptive triggers. Feel every game moment with unparalleled immersion. Wireless with 20-hour battery.',
    features: ['Haptic Feedback Motors', 'Adaptive Triggers', 'Wireless Bluetooth 5.1', '20-hour battery life', 'Built-in microphone & speaker', 'Compatible with PC & Console'],
    freeShipping: false
  },
  {
    id: 8, category: 'electronics', emoji: '📷',
    title: 'Mirrorless Camera Pro – 50MP, 4K Video, 5-axis Stabilization',
    brand: 'SnapMaster',
    price: 1999.99, originalPrice: 2499.99,
    rating: 4.9, reviews: 567,
    badge: 'prime', prime: true, inStock: true, isNew: false,
    description: 'Professional mirrorless camera with 50MP full-frame sensor. Capture stunning photos and cinematic 4K video with industry-leading 5-axis optical image stabilization.',
    features: ['50MP Full-Frame BSI-CMOS Sensor', '4K 60fps Video Recording', '5-axis Optical Image Stabilization', 'Dual Card Slots', 'Weather-sealed body', 'AI-powered autofocus'],
    freeShipping: true
  },

  /* ── CLOTHING ── */
  {
    id: 9, category: 'clothing', emoji: '👟',
    title: 'AirStep Pro Running Shoes – Lightweight, Responsive',
    brand: 'SportStep',
    price: 89.99, originalPrice: 129.99,
    rating: 4.5, reviews: 4521,
    badge: 'sale', prime: true, inStock: true, isNew: false,
    description: 'Ultra-lightweight running shoes with advanced cushioning technology. The breathable mesh upper keeps your feet cool while the responsive foam delivers energy return with every step.',
    features: ['Lightweight mesh upper', 'Responsive foam midsole', 'Anti-slip rubber outsole', 'Available in 8 colors', 'Machine washable', 'Sizes 6-14 available'],
    freeShipping: true
  },
  {
    id: 10, category: 'clothing', emoji: '👗',
    title: 'Floral Summer Dress – Midi Length, Wrap Style',
    brand: 'FashionForward',
    price: 49.99, originalPrice: 79.99,
    rating: 4.4, reviews: 2103,
    badge: 'new', prime: true, inStock: true, isNew: true,
    description: 'Effortlessly stylish wrap dress in vibrant floral print. Made from sustainable viscose fabric that drapes beautifully. Perfect for summer outings, beach days, or garden parties.',
    features: ['100% Sustainable Viscose', 'Midi length (knee to ankle)', 'Adjustable wrap tie', 'Machine washable', '5 color options', 'Inclusive sizes XS–3XL'],
    freeShipping: true
  },
  {
    id: 11, category: 'clothing', emoji: '🧥',
    title: 'Men\'s Premium Down Jacket – Lightweight, Packable',
    brand: 'AlpineWear',
    price: 119.99, originalPrice: 179.99,
    rating: 4.7, reviews: 876,
    badge: 'sale', prime: true, inStock: true, isNew: false,
    description: 'Stay warm without the bulk. This packable down jacket uses 90% recycled down fill for exceptional warmth. Packs into its own pocket for easy storage and travel.',
    features: ['90% recycled down fill', 'Packable into own pocket', 'Wind and water-resistant shell', 'YKK zippers', 'Available in 6 colors', 'Sizes S–3XL'],
    freeShipping: true
  },
  {
    id: 12, category: 'clothing', emoji: '👜',
    title: 'Luxury Leather Tote Bag – Vegan, Multiple Pockets',
    brand: 'StyleHouse',
    price: 79.99, originalPrice: 119.99,
    rating: 4.6, reviews: 1567,
    badge: 'sale', prime: true, inStock: true, isNew: false,
    description: 'Sophisticated vegan leather tote bag perfect for work, travel, or everyday use. Features multiple organizational pockets, a padded laptop sleeve, and magnetic closure.',
    features: ['Premium vegan leather', 'Fits 15" laptop', '5 interior pockets', 'Magnetic snap closure', 'Removable crossbody strap', '4 color options'],
    freeShipping: true
  },

  /* ── HOME & KITCHEN ── */
  {
    id: 13, category: 'home', emoji: '🍳',
    title: 'Non-Stick Cookware Set – 10 Piece, Ceramic Coating',
    brand: 'ChefPro',
    price: 149.99, originalPrice: 249.99,
    rating: 4.6, reviews: 6789,
    badge: 'sale', prime: true, inStock: true, isNew: false,
    description: '10-piece ceramic non-stick cookware set featuring PFOA-free coating. Oven-safe up to 500°F and compatible with all cooktops including induction. Dishwasher safe.',
    features: ['10-piece complete set', 'Ceramic non-stick PFOA-free', 'Oven safe to 500°F', 'All cooktop compatible', 'Dishwasher safe', 'Tempered glass lids'],
    freeShipping: true
  },
  {
    id: 14, category: 'home', emoji: '🪑',
    title: 'Ergonomic Office Chair – Lumbar Support, Adjustable',
    brand: 'ComfortSeat',
    price: 299.99, originalPrice: 499.99,
    rating: 4.7, reviews: 3234,
    badge: 'sale', prime: true, inStock: true, isNew: false,
    description: 'Award-winning ergonomic office chair with advanced lumbar support system. Breathable mesh back keeps you cool during long work sessions. Fully adjustable for any body type.',
    features: ['Advanced lumbar support', 'Breathable mesh back', 'Adjustable armrests (4D)', 'Seat height & tilt adjustment', 'Weight capacity: 300 lbs', '5-year warranty'],
    freeShipping: true
  },
  {
    id: 15, category: 'home', emoji: '💡',
    title: 'Smart LED Bulbs 4-Pack – Voice Control, 16M Colors',
    brand: 'BrightHome',
    price: 34.99, originalPrice: 59.99,
    rating: 4.5, reviews: 8901,
    badge: 'hot', prime: true, inStock: true, isNew: false,
    description: 'Transform your home lighting with 16 million color options. Compatible with Alexa, Google Home, and Apple HomeKit. Schedule, dim, and change colors from your smartphone.',
    features: ['16 million color options', 'Voice & app control', 'Works with Alexa & Google', 'Schedule & automations', 'Energy efficient (9W = 60W)', 'No hub required'],
    freeShipping: false
  },
  {
    id: 16, category: 'home', emoji: '🧹',
    title: 'Robot Vacuum Pro – LiDAR Navigation, Auto-Empty',
    brand: 'CleanBot',
    price: 449.99, originalPrice: 699.99,
    rating: 4.8, reviews: 2345,
    badge: 'sale', prime: true, inStock: true, isNew: false,
    description: 'Advanced robot vacuum with LiDAR mapping technology. Automatically creates a precise map of your home and cleans room by room. Self-empties into the base station for 60 days of hands-free cleaning.',
    features: ['LiDAR navigation & mapping', 'Self-emptying base station (60 days)', '4000Pa suction power', 'Mop function included', 'Multi-floor mapping', 'App & voice control'],
    freeShipping: true
  },
  {
    id: 17, category: 'home', emoji: '☕',
    title: 'Espresso Machine Deluxe – 15-bar, Built-in Grinder',
    brand: 'BrewMaster',
    price: 349.99, originalPrice: 499.99,
    rating: 4.7, reviews: 1678,
    badge: 'prime', prime: true, inStock: true, isNew: false,
    description: 'Barista-quality espresso at home. The integrated conical burr grinder ensures fresh grounds for every cup. Steam wand creates perfect microfoam for lattes and cappuccinos.',
    features: ['15-bar pressure pump', 'Integrated conical burr grinder', 'PID temperature control', 'Steam wand for milk frothing', 'Pre-infusion technology', 'Removable 2.5L water tank'],
    freeShipping: true
  },

  /* ── BOOKS ── */
  {
    id: 18, category: 'books', emoji: '📖',
    title: 'Atomic Habits – Tiny Changes, Remarkable Results',
    brand: 'James Clear',
    price: 16.99, originalPrice: 27.99,
    rating: 4.9, reviews: 89234,
    badge: 'hot', prime: true, inStock: true, isNew: false,
    description: 'The #1 New York Times bestseller. Transform your habits and take your goals to a new level with this life-changing book on building good habits and breaking bad ones.',
    features: ['Paperback, 320 pages', 'Language: English', 'Publisher: Avery', 'NYT #1 Bestseller', 'Over 15 million copies sold', 'Available in digital format too'],
    freeShipping: false
  },
  {
    id: 19, category: 'books', emoji: '📚',
    title: 'The Complete Web Development Course – HTML to Node.js',
    brand: 'Dr. Angela Yu',
    price: 29.99, originalPrice: 49.99,
    rating: 4.8, reviews: 34567,
    badge: 'sale', prime: true, inStock: true, isNew: false,
    description: 'Learn web development from scratch to professional level. Covers HTML5, CSS3, JavaScript, React, Node.js, MongoDB, and more. Over 800 pages of hands-on content.',
    features: ['800+ pages', 'Covers HTML, CSS, JS, React', 'Node.js & MongoDB', 'Practice projects included', 'Updated for 2025', 'Certificate of completion'],
    freeShipping: false
  },

  /* ── SPORTS ── */
  {
    id: 20, category: 'sports', emoji: '🏋️',
    title: 'Adjustable Dumbbell Set – 5-50lbs, Space-Saving',
    brand: 'PowerFit',
    price: 249.99, originalPrice: 399.99,
    rating: 4.8, reviews: 5432,
    badge: 'sale', prime: true, inStock: true, isNew: false,
    description: 'Replace 15 sets of weights with one compact adjustable dumbbell set. Dial to adjust weight from 5 to 50 lbs in seconds. Perfect for home gyms with limited space.',
    features: ['Adjusts from 5 to 50 lbs', 'Replaces 15 sets of weights', 'Quick weight selection', 'Secure locking mechanism', 'Includes storage tray', 'Molded handle for comfort'],
    freeShipping: true
  },
  {
    id: 21, category: 'sports', emoji: '🚲',
    title: 'Electric Bike Pro – 750W Motor, 60-Mile Range',
    brand: 'EcoRide',
    price: 1499.99, originalPrice: 2199.99,
    rating: 4.7, reviews: 876,
    badge: 'sale', prime: true, inStock: true, isNew: false,
    description: 'Powerful electric bike with 750W mid-drive motor and up to 60-mile range on a single charge. Features integrated LED lights, hydraulic disc brakes, and 7-speed Shimano gears.',
    features: ['750W Mid-Drive Motor', '60-mile range per charge', 'Removable 48V 15Ah battery', 'Shimano 7-speed gears', 'Hydraulic disc brakes', 'LCD display with navigation'],
    freeShipping: true
  },
  {
    id: 22, category: 'sports', emoji: '🧘',
    title: 'Premium Yoga Mat – Non-Slip, Eco-Friendly, 6mm',
    brand: 'ZenFlow',
    price: 49.99, originalPrice: 79.99,
    rating: 4.7, reviews: 12340,
    badge: 'new', prime: true, inStock: true, isNew: true,
    description: 'Professional yoga mat made from natural rubber with superior grip. Alignment lines help perfect your poses. Eco-friendly and free from harmful chemicals.',
    features: ['Natural rubber material', 'Superior non-slip grip', '6mm thickness for joint support', 'Alignment guide lines', 'Comes with carrying strap', 'Eco-friendly & toxic-free'],
    freeShipping: false
  },

  /* ── TOYS ── */
  {
    id: 23, category: 'toys', emoji: '🤖',
    title: 'STEM Robot Kit – Programmable, 250+ Pieces',
    brand: 'BrainBuilder',
    price: 79.99, originalPrice: 119.99,
    rating: 4.8, reviews: 3456,
    badge: 'new', prime: true, inStock: true, isNew: true,
    description: 'Build and program your own robot with this comprehensive STEM kit. Teaches coding, engineering, and problem-solving skills. Compatible with Scratch and Python programming.',
    features: ['250+ building pieces', 'Compatible with Scratch & Python', 'Step-by-step instructions', 'Ages 10+ recommended', 'Free companion app', 'Expands with accessory sets'],
    freeShipping: true
  },
  {
    id: 24, category: 'toys', emoji: '🎯',
    title: 'Kids\' Telescope Set – 70x Magnification, Tripod Included',
    brand: 'StarGazer',
    price: 59.99, originalPrice: 89.99,
    rating: 4.6, reviews: 1234,
    badge: 'sale', prime: true, inStock: true, isNew: false,
    description: 'Introduce young astronomers to the wonders of the universe. 70x magnification lets you see moon craters, planets, and star clusters. Includes tripod, multiple eyepieces, and star map.',
    features: ['70x magnification', 'Multiple eyepieces included', 'Aluminum adjustable tripod', 'Star map & astronomy guide', 'Ages 8+ recommended', 'Padded carrying case'],
    freeShipping: false
  },

  /* ── BEAUTY ── */
  {
    id: 25, category: 'beauty', emoji: '✨',
    title: 'Vitamin C Brightening Serum – 30ml, Hyaluronic Acid',
    brand: 'GlowLab',
    price: 34.99, originalPrice: 59.99,
    rating: 4.7, reviews: 18923,
    badge: 'hot', prime: true, inStock: true, isNew: false,
    description: 'Powerful vitamin C serum with 20% L-Ascorbic Acid and hyaluronic acid. Brightens dark spots, evens skin tone, and boosts collagen production for youthful-looking skin.',
    features: ['20% L-Ascorbic Acid', 'Hyaluronic Acid for hydration', 'Reduces dark spots & hyperpigmentation', 'Boosts collagen production', 'Suitable for all skin types', 'Dermatologist tested'],
    freeShipping: false
  },
  {
    id: 26, category: 'beauty', emoji: '💅',
    title: 'Professional Hair Dryer – Ionic, 1875W, 3 Heat Settings',
    brand: 'StylePro',
    price: 69.99, originalPrice: 99.99,
    rating: 4.6, reviews: 7654,
    badge: 'sale', prime: true, inStock: true, isNew: false,
    description: 'Salon-quality ionic hair dryer that dries hair 60% faster while reducing frizz. Features multiple heat and speed settings for all hair types. Comes with diffuser and concentrator.',
    features: ['1875W powerful motor', 'Ionic technology reduces frizz', 'Cold shot button', '3 heat + 2 speed settings', 'Includes diffuser & concentrator', 'Removable filter for easy cleaning'],
    freeShipping: false
  },
  {
    id: 27, category: 'beauty', emoji: '🧴',
    title: 'Luxury Skincare Gift Set – 8 Products, All Skin Types',
    brand: 'LuxDerma',
    price: 89.99, originalPrice: 149.99,
    rating: 4.8, reviews: 4321,
    badge: 'new', prime: true, inStock: true, isNew: true,
    description: 'Complete luxury skincare routine in one beautiful gift set. Includes cleanser, toner, serum, eye cream, moisturizer, face mask, SPF30 sunscreen, and overnight repair cream.',
    features: ['8 full-size products', 'Suitable for all skin types', 'Paraben & sulfate free', 'Dermatologist tested', 'Beautiful gift packaging', 'Travel-size versions available'],
    freeShipping: true
  },
  {
    id: 28, category: 'electronics', emoji: '🔊',
    title: 'Portable Bluetooth Speaker – 360° Sound, 24hr Battery',
    brand: 'SoundWave',
    price: 79.99, originalPrice: 129.99,
    rating: 4.7, reviews: 9876,
    badge: 'hot', prime: true, inStock: true, isNew: false,
    description: '360-degree surround sound with powerful bass. IP67 waterproof and dustproof. 24-hour battery life with USB-C fast charging. Perfect companion for outdoor adventures.',
    features: ['360° stereo surround sound', 'IP67 waterproof & dustproof', '24-hour battery life', 'USB-C fast charging', 'Stereo pairing with 2 speakers', 'Built-in microphone for calls'],
    freeShipping: true
  }
];
