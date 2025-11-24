import { useState } from "react";
import { Clock, TrendingDown, MapPin, FileText, ArrowDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Line, LineChart } from "recharts";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AuditLogModal } from "./modals/AuditLogModal";

interface OptimizationProps {
  optimizationData: {
    timeline: any[];
    decisions: any[];
    cost_comparison: {
      without_gridflex: number;
      with_gridflex: number;
      savings_percent: number;
    };
    carbon_comparison: {
      without_gridflex_kg: number;
      with_gridflex_kg: number;
      reduction_percent: number;
    };
  };
}

export const Optimization = ({ optimizationData }: OptimizationProps) => {
  const [isAuditLogOpen, setIsAuditLogOpen] = useState(false);
  const currentHour = new Date().getHours();

  // Forecast sparkline data
  const forecastData = [
    { value: 120 },
    { value: 115 },
    { value: 110 },
    { value: 105 },
    { value: 100 },
    { value: 98 },
  ];

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return "Just now";
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return "Just now";
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      
      if (diffSecs < 60) return `${diffSecs} sec ago`;
      if (diffMins < 60) return `${diffMins} min ago`;
      return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return "Just now";
    }
  };

  const getAgentColor = (agent: string) => {
    if (agent.toLowerCase().includes("workload") || agent.toLowerCase().includes("intelligence")) return "bg-blue-500/20 text-blue-700 dark:text-blue-300";
    if (agent.toLowerCase().includes("grid") || agent.toLowerCase().includes("market")) return "bg-green-500/20 text-green-700 dark:text-green-300";
    if (agent.toLowerCase().includes("orchestrator")) return "bg-orange-500/20 text-orange-700 dark:text-orange-300";
    return "bg-gray-500/20 text-gray-700 dark:text-gray-300";
  };

  const getBlockColor = (type: string) => {
    switch (type) {
      case "training": return "bg-blue-500";
      case "inference": return "bg-green-500";
      case "batch": return "bg-orange-500";
      default: return "bg-gray-500";
    }
  };

  const getBlockLabel = (type: string) => {
    switch (type) {
      case "training": return "ML Training";
      case "inference": return "Inference";
      case "batch": return "Batch Processing";
      default: return "Processing";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Real-Time Optimization View</h2>
        <button 
          onClick={() => setIsAuditLogOpen(true)}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all shadow-md hover:shadow-lg"
        >
          <FileText className="h-4 w-4" />
          View Full Audit Log
        </button>
      </div>

      <AuditLogModal
        open={isAuditLogOpen}
        onOpenChange={setIsAuditLogOpen}
        decisions={optimizationData.decisions}
      />

      {/* Grid Forecast */}
      <Card className="p-6 bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-green-500/20 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-green-500" />
          Grid Forecast (Next 6 Hours)
        </h3>
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-3">Carbon intensity expected to drop in next 3 hours</p>
            <div className="flex items-center gap-3 text-sm">
              <span className="px-3 py-1.5 bg-green-500 text-white rounded-lg font-medium">Optimal: 14:00-17:00</span>
              <span className="text-muted-foreground">Target: 95g CO2/kWh</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-4xl font-bold text-green-600 flex items-center gap-2">
                <ArrowDown className="h-8 w-8" />
                18%
              </p>
              <p className="text-sm text-muted-foreground mt-1">Next 3h forecast</p>
            </div>
            <div className="w-24 h-10">
              <LineChart width={96} height={40} data={forecastData}>
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </div>
          </div>
        </div>
      </Card>

      {/* Timeline */}
      <Card className="p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold mb-4">24-Hour Workload Timeline</h3>
        <div className="relative overflow-hidden">
          <div className="w-full bg-secondary rounded-lg p-4">
            {/* Hour markers - Every 3 hours */}
            <div className="flex justify-between text-sm font-semibold text-muted-foreground mb-3 px-1">
              {[0, 3, 6, 9, 12, 15, 18, 21, 24].map((hour) => (
                <span key={hour} className="flex-shrink-0">
                  {hour.toString().padStart(2, '0')}:00
                </span>
              ))}
            </div>

            {/* Timeline bar */}
            <div className="relative h-44 bg-card rounded-lg border border-border">
              {/* Workload blocks */}
              {optimizationData.timeline.map((block: any) => {
                const blockEnd = block.start + block.duration;
                const blockOverflows = blockEnd > 24;
                
                // If block overflows past 24:00, truncate it
                const effectiveDuration = blockOverflows ? 24 - block.start : block.duration;
                const blockWidth = (effectiveDuration / 24) * 100;
                const showLabel = blockWidth > 8; // Only show label if block is wide enough
                
                return (
                  <div
                    key={block.id}
                    className={`absolute top-2 h-40 ${getBlockColor(block.type)} rounded-lg opacity-90 hover:opacity-100 transition-all duration-300 cursor-pointer flex items-center justify-center text-white text-sm font-medium px-2 border ${
                      block.type === 'training' ? 'border-blue-600' : 
                      block.type === 'inference' ? 'border-green-600' : 
                      'border-orange-600'
                    } ${
                      block.deferred ? 'ring-2 ring-orange-400 shadow-[0_0_20px_rgba(251,146,60,0.5)]' : ''
                    }`}
                    style={{
                      left: `${(block.start / 24) * 100}%`,
                      width: `${blockWidth}%`,
                    }}
                    title={`${block.label} (${block.start}:00 - ${blockEnd}:00) | ${block.energy_kwh} kWh${block.deferred ? ' - DEFERRED' : ''}${blockOverflows ? ' (continues next day)' : ''}`}
                  >
                    {showLabel && <span className="truncate">{block.label}{blockOverflows ? '...' : ''}</span>}
                  </div>
                );
              })}

              {/* Current time marker */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-red-500 z-10 transition-all duration-300"
                style={{ left: `${(currentHour / 24) * 100}%` }}
              >
                <div className="absolute -top-7 left-1/2 -translate-x-1/2">
                  <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded whitespace-nowrap">
                    NOW
                  </span>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex gap-6 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded border border-blue-600"></div>
                <span>Training</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded border border-green-600"></div>
                <span>Inference</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded border border-orange-600"></div>
                <span>Batch</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Bottom section */}
      <div className="grid grid-cols-1 xl:grid-cols-[45%_55%] gap-6">
        {/* Recent Decisions */}
        <Card className="p-6 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Decisions</h3>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </div>
          
          <ScrollArea className="h-96 pr-4">
            <div className="space-y-4">
              {optimizationData.decisions.map((decision: any) => {
                const isRegionalShift = decision.decision.toLowerCase().includes('shift') && 
                                       (decision.decision.toLowerCase().includes('region') || 
                                        decision.decision.toLowerCase().includes('glasgow') ||
                                        decision.decision.toLowerCase().includes('london'));
                
                return (
                  <div
                    key={decision.id}
                    className={`flex items-start gap-3 p-4 rounded-lg hover:bg-muted/70 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 animate-fade-in ${
                      isRegionalShift ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-muted/50'
                    }`}
                    title={decision.decision}
                  >
                    <div className="flex-shrink-0 mt-1">
                      {isRegionalShift ? <MapPin className="h-8 w-8 text-emerald-600" /> : <div className="h-8 w-8 flex items-center justify-center text-2xl">{decision.icon}</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge
                          variant="outline"
                          className={`${getAgentColor(decision.agent)} border-0 text-xs`}
                        >
                          {decision.agent}
                        </Badge>
                        {isRegionalShift && (
                          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded">
                            🌍 Regional Shift
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">{formatTimestamp(decision.timestamp)}</span>
                      </div>
                      <p className="text-sm font-medium line-clamp-2 leading-relaxed">
                        {isRegionalShift && !decision.decision.includes('Glasgow') && !decision.decision.includes('London') 
                          ? decision.decision.replace('region', 'Glasgow (renewable-rich)')
                          : decision.decision}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={decision.outcome === 'Success' ? 'bg-success text-white border-0 text-xs' : 'bg-gray-500 text-white border-0 text-xs'}>
                          {decision.outcome}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{decision.impact}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </Card>

        {/* Comparison Panel */}
        <Card className="p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-6">Impact Analysis</h3>
          
          <div className="space-y-8">
            {/* Cost comparison */}
            <div>
              <p className="text-sm font-medium mb-4 flex items-center gap-2">
                <span className="text-lg">💰</span>
                Daily Cost
              </p>
              <div className="space-y-3">
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Without GridFlex</span>
                    <span className="font-mono font-medium">£{optimizationData.cost_comparison.without_gridflex.toFixed(2)}/day</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden w-full">
                    <div className="h-full bg-gray-400 w-full transition-all duration-300"></div>
                  </div>
                </div>
                
                <div className="bg-green-50/50 dark:bg-green-950/20 rounded-lg p-3">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">With GridFlex</span>
                    <span className="font-mono font-bold text-success">£{optimizationData.cost_comparison.with_gridflex.toFixed(2)}/day</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden w-full">
                    <div 
                      className="h-full bg-success transition-all duration-300" 
                      style={{ width: `${(optimizationData.cost_comparison.with_gridflex / optimizationData.cost_comparison.without_gridflex) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-end gap-2">
                  <span className="text-lg font-bold text-green-600 flex items-center gap-1">
                    <ArrowDown className="h-5 w-5" />
                    {optimizationData.cost_comparison.savings_percent}%
                  </span>
                </div>
              </div>
            </div>

            {/* Carbon comparison */}
            <div>
              <p className="text-sm font-medium mb-4 flex items-center gap-2">
                <span className="text-lg">🌱</span>
                Daily Carbon
              </p>
              <div className="space-y-3">
                <div className="bg-muted/30 rounded-lg p-3">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Without GridFlex</span>
                    <span className="font-mono font-medium">{optimizationData.carbon_comparison.without_gridflex_kg} kg CO2</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden w-full">
                    <div className="h-full bg-gray-400 w-full transition-all duration-300"></div>
                  </div>
                </div>
                
                <div className="bg-green-50/50 dark:bg-green-950/20 rounded-lg p-3">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">With GridFlex</span>
                    <span className="font-mono font-bold text-success">{optimizationData.carbon_comparison.with_gridflex_kg} kg CO2</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden w-full">
                    <div 
                      className="h-full bg-success transition-all duration-300" 
                      style={{ width: `${(optimizationData.carbon_comparison.with_gridflex_kg / optimizationData.carbon_comparison.without_gridflex_kg) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex items-center justify-end gap-2">
                  <span className="text-lg font-bold text-green-600 flex items-center gap-1">
                    <ArrowDown className="h-5 w-5" />
                    {optimizationData.carbon_comparison.reduction_percent}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
