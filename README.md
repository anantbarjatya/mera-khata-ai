<div align="center">

<img src="https://img.shields.io/badge/Voice%20AI-Hindi%20%7C%20Hinglish%20%7C%20English-FF6B35?style=for-the-badge" />
<img src="https://img.shields.io/badge/Stack-React%20%7C%20Node.js%20%7C%20SQLite-0A7EA4?style=for-the-badge" />
<img src="https://img.shields.io/badge/AI-Sarvam%20AI-5C2D91?style=for-the-badge" />

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
