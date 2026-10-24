# 🍰 SA Product - Cake Bakery & Ordering System

A full-stack Cake Bakery web application and REST API system. Customers can browse artisan cake galleries, submit custom orders, and share feedback, while store owners can manage inventory and orders through the platform.

---

## 📁 Project Architecture & File Structure

The project is cleanly decoupled into `frontend/` and `backend/` directories:

```text
SA-Product/
├── .github/
│   └── workflows/
│       └── static.yml           # GitHub Pages automated deployment workflow
├── frontend/                     # Client-side web application
│   ├── assets/
│   │   ├── css/
│   │   │   └── styles.css       # Main design system & responsive styling
│   │   ├── js/
│   │   │   └── script.js        # UI interactions & gallery logic
│   │   └── images/
│   │       ├── cakes/           # Categorized cake collections
│   │       │   ├── birthday/    # Birthday cake images (1.jpg - 10.jpg)
│   │       │   ├── cupcakes/    # Cupcake collection (1.jpg - 10.jpg)
│   │       │   ├── custom/      # Custom themed cakes (1.jpg - 4.jpg)
│   │       │   ├── structured/  # Architectural sculpted cakes (1.jpg - 11.jpg)
│   │       │   └── wedding/     # Wedding cakes (1.jpg - 12.jpg)
│   │       └── site/            # Logos, banners & feature badges
│   ├── index.html               # Main storefront landing page
│   ├── feedback.html            # Customer review submission page
│   └── birthdayGallery.html     # Dedicated birthday gallery view
├── backend/                      # Node.js & Express REST API
│   ├── config/
│   │   └── db.js                # Database storage adapter
│   ├── controllers/
│   │   ├── cakeController.js    # Cake product business logic
│   │   ├── orderController.js   # Order placement & status updates
│   │   └── feedbackController.js# Feedback management logic
│   ├── routes/
│   │   ├── cakeRoutes.js        # /api/cakes endpoints
│   │   ├── orderRoutes.js       # /api/orders endpoints
│   │   └── feedbackRoutes.js    # /api/feedback endpoints
│   ├── models/
│   │   ├── Cake.js              # Cake schema definition
│   │   ├── Order.js             # Order schema definition
│   │   └── Feedback.js          # Feedback schema definition
│   ├── middleware/
│   │   └── errorHandler.js      # Centralized error handler
│   ├── data/
│   │   ├── cakes.json           # Initial cake catalog
│   │   ├── orders.json          # Initial customer orders
│   │   └── feedback.json        # Customer feedback records
│   ├── .env.example             # Environment configuration template
│   ├── package.json             # Backend dependencies & scripts
│   ├── README.md                # Backend API documentation
│   └── server.js                # Express server entry point
├── .gitignore                   # Ignored files (node_modules, .env, etc.)
└── README.md                    # Root project documentation
```

---

## 🚀 Getting Started

### 1. Running the Frontend
You can open `frontend/index.html` directly in any web browser, or use VS Code's "Live Server" extension, or run it through the Express backend.

### 2. Running the Backend (Node.js & Express)
1. Open a terminal in the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```
3. Start the server:
   - **Development Mode** (auto-restart on changes):
     ```bash
     npm run dev
     ```
   - **Production Mode**:
     ```bash
     npm start
     ```
4. Access the API at **`http://localhost:5000`**:
   - Health check: `http://localhost:5000/api/health`
   - Cakes API: `http://localhost:5000/api/cakes`
   - Orders API: `http://localhost:5000/api/orders`
   - Feedback API: `http://localhost:5000/api/feedback`
   - Admin Summary Stats: `http://localhost:5000/api/stats`

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Modern JavaScript (Vanilla), Font Awesome 6
- **Backend**: Node.js, Express.js, CORS, Dotenv
- **Deployment**: GitHub Pages (via GitHub Actions targeting `frontend/`)
