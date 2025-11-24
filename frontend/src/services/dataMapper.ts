import type { BackendResponse, BackendTimeline, BackendDecision } from './api';

export const mapBackendToAgentData = (backend: BackendResponse) => {
  const { agents } = backend;
  
  if (!agents || !agents.workload || !agents.grid || !agents.orchestrator) {
    console.error('Missing agent data:', agents);
    throw new Error('Invalid agent data structure');
  }
  
  return {
    workload: {
      jobs_monitored: agents.workload.jobs_monitored,
      deferrable: agents.workload.deferrable,
      efficiency: agents.workload.efficiency,
      status: "ACTIVE" as const,
      trend: Array.from({ length: 12 }, () => Math.floor(Math.random() * 100) + 50),
    },
    grid: {
      carbon: agents.grid.carbon_intensity,
      price: agents.grid.energy_price,
      forecast: agents.grid.carbon_intensity > 150 ? "rising" : agents.grid.carbon_intensity < 100 ? "improving" : "stable",
      status: "ACTIVE" as const,
      carbon_trend: backend.charts.carbon_by_hour.slice(-12).map(d => ({ hour: d.hour, value: d.carbon })),
    },
    orchestrator: {
      decisions_per_min: agents.orchestrator.decisions_per_min,
      response_time: agents.orchestrator.response_time,
      queue: agents.orchestrator.queue_size,
      status: "ACTIVE" as const,
      decision_volume: Array.from({ length: 12 }, () => Math.floor(Math.random() * 30) + 10),
    },
  };
};

export const mapBackendToImpactData = (backend: BackendResponse) => {
  const { impact } = backend;
  
  console.log('🔍 Backend impact data received:', impact);
  
  if (!impact) {
    console.error('Missing impact data');
    throw new Error('Invalid impact data structure');
  }
  
  const mapped = {
    cost_saved: impact.total_cost_saved_gbp || 0,
    carbon_reduced: impact.total_carbon_reduced_tonnes || 0,
    uptime: impact.system_uptime_percent || 0,
    trees_equivalent: impact.trees_equivalent || 0,
  };
  
  console.log('✅ Mapped impact data:', mapped);
  
  return mapped;
};

export const mapBackendToOptimizationData = (backend: BackendResponse) => {
  const { optimization } = backend;
  
  if (!optimization) {
    console.error('Missing optimization data');
    throw new Error('Invalid optimization data structure');
  }
  
  // Map timeline blocks
  const timeline = optimization.timeline.map((block: BackendTimeline) => ({
    id: block.id,
    start: block.start_hour,
    duration: block.duration,
    type: mapJobType(block.type),
    label: formatJobLabel(block.type),
    energy_kwh: block.energy_kwh,
    deferred: block.deferred,
  }));
  
  // Map decisions
  const decisions = optimization.recent_decisions.map((d: BackendDecision, index: number) => ({
    id: Date.now() + index,
    timestamp: new Date(d.timestamp).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    agent: d.agent,
    icon: getAgentIcon(d.agent),
    decision: d.action.length > 60 ? d.action.substring(0, 60) + '...' : d.action,
    outcome: d.status,
    impact: formatImpact(d.cost_savings_gbp, d.carbon_reduction_kg),
  }));
  
  return {
    timeline,
    decisions,
    cost_comparison: optimization.daily_cost_comparison,
    carbon_comparison: optimization.daily_carbon_comparison,
  };
};

export const mapBackendToCharts = (backend: BackendResponse) => {
  const { charts } = backend;
  
  console.log('🔍 Backend charts data received:', charts);
  
  if (!charts) {
    console.error('Missing charts data');
    throw new Error('Invalid charts data structure');
  }
  
  const mapped = {
    costTrend: charts.cost_trend_7days || [],
    carbonByHour: charts.carbon_by_hour || [],
    workloadDistribution: [
      { name: 'Training', value: charts.workload_distribution?.training || 0, color: '#2563EB' },
      { name: 'Inference', value: charts.workload_distribution?.inference || 0, color: '#10B981' },
      { name: 'Processing', value: charts.workload_distribution?.processing || 0, color: '#F59E0B' },
    ],
    energyPattern: charts.energy_pattern_24h || [],
  };
  
  console.log('✅ Mapped charts data:', mapped);
  
  return mapped;
};

// Helper functions
const mapJobType = (type: string | undefined): string => {
  if (!type) return 'training';
  if (type.includes('training') || type.includes('finetuning')) return 'training';
  if (type.includes('inference')) return 'inference';
  if (type.includes('processing')) return 'batch';
  return 'training';
}

const formatJobLabel = (type: string | undefined): string => {
  if (!type) return 'Processing';
  if (type.includes('training')) return 'ML Training';
  if (type.includes('finetuning')) return 'Model Finetuning';
  if (type.includes('inference') && type.includes('realtime')) return 'Real-time Inference';
  if (type.includes('inference')) return 'Inference';
  if (type.includes('processing')) return 'Batch Processing';
  return 'Processing';
}

const getAgentIcon = (agent: string): string => {
  if (agent.toLowerCase().includes('orchestrator')) return '⚙️';
  if (agent.toLowerCase().includes('workload') || agent.toLowerCase().includes('intelligence')) return '🧠';
  if (agent.toLowerCase().includes('grid') || agent.toLowerCase().includes('market')) return '📊';
  return '🤖';
};

const formatImpact = (cost?: number, carbon?: number): string => {
  const parts = [];
  if (cost !== undefined && cost > 0) {
    parts.push(`£${cost.toFixed(2)} saved`);
  }
  if (carbon !== undefined && carbon > 0) {
    parts.push(`${carbon.toFixed(2)} kg CO2 reduced`);
  }
  return parts.length > 0 ? parts.join(', ') : 'Optimizing...';
};
