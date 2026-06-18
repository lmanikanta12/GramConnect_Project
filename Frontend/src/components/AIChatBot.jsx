import { useState, useRef, useEffect } from "react";

// ─── Language config ──────────────────────────────────────────────────────────
const LANGUAGES = {
  en: { label: "EN", name: "English" },
  ta: { label: "தமி", name: "Tamil" },
  hi: { label: "हिं", name: "Hindi" },
  te: { label: "తెలు", name: "Telugu" },
};

const LANG_INSTRUCTION = {
  en: "",
  ta: "\n\nIMPORTANT: Always respond in Tamil (தமிழ்) language. Use simple, clear Tamil. Technical terms can remain in English if no Tamil equivalent exists.",
  hi: "\n\nIMPORTANT: Always respond in Hindi (हिंदी) language. Use simple, clear Hindi. Technical terms can remain in English if no Hindi equivalent exists.",
  te: "\n\nIMPORTANT: Always respond in Telugu (తెలుగు) language. Use simple, clear Telugu. Technical terms can remain in English if no Telugu equivalent exists.",
};

// UI strings per language
const UI_STRINGS = {
  en: {
    online: "Online",
    clear: "↺ Clear",
    clearTitle: "Clear chat",
    poweredBy: "Powered by GROQ AI · GramConnect",
  },
  ta: {
    online: "ஆன்லைன்",
    clear: "↺ அழி",
    clearTitle: "அரட்டையை அழி",
    poweredBy: "GROQ AI · GramConnect மூலம் இயக்கப்படுகிறது",
  },
  hi: {
    online: "ऑनलाइन",
    clear: "↺ साफ़",
    clearTitle: "चैट साफ़ करें",
    poweredBy: "GROQ AI · GramConnect द्वारा संचालित",
  },
  te: {
    online: "ఆన్‌లైన్",
    clear: "↺ క్లియర్",
    clearTitle: "చాట్ క్లియర్ చేయి",
    poweredBy: "GROQ AI · GramConnect ద్వారా నడుస్తోంది",
  },
};

// Greetings per role per language
const GREETINGS = {
  customer: {
    en: "Hi! 👋 I'm GramAssist, your shopping helper. Ask me anything about orders, products, delivery, or fees!",
    ta: "வணக்கம்! 👋 நான் GramAssist, உங்கள் ஷாப்பிங் உதவியாளர். ஆர்டர்கள், தயாரிப்புகள், டெலிவரி அல்லது கட்டணங்கள் பற்றி என்னிடம் கேளுங்கள்!",
    hi: "नमस्ते! 👋 मैं GramAssist हूँ, आपका शॉपिंग सहायक। ऑर्डर, उत्पाद, डिलीवरी या शुल्क के बारे में कुछ भी पूछें!",
    te: "నమస్కారం! 👋 నేను GramAssist, మీ షాపింగ్ సహాయకుడు. ఆర్డర్లు, ఉత్పత్తులు, డెలివరీ లేదా రుసుముల గురించి అడగండి!",
  },
  vendor: {
    en: "Hello! 🌾 I'm VendorBot. Ask me about managing products, handling orders, assigning deliveries, or understanding your earnings.",
    ta: "வணக்கம்! 🌾 நான் VendorBot. தயாரிப்புகள் நிர்வகிப்பு, ஆர்டர்கள் கையாளுதல், டெலிவரி ஒதுக்குதல் அல்லது உங்கள் வருவாய் பற்றி கேளுங்கள்.",
    hi: "नमस्ते! 🌾 मैं VendorBot हूँ। उत्पाद प्रबंधन, ऑर्डर संभालना, डिलीवरी असाइन करना या अपनी कमाई के बारे में पूछें।",
    te: "నమస్కారం! 🌾 నేను VendorBot. ఉత్పత్తుల నిర్వహణ, ఆర్డర్లు, డెలివరీ అసైన్‌మెంట్ లేదా మీ సంపాదన గురించి అడగండి.",
  },
  delivery: {
    en: "Hey! 🚴 I'm RouteBot. Ask me about your delivery workflow, earnings breakdown, or how to handle tricky situations on the road.",
    ta: "ஹேய்! 🚴 நான் RouteBot. உங்கள் டெலிவரி பணிப்பாய்வு, வருவாய் விவரம் அல்லது சாலையில் சிக்கலான சூழ்நிலைகளை எப்படி கையாள்வது என்று கேளுங்கள்.",
    hi: "हे! 🚴 मैं RouteBot हूँ। अपनी डिलीवरी वर्कफ़्लो, कमाई विवरण, या मुश्किल परिस्थितियों से निपटने के बारे में पूछें।",
    te: "హే! 🚴 నేను RouteBot. మీ డెలివరీ వర్క్‌ఫ్లో, సంపాదన వివరణ లేదా రోడ్డులో కష్టమైన పరిస్థితులను ఎలా నిర్వహించాలో అడగండి.",
  },
  admin: {
    en: "Welcome, Admin. 📊 I'm AdminAI. Ask me about platform revenue, user management, approval workflows, or operational insights.",
    ta: "வரவேற்கிறோம், Admin. 📊 நான் AdminAI. பிளாட்ஃபார்ம் வருவாய், பயனர் மேலாண்மை, ஒப்புதல் பணிப்பாய்வுகள் அல்லது செயல்பாட்டு நுண்ணறிவு பற்றி கேளுங்கள்.",
    hi: "स्वागत है, Admin. 📊 मैं AdminAI हूँ। प्लेटफ़ॉर्म राजस्व, उपयोगकर्ता प्रबंधन, अनुमोदन वर्कफ़्लो, या परिचालन जानकारी के बारे में पूछें।",
    te: "స్వాగతం, Admin. 📊 నేను AdminAI. ప్లాట్‌ఫారమ్ ఆదాయం, వినియోగదారు నిర్వహణ, ఆమోద వర్క్‌ఫ్లోలు లేదా కార్యాచరణ అంతర్దృష్టుల గురించి అడగండి.",
  },
};

// ─── Quick chips per role per language ───────────────────────────────────────
// Only questions matching actually implemented features:
// Customer  → order statuses, bill breakdown (₹5/km + ₹10 fee), payment methods, cancel window, rating, invoice
// Vendor    → add/edit product, accept→prepare→ready flow, assign delivery, 3% commission, stock toggle, earnings statement
// Delivery  → step-by-step flow, earnings (3% + ₹5/km), decline impact, unreachable customer, performance score, mark delivered
// Admin     → approve vendor/delivery, block/activate customer, ₹10 fee, revenue model, documents to check, monthly chart
const QUICK_CHIPS = {
  customer: {
    en: [
      "What are the order statuses?",
      "How is my total bill calculated?",
      "Which payment methods are accepted?",
      "When can I cancel my order?",
      "How to rate a delivered order?",
    "How to download my invoice?",
    "How do discounts work?",
    "How to reorder a previous order?",
    ],
    ta: [
      "ஆர்டர் நிலைகள் என்ன?",
      "என் மொத்த கட்டணம் எப்படி கணக்கிடப்படுகிறது?",
      "எந்த கட்டண முறைகள் ஏற்கப்படுகின்றன?",
      "என் ஆர்டரை எப்போது ரத்து செய்யலாம்?",
      "டெலிவரி ஆர்டரை எப்படி மதிப்பிடுவது?",
    "இன்வாய்ஸை எப்படி பதிவிறக்குவது?",
    "தள்ளுபடிகள் எப்படி செயல்படுகின்றன?",
    "முந்தைய ஆர்டரை மீண்டும் ஆர்டர் செய்வது எப்படி?",
    ],
    hi: [
      "ऑर्डर की स्थिति क्या-क्या होती है?",
      "मेरा कुल बिल कैसे बनता है?",
      "कौन से भुगतान तरीके स्वीकार होते हैं?",
      "ऑर्डर कब रद्द कर सकते हैं?",
     "डिलीवर ऑर्डर को रेट कैसे करें?",
    "इनवॉइस कैसे डाउनलोड करें?",
    "डिस्काउंट कैसे काम करता है?",
    "पुराना ऑर्डर दोबारा कैसे करें?",
    ],
    te: [
      "ఆర్డర్ స్టేటస్‌లు ఏమిటి?",
      "నా మొత్తం బిల్ ఎలా లెక్కిస్తారు?",
      "ఏ పేమెంట్ పద్ధతులు అంగీకరిస్తారు?",
      "ఆర్డర్ ఎప్పుడు రద్దు చేయవచ్చు?",
      "డెలివరీ ఆర్డర్‌ని రేట్ చేయడం ఎలా?",
    "ఇన్వాయిస్ డౌన్‌లోడ్ ఎలా చేయాలి?",
    "డిస్కౌంట్లు ఎలా పని చేస్తాయి?",
    "పాత ఆర్డర్‌ని మళ్ళీ ఆర్డర్ చేయడం ఎలా?",
    ],
  },
  vendor: {
    en: [
      "How to add or edit a product?",
      "How to accept and prepare an order?",
      "How to assign a delivery agent?",
      "How is the 3% commission deducted?",
      "How to toggle product stock status?",
      "How to download earnings statement?",
    ],
    ta: [
      "தயாரிப்பை எப்படி சேர்க்கலாம் அல்லது திருத்தலாம்?",
      "ஆர்டரை எப்படி ஏற்று தயாரிக்கலாம்?",
      "டெலிவரி ஏஜெண்டை எப்படி ஒதுக்குவது?",
      "3% கமிஷன் எப்படி கழிக்கப்படுகிறது?",
      "தயாரிப்பு ஸ்டாக் நிலையை எப்படி மாற்றுவது?",
      "வருவாய் அறிக்கையை எப்படி பதிவிறக்குவது?",
    ],
    hi: [
      "उत्पाद कैसे जोड़ें या संपादित करें?",
      "ऑर्डर कैसे स्वीकार करें और तैयार करें?",
      "डिलीवरी एजेंट कैसे असाइन करें?",
      "3% कमीशन कैसे काटा जाता है?",
      "उत्पाद स्टॉक स्थिति कैसे बदलें?",
      "कमाई का विवरण कैसे डाउनलोड करें?",
    ],
    te: [
      "ఉత్పత్తి ఎలా జోడించాలి లేదా సవరించాలి?",
      "ఆర్డర్ ఎలా అంగీకరించి తయారు చేయాలి?",
      "డెలివరీ ఏజెంట్‌ని ఎలా అసైన్ చేయాలి?",
      "3% కమిషన్ ఎలా తగ్గించబడుతుంది?",
      "ప్రోడక్ట్ స్టాక్ స్టేటస్ ఎలా మార్చాలి?",
      "సంపాదన స్టేట్‌మెంట్ డౌన్‌లోడ్ ఎలా చేయాలి?",
    ],
  },
  delivery: {
    en: [
      "What is the delivery step-by-step flow?",
      "How is my earnings calculated per order?",
      "What happens if I decline an order?",
      "Customer not reachable — what to do?",
      "What affects my performance score?",
      "How to mark an order as delivered?",
    ],
    ta: [
      "டெலிவரி படிப்படியான பணிப்பாய்வு என்ன?",
      "ஒரு ஆர்டருக்கு என் வருவாய் எப்படி கணக்கிடப்படுகிறது?",
      "நான் ஆர்டரை மறுத்தால் என்ன ஆகும்?",
      "வாடிக்கையாளர் கிடைக்கவில்லை — என்ன செய்வது?",
      "என் செயல்திறன் மதிப்பெண்ணை எது பாதிக்கிறது?",
      "ஆர்டரை டெலிவர் ஆனதாக எப்படி குறிப்பிடுவது?",
    ],
    hi: [
      "डिलीवरी का चरण-दर-चरण प्रवाह क्या है?",
      "प्रति ऑर्डर मेरी कमाई कैसे होती है?",
      "ऑर्डर अस्वीकार करने पर क्या होता है?",
      "ग्राहक उपलब्ध नहीं — क्या करें?",
      "मेरे परफॉर्मेंस स्कोर को क्या प्रभावित करता है?",
      "ऑर्डर को डिलीवर कैसे मार्क करें?",
    ],
    te: [
      "డెలివరీ దశల వర్క్‌ఫ్లో ఏమిటి?",
      "ప్రతి ఆర్డర్‌కు నా సంపాదన ఎలా లెక్కిస్తారు?",
      "ఆర్డర్ తిరస్కరిస్తే ఏమవుతుంది?",
      "కస్టమర్ అందుబాటులో లేకుంటే ఏం చేయాలి?",
      "నా పెర్ఫార్మెన్స్ స్కోర్‌ని ఏది ప్రభావితం చేస్తుంది?",
      "ఆర్డర్‌ని డెలివర్ అయినట్టు మార్క్ చేయడం ఎలా?",
    ],
  },
  admin: {
    en: [
      "How to approve a vendor or delivery partner?",
      "How to block or activate a customer?",
      "How does the ₹10 platform fee work?",
      "Explain the full revenue model",
      "What documents to check before approving?",
      "How to view monthly revenue chart?",
    ],
    ta: [
      "வெண்டர் அல்லது டெலிவரி பார்ட்னரை எப்படி அங்கீகரிப்பது?",
      "வாடிக்கையாளரை எப்படி தடுப்பது அல்லது செயல்படுத்துவது?",
      "₹10 பிளாட்ஃபார்ம் கட்டணம் எப்படி செயல்படுகிறது?",
      "முழு வருவாய் மாதிரியை விளக்கவும்",
      "அங்கீகரிக்கும் முன் எந்த ஆவணங்களை சரிபார்க்கணும்?",
      "மாதாந்திர வருவாய் விளக்கப்படத்தை எப்படி பார்ப்பது?",
    ],
    hi: [
      "वेंडर या डिलीवरी पार्टनर को कैसे अनुमोदित करें?",
      "ग्राहक को कैसे ब्लॉक या सक्रिय करें?",
      "₹10 प्लेटफ़ॉर्म शुल्क कैसे काम करता है?",
      "पूरा राजस्व मॉडल समझाएं",
      "अनुमोदन से पहले कौन से दस्तावेज़ जांचें?",
      "मासिक राजस्व चार्ट कैसे देखें?",
    ],
    te: [
      "వెండర్ లేదా డెలివరీ పార్టనర్‌ని ఎలా ఆమోదించాలి?",
      "కస్టమర్‌ని బ్లాక్ లేదా యాక్టివేట్ ఎలా చేయాలి?",
      "₹10 ప్లాట్‌ఫారమ్ రుసుము ఎలా పని చేస్తుంది?",
      "పూర్తి రెవెన్యూ మోడల్ వివరించండి",
      "ఆమోదించే ముందు ఏ డాక్యుమెంట్లు చెక్ చేయాలి?",
      "నెలవారీ రెవెన్యూ చార్ట్ ఎలా చూడాలి?",
    ],
  },
};

// Placeholder per language
const PLACEHOLDERS = {
  customer: {
    en: "Ask GramAssist anything…",
    ta: "GramAssist-ஐ கேளுங்கள்…",
    hi: "GramAssist से कुछ भी पूछें…",
    te: "GramAssist ని అడగండి…",
  },
  vendor: {
    en: "Ask VendorBot anything…",
    ta: "VendorBot-ஐ கேளுங்கள்…",
    hi: "VendorBot से कुछ भी पूछें…",
    te: "VendorBot ని అడగండి…",
  },
  delivery: {
    en: "Ask RouteBot anything…",
    ta: "RouteBot-ஐ கேளுங்கள்…",
    hi: "RouteBot से कुछ भी पूछें…",
    te: "RouteBot ని అడగండి…",
  },
  admin: {
    en: "Ask AdminAI anything…",
    ta: "AdminAI-ஐ கேளுங்கள்…",
    hi: "AdminAI से कुछ भी पूछें…",
    te: "AdminAI ని అడగండి…",
  },
};

// ─── Role-based system prompts ───────────────────────────────────────────────
const SYSTEM_PROMPTS = {
  customer: `You are GramConnect's friendly customer support assistant. GramConnect is a farm-to-door platform connecting customers with local farmers/vendors for fresh produce.

You help customers with:
- Browsing and ordering products (vegetables, fruits, grains, dairy, spices)
- Understanding the cart and checkout process
- Order tracking (statuses: Placed → Accepted → Preparing → Assigned → On the way → Delivered)
- Fee breakdown: Item amount + Distance charge (₹5/km) + Platform fee (₹10)
- Payment methods: COD, UPI, Card
- Cancellation: allowed only when order status is "Placed"; cannot cancel after that
- Discounts: auto-applied at checkout — 10% off ₹300+, 15% off ₹500+, 20% off ₹1000+. Customer can remove it manually before placing order
- Reorder: on any delivered order, tap the "Reorder" button to reload all items into cart with latest live prices
- Rating orders after delivery (1–5 stars + optional feedback)
- Downloading invoice from the Orders tab per order

Be warm, helpful, and concise. Use simple language. Add relevant emojis occasionally.`,

  vendor: `You are GramConnect's vendor business assistant. GramConnect is a farm-to-door platform where vendors sell fresh produce directly to customers.

You help vendors with:
- Adding, editing, deleting products (name, price, quantity, unit, category, stock status, image)
- Toggling stock status between In Stock and Out of Stock
- Managing orders: Placed → Accept/Reject → Preparing → Ready → Assign Delivery → Delivered
- Understanding earnings: Item amount − 3% commission = Net earnings (3% goes to delivery partner)
- Assigning delivery agents once order is marked Ready
- Tracking active deliveries in the Delivery tab
- Downloading delivered orders earnings statement: go to the Orders tab → click the "Delivered Orders Statement" button at the top right (only visible when at least one order is delivered). It opens a PDF statement in a new tab.
- Dashboard stats: total products, orders, revenue, commission paid
- Support contact: support@gramconnect.com, +91 98765 43210

Be professional, precise, and supportive. Use clear step-by-step instructions when explaining processes.`,

  delivery: `You are GramConnect's delivery partner assistant. GramConnect connects delivery agents with vendors and customers for fresh produce delivery.

You help delivery partners with:
- Understanding the delivery workflow: Assigned → Accept & Pickup → Start Delivery (On the way) → Mark Delivered
- Earnings: 3% commission from item amount + ₹5 per km distance charge
- Declining orders: only before accepting pickup; frequent declines hurt your performance score
- Customer unreachable: try 2–3 times, wait 10 mins at address, then contact support
- Performance score: based on on-time rate, acceptance rate, customer feedback
- Earnings breakdown: commission + distance charge = total per delivery
- Support: support@gramconnect.com, +91 98765 43210, Mon–Sat 9AM–8PM

Be motivating, clear, and practical. Use simple step-based answers.`,

  admin: `You are GramConnect's admin operations assistant. GramConnect is a farm-to-door platform with vendors, customers, delivery partners, and an admin panel.

You help admins with:
- Managing users: approve/reject vendors and delivery partners, block/activate customers
- Platform revenue: ₹10 flat fee per delivered order
- Revenue model: Customer pays (item + distance + ₹10), Vendor gets (item − 3%), Delivery gets (3% + distance), GramConnect keeps ₹10
- Monitoring order pipeline and user activity via the live activity timeline
- Understanding dashboard stats: total users by role and status, monthly revenue bar chart
- Vendor approval: check ID proof documents before approving
- Delivery approval: check ID, driving license, vehicle details

Be analytical, precise, and efficient. Give structured answers with data points when relevant.`,
};

// ─── SVG Robot Avatars ───────────────────────────────────────────────────────
const RobotCustomer = () => (
  <svg viewBox="0 0 100 122" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <line x1="50" y1="18" x2="50" y2="4" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="50" cy="3" r="4" fill="#10b981"/>
    <rect x="20" y="18" width="60" height="48" rx="10" fill="#10b981"/>
    <rect x="29" y="30" width="14" height="10" rx="3" fill="#fff"/>
    <rect x="57" y="30" width="14" height="10" rx="3" fill="#fff"/>
    <circle cx="36" cy="35" r="3" fill="#065f46"/>
    <circle cx="64" cy="35" r="3" fill="#065f46"/>
    <path d="M34 51 Q50 62 66 51" stroke="#fff" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    <rect x="24" y="70" width="52" height="34" rx="8" fill="#34d399"/>
    <rect x="6" y="73" width="16" height="8" rx="4" fill="#10b981"/>
    <rect x="78" y="73" width="16" height="8" rx="4" fill="#10b981"/>
    <rect x="29" y="104" width="14" height="18" rx="5" fill="#10b981"/>
    <rect x="57" y="104" width="14" height="18" rx="5" fill="#10b981"/>
  </svg>
);

const RobotVendor = () => (
  <svg viewBox="0 0 100 122" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <line x1="50" y1="18" x2="50" y2="6" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="44" y1="6" x2="56" y2="6" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="44" cy="4" r="3" fill="#f59e0b"/>
    <circle cx="56" cy="4" r="3" fill="#f59e0b"/>
    <rect x="20" y="18" width="60" height="48" rx="10" fill="#f59e0b"/>
    <rect x="22" y="27" width="56" height="16" rx="5" fill="#fef3c7"/>
    <circle cx="36" cy="35" r="5" fill="#f59e0b"/>
    <circle cx="64" cy="35" r="5" fill="#f59e0b"/>
    <circle cx="36" cy="35" r="2.5" fill="#fff"/>
    <circle cx="64" cy="35" r="2.5" fill="#fff"/>
    <rect x="35" y="52" width="30" height="5" rx="2.5" fill="#fef3c7"/>
    <rect x="22" y="70" width="56" height="34" rx="8" fill="#fbbf24"/>
    <rect x="30" y="70" width="40" height="34" rx="5" fill="#fef3c7"/>
    <rect x="4" y="73" width="16" height="8" rx="4" fill="#f59e0b"/>
    <rect x="80" y="73" width="16" height="8" rx="4" fill="#f59e0b"/>
    <rect x="29" y="104" width="14" height="18" rx="5" fill="#d97706"/>
    <rect x="57" y="104" width="14" height="18" rx="5" fill="#d97706"/>
  </svg>
);

const RobotDelivery = () => (
  <svg viewBox="0 0 100 122" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <line x1="50" y1="18" x2="50" y2="4" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="50" cy="3" r="4" fill="#3b82f6"/>
    <rect x="18" y="18" width="64" height="48" rx="12" fill="#3b82f6"/>
    <rect x="18" y="18" width="64" height="8" rx="6" fill="#2563eb"/>
    <rect x="26" y="33" width="18" height="12" rx="4" fill="#bfdbfe"/>
    <rect x="56" y="33" width="18" height="12" rx="4" fill="#bfdbfe"/>
    <circle cx="35" cy="39" r="3.5" fill="#1d4ed8"/>
    <circle cx="65" cy="39" r="3.5" fill="#1d4ed8"/>
    <path d="M32 54 Q50 66 68 54" stroke="#bfdbfe" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
    <rect x="22" y="70" width="56" height="34" rx="8" fill="#60a5fa"/>
    <rect x="60" y="66" width="22" height="26" rx="5" fill="#2563eb"/>
    <rect x="4" y="73" width="16" height="8" rx="4" fill="#3b82f6"/>
    <rect x="80" y="73" width="16" height="8" rx="4" fill="#3b82f6"/>
    <rect x="28" y="104" width="14" height="18" rx="5" fill="#2563eb"/>
    <rect x="58" y="104" width="14" height="18" rx="5" fill="#2563eb"/>
  </svg>
);

const RobotAdmin = () => (
  <svg viewBox="0 0 100 122" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
    <line x1="50" y1="18" x2="50" y2="4" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"/>
    <line x1="40" y1="18" x2="36" y2="6" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"/>
    <line x1="60" y1="18" x2="64" y2="6" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="50" cy="3" r="3.5" fill="#a78bfa"/>
    <circle cx="35" cy="5" r="3" fill="#c4b5fd"/>
    <circle cx="65" cy="5" r="3" fill="#c4b5fd"/>
    <rect x="20" y="18" width="60" height="48" rx="10" fill="#7c3aed"/>
    <rect x="24" y="23" width="52" height="36" rx="6" fill="#1e1b4b"/>
    <rect x="28" y="30" width="18" height="5" rx="2" fill="#a78bfa"/>
    <rect x="54" y="30" width="18" height="5" rx="2" fill="#a78bfa"/>
    <polyline points="28,47 35,43 42,48 50,43 58,48 65,43 72,47" stroke="#a78bfa" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="22" y="70" width="56" height="34" rx="8" fill="#8b5cf6"/>
    <rect x="30" y="76" width="40" height="20" rx="4" fill="#1e1b4b"/>
    <rect x="33" y="80" width="12" height="3" rx="1.5" fill="#a78bfa"/>
    <rect x="33" y="85" width="20" height="3" rx="1.5" fill="#c4b5fd" opacity="0.6"/>
    <rect x="33" y="90" width="16" height="3" rx="1.5" fill="#a78bfa" opacity="0.4"/>
    <rect x="4" y="73" width="16" height="8" rx="4" fill="#7c3aed"/>
    <rect x="80" y="73" width="16" height="8" rx="4" fill="#7c3aed"/>
    <rect x="29" y="104" width="14" height="18" rx="5" fill="#7c3aed"/>
    <rect x="57" y="104" width="14" height="18" rx="5" fill="#7c3aed"/>
  </svg>
);

// ─── Role config ─────────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  customer: {
    name: "GramAssist",
    subtitle: "Customer Support",
    avatar: RobotCustomer,
    accent: "#10b981",
    accentDim: "rgba(16,185,129,0.12)",
    accentBorder: "rgba(16,185,129,0.25)",
  },
  vendor: {
    name: "VendorBot",
    subtitle: "Vendor Assistant",
    avatar: RobotVendor,
    accent: "#f59e0b",
    accentDim: "rgba(245,158,11,0.12)",
    accentBorder: "rgba(245,158,11,0.25)",
  },
  delivery: {
    name: "RouteBot",
    subtitle: "Delivery Assistant",
    avatar: RobotDelivery,
    accent: "#3b82f6",
    accentDim: "rgba(59,130,246,0.12)",
    accentBorder: "rgba(59,130,246,0.25)",
  },
  admin: {
    name: "AdminAI",
    subtitle: "Operations Assistant",
    avatar: RobotAdmin,
    accent: "#a78bfa",
    accentDim: "rgba(167,139,250,0.12)",
    accentBorder: "rgba(167,139,250,0.25)",
  },
};

// ─── Language Selector Button ─────────────────────────────────────────────────
function LangSelector({ lang, setLang, accent, accentDim, accentBorder, textSub, border, bg2 }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: accentDim,
          border: `1px solid ${accentBorder}`,
          borderRadius: 8,
          color: accent,
          fontSize: 11,
          fontWeight: 600,
          padding: "3px 8px",
          cursor: "pointer",
          fontFamily: "inherit",
          letterSpacing: "0.02em",
        }}
        title="Change language"
      >
        {LANGUAGES[lang].label} ▾
      </button>
      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          right: 0,
          background: bg2,
          border: `1px solid ${border}`,
          borderRadius: 10,
          overflow: "hidden",
          zIndex: 10,
          minWidth: 110,
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        }}>
          {Object.entries(LANGUAGES).map(([code, { label, name }]) => (
            <button
              key={code}
              onClick={() => { setLang(code); setOpen(false); }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "8px 12px",
                background: lang === code ? accentDim : "transparent",
                border: "none",
                color: lang === code ? accent : textSub,
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: lang === code ? 600 : 400,
              }}
            >
              {label}  {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AIChatBot({ role = "customer", darkMode = true }) {
  const cfg = ROLE_CONFIG[role];
  const AvatarIcon = cfg.avatar;

  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState("en");
  const [messages, setMessages] = useState([
    { role: "assistant", content: GREETINGS[role]["en"] },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showChips, setShowChips] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // When language changes, reset chat with new greeting
  useEffect(() => {
    setMessages([{ role: "assistant", content: GREETINGS[role][lang] }]);
    setShowChips(true);
    setInput("");
  }, [lang, role]);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, messages]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput("");
    setShowChips(false);

    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    // Build system prompt with language instruction appended
    const systemPrompt = SYSTEM_PROMPTS[role] + LANG_INSTRUCTION[lang];

    try {
      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemPrompt,
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await response.json();
      const reply = data.reply || "Sorry, I couldn't process that. Please try again.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Could not connect to server. Make sure your backend is running on port 5000." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleClear = () => {
    setMessages([{ role: "assistant", content: GREETINGS[role][lang] }]);
    setShowChips(true);
  };

  const ui = UI_STRINGS[lang];
  const chips = QUICK_CHIPS[role][lang];
  const placeholder = PLACEHOLDERS[role][lang];

  // Theme
  const bg       = darkMode ? "#0f172a" : "#ffffff";
  const bg2      = darkMode ? "#1e293b" : "#f8fafc";
  const border   = darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const text     = darkMode ? "#e2e8f0" : "#0f172a";
  const textSub  = darkMode ? "#94a3b8" : "#64748b";
  const userBubble = cfg.accent;
  const botBubble  = darkMode ? "#1e293b" : "#f1f5f9";
  const botText    = darkMode ? "#e2e8f0" : "#0f172a";
  const inputBg    = darkMode ? "#0f172a" : "#ffffff";
  const shadow     = darkMode
    ? "0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)"
    : "0 24px 64px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.06)";

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 9999,
          width: 56, height: 56, borderRadius: "50%",
          background: `linear-gradient(135deg, ${cfg.accent}, ${cfg.accent}cc)`,
          border: "none", cursor: "pointer",
          boxShadow: `0 8px 32px ${cfg.accentDim}, 0 0 0 3px ${cfg.accentBorder}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "transform 0.2s, box-shadow 0.2s",
          transform: open ? "rotate(0deg) scale(0.95)" : "scale(1)",
          padding: 0, overflow: "hidden",
        }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.08)"}
        onMouseLeave={e => e.currentTarget.style.transform = open ? "scale(0.95)" : "scale(1)"}
        title={`Open ${cfg.name}`}
      >
        {open
          ? <span style={{ color: "#fff", fontSize: 20, lineHeight: 1 }}>✕</span>
          : <div style={{ width: 36, height: 36 }}><AvatarIcon /></div>
        }
      </button>

      {/* Pulse ring */}
      {!open && (
        <div style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 9998,
          width: 56, height: 56, borderRadius: "50%",
          border: `2px solid ${cfg.accent}`,
          animation: "gcPulse 2s ease infinite",
          pointerEvents: "none",
        }} />
      )}

      {/* Chat window */}
      {open && (
        <div style={{
          position: "fixed", bottom: 96, right: 28, zIndex: 9998,
          width: 380, height: 560,
          background: bg, borderRadius: 20,
          boxShadow: shadow,
          display: "flex", flexDirection: "column",
          overflow: "hidden",
          animation: "gcSlideUp 0.25s cubic-bezier(0.175,0.885,0.32,1.275)",
          fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        }}>

          {/* Header */}
          <div style={{
            padding: "14px 16px",
            background: `linear-gradient(135deg, ${cfg.accent}22, ${cfg.accent}08)`,
            borderBottom: `1px solid ${border}`,
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: `linear-gradient(135deg, ${cfg.accent}, ${cfg.accent}aa)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, padding: 4,
              boxShadow: `0 4px 12px ${cfg.accentDim}`,
            }}>
              <AvatarIcon />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: text, fontWeight: 700, fontSize: 14 }}>{cfg.name}</div>
              <div style={{ color: cfg.accent, fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.accent, display: "inline-block", animation: "gcBlink 1.5s ease infinite" }} />
                {ui.online} · {cfg.subtitle}
              </div>
            </div>

            {/* Language selector */}
            <LangSelector
              lang={lang}
              setLang={setLang}
              accent={cfg.accent}
              accentDim={cfg.accentDim}
              accentBorder={cfg.accentBorder}
              textSub={textSub}
              border={border}
              bg2={bg2}
            />

            <button
              onClick={handleClear}
              style={{ background: "none", border: "none", cursor: "pointer", color: textSub, fontSize: 12, padding: "4px 6px", borderRadius: 8 }}
              title={ui.clearTitle}
            >{ui.clear}</button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "16px 14px",
            display: "flex", flexDirection: "column", gap: 10,
            scrollbarWidth: "thin", scrollbarColor: `${border} transparent`,
          }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                alignItems: "flex-end", gap: 8,
              }}>
                {m.role === "assistant" && (
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    background: `${cfg.accent}20`, border: `1px solid ${cfg.accentBorder}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: 3,
                  }}>
                    <AvatarIcon />
                  </div>
                )}
                <div style={{
                  maxWidth: "78%",
                  padding: "10px 13px",
                  borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: m.role === "user" ? userBubble : botBubble,
                  color: m.role === "user" ? "#fff" : botText,
                  fontSize: 13, lineHeight: 1.6,
                  boxShadow: m.role === "user" ? `0 4px 12px ${cfg.accentDim}` : "0 2px 8px rgba(0,0,0,0.06)",
                  whiteSpace: "pre-wrap", wordBreak: "break-word",
                }}>{m.content}</div>
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: `${cfg.accent}20`, border: `1px solid ${cfg.accentBorder}`,
                  display: "flex", alignItems: "center", justifyContent: "center", padding: 3,
                }}>
                  <AvatarIcon />
                </div>
                <div style={{
                  padding: "12px 16px", borderRadius: "16px 16px 16px 4px",
                  background: botBubble, display: "flex", alignItems: "center", gap: 5,
                }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 7, height: 7, borderRadius: "50%",
                      background: cfg.accent, opacity: 0.6,
                      animation: `gcBounce 1.2s ease ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}

            {/* Quick chips */}
            {showChips && messages.length === 1 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                {chips.map((chip) => (
                  <button key={chip} onClick={() => sendMessage(chip)} style={{
                    fontSize: 11, padding: "5px 10px", borderRadius: 20,
                    background: cfg.accentDim, border: `1px solid ${cfg.accentBorder}`,
                    color: cfg.accent, cursor: "pointer", fontFamily: "inherit",
                    transition: "all 0.15s",
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = cfg.accent; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = cfg.accentDim; e.currentTarget.style.color = cfg.accent; }}
                  >{chip}</button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: "12px 14px",
            borderTop: `1px solid ${border}`,
            background: bg,
            display: "flex", gap: 8, alignItems: "flex-end",
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={placeholder}
              rows={1}
              style={{
                flex: 1, padding: "10px 12px", fontSize: 13,
                background: inputBg, color: text,
                border: `1px solid ${border}`, borderRadius: 12,
                outline: "none", resize: "none", fontFamily: "inherit",
                lineHeight: 1.5, maxHeight: 90, overflowY: "auto",
                transition: "border-color 0.15s",
              }}
              onFocus={e => e.target.style.borderColor = cfg.accent}
              onBlur={e => e.target.style.borderColor = border}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              style={{
                width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                background: input.trim() && !loading ? `linear-gradient(135deg, ${cfg.accent}, ${cfg.accent}cc)` : bg2,
                border: "none", cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, transition: "all 0.2s",
                boxShadow: input.trim() && !loading ? `0 4px 12px ${cfg.accentDim}` : "none",
              }}
            >➤</button>
          </div>

          {/* Footer */}
          <div style={{
            textAlign: "center", padding: "6px 0 10px",
            fontSize: 10, color: textSub, background: bg,
          }}>
            {ui.poweredBy}
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes gcSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes gcPulse {
          0%   { transform: scale(1); opacity: 0.6; }
          70%  { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes gcBlink {
          0%,100% { opacity: 1; }
          50%      { opacity: 0.3; }
        }
        @keyframes gcBounce {
          0%,80%,100% { transform: translateY(0); }
          40%          { transform: translateY(-6px); }
        }
      `}</style>
    </>
  );
}
