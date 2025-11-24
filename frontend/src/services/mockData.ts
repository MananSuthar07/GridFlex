// Mock data service for dashboard real-time updates

export interface WorkloadAgentData {
  status: "ACTIVE" | "INACTIVE";
  jobs_monitored: number;
  deferrable: number;
  efficiency: number;
  trend: number[];
}

export interface GridAgentData {
  status: "ACTIVE" | "INACTIVE";
  carbon: number;
  price: number;
  forecast: "improving" | "stable" | "degrading";
  carbon_trend: number[];
}

export interface OrchestratorData {
  status: "ACTIVE" | "INACTIVE";
  decisions_per_min: number;
  response_time: number;
  queue: number;
  decision_volume: number[];
}

export interface Decision {
  id: number;
  timestamp: string;
  agent: string;
  icon: string;
  decision: string;
  outcome: string;
  impact: string;
}

export interface ImpactMetrics {
  cost_saved: number;
  carbon_reduced: number;
  uptime: number;
}

const baseWorkloadData: WorkloadAgentData = {
  status: "ACTIVE",
  jobs_monitored: 247,
  deferrable: 45,
  efficiency: 94,
  trend: [85, 87, 89, 91, 92, 93, 94, 95, 94, 93, 94, 94]
};

const baseGridData: GridAgentData = {
  status: "ACTIVE",
  carbon: 95,
  price: 0.08,
  forecast: "improving",
  carbon_trend: [120, 115, 110, 105, 100, 98, 95, 93, 95, 97, 95, 95]
};

const baseOrchestratorData: OrchestratorData = {
  status: "ACTIVE",
  decisions_per_min: 12,
  response_time: 2.8,
  queue: 3,
  decision_volume: [8, 10, 12, 15, 13, 11, 12, 14, 12, 10, 12, 12]
};

const baseImpactMetrics: ImpactMetrics = {
  cost_saved: 45230,
  carbon_reduced: 2.3,
  uptime: 99.9
};

export const getWorkloadAgentData = (addVariation = true): WorkloadAgentData => {
  if (!addVariation) return { ...baseWorkloadData };
  
  return {
    ...baseWorkloadData,
    jobs_monitored: baseWorkloadData.jobs_monitored + Math.floor(Math.random() * 7) - 3,
    deferrable: baseWorkloadData.deferrable + Math.floor(Math.random() * 5) - 2,
    efficiency: Math.min(100, Math.max(90, baseWorkloadData.efficiency + (Math.random() * 2 - 1))),
    trend: baseWorkloadData.trend.map(v => Math.max(60, Math.min(100, v + (Math.random() * 6 - 3))))
  };
};

export const getGridAgentData = (addVariation = true): GridAgentData => {
  if (!addVariation) return { ...baseGridData };
  
  const carbonChange = Math.floor(Math.random() * 11) - 5;
  return {
    ...baseGridData,
    carbon: Math.max(40, Math.min(200, baseGridData.carbon + carbonChange)),
    price: Math.max(0.04, Math.min(0.15, baseGridData.price + (Math.random() * 0.02 - 0.01))),
    forecast: carbonChange < -2 ? "improving" : carbonChange > 2 ? "degrading" : "stable",
    carbon_trend: baseGridData.carbon_trend.map(v => Math.max(40, Math.min(200, v + (Math.random() * 10 - 5))))
  };
};

export const getOrchestratorData = (addVariation = true): OrchestratorData => {
  if (!addVariation) return { ...baseOrchestratorData };
  
  return {
    ...baseOrchestratorData,
    decisions_per_min: Math.max(5, baseOrchestratorData.decisions_per_min + Math.floor(Math.random() * 5) - 2),
    response_time: Math.max(1.0, Math.min(5.0, baseOrchestratorData.response_time + (Math.random() * 0.6 - 0.3))),
    queue: Math.max(0, baseOrchestratorData.queue + Math.floor(Math.random() * 3) - 1),
    decision_volume: baseOrchestratorData.decision_volume.map(v => Math.max(5, Math.min(20, v + Math.floor(Math.random() * 6 - 3))))
  };
};

export const getImpactMetrics = (addVariation = true): ImpactMetrics => {
  if (!addVariation) return { ...baseImpactMetrics };
  
  return {
    cost_saved: baseImpactMetrics.cost_saved + Math.floor(Math.random() * 100),
    carbon_reduced: Math.max(2.0, baseImpactMetrics.carbon_reduced + (Math.random() * 0.02 - 0.01)),
    uptime: Math.max(99.5, Math.min(100, baseImpactMetrics.uptime + (Math.random() * 0.1 - 0.05)))
  };
};

export const generateNewDecision = (): Decision => {
  const decisions = [
    {
      agent: "Workload Intelligence",
      icon: "🧠",
      decision: "Identified 8 deferrable batch jobs (total 28 MWh)",
      outcome: "Success",
      impact: "Added to optimization queue"
    },
    {
      agent: "Grid Market Agent",
      icon: "📊",
      decision: "Carbon intensity dropping - increased compute allocation",
      outcome: "Success",
      impact: "12% efficiency gain"
    },
    {
      agent: "Orchestrator",
      icon: "⚙️",
      decision: "Deferred ML training job to 03:00 (low carbon window)",
      outcome: "Success",
      impact: "£85 saved, 0.3 tonnes CO2 reduced"
    },
    {
      agent: "Workload Intelligence",
      icon: "🧠",
      decision: "Training workload completed - 94% efficiency achieved",
      outcome: "Success",
      impact: "Within carbon budget"
    },
    {
      agent: "Grid Market Agent",
      icon: "📊",
      decision: "Renewable energy surge detected - shifting workloads",
      outcome: "Success",
      impact: "22% carbon reduction"
    }
  ];

  const selected = decisions[Math.floor(Math.random() * decisions.length)];
  const now = new Date();
  
  return {
    id: Date.now(),
    timestamp: now.toLocaleTimeString('en-GB'),
    ...selected
  };
};
