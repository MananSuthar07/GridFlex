import { useState } from "react";
import { Brain, TrendingUp, Settings, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, ResponsiveContainer } from "recharts";
import { WorkloadAgentModal } from "./modals/WorkloadAgentModal";
import { GridMarketModal } from "./modals/GridMarketModal";
import { OrchestratorModal } from "./modals/OrchestratorModal";

interface AgentStatusProps {
  agentData: {
    workload: any;
    grid: any;
    orchestrator: any;
  };
  highlightState: {
    workload: boolean;
    grid: boolean;
    orchestrator: boolean;
  };
}

// Mini chart transitions
const chartTransitionStyle = "transition-all duration-300 ease-in-out";

export const AgentStatus = ({ agentData, highlightState }: AgentStatusProps) => {
  const [workloadModalOpen, setWorkloadModalOpen] = useState(false);
  const [gridModalOpen, setGridModalOpen] = useState(false);
  const [orchestratorModalOpen, setOrchestratorModalOpen] = useState(false);

  const { workload, grid, orchestrator } = agentData;

  const workloadChartData = workload.trend.map((value: number, i: number) => ({ hour: i, value }));
  const carbonChartData = Array.isArray(grid.carbon_trend) && grid.carbon_trend.length > 0 
    ? grid.carbon_trend 
    : Array.from({ length: 12 }, (_, i) => ({ hour: i, value: Math.floor(Math.random() * 50) + 100 }));
  const decisionChartData = orchestrator.decision_volume.map((value: number, i: number) => ({ hour: i, value }));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Agent Status</h2>
      
      {/* Modals */}
      <WorkloadAgentModal 
        open={workloadModalOpen} 
        onOpenChange={setWorkloadModalOpen}
        agentData={workload}
      />
      <GridMarketModal 
        open={gridModalOpen} 
        onOpenChange={setGridModalOpen}
        agentData={grid}
      />
      <OrchestratorModal 
        open={orchestratorModalOpen} 
        onOpenChange={setOrchestratorModalOpen}
        agentData={orchestrator}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {/* Workload Intelligence Agent */}
        <Card className={`bg-gradient-blue text-white hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 h-[420px] relative p-6 rounded-xl ${highlightState.workload ? 'ring-4 ring-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.5)] animate-pulse' : ''}`}>
          <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              <h3 className="text-base font-semibold">Workload Intelligence Agent</h3>
            </div>
            <Badge className="bg-success text-white border-0 shadow-sm text-xs">ACTIVE</Badge>
          </div>

          <div className="absolute top-[90px] left-6 right-6 grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs opacity-90">Jobs Monitored</p>
              <p className="text-xl font-bold transition-all duration-300">{workload.jobs_monitored}</p>
            </div>
            <div>
              <p className="text-xs opacity-90">Deferrable</p>
              <p className="text-xl font-bold transition-all duration-300">{workload.deferrable}</p>
            </div>
            <div>
              <p className="text-xs opacity-90">Efficiency</p>
              <p className="text-xl font-bold transition-all duration-300">{workload.efficiency}%</p>
            </div>
          </div>

          <div className="absolute top-[280px] left-6 right-6 h-[100px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={workloadChartData} className={chartTransitionStyle}>
                <Line type="monotone" dataKey="value" stroke="white" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <button 
            onClick={() => setWorkloadModalOpen(true)}
            className="absolute bottom-5 right-6 text-sm flex items-center gap-1 hover:underline transition-all hover:gap-2"
          >
            View Details <ArrowUpRight className="h-3 w-3" />
          </button>
        </Card>

        {/* Grid Market Agent */}
        <Card className={`bg-gradient-green text-white hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 h-[420px] relative p-6 rounded-xl ${highlightState.grid ? 'ring-4 ring-green-400 shadow-[0_0_30px_rgba(34,197,94,0.5)] animate-pulse' : ''}`}>
          <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              <h3 className="text-base font-semibold">Grid Market Agent</h3>
            </div>
            <Badge className="bg-success text-white border-0 shadow-sm text-xs">ACTIVE</Badge>
          </div>

          <div className="absolute top-[90px] left-6 right-6 grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs opacity-90">Carbon</p>
              <p className="text-xl font-bold transition-all duration-300">{grid.carbon} gCO2/kWh</p>
            </div>
            <div>
              <p className="text-xs opacity-90">Price</p>
              <p className="text-xl font-bold transition-all duration-300">£{grid.price.toFixed(2)}/kWh</p>
            </div>
            <div>
              <p className="text-xs opacity-90">Forecast</p>
              <p className="text-xl font-bold transition-all duration-300">
                {grid.forecast === "improving" ? "↓ Improving" : grid.forecast === "stable" ? "→ Stable" : "↑ Rising"}
              </p>
            </div>
          </div>

          <div className="absolute top-[280px] left-6 right-6 h-[100px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={carbonChartData} className={chartTransitionStyle}>
                <Area type="monotone" dataKey="value" stroke="white" fill="white" fillOpacity={0.3} strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <button 
            onClick={() => setGridModalOpen(true)}
            className="absolute bottom-5 right-6 text-sm flex items-center gap-1 hover:underline transition-all hover:gap-2"
          >
            View Details <ArrowUpRight className="h-3 w-3" />
          </button>
        </Card>

        {/* Orchestrator */}
        <Card className={`bg-gradient-orange text-gray-900 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 h-[420px] relative p-6 rounded-xl ${highlightState.orchestrator ? 'ring-4 ring-orange-400 shadow-[0_0_30px_rgba(251,146,60,0.5)] animate-pulse' : ''}`}>
          <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <h3 className="text-base font-semibold">Orchestrator</h3>
            </div>
            <Badge className="bg-success text-white border-0 shadow-sm text-xs">ACTIVE</Badge>
          </div>

          <div className="absolute top-[90px] left-6 right-6 grid grid-cols-3 gap-3">
            <div>
              <p className="text-xs opacity-90">Decisions/min</p>
              <p className="text-xl font-bold transition-all duration-300">{orchestrator.decisions_per_min}</p>
            </div>
            <div>
              <p className="text-xs opacity-90">Response</p>
              <p className="text-xl font-bold transition-all duration-300">{orchestrator.response_time}</p>
            </div>
            <div>
              <p className="text-xs opacity-90">Queue</p>
              <p className="text-xl font-bold transition-all duration-300">{orchestrator.queue} jobs</p>
            </div>
          </div>

          <div className="absolute top-[280px] left-6 right-6 h-[100px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={decisionChartData} className={chartTransitionStyle}>
                <Bar dataKey="value" fill="rgba(0,0,0,0.2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <button 
            onClick={() => setOrchestratorModalOpen(true)}
            className="absolute bottom-5 right-6 text-sm flex items-center gap-1 hover:underline transition-all hover:gap-2"
          >
            View Details <ArrowUpRight className="h-3 w-3" />
          </button>
        </Card>
      </div>
    </div>
  );
};
