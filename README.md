# Smart Hostel OS - Complete Digital Hostel Management Ecosystem

**🚀 Live Website Demo**: [https://frontend-orcin-sigma-74.vercel.app](https://frontend-orcin-sigma-74.vercel.app)

Smart Hostel OS is a centralized digital management system tailored for modern university hostels. The platform streamlines student bookings, leaves, security gates, maintenance logs, and parent-warden communications, backed by local AI classification and predictions.

---

## Unique Selling Propositions (USPs) & AI Twists

1. **🔒 Biometric-QR Security Closed Loop (Fully Implemented)**
   * *The Problem*: Students share QR passes or write fake register entries.
   * *Our Solution*: Connects dynamic QR passes with a **Simulated Face Biometric Verification scan overlay** at checkpoints (Security Guard view). Ensures the student matches the database profile before gates open.
   
2. **📈 Proactive Resource Analytics (Mess & Power)**
   * *The Problem*: High mess food wastage and power overloads.
   * *Our Solution*: AI forecasts mess attendance plate count (excluding students on approved outings, saving ~30% waste) and summer electricity consumption spikes to prevent power grid overloads.

3. **🤖 Role-Aware Contextual AI Assistants**
   * *Our Solution*: Independent, role-based AI assistants. A parent's assistant answers child-specific billing, a guard's assistant checks scanner data, and a student's assistant checks menu/dues contextually.

4. **🧬 Algorithmic Roommate Matching Engine**
   * *Our Solution*: Automatically scores vacant beds based on strict room gender segregation, matching roommates from the same academic branches (+5 points), and same year (+3 points) to minimize room conflicts.

---

## Technical Stack
- **Frontend**: React, TypeScript, Tailwind CSS, Recharts, Framer Motion, React Router
- **Backend**: Node.js, Express.js, TypeScript, SQLite
- **Database ORM**: Prisma Client

---

## Environment Variables

### Backend (`backend/.env`)
Create a file at `backend/.env` with the following variables:
```env
PORT=5001
JWT_SECRET="supersecretkey123"
DATABASE_URL="file:./dev.db"
```

### Frontend (`frontend/.env`)
To target a hosted backend server (e.g. for Vercel/Netlify staging), create a file at `frontend/.env`:
```env
VITE_API_URL="https://your-deployed-backend-api.com"
```

---

## Quick Start (Local Setup)

### 1. Backend Setup & Database Seed
```bash
cd backend
npm install
npx prisma db push
npm run prisma:seed
```
This generates a local SQLite `dev.db` file and seeds the database with structural buildings, rooms, beds, and standard testing credentials.

### 2. Run Backend APIs
```bash
npm run dev
```
Starts API server on [http://localhost:5001](http://localhost:5001).

### 3. Run Frontend React Client
```bash
cd ../frontend
npm install
npm run dev
```
Starts Vite development client on [http://localhost:5174](http://localhost:5174).

---

## Seed Accounts (Password: `password123`)
*Note: You can log into any of these accounts with one click using the quick login demo grid on the Sign In page!*

- **Admin**: `admin@hostel.com` (Manage buildings, invoices, electricity billing, AI forecasts)
- **Warden**: `warden@hostel.com` (Approve leaves, allocate rooms, circular announcements, crowd alerts)
- **Student 1**: `student1@hostel.com` (Room 101 Bed A, view bills, request passes, emergency SOS, chat AI)
- **Student 2**: `student2@hostel.com` (Room 101 Bed B)
- **Parent**: `parent@hostel.com` (Read-only student tracking dashboard)
- **Guard**: `guard@hostel.com` (Check-out/in checkpoint, biometric scans, gate logs)
- **Staff**: `staff@hostel.com` (Resolve repair complaints assigned by Admin)

---

## Vercel Deployment Instructions

### Deploying the Frontend (Vite App)
1. Install Vercel CLI: `npm i -g vercel`
2. Run deployment from the `frontend/` directory:
   ```bash
   cd frontend
   vercel
   ```
3. Set your production environment variable when prompted or via the Vercel Dashboard:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://your-deployed-backend.com`
4. Confirm build settings on Vercel:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

