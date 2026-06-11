<div align="center">

<img src="https://img.shields.io/badge/Voice%20AI-Hindi%20%7C%20Hinglish%20%7C%20English-FF6B35?style=for-the-badge" />
<img src="https://img.shields.io/badge/Stack-React%20%7C%20Node.js%20%7C%20SQLite-0A7EA4?style=for-the-badge" />
<img src="https://img.shields.io/badge/AI-Sarvam%20AI-5C2D91?style=for-the-badge" />

<img src="https://img.shields.io/badge/OCR-Sarvam%20Document%20Intelligence-blue?style=for-the-badge" />
<img src="https://img.shields.io/badge/Deployment-Vercel%20%7C%20Render-black?style=for-the-badge" />
# 🧾 Mera Khata AI

### *Boliye, aur ledger khud update ho jaaye.*

**A voice-first AI-powered udhaar ledger for Indian Kirana Stores.**

[🚀 Local Setup](#️-local-setup) · [✨ Features](#-features) · [🎯 Demo Commands](#-example-voice-commands) · [🏗️ Architecture](#️-architecture)

</div>


---

## 🧩 Problem

Crores of small shopkeepers across India still manage customer credit *(udhaar)* in worn-out notebooks. The result?

| Pain Point | Reality |
|---|---|
| 📓 Lost records | Notebook gum gayi, sab data gone |
| ❌ Human errors | Galat entry, customer dispute |
| 📦 Inventory mismatch | Kitna maal diya? Pata nahi |
| 🔍 No audit trail | GST? Invoice? Kaun karta hai |
| ⏱️ Time waste | Roz manually hisaab karo |

**Mera Khata AI** fixes this — shopkeeper sirf bolein, baki AI sambhale.

---

## ✨ Features

### 🎙️ Voice-Based Transactions
Sirf itna bolo:
```
"Raju ko 2 kilo aloo udhar do"
```
System automatically:
- 🗣️ Speech → Text (Sarvam STT)
- 🤖 Text → Structured transaction (Sarvam LLM)
- 📋 Customer ledger update
- 📦 Inventory deduction
- 🔊 Voice confirmation back to shopkeeper

---

### 📦 Smart Inventory Management
- Add / Edit / Delete items
- Automatic stock deduction on every transaction
- Low stock alerts
- Real-time inventory dashboard

---

### 👥 Customer Ledger
- Add & manage customers
- Track outstanding udhaar per customer
- Partial & full settlements
- Automatic due recalculation
- Full delete support

---

### 🤖 AI Transaction Extraction

Sarvam LLM extracts structured data from raw speech:

```json
{
  "customer_name": "Raju",
  "items": [
    { "name": "Aloo", "quantity": 2, "unit": "kg" },
    { "name": "Pyaz", "quantity": 1, "unit": "kg" }
  ],
  "transaction_type": "udhaar"
}
```

Supports **Hindi**, **Hinglish**, and **English** — naturally.

---
🧾 AI-Powered Raseed Scanner (NEW)

Upload a supplier invoice and let AI automatically update your inventory.

Workflow
📸 Upload invoice image
📄 Convert image → PDF
🤖 Sarvam Document Intelligence extracts OCR text
🧠 Sarvam LLM converts OCR output into structured inventory items
📦 Inventory is automatically updated

Example Output:

[
  {
    "item_name": "Aata",
    "quantity": 10,
    "unit": "kg",
    "price": 320
  },
  {
    "item_name": "Chini",
    "quantity": 5,
    "unit": "kg",
    "price": 240
  }
]
Why it matters

Most kirana shopkeepers receive supplier invoices daily.

Instead of manually entering stock:

Scan invoice
AI extracts products
Inventory updates automatically

Saving time and reducing human errors.

🌐 Live Demo
Frontend

https://mera-khata-ai.vercel.app

Backend

https://mera-khata-ai.onrender.com/api/health

🚀 AI Pipeline
Voice Transaction Flow

Voice Input
→ Sarvam STT
→ Sarvam LLM
→ Ledger Update
→ Inventory Update
→ Sarvam TTS
→ Audio Confirmation

Invoice Flow

Invoice Image
→ PDF Conversion
→ Sarvam Document Intelligence
→ OCR Text
→ Sarvam LLM Extraction
→ Inventory Update

📈 Impact
Before

❌ Manual notebooks

❌ Missing entries

❌ Inventory mismatch

❌ No transaction history

❌ Time-consuming bookkeeping

After

✅ Voice-based bookkeeping

✅ AI-powered invoice processing

✅ Automated inventory updates

✅ Digital customer ledger

✅ Real-time transaction history

🏆 Why This Project Matters

India has over 12 million kirana stores.

Most still rely on handwritten credit records and manual inventory tracking.

Mera Khata AI demonstrates how multilingual Indian AI models can modernize small businesses using natural voice interactions and intelligent document processing.

Built specifically for real-world Indian retail workflows using Sarvam AI

### 🔊 AI Voice Confirmation

Every transaction ends with a spoken confirmation:
> *"Raju ke khaate mein 2 kilo Aloo jod diya gaya. Kul udhaar ₹24."*

Generated via **Sarvam TTS** — so even an illiterate shopkeeper gets full feedback.

---

### 📊 Dashboard Insights
- 👥 Total customers & udhaar overview
- 📦 Inventory health at a glance
- 🕒 Recent transactions log
- 🎙️ Voice activity timeline

---

## 🏗️ Architecture

```
User Voice
    │
    ▼
┌─────────────────┐
│   Sarvam STT    │  ← Speech to Text
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Sarvam LLM   │  ← Extract customer, items, type
└────────┬────────┘
         │
         ▼
┌──────────────────────────────┐
│       Transaction Engine     │
│  ┌───────────┐ ┌──────────┐  │
│  │ Customer  │ │Inventory │  │
│  │  Ledger   │ │  Update  │  │
│  └───────────┘ └──────────┘  │
│       └─── Transaction DB ───┘
└────────┬─────────────────────┘
         │
         ▼
┌─────────────────┐
│   Sarvam TTS    │  ← Voice confirmation
└─────────────────┘
         │
         ▼
    Shopkeeper 🎧
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React + Vite, Framer Motion, Lucide Icons |
| **Backend** | Node.js, Express.js |
| **Database** | Better SQLite3 |
| **AI / Voice** | Sarvam STT · Sarvam LLM · Sarvam TTS |
| **Utilities** | UUID, React Hot Toast, Axios |

---

## 📂 Project Structure

```
mera-khata-ai/
│
├── backend/
│   ├── routes/          # API endpoints
│   ├── services/        # Sarvam AI integrations
│   ├── db/              # SQLite schema & queries
│   └── server.js
│
└── mera-khata-frontend/
    ├── src/
    ├── components/      # UI components
    ├── pages/           # Dashboard, Ledger, Inventory
    └── services/        # API calls
```

---

## ⚙️ Local Setup

### 1. Clone the repo
```bash
git clone https://github.com/anantbarjatya/mera-khata-ai.git
cd mera-khata-ai
```

### 2. Start Backend
```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:3001
```

### 3. Start Frontend
```bash
cd mera-khata-frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

---

## 🎯 Example Voice Commands

| Intent | Command |
|---|---|
| Udhaar dena | `"Raju ko 2 kilo aloo udhar do"` |
| Payment receive | `"Raju ne 200 rupaye de diye"` |
| Multiple items | `"Raju ko 2 kilo aloo aur 1 kilo pyaz udhar do"` |
| English | `"Add 500 rupees credit for Sunita"` |

---

## 🔄 Demo Reset

One-click reset clears all customers, transactions, and dues — perfect for live demos and testing.

---

## 🔮 Roadmap

- [ ] 📱 WhatsApp reminders for pending udhaar
- [ ] 💳 UPI payment integration
- [ ] 🏪 Multi-shop support
- [ ] 🧾 GST invoice generation
- [ ] 📊 Advanced analytics & spending trends
- [ ] 📲 Mobile application (React Native)

---

## 👨‍💻 Author

**Anant Barjatya**
[![GitHub](https://img.shields.io/badge/GitHub-anantbarjatya-181717?style=flat-square&logo=github)](https://github.com/anantbarjatya)

---

<div align="center">

**🏆 Built for Sarvam AI Internship Assignment**

*Empowering India's 12 crore kirana stores — one voice command at a time.*

</div>
