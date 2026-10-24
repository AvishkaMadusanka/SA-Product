# 🍰 SA Product - Backend REST API

Node.js & Express REST API for the **SA Product** Cake Bakery website.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v16 or higher).

### 2. Installation
Navigate to the `backend` directory in your terminal and install dependencies:
```bash
cd backend
npm install
```

### 3. Environment Setup
Copy `.env.example` to create your `.env` file:
```bash
cp .env.example .env
```

### 4. Start the Server
- **Development Mode** (with auto-restart):
  ```bash
  npm run dev
  ```
- **Production Mode**:
  ```bash
  npm start
  ```

Server will run at: **`http://localhost:5000`**

---

## 📡 API Endpoints

### 🩺 Health Check
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Check API server status |

### 🍰 Cakes (`/api/cakes`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/cakes` | Get all cakes (Supports query filter: `?category=birthday`) |
| `GET` | `/api/cakes/:id` | Get specific cake by ID |
| `POST` | `/api/cakes` | Add a new cake (Admin) |
| `DELETE` | `/api/cakes/:id` | Delete a cake (Admin) |

### 📦 Orders (`/api/orders`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/orders` | View all customer orders (Supports `?status=Pending`) |
| `GET` | `/api/orders/:id` | View order by ID |
| `POST` | `/api/orders` | Place a new cake order (User Side) |
| `PUT` | `/api/orders/:id/status` | Update order status (`Pending`, `Confirmed`, `Delivered`) |
| `DELETE` | `/api/orders/:id` | Cancel / Delete an order |

### 💬 Feedback (`/api/feedback`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/feedback` | Get customer reviews & ratings |
| `POST` | `/api/feedback` | Submit customer review |
| `DELETE` | `/api/feedback/:id` | Remove a review (Admin) |

### 📊 Admin Dashboard Stats (`/api/stats`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/stats` | Summary of total products, orders, revenue, and pending counts |

---

## 📁 Backend Directory Architecture

```
backend/
├── config/
│   └── db.js                 # Database connector / File adapter
├── controllers/
│   ├── cakeController.js     # Cake business logic
│   ├── orderController.js    # Order processing logic
│   └── feedbackController.js # Feedback logic
├── routes/
│   ├── cakeRoutes.js         # Cake endpoints
│   ├── orderRoutes.js        # Order endpoints
│   └── feedbackRoutes.js     # Feedback endpoints
├── models/
│   ├── Cake.js               # Cake schema definition
│   ├── Order.js              # Order schema definition
│   └── Feedback.js           # Feedback schema definition
├── middleware/
│   └── errorHandler.js       # Global error handler
├── data/
│   ├── cakes.json            # Initial cakes storage
│   ├── orders.json           # Initial orders storage
│   └── feedback.json         # Initial feedback storage
├── .env.example
├── package.json
└── server.js                 # Express server entry point
```
