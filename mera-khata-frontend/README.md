# मेरा खाता AI — Frontend

Voice-first AI ledger for Indian kirana shopkeepers, built for Sarvam AI internship demo.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the frontend (backend must already be running on :3001)
npm run dev

# Open http://localhost:3000
```

## Backend Assumption
This frontend assumes the backend is running at `localhost:3001`.
The Vite dev server proxies all `/api/*` requests to `:3001` automatically.

## Tech Stack
- React 18 + Vite
- Framer Motion (animations)
- React Router (pages)
- Axios (API calls)
- react-hot-toast (notifications)
- date-fns (time formatting)
- Lucide React (icons)

## Project Structure
```
src/
├── components/
│   ├── Sidebar.jsx          # Navigation with Hindi labels
│   ├── VoiceRecorder.jsx    # Hero voice component (mandala + waveform)
│   ├── InsightsPanel.jsx    # AI insights strip (4 cards)
│   ├── InventoryHealth.jsx  # Stock health widget
│   ├── VoiceTimeline.jsx    # Voice command history
│   └── TransactionFeed.jsx  # Recent transactions feed
├── pages/
│   ├── Dashboard.jsx        # Main AI OS view
│   ├── InventoryPage.jsx    # Full inventory CRUD
│   ├── CustomersPage.jsx    # Customer management + settle
│   └── TransactionsPage.jsx # Transaction history + filters
├── services/
│   └── api.js               # All backend API calls
└── main.jsx
```

## Voice Pipeline
1. Click mic button
2. Speak naturally in Hindi/Hinglish: "Raju ko 2kg atta diya"
3. Audio sent to `POST /api/transactions/voice-commit`
4. Transcript, extracted data, balance update displayed
5. TTS confirmation plays automatically
