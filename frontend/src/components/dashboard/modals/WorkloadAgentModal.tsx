import { Brain, TrendingUp, Activity } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { useState, useEffect } from "react";

interface WorkloadAgentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentData?: any;
}

const performanceData = Array.from({ length: 7 }, (_, i) => ({
  day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
  efficiency: Math.floor(Math.random() * 10) + 90,
}));

const jobs = [
  { id: "JOB-1247", type: "ML Training", status: "Deferred", energy: "12.3 kWh", savings: "£18" },
  { id: "JOB-1248", type: "Data Processing", status: "Running", energy: "5.8 kWh", savings: "£8" },
  { id: "JOB-1249", type: "Model Inference", status: "Deferred", energy: "3.2 kWh", savings: "£5" },
  { id: "JOB-1250", type: "Batch Analysis", status: "Queued", energy: "8.7 kWh", savings: "£12" },
];

const activities = [
  { time: "2 min ago", action: "Deferred ML training job to low-carbon window", impact: "positive" },
  { time: "15 min ago", action: "Optimized batch processing schedule", impact: "positive" },
  { time: "32 min ago", action: "Completed workload analysis for 45 jobs", impact: "neutral" },
  { time: "1 hour ago", action: "Shifted inference workload to off-peak hours", impact: "positive" },
];

export const WorkloadAgentModal = ({ open, onOpenChange, agentData }: WorkloadAgentModalProps) => {
  const [lastUpdated, setLastUpdated] = useState(0);
  const [efficiency, setEfficiency] = useState(94);
  const [jobClassification, setJobClassification] = useState(96);
  const [deferrals, setDeferrals] = useState(92);
  const [resourceUtil, setResourceUtil] = useState(94);

  // Update data every 5 seconds when modal is open
  useEffect(() => {
    if (!open) return;

    setLastUpdated(0);
    const interval = setInterval(() => {
      setLastUpdated((prev) => prev + 1);
      
      // Subtle data updates
      setEfficiency((prev) => Math.min(100, Math.max(90, prev + (Math.random() - 0.5) * 2)));
      setJobClassification((prev) => Math.min(100, Math.max(92, prev + (Math.random() - 0.5))));
      setDeferrals((prev) => Math.min(100, Math.max(88, prev + (Math.random() - 0.5) * 2)));
      setResourceUtil((prev) => Math.min(100, Math.max(90, prev + (Math.random() - 0.5) * 2)));
    }, 5000);

    return () => clearInterval(interval);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Brain className="h-6 w-6 text-primary" />
            Workload Intelligence Agent - Detailed Analytics
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Efficiency Breakdown */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Efficiency Breakdown
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Job Classification Accuracy</span>
                  <span className="font-semibold transition-all duration-300">{Math.round(jobClassification)}%</span>
                </div>
                <Progress value={jobClassification} className="h-2 transition-all duration-300" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Deferral Success Rate</span>
                  <span className="font-semibold transition-all duration-300">{Math.round(deferrals)}%</span>
                </div>
                <Progress value={deferrals} className="h-2 transition-all duration-300" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Schedule Optimization</span>
                  <span className="font-semibold transition-all duration-300">89%</span>
                </div>
                <Progress value={89} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Resource Utilization</span>
                  <span className="font-semibold transition-all duration-300">{Math.round(resourceUtil)}%</span>
                </div>
                <Progress value={resourceUtil} className="h-2 transition-all duration-300" />
              </div>
            </div>
          </div>

          {/* Job Analytics Table */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Active Jobs Analytics</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-secondary">
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold">Job ID</th>
                    <th className="text-left p-3 text-sm font-semibold">Type</th>
                    <th className="text-left p-3 text-sm font-semibold">Status</th>
                    <th className="text-left p-3 text-sm font-semibold">Energy</th>
                    <th className="text-left p-3 text-sm font-semibold">Savings</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job, index) => (
                    <tr key={job.id} className={index % 2 === 0 ? "bg-background" : "bg-secondary/30"}>
                      <td className="p-3 text-sm font-mono">{job.id}</td>
                      <td className="p-3 text-sm">{job.type}</td>
                      <td className="p-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          job.status === "Running" ? "bg-primary/20 text-primary" :
                          job.status === "Deferred" ? "bg-success/20 text-success" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="p-3 text-sm">{job.energy}</td>
                      <td className="p-3 text-sm font-semibold text-success">{job.savings}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </h3>
            <div className="space-y-2">
              {activities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-secondary/30 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-1.5 ${
                    activity.impact === "positive" ? "bg-success" : "bg-muted-foreground"
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm">{activity.action}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 7-Day Performance Chart */}
          <div>
            <h3 className="text-lg font-semibold mb-4">7-Day Performance Trend</h3>
            <div className="h-64 bg-secondary/30 rounded-lg p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" domain={[80, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--background))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="efficiency" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3} 
                    dot={{ fill: "hsl(var(--primary))", r: 5 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
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
