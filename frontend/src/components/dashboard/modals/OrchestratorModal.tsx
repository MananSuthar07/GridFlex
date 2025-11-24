import { Settings, PieChart, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";

interface OrchestratorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentData?: any;
}

const decisionData = [
  { name: "Defer Workload", value: 45, color: "hsl(var(--primary))" },
  { name: "Cost Optimization", value: 30, color: "hsl(var(--success))" },
  { name: "Carbon Reduction", value: 20, color: "hsl(142, 76%, 36%)" },
  { name: "Emergency", value: 5, color: "hsl(0, 84%, 60%)" }, // RED color
];

const queuedJobs = [
  { id: "Q-001", priority: "High", action: "Defer ML Training", eta: "2 min", confidence: 95 },
  { id: "Q-002", priority: "Medium", action: "Optimize Batch", eta: "5 min", confidence: 89 },
  { id: "Q-003", priority: "Low", action: "Schedule Inference", eta: "8 min", confidence: 92 },
];

const systemStatus = [
  { component: "Decision Engine", status: "Operational", uptime: 99.9 },
  { component: "Policy Enforcer", status: "Operational", uptime: 100 },
  { component: "Conflict Resolver", status: "Operational", uptime: 99.7 },
  { component: "Queue Manager", status: "Operational", uptime: 99.8 },
];

export const OrchestratorModal = ({ open, onOpenChange, agentData }: OrchestratorModalProps) => {
  const [lastUpdated, setLastUpdated] = useState(0);
  const [decisionsPerMin, setDecisionsPerMin] = useState(12);
  const [queueLength, setQueueLength] = useState(3);
  const [avgResponse, setAvgResponse] = useState(2.4);

  // Update data every 5 seconds when modal is open
  useEffect(() => {
    if (!open) return;

    setLastUpdated(0);
    const interval = setInterval(() => {
      setLastUpdated((prev) => prev + 1);
      
      // Subtle data updates
      setDecisionsPerMin((prev) => Math.max(8, Math.min(16, prev + Math.floor((Math.random() - 0.5) * 3))));
      setQueueLength((prev) => Math.max(0, Math.min(8, prev + Math.floor((Math.random() - 0.5) * 2))));
      setAvgResponse((prev) => Math.max(1.8, Math.min(3.2, prev + (Math.random() - 0.5) * 0.3)));
    }, 5000);

    return () => clearInterval(interval);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Settings className="h-6 w-6 text-warning" />
            Orchestrator - Control Center
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Performance Metrics */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Current Performance Metrics</h3>
            <div className="grid grid-cols-4 gap-4">
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Decisions/min</p>
                <p className="text-3xl font-bold text-primary transition-all duration-300">{decisionsPerMin}</p>
              </div>
              <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Avg Response</p>
                <p className="text-3xl font-bold text-success transition-all duration-300">{avgResponse.toFixed(1)}min</p>
              </div>
              <div className="p-4 bg-secondary border border-border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Queue Length</p>
                <p className="text-3xl font-bold transition-all duration-300">{queueLength}</p>
              </div>
              <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Success Rate</p>
                <p className="text-3xl font-bold text-success">97%</p>
              </div>
            </div>
          </div>

          {/* Decision Breakdown */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Decision Breakdown (Last 24h)
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center justify-center">
                <div className="h-72 w-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                      <Pie
                        data={decisionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        strokeWidth={2}
                        stroke="hsl(var(--background))"
                      >
                        {decisionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--background))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                        formatter={(value: number) => [`${value} decisions`, '']}
                      />
                    </RechartsPie>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="space-y-3 flex flex-col justify-center">
                {decisionData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className={`text-sm font-medium ${
                        item.name === "Emergency" ? "font-bold text-destructive flex items-center gap-1" : "text-foreground"
                      }`}>
                        {item.name === "Emergency" && (
                          <AlertTriangle className="h-4 w-4" />
                        )}
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-lg font-bold ${
                        item.name === "Emergency" ? "text-destructive" : "text-foreground"
                      }`}>
                        {item.value}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({((item.value / decisionData.reduce((sum, d) => sum + d.value, 0)) * 100).toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Active Queue */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Active Decision Queue
            </h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-secondary">
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold">Queue ID</th>
                    <th className="text-left p-3 text-sm font-semibold">Priority</th>
                    <th className="text-left p-3 text-sm font-semibold">Action</th>
                    <th className="text-left p-3 text-sm font-semibold">ETA</th>
                    <th className="text-left p-3 text-sm font-semibold">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {queuedJobs.map((job, index) => (
                    <tr key={job.id} className={index % 2 === 0 ? "bg-background" : "bg-secondary/30"}>
                      <td className="p-3 text-sm font-mono">{job.id}</td>
                      <td className="p-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          job.priority === "High" ? "bg-destructive/20 text-destructive" :
                          job.priority === "Medium" ? "bg-warning/20 text-warning" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {job.priority}
                        </span>
                      </td>
                      <td className="p-3 text-sm">{job.action}</td>
                      <td className="p-3 text-sm">{job.eta}</td>
                      <td className="p-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Progress value={job.confidence} className="h-2 w-16" />
                          <span className="text-xs font-semibold">{job.confidence}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* System Status */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              Decision Logic System Status
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {systemStatus.map((system) => (
                <div key={system.component} className="p-4 bg-secondary/30 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold">{system.component}</span>
                    <span className="px-2 py-1 bg-success/20 text-success text-xs rounded-full font-medium">
                      {system.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={system.uptime} className="h-2 flex-1" />
                    <span className="text-xs text-muted-foreground">{system.uptime}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Last Updated */}
          <div className="mt-4 pt-4 border-t text-center">
            <p className="text-xs text-muted-foreground">
              Last updated: {lastUpdated} seconds ago
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
