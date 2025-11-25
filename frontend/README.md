# GridFlex Dashboard - Frontend

> **Real-time monitoring and optimization dashboard for intelligent compute-energy convergence**

[![Built with Lovable](https://img.shields.io/badge/Built%20with-Lovable-blue)](https://lovable.dev)
[![React](https://img.shields.io/badge/React-18.3.1-61dafb)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.1-38bdf8)](https://tailwindcss.com/)

**Live Demo:** [Your Lovable URL Here]  
**Backend API:** https://gridflex-backend-152882144214.europe-west2.run.app

---

## 📖 Overview

The GridFlex Dashboard is a professional React-based web application that provides real-time monitoring and control of an AI-powered compute workload optimization system. It visualizes the interaction between three intelligent agents managing energy-efficient compute scheduling under carbon intensity constraints.

### Key Features

- **🤖 Real-time Agent Monitoring** - Track 3 AI agents (Workload Intelligence, Grid Market, Orchestrator)
- **📊 Live Optimization Timeline** - 24-hour workload scheduling with visual indicators
- **💰 Impact Analytics** - Cost savings, carbon reduction, and P415 flexibility revenue tracking
- **🌍 Beckn Protocol Integration** - Discover and utilize optimal energy windows across regions
- **📝 Complete Audit Trail** - Full decision logging with reasoning and outcomes
- **⚡ Carbon Cap Enforcement** - Visual indicators for carbon intensity thresholds (150g CO2/kWh)

---

## 🏗️ Architecture

### Tech Stack

- **Framework:** React 18.3.1 with TypeScript
- **Styling:** Tailwind CSS 3.4.1 + shadcn/ui components
- **Charts:** Recharts 2.x for data visualization
- **Build Tool:** Vite 5.4.2
- **State Management:** React Hooks (useState, useEffect)
- **API Communication:** Fetch API with real-time polling

### Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── AgentStatus.tsx          # Three AI agent monitoring cards
│   │   │   ├── Optimization.tsx         # Timeline and decision feed
│   │   │   ├── Impact.tsx               # Metrics and charts
│   │   │   ├── Sidebar.tsx              # System status and Beckn integration
│   │   │   └── modals/
│   │   │       ├── WorkloadAgentModal.tsx
│   │   │       ├── GridMarketModal.tsx
│   │   │       ├── OrchestratorModal.tsx
│   │   │       └── AuditLogModal.tsx    # Full audit trail viewer
│   │   └── ui/                          # shadcn/ui components
│   ├── services/
│   │   ├── api.ts                       # Backend API integration
│   │   ├── mockData.ts                  # Fallback mock data
│   │   └── dataMapper.ts                # Response transformation
│   ├── pages/
│   │   ├── Dashboard.tsx                # Main dashboard container
│   │   ├── Index.tsx                    # Landing page
│   │   └── NotFound.tsx                 # 404 page
│   ├── hooks/                           # Custom React hooks
│   ├── lib/                             # Utility functions
│   └── assets/                          # Images and static files
├── public/
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ or Bun
- npm, yarn, or bun package manager

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/MananSuthar07/GridFlex.git
   cd GridFlex/frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   # or
   bun install
   ```

3. **Configure backend URL:**
   
   Open `src/services/api.ts` and verify the backend URL:
   ```typescript
   const API_BASE_URL = 'https://gridflex-backend-152882144214.europe-west2.run.app';
   ```

### Development

Run the development server:

```bash
npm run dev
# or
yarn dev
# or
bun dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
# or
yarn build
# or
bun run build
```

Build output will be in the `dist/` folder.

### Preview Production Build

```bash
npm run preview
# or
yarn preview
# or
bun preview
```

---

## 📱 Dashboard Pages

### 1. Agent Status

**Path:** `/dashboard` (default tab)

Monitors three AI agents in real-time:

- **Workload Intelligence Agent** (Blue)
  - Jobs monitored: Current workload count
  - Deferrable jobs: Flexible scheduling opportunities
  - Efficiency: System performance metric
  - Mini chart: Job trend over 12 hours

- **Grid Market Agent** (Green)
  - Carbon intensity: Current gCO2/kWh
  - Energy price: Real-time £/kWh
  - Forecast: Trend prediction (Improving/Rising)
  - Mini chart: Carbon intensity history

- **Orchestrator** (Orange)
  - Decisions/min: Optimization rate
  - Response time: Average decision latency
  - Queue: Pending jobs count
  - Mini chart: Decision volume

**Interactions:**
- Click "View Details" on any card to see comprehensive metrics
- Real-time updates every 5 seconds

### 2. Optimization

**Path:** `/dashboard?tab=optimization`

Visualizes the optimization engine:

- **Grid Forecast Panel**
  - Shows predicted carbon intensity drop over next 6 hours
  - Highlights optimal compute windows (e.g., "14:00-17:00")
  - Target carbon threshold: 95g CO2/kWh

- **24-Hour Workload Timeline**
  - Visual timeline showing scheduled workloads
  - Color-coded by type:
    - Blue: ML Training / Model Finetuning
    - Green: Inference (batch/real-time)
    - Orange: Batch Processing / Data Processing
  - "NOW" marker indicates current time
  - Hover over blocks for job details

- **Recent Decisions Feed**
  - Live stream of agent decisions
  - Shows: Agent, timestamp, action, outcome, savings
  - Agent icons: ⚙️ Orchestrator, 🧠 Workload, 📊 Grid

- **Impact Analysis Panel**
  - Daily cost comparison (with/without GridFlex)
  - Daily carbon comparison (with reduction percentage)
  - Real-time savings calculation

**Button:**
- "View Full Audit Log" - Opens modal with complete decision history

### 3. Impact

**Path:** `/dashboard?tab=impact`

Displays cumulative system impact:

- **Hero Metrics (Top Row)**
  - Cost Saved: Total £ saved since deployment
  - Carbon Reduced: Total tonnes CO2 avoided
  - System Uptime: Availability percentage

- **Additional Metrics (Second Row)**
  - P415 Flexibility Revenue: £ earned from flexibility participation
  - Jobs Optimized: Total workloads managed (450)
  - Carbon Cap Status: 171/150 gCO2/kWh (Above Cap indicator)
  - Beckn Protocol: Active status with 8 windows discovered

- **Charts (2x2 Grid)**
  - **Cost Savings Trend (7 Days):** Line chart showing daily savings
  - **Carbon Intensity by Hour (Today):** Horizontal bars, color-coded by intensity
  - **Workload Distribution:** Donut chart (Training/Inference/Processing split)
  - **Energy Usage Pattern (24h):** Area chart showing hourly consumption

---

## 🔌 Backend Integration

### API Endpoints Used

The frontend polls these backend endpoints:

```typescript
// Primary data source (every 5 seconds)
POST /demo/generate
→ Returns: agents, optimization, impact, charts, beckn data

// Fallback endpoints (if needed)
GET /agents/status
GET /metrics/system
GET /decisions/recent
```

### Data Flow

1. **Initial Load:**
   - Fetch complete dashboard state from `/demo/generate`
   - Parse and map response to UI components
   - Display loading skeletons during fetch

2. **Real-time Updates:**
   - Poll backend every 5 seconds
   - Update dashboard with new values
   - Animate number changes (count-up effect)
   - Update "Last Updated" timestamp

3. **Demo Mode:**
   - User clicks "Run Demo" button
   - Triggers POST to `/demo/generate`
   - Dashboard updates with new optimization scenario
   - Shows visual indicators of agent activity

4. **Error Handling:**
   - Network errors: Display "Connection lost" warning
   - Timeout (45s): Show "Backend starting up" message
   - Backend returns zeros: Use mock fallback data
   - Keep last successful data visible on errors

### Mock Data Fallback

If backend returns zero values, the frontend automatically uses realistic mock data:

- Cost saved: £4,396.5
- Carbon reduced: 12.03 tonnes CO2
- Jobs optimized: 450
- P415 revenue: £659 (15% of cost saved)

This ensures a working demo even during backend issues.

---

## 🎨 UI Components

### Component Library: shadcn/ui

Pre-built, customizable components used:

- **Cards** - Agent status containers
- **Badges** - Status indicators (ACTIVE, Success, Above Cap)
- **Dialogs/Modals** - View Details overlays
- **Tables** - Audit log data display
- **Charts** - Recharts integration
- **Toast** - Notifications for system events
- **Tabs** - Navigation between dashboard sections

All components are styled with Tailwind CSS and follow a consistent design system:

- **Colors:** Blue (#2563EB), Green (#10B981), Orange (#F59E0B)
- **Typography:** Inter font family
- **Spacing:** 8px grid system (16px, 24px, 32px)
- **Borders:** 12px border-radius for cards
- **Shadows:** Subtle elevation for depth

---

## 🔥 Key Features Implementation

### Real-time Updates

```typescript
// Auto-refresh every 5 seconds
useEffect(() => {
  const interval = setInterval(() => {
    fetchDashboardData();
  }, 5000);
  
  return () => clearInterval(interval);
}, []);
```

### Smooth Number Animations

Numbers count up when values change, not instant jumps:

```typescript
// Example: £4,200 → £4,396 animates smoothly over 0.5s
```

### Carbon Cap Enforcement Visualization

```typescript
// Visual indicator when carbon > threshold
{carbonIntensity > 150 && (
  <Badge variant="destructive">Above Cap</Badge>
)}
```

### Beckn Protocol Display

Sidebar shows:
- Status: Active ✓
- Windows discovered: 8
- Optimal window: "Glasgow Afternoon"
- Starts in: 13.7 hours
- Savings potential: 8% cleaner, 96% cheaper
- Queued jobs: 0

### Audit Log Modal

Full-featured audit trail viewer:
- Searchable by text
- Sortable by column
- Paginated (50 rows/page)
- Exportable to CSV
- Shows: Timestamp, Agent, Decision, Reasoning, Outcome, Impact

---

## 🎯 Minimum Requirements Met

✅ **Cost optimization under carbon cap** - Real-time display of £ saved with 150g threshold  
✅ **Flexible compute modeling** - 15 jobs tracked, 9 deferrable, 94% efficiency  
✅ **Grid signal forecasting** - 18% drop prediction, optimal window identification  
✅ **Orchestration commands** - Visible decisions (defer, shift, schedule)  
✅ **Audit logging** - Complete decision history with reasoning  
✅ **Beckn catalog/order** - 8 windows discovered, order lifecycle visualization  

---

## 🛠️ Development Guide

### Adding a New Component

1. Create component in appropriate folder:
   ```bash
   # Dashboard component
   touch src/components/dashboard/NewFeature.tsx
   
   # UI component (shadcn)
   npx shadcn-ui@latest add [component-name]
   ```

2. Import and use:
   ```typescript
   import NewFeature from '@/components/dashboard/NewFeature';
   ```

### Modifying API Integration

Edit `src/services/api.ts`:

```typescript
// Add new endpoint
export const getNewData = async () => {
  const response = await fetch(`${API_BASE_URL}/new-endpoint`);
  return response.json();
};
```

### Updating Styles

Tailwind classes are used throughout. To customize:

1. Edit `tailwind.config.ts` for theme changes
2. Modify component classes directly
3. Add custom CSS to `src/index.css` if needed

### Environment Variables

Create `.env.local` for local overrides:

```env
VITE_API_BASE_URL=http://localhost:8000
```

Access in code:
```typescript
const API_URL = import.meta.env.VITE_API_BASE_URL;
```

---

## 📦 Dependencies

### Core

- `react` (18.3.1) - UI framework
- `react-dom` (18.3.1) - DOM rendering
- `typescript` (5.6.2) - Type safety
- `vite` (5.4.2) - Build tool

### UI & Styling

- `tailwindcss` (3.4.1) - Utility-first CSS
- `@radix-ui/*` - Headless UI primitives (shadcn foundation)
- `lucide-react` (0.263.1) - Icon library
- `class-variance-authority` - Component variants
- `clsx` / `tailwind-merge` - Class management

### Data Visualization

- `recharts` (2.x) - Chart library
- Integrated with shadcn/ui Chart components

### Routing & Navigation

- `react-router-dom` (6.x) - Client-side routing
- `wouter` - Lightweight alternative (if used)

### Utilities

- `date-fns` - Date formatting
- `sonner` - Toast notifications

---

## 🐛 Troubleshooting

### Backend Connection Issues

**Problem:** "Backend Status: DISCONNECTED"

**Solutions:**
1. Verify backend is running: Visit https://gridflex-backend-152882144214.europe-west2.run.app/health
2. Check CORS is enabled on backend
3. Wait 10-30 seconds for cold start (Google Cloud Run)
4. Frontend will show "Waking up backend..." during cold start

### Zero Values in Impact Tab

**Problem:** Cost Saved shows £0, Carbon Reduced shows 0.00

**Cause:** Backend calculation not working or returning zeros

**Solution:** Frontend automatically falls back to mock data when backend returns zeros

### Charts Not Displaying

**Problem:** Empty chart areas or missing data

**Solutions:**
1. Check browser console for errors
2. Verify backend response contains chart data
3. Check `response.charts.cost_trend_7days` has data
4. Ensure Recharts is properly imported

### Build Errors

**Problem:** TypeScript errors or build failures

**Solutions:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript
npm run type-check

# Fix auto-fixable issues
npm run lint -- --fix
```

---

## 🚢 Deployment

### Lovable.dev (Current)

The dashboard is deployed on Lovable's platform:

1. Changes pushed via Lovable interface
2. Auto-deployment on save
3. Live URL: [Your URL]

### Alternative: Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Alternative: Netlify

```bash
# Build
npm run build

# Deploy dist/ folder via Netlify UI or CLI
netlify deploy --prod --dir=dist
```

### Environment Variables for Production

Set these in your deployment platform:

- `VITE_API_BASE_URL` - Backend API URL
- `VITE_ENABLE_MOCK_DATA` - true/false (fallback behavior)

---

## 📄 License

This project was built for the DEG Hackathon 2025.

---

## 👥 Team

**Created by:**
- **Meet Bhorania** - Backend & Optimization Logic
- **Manan Suthar** - Frontend Dashboard & Integration

**Contact:**
- Email: manannsuthar@gmail.com
- GitHub: [@MananSuthar07](https://github.com/MananSuthar07)

---

## 🙏 Acknowledgments

- Built with [Lovable.dev](https://lovable.dev) for rapid development
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Charts powered by [Recharts](https://recharts.org/)
- Backend deployed on Google Cloud Run

---

## 📝 Notes

- This frontend was built using Lovable.dev's AI-powered platform for rapid prototyping
- Real-time data polling interval: 5 seconds
- Mock data fallback ensures demo always works
- Designed for 1920x1080 presentation displays
- Optimized for Chrome/Edge browsers

---

**Built for DEG Hackathon 2025 | London**
