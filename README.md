# Smart Hostel OS - Complete Digital Hostel Management Ecosystem

**🚀 Live Website Demo**: [https://frontend-orcin-sigma-74.vercel.app](https://frontend-orcin-sigma-74.vercel.app)

Smart Hostel OS is a centralized digital management system tailored for modern university hostels. The platform streamlines student bookings, leaves, security gates, maintenance logs, and parent-warden communications, backed by local AI classification and predictions.

---

## Technical Features & AI Twists
1. **Biometric Face Verification Checkpoint**: Integrated in the Guard Checkpoint Dashboard (Security) using simulated real-time facial mesh scan detection to verify student exits/returns and visitor entries/exits against database records.
2. **Intelligent Capacity Crowd Alerts**: Dynamically monitors and warns when occupancy rates cross $\ge 85\%$ in the Warden and Admin Dashboards to active crowd density flow controls.
3. **AI Complaint Routing**: Automatically parses complaint descriptions and classifies department/urgency.
4. **Interactive Role-Aware AI Assistant Chatbot**: Available to students, parents, wardens, staff, guards, and admins.
5. **Interactive Recharts Predictions**: For forecasting mess demand plates, electrical spikes, and occupancy growth trends.

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

