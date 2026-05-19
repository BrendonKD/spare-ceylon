# Spare Ceylon

An AI-powered auto parts e-commerce marketplace connecting buyers and sellers with intelligent part identification.

## Features

- **AI Part Identification** — Identify auto parts from images
- **Full E-Commerce** — Cart, orders, payments via Stripe
- **Vendor Management** — Listings, subscriptions, verification
- **User Dashboards** — Separate interfaces for customers, vendors, admins
- **Community** — Forums, messaging, reviews & ratings
- **Payments** — Stripe integration with webhooks

## Project Structure

```
spare-ceylon/
├── frontend/          React UI
├── backend/           Express API
├── ml_service/        Python ML service
└── package.json
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router, Axios, Bootstrap 5, Stripe.js |
| Backend | Node.js, Express 5, MongoDB, JWT, Stripe SDK |
| ML | Flask, TensorFlow/Keras, OpenCV, PIL |

## Quick Start

### Prerequisites
- Node.js v14+
- Python 3.8+
- MongoDB
- Stripe account

### Installation

**Backend**
```bash
cd backend && npm install
# Create .env with MONGODB_URI, JWT_SECRET, STRIPE_SECRET_KEY
npm start
```

**Frontend**
```bash
cd frontend && npm install
npm start
```

**ML Service**
```bash
cd ml_service
pip install flask flask-cors tensorflow pillow opencv-python numpy
python app.py
```

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | User login |
| GET | `/api/public/listings` | Get listings |
| POST | `/api/vendor/listings` | Create listing |
| POST | `/api/orders` | Place order |
| GET | `/api/cart` | View cart |
| GET | `/api/messages` | Get messages |
| POST | `/api/subscriptions` | Create subscription |
| POST | `/api/stripe/webhook` | Payment webhook |

**ML Service**
- `POST /predict` — Identify part from image
- `GET /health` — Service status

## ML Model

Uses TensorFlow/Keras to classify auto parts from images (224x224px).

**Quality Checks:**
- Blur detection (threshold: 80.0)
- Confidence minimum: 55%
- Prediction margin: 15%
- Entropy threshold: 2.40

**Request:**
```json
{
  "image": "base64_encoded_image"
}
```

**Response:**
```json
{
  "success": true,
  "part_name": "Engine Block",
  "confidence": 92.5
}
```

## Environment Variables

**.env (Backend)**
```
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret
STRIPE_SECRET_KEY=your_stripe_key
PORT=5000
```

## Authentication

JWT-based with bcrypt password hashing. Role-based access for customers, vendors, and admins.

## Deployment

- **Frontend:** Build with `npm run build`, deploy to Vercel/Netlify
- **Backend:** Deploy to Heroku/AWS/DigitalOcean with MongoDB Atlas
- **ML:** Containerize with Docker for scaling

## Author

Kekulkotuwage D Brendon
