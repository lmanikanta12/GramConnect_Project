# GramConnect — Backend

A Node.js/Express REST API for **GramConnect**, a multi-role farm-to-door grocery delivery platform connecting vendors, customers, and delivery agents — with an AI-powered chat assistant, distance-based pricing, and HTML invoice generation.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js >= 18 |
| Framework | Express.js v5 |
| Database | MongoDB (Mongoose v9) |
| Auth | JWT + bcryptjs |
| File Uploads | Multer |
| AI Chat | Groq SDK (LLaMA 3.3 70B) |
| Email | Nodemailer (Gmail SMTP) |
| Dev Server | Nodemon |

---

## Project Structure

```
backend/
├── config/
│   └── db.js                  # MongoDB connection
├── controllers/
│   ├── authController.js      # Register, login, OTP, profile, admin
│   ├── orderController.js     # Full order lifecycle + invoices + statements
│   └── productController.js   # Product CRUD + stock toggle
├── middleware/
│   ├── auth.js                # JWT protect + adminOnly middleware
│   └── upload.js              # Multer config (images + PDFs, 5 MB limit)
├── models/
│   ├── User.js                # User schema (customer / vendor / delivery)
│   ├── Product.js             # Product schema with vendor location sync
│   └── Order.js               # Order schema with full earnings breakdown
├── routes/
│   ├── authRoutes.js          # /api/auth/*
│   ├── productRoutes.js       # /api/products/*
│   ├── orderRoutes.js         # /api/orders/*
│   └── chat.js                # /api/chat (Groq AI)
├── uploads/                   # Stored product images & ID documents
├── utils/
│   └── sendEmail.js           # Nodemailer email utility
├── server.js                  # App entry point
├── .env                       # Environment variables (not committed)
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- MongoDB (local or Atlas)
- Groq API key
- Gmail account with an App Password (for Nodemailer)

### Installation

```bash
cd backend
npm install
```

### Environment Variables

Create a `.env` file in the `backend/` root:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GROQ_API_KEY=your_groq_api_key

# Nodemailer (Gmail SMTP)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# Admin notification recipient
ADMIN_EMAIL=admin@example.com
```

### Run

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

Server starts at `http://localhost:5000`.  
Health check: `GET /` → `🌾 GramConnect API is running...`

---

## API Reference

Protected routes require:
```
Authorization: Bearer <token>
```

Invoice routes also accept a `?token=<jwt>` query parameter (to support `window.open()` from the browser).

---

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | ❌ | Register as customer, vendor, or delivery agent (supports file uploads) |
| POST | `/login` | ❌ | Login — returns JWT token, role, and status |
| POST | `/send-otp` | ❌ | Send 6-digit OTP to email for password reset (valid 5 min) |
| POST | `/reset-password` | ❌ | Reset password with email + OTP verification |
| GET | `/profile` | ✅ | Get logged-in user profile (password excluded) |
| GET | `/users` | ✅ Admin | Get all users, sorted by newest first |
| PUT | `/status/:id` | ✅ Admin | Approve / Reject / Block a user (with optional reason) |

**Registration file fields (multipart/form-data):**

| Field | Role |
|---|---|
| `vendorId` | Vendor identity document |
| `deliveryId` | Delivery agent identity document |
| `license` | Delivery agent vehicle license |

**Login status rules:**

| Status | Result |
|---|---|
| `Active` / `Approved` | JWT issued, login succeeds |
| `Pending` | 403 — awaiting admin approval |
| `Rejected` | 403 — registration not approved |
| `Blocked` | 403 — blocked with reason message |

**Admin login** uses hardcoded credentials (`admin@gmail.com` / `12345678`) and returns a role-only JWT (no user document).

---

### Products — `/api/products`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | ❌ | Browse all active, in-stock products (filterable by `category`, `vendorId`, `search`) |
| GET | `/mine` | ✅ Vendor | Get the authenticated vendor's own products |
| GET | `/:id` | ❌ | Get a single product by ID |
| POST | `/` | ✅ Vendor | Add a product (with optional image upload) |
| PUT | `/:id` | ✅ Vendor | Update a product (auto-syncs vendor location) |
| DELETE | `/:id` | ✅ Vendor | Delete a product |
| PATCH | `/:id/stock` | ✅ Vendor | Toggle `In Stock` / `Out of Stock` |

**Query parameters for `GET /`:**

| Param | Description |
|---|---|
| `category` | Filter by category (e.g. `vegetables`) |
| `vendorId` | Filter by specific vendor |
| `search` | Case-insensitive name search |

---

### Orders — `/api/orders`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/` | ✅ Customer | Place an order (split per vendor automatically) |
| GET | `/my` | ✅ Customer | Get the customer's own orders |
| PATCH | `/:id/cancel` | ✅ Customer | Cancel an order (restores stock) |
| PATCH | `/:id/rate` | ✅ Customer | Rate and leave feedback on a delivered order |
| POST | `/calculate-fees` | ✅ Customer | Preview distance charge and platform fee before placing |
| GET | `/invoice/all-delivered` | ✅ Customer | Generate a combined HTML purchase statement (all delivered orders) |
| GET | `/vendor` | ✅ Vendor | Get all incoming orders for the vendor |
| PATCH | `/:id/vendor-update` | ✅ Vendor | Update order status (`Accepted` / `Rejected` / `Preparing` / `Ready`) |
| PATCH | `/:id/assign-delivery` | ✅ Vendor | Assign an approved delivery agent to an order |
| GET | `/delivery-agents` | ✅ Vendor | List all approved delivery agents |
| GET | `/invoice/vendor-statement` | ✅ Vendor | Generate a combined HTML earnings statement (all delivered orders) |
| GET | `/delivery` | ✅ Delivery | Get orders assigned to the delivery agent |
| PATCH | `/:id/delivery-update` | ✅ Delivery | Update status (`Picked` / `On the way` / `Delivered` / `Declined`) |
| GET | `/earnings/summary` | ✅ Delivery | Get total, today, and weekly earnings summary |
| GET | `/all` | ✅ Admin | View all orders |
| GET | `/platform-revenue` | ✅ Admin | Platform fee revenue (total, today, weekly) |
| GET | `/:id/invoice` | ✅ Customer / Vendor | Generate a single-order HTML invoice |

**Place Order — request body:**

```json
{
  "items": [
    {
      "productId": "...",
      "name": "Tomatoes",
      "price": 30,
      "quantity": 2,
      "unit": "kg",
      "totalPrice": 60,
      "vendorId": "...",
      "vendorName": "Ravi Farms",
      "image": "tomato.jpg"
    }
  ],
  "deliveryAddress": "123 Main St, Hyderabad",
  "shippingCity": "hyderabad",
  "paymentMethod": "COD",
  "discountPercent": 10,
  "discountAmount": 6,
  "discountApplied": true
}
```

Orders with items from multiple vendors are automatically **split into separate per-vendor orders** in a single request.

**Calculate Fees — request body:**

```json
{
  "vendorId": "...",
  "shippingCity": "karimnagar"
}
```

---

### AI Chat — `/api/chat`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/chat` | ❌ | Send a message to the Groq LLaMA 3.3 70B assistant |

**Request body:**

```json
{
  "messages": [{ "role": "user", "content": "What vegetables are in season?" }],
  "systemPrompt": "You are a helpful grocery assistant for GramConnect."
}
```

**Response:**

```json
{
  "reply": "Tomatoes, spinach, and brinjal are great right now..."
}
```

---

## Data Models

### User

| Field | Notes |
|---|---|
| `role` | `customer` \| `vendor` \| `delivery` |
| `status` | `Active` (customers) \| `Pending` → `Approved` / `Rejected` / `Blocked` (vendors & delivery) |
| `reason` | Populated when status is `Blocked` |
| `vendorId` | Uploaded ID document filename (vendors) |
| `deliveryId` | Uploaded ID document filename (delivery) |
| `license` | Uploaded vehicle license filename (delivery) |
| `vehicleType` | `scooty` \| `bike` \| `car` \| `van` |
| `otp` / `otpExpire` | Temporary OTP for password reset (cleared after use) |

Passwords, OTPs, and expiry dates are stripped from all JSON responses via `toJSON()`.

### Product

| Field | Notes |
|---|---|
| `category` | `vegetables` \| `fruits` \| `grains` \| `dairy` \| `spices` \| `other` |
| `stock` | `In Stock` \| `Out of Stock` (auto-updated when quantity hits 0) |
| `location` / `vendorLocation` | Synced from the vendor's profile on every update |
| `isActive` | Soft-active flag; only `true` products appear in public listings |

### Order

**Status lifecycle:**

```
Placed → Accepted → Preparing → Ready → Assigned → Picked → On the way → Delivered
                                                                        ↕
                         Cancelled (customer) / Rejected (vendor) / Declined (delivery)
```

When an order is cancelled, rejected, or declined, all item quantities are **automatically restored** to stock.

**Pricing breakdown:**

| Field | Calculation |
|---|---|
| `itemAmount` | Sum of all `item.price × item.quantity` |
| `distanceKm` | Haversine formula between vendor city and shipping city |
| `distanceCharge` | `distanceKm × ₹5` |
| `platformFee` | Fixed ₹10 per order |
| `discountAmount` | Applied before final total |
| `totalAmount` | `itemAmount − discount + distanceCharge + platformFee` |

Maximum delivery distance is **100 km**. Orders beyond this are rejected.

**Earnings breakdown:**

| Recipient | Calculation |
|---|---|
| Vendor | `itemAmount − 3% commission − discountAmount` |
| Delivery Agent | `3% commission + distanceCharge` |
| Platform | `₹10 platformFee` |

**Supported cities** (for distance calculation): Major cities across Andhra Pradesh, Telangana, Karnataka, Tamil Nadu, and Maharashtra are included in the city coordinates lookup table.

---

## Invoice & Statement Generation

The backend generates styled, print-ready **HTML invoices** returned directly as `text/html` responses. No PDF library is required — users print or save to PDF from the browser.

| Endpoint | Audience | Design |
|---|---|---|
| `GET /api/orders/:id/invoice` | Customer | Warm ivory/gold theme, itemised totals, discount row |
| `GET /api/orders/:id/invoice` | Vendor | Royal blue/indigo theme, earnings + commission breakdown metrics strip |
| `GET /api/orders/invoice/all-delivered` | Customer | Landscape statement, summary strip, all delivered orders table |
| `GET /api/orders/invoice/vendor-statement` | Vendor | Landscape earnings statement, per-order commission breakdown |

All invoices include a **Print / Save PDF** button and are print-optimised with `@media print` styles.

---

## Email Notifications

Emails are sent via Nodemailer (Gmail SMTP) as non-blocking background operations. Three HTML email templates are included:

| Trigger | Recipient | Content |
|---|---|---|
| User registration | New user | Welcome email with account details and status note |
| User registration | Admin | Alert with full user details and action required (for non-customer roles) |
| Forgot password | User | OTP email with 5-minute expiry warning |

---

## File Uploads

Files are stored in `backend/uploads/` and served statically at:

```
http://localhost:5000/uploads/<filename>
```

| Upload | Field Name | Allowed Types | Max Size |
|---|---|---|---|
| Product image | `image` (single) | JPG, PNG | 5 MB |
| Vendor ID | `vendorId` (single) | JPG, PNG, PDF | 5 MB |
| Delivery ID | `deliveryId` (single) | JPG, PNG, PDF | 5 MB |
| Delivery license | `license` (single) | JPG, PNG, PDF | 5 MB |

---

## Middleware

**`protect`** — Verifies JWT from `Authorization: Bearer <token>` header or `?token=` query param. Attaches decoded user to `req.user`.

**`adminOnly`** — Must follow `protect`. Rejects requests where `req.user.role !== "admin"`.

**`upload`** — Multer instance with disk storage, unique timestamped filenames, file type filtering, and 5 MB size limit.

---

## Scripts

```bash
npm run dev    # Start with nodemon (auto-reload)
npm start      # Start with node
```