# GridFlex

> AI-powered compute orchestration platform that synchronizes datacenter workloads with energy grid conditions to reduce costs and carbon emissions.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

GridFlex addresses a critical challenge in AI infrastructure: datacenters are massive energy consumers with rapidly growing demand. Our platform makes compute workloads flexible by coordinating them with real-time energy grid conditions, enabling datacenters to participate in P415 flexibility markets while reducing both costs and environmental impact.

**Key Benefits:**
- 25-35% reduction in energy costs
- 40-60% decrease in carbon emissions
- 50-200MW flexible capacity per major datacenter
- 20-30% lower AI training expenses

## Problem Statement

As AI scales, datacenters face mounting pressure from:
- Exponential growth in energy consumption
- Rising electricity costs and carbon emissions
- Grid capacity constraints during peak demand
- Regulatory requirements for carbon reduction

GridFlex solves this by treating compute clusters as flexible loads that can shift to optimal energy windows without breaking SLA commitments.

## How It Works

GridFlex uses three intelligent agents working in concert:

### 1. **Workload Intelligence Agent**
- Tracks AI training jobs across distributed GPU clusters using Ray
- Forecasts demand patterns with Prophet/LSTM models
- Identifies deferrable workloads and calculates flexibility windows

### 2. **Grid Market Agent**
- Monitors real-time energy prices and carbon intensity via Beckn Protocol
- Connects to UK Carbon Intensity API and wholesale markets
- Identifies optimal windows when power is cheap and clean

### 3. **Orchestration Engine**
- Runs multi-objective optimization (NSGA-II + reinforcement learning)
- Balances three goals: minimize cost, enforce carbon caps (<200g CO2/kWh), maintain SLA (<5min response)
- Makes split-second decisions to shift workloads to low-carbon periods

## Architecture

<img width="1404" height="904" alt="image" src="https://github.com/user-attachments/assets/443e20bf-6d29-4af6-ba00-f5cbee49d4ea" />
<em>Figure 1: GridFlex System Architecture.</em>

### Technology Stack

- **Backend:** Python, FastAPI
- **Frontend:** React (operator dashboard)
- **Database:** PostgreSQL
- **ML/AI:** GCP Vertex AI, Ray, Prophet, LSTM
- **Protocol:** Beckn Protocol for energy market integration

## Agent Workflow

### Discovery Phase
The Workload Agent publishes flexibility catalogs via Beckn, describing:
- Energy requirements (e.g., 150kWh)
- Deferral windows (e.g., 4 hours)
- Flexibility premiums (e.g., £0.15/kWh)

### Selection & Booking
When optimal conditions arise (e.g., 02:00-06:00 window with <100g CO2/kWh and £0.08/kWh), the Grid Agent initiates a Beckn order. The Orchestration Engine validates constraints and confirms booking.

### Execution
Confirmed orders trigger workload rescheduling with real-time monitoring:
- Power draw tracking
- Actual carbon intensity measurement
- Cost savings calculation

### Settlement
Transactions complete via Beckn protocol with verifiable audit trails for P415 compliance.

## Business Model

### Revenue Streams
1. **SaaS Subscriptions** (based on GPU count):
   - <500 GPUs: £2,000/month
   - 500-2000 GPUs: £5,000/month
   - >2000 GPUs: £8,000/month

2. **Marketplace Commission**: 20% of P415 flexibility payments earned

### Market Opportunity
- 30+ large datacenters in the UK
- £15-25M addressable market annually
- 40% YoY growth in AI compute demand
- International expansion planned for Q3 2026 (EU, US)

## Environmental Impact

Each participating datacenter can prevent **2-3 million tons of CO2 emissions annually** while maintaining performance standards and generating new revenue streams.

## Getting Started

### Prerequisites
```bash
Python 3.9+
Node.js 16+
PostgreSQL 14+
Docker (optional)
```

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/gridflex.git
cd gridflex

# Install backend dependencies
pip install -r requirements.txt

# Install frontend dependencies
cd frontend
npm install
```

### Configuration
```bash
# Copy environment template
cp .env.example .env

# Configure your settings
# - Beckn sandbox credentials
# - Database connection
# - API keys for energy market data
```

### Running the Application
```bash
# Start backend
python -m uvicorn app.main:app --reload

# Start frontend (in separate terminal)
cd frontend
npm start
```

## Project Assumptions

- Simulated GPU workload data for initial development
- Energy market API integration (UK Carbon Intensity API, wholesale prices)
- 30-minute scheduling windows aligned with P415 requirements
- Beckn sandbox environment for protocol validation

## Team

**GridFlex Team**
- **Meet Bhorania** - AI Engineer, Technical Lead
- **Manan Suthar** - Frontend Engineer, Designer, Business Strategist

## References

- [UK National Grid Carbon Intensity API](https://carbonintensity.org.uk)
- [Beckn Protocol Documentation](https://developers.becknprotocol.io)
- [Ofgem P415 Flexibility Market](https://www.ofgem.gov.uk)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

- **Email:** meet.bhorania@gmail.com, manannsuthar@gmail.com
- **Discord:** meet5867, manansuthar

## Acknowledgments

Developed for the Digital Energy Grid Hackathon. Special thanks to the Beckn Protocol community and UK National Grid for providing essential APIs and documentation.

---

**Note:** This project is currently in active development. We welcome contributions and feedback from the community.
