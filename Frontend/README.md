# GramConnect — Frontend

A React 19 single-page application for **GramConnect**, a farm-to-door multi-role grocery delivery platform. The UI adapts per role — customers browse and order fresh produce, vendors manage products and orders, delivery agents track and complete deliveries, and admins oversee the entire platform with revenue analytics.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Bundler | Vite 8 |
| Routing | React Router DOM v7 |
| Styling | Tailwind CSS v3 + inline CSS-in-JS |
| HTTP Client | Axios |
| Charts | Recharts (BarChart, PieChart) |
| Icons | Lucide React, custom inline SVGs |
| Fonts | DM Sans, Syne, IBM Plex Sans, Inter (Google Fonts) |
| Icon CDN | Tabler Icons Webfont |

---

## Project Structure

```
frontend/
├── public/
│   └── favicon.svg
├── src/
│   ├── api/
│   │   └── index.js                  # Axios instance + all API call functions
│   ├── components/
│   │   └── AIChatBot.jsx             # Floating AI chat assistant (Groq-powered)
│   ├── dashboard/
│   │   ├── admindashboard.jsx        # Admin: users, revenue, approval workflows
│   │   ├── vendordashboard.jsx       # Vendor: products, orders, delivery assign, earnings
│   │   ├── customerdashboard.jsx     # Customer: shop, cart, checkout, orders, support
│   │   └── deliverydashboard.jsx     # Delivery: pipeline, earnings, status updates
│   ├── pages/
│   │   ├── login.jsx                 # Login page
│   │   ├── register.jsx              # Role-based registration
│   │   └── forgotpassword.jsx        # OTP-based password reset
│   ├── App.jsx                       # Routes + role-based private route guard
│   ├── main.jsx                      # React entry point
│   └── index.css                     # Tailwind directives
├── index.html                        # Loads Inter font + Tabler Icons CDN
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js >= 20 (required by Vite 8 and React Router v7)
- Backend server running at `http://localhost:5000`

### Installation

```bash
cd frontend
npm install
```

### Run

```bash
npm run dev       # Development server (http://localhost:5173)
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

---

## Authentication & Routing

The app uses a **token-based route guard** (`PrivateRoute`) in `App.jsx`. On login, two values are stored in `localStorage`:

- `gc_token` — JWT access token (auto-attached to every API request)
- `gc_role` — user role (`admin` | `vendor` | `customer` | `delivery`)

On any `401` API response, the user is automatically logged out and redirected to `/login`.

| Path | Access | Redirects to |
|---|---|---|
| `/` | Public | `/login` |
| `/login` | Public | — |
| `/register` | Public | — |
| `/forgotpassword` | Public | — |
| `/admindashboard` | `admin` only | `/login` if no token / wrong role |
| `/vendordashboard` | `vendor` only | `/login` if no token / wrong role |
| `/customerdashboard` | `customer` only | `/login` if no token / wrong role |
| `/deliverydashboard` | `delivery` only | `/login` if no token / wrong role |

---

## Pages

### Login (`/login`)
Email + password login with password visibility toggle and inline error display. On success, stores token and role and redirects to the appropriate dashboard. Handles `Pending`, `Rejected`, and `Blocked` account states with clear error messages. Supports dark/light theme toggle.

### Register (`/register`)
Role-based registration with a tab switcher for Vendor / Customer / Delivery. Fields adjust dynamically per role:

- **Customer** — name, email, phone, age, location, password
- **Vendor** — all of the above + ID proof document upload (required for admin approval)
- **Delivery** — all of the above + vehicle type (bike / scooty / car), ID proof upload, driving license upload

New vendors and delivery agents start in **Pending** status and require admin approval before they can log in. Supports dark/light theme toggle.

### Forgot Password (`/forgotpassword`)
Two-step OTP recovery flow:
1. Enter registered email → OTP sent to the address
2. Enter OTP + new password + confirm password → password updated, redirect to login

Includes password visibility toggles, step indicator, and dark/light theme toggle.

---

## Dashboards

All dashboards support **dark/light theme toggling** (persisted to `localStorage`).

### Customer Dashboard (`/customerdashboard`)

**Navigation tabs:** Dashboard · Shop · Cart · Orders · Support

| Tab | Features |
|---|---|
| Dashboard | Stats (total orders, delivered, pending, total spent), monthly deliveries bar chart, recent orders list |
| Shop | Product grid with search + category filter, vendor name + location, add-to-cart with quantity controls, in-cart quantity editor, multi-vendor detection warning |
| Cart | Item list with remove, price breakdown (item total → auto discount → distance charge → ₹10 platform fee → grand total), address step (city selector + street + PIN), distance fee calculation, checkout flow with COD / UPI / Card payment |
| Orders | Full order history, per-order fee breakdown (item amount, discount, distance charge, platform fee), live tracking bar (Placed → Accepted → Preparing → Assigned → On the way → Delivered), cancel with reason (Placed status only), 1–5 star rating + feedback (delivered only), Reorder button (fetches live prices), Invoice PDF download per order, Purchase Delivered Statement (all delivered orders PDF) |
| Support | Info cards: About GramConnect, How to Order, Delivery Info, Fee Breakdown, Discounts & Offers, Ratings & Feedback; contact details + quick links |

**Discount tiers (auto-applied at checkout):**

| Cart Total | Discount |
|---|---|
| ₹300 – ₹499 | 10% off |
| ₹500 – ₹999 | 15% off |
| ₹1000+ | 20% off |

Customers can manually remove the discount before placing an order.

**Fee formula:** `Total = Item Amount − Discount + Distance Charge (₹5 × km) + Platform Fee (₹10)`

---

### Vendor Dashboard (`/vendordashboard`)

**Navigation tabs:** Dashboard · Products · Orders · Delivery · Support

| Tab | Features |
|---|---|
| Dashboard | KPI cards (total products, in-stock, total/pending/delivered orders, net earnings, discounts given, rejected/cancelled count), earnings breakdown (item sales − 3% commission = net), weekly orders bar chart (Mon–Sun), order status pie chart, recent orders list |
| Products | Add / edit / delete products (name, price, quantity, unit, category, description, image upload), toggle In Stock / Out of Stock per product, product grid with image, price, vendor location |
| Orders | Filter bar by status, per-order fee breakdown panel (customer paid → deductions → your net earnings), flow track (Placed → Accepted → Preparing → Ready → Assigned → Delivered), Accept / Reject (with reason) / Mark Preparing / Mark Ready / Assign Delivery actions, rejection reason display, cancellation reason display, Invoice PDF button per order, Delivered Orders Statement PDF button |
| Delivery | Available delivery agents list (name, phone, vehicle, location), active deliveries with progress bar (Assigned → Picked → On the way → Delivered) |
| Support | Help cards: Adding & Managing Products, Managing Incoming Orders, Assigning Delivery Agents, Understanding Your Earnings; contact details |

**Earnings formula per order:** `Item Amount − 3% commission = Net Vendor Earnings`
The 3% commission goes to the delivery partner; the ₹10 platform fee and distance charge are separate and do not affect vendor payout.

---

### Delivery Dashboard (`/deliverydashboard`)

**Navigation tabs:** Dashboard · Deliveries · Earnings · Support

| Tab | Features |
|---|---|
| Dashboard | KPI cards (total earnings, completed, active, total orders), earnings breakdown (commission + distance charge), status distribution pie chart, active deliveries mini-list, notifications panel |
| Deliveries | Full delivery pipeline with status filter chips, per-order earnings pill (3% commission + ₹5/km distance), customer info + phone link, delivery address, order items, step progress track (Assigned → Picked → On the way → Delivered), action buttons: Accept & Pickup / Start Delivery / Mark Delivered / Decline / Call Customer |
| Earnings | Hero card (lifetime total + today + this week), earnings breakdown (commission / distance / net), analytics grid (avg per delivery, today, this week), completed deliveries list with per-delivery breakdown |
| Support | 5-step delivery workflow cards, FAQ grid (How You Earn, How Orders are Assigned, Customer Not Reachable, Declining Orders, Performance & Ratings, Staying Updated), contact support panel |

**Earnings formula per delivery:** `3% × Item Amount + ₹5 × Distance (km) = Total Earnings`

---

### Admin Dashboard (`/admindashboard`)

**Navigation tabs:** Dashboard · Vendors · Customers · Delivery · Revenue

| Tab | Features |
|---|---|
| Dashboard | User summary cards (customers active/blocked, vendors approved/rejected/pending, delivery approved/rejected/pending) with year filter, platform performance bar chart, live activity timeline (last 10 user events) |
| Vendors | Stat cards (approved / rejected / pending counts), vendor directory table (name, email, location, age, phone, ID proof link, status), Manage → Approve / Reject inline actions |
| Customers | Customer cards grid (name, email, location, age, phone, status, block reason if blocked), Manage → Activate / Block (with reason prompt) inline actions |
| Delivery | Stat cards, delivery partners table (name, email, location, age, phone, vehicle, ID proof link, license link, status), Manage → Approve / Reject inline actions |
| Revenue | KPI cards (total revenue, today, this week, delivered orders count), revenue model breakdown (Customer Pays / Vendor Gets / Delivery Gets / GramConnect Keeps), monthly revenue bar chart with year filter, recent delivered orders table |

**Platform revenue model:**

| Party | Amount |
|---|---|
| Customer pays | Item + Distance Charge + ₹10 Platform Fee |
| Vendor receives | Item Amount − 3% commission |
| Delivery receives | 3% commission + Distance Charge |
| GramConnect keeps | ₹10 flat Platform Fee per delivered order |

---

## AI Chat Assistant (`AIChatBot.jsx`)

A floating chatbot rendered in all four dashboards, positioned bottom-right. Each role gets a distinct bot identity, avatar, accent colour, and system prompt:

| Role | Bot Name | Accent |
|---|---|---|
| Customer | GramAssist | Emerald green |
| Vendor | VendorBot | Amber |
| Delivery | RouteBot | Blue |
| Admin | AdminAI | Purple |

**Features:**
- Role-specific system prompts with accurate platform knowledge (pricing, workflows, statuses)
- Quick-chip suggestion buttons (8 for customer, 6 for vendor/delivery/admin) — hidden after first message
- Multi-language support: English, Tamil, Hindi, Telugu (language selector in header; resets chat on change)
- Typing indicator with animated dots
- Clear chat button
- Dark/light theme awareness passed from parent dashboard
- Communicates with backend `/api/chat` endpoint (Groq LLaMA model, port 5000)

---

## API Layer (`src/api/index.js`)

All calls go through a single Axios instance with base URL `http://localhost:5000/api`. The JWT token is auto-attached via a request interceptor; a response interceptor handles `401` by clearing storage and redirecting to `/login`.

**Auth**
```js
login(data)
register(data)            // multipart/form-data
sendOtp(data)
resetPassword(data)
getProfile()
getUsers()
updateUserStatus(id, data)
```

**Products**
```js
getProducts(params)       // supports search + category query params
getMyProducts()
addProduct(data)          // multipart/form-data (includes image)
updateProduct(id, data)   // multipart/form-data
deleteProduct(id)
toggleStock(id)
```

**Orders**
```js
placeOrder(data)
getMyOrders()
cancelOrder(id, reason)
rateOrder(id, data)
getVendorOrders()
vendorUpdateOrder(id, status, reason?)
assignDelivery(id, deliveryId)
getDeliveryAgents()
getDeliveryOrders()
deliveryUpdateOrder(id, status)
getEarnings()
```

**Constants**
```js
BASE_URL   // "http://localhost:5000/uploads" — prefix for uploaded images
```

---

## Order Status Flow

```
Placed → Accepted → Preparing → Ready → Assigned → Picked → On the way → Delivered
                                                  ↘ Declined (delivery only)
       ↘ Rejected (vendor)
Placed ↘ Cancelled (customer, Placed status only)
```

---

## Environment / Configuration

The API base URL is hardcoded in `src/api/index.js`:

```js
baseURL: "http://localhost:5000/api"
```

To point to a different backend, update this value or switch to a Vite environment variable:

```js
baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api"
```

Then create a `.env` file:

```
VITE_API_URL=https://your-backend.example.com/api
```