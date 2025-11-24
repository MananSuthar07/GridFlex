import { TrendingUp, Cloud, Zap, Target } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, ReferenceLine } from "recharts";
import { useState, useEffect } from "react";

interface GridMarketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentData?: any;
}

const forecastData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  carbon: Math.floor(Math.random() * 100) + 50,
  price: (Math.random() * 0.1 + 0.05).toFixed(3),
}));

const opportunities = [
  { time: "02:00-06:00", type: "Low Carbon Window", carbon: "45g CO2/kWh", price: "£0.05/kWh", potential: "High" },
  { time: "13:00-15:00", type: "Solar Peak", carbon: "60g CO2/kWh", price: "£0.07/kWh", potential: "Medium" },
  { time: "22:00-24:00", type: "Off-Peak Pricing", carbon: "80g CO2/kWh", price: "£0.04/kWh", potential: "High" },
];

export const GridMarketModal = ({ open, onOpenChange, agentData }: GridMarketModalProps) => {
  const currentHour = new Date().getHours();
  const [lastUpdated, setLastUpdated] = useState(0);
  const [carbonIntensity, setCarbonIntensity] = useState(171);
  const [currentPrice, setCurrentPrice] = useState(0.08);
  
  // Update data every 5 seconds when modal is open
  useEffect(() => {
    if (!open) return;

    setLastUpdated(0);
    const interval = setInterval(() => {
      setLastUpdated((prev) => prev + 1);
      
      // Subtle data updates
      setCarbonIntensity((prev) => Math.max(140, Math.min(190, prev + (Math.random() - 0.5) * 5)));
      setCurrentPrice((prev) => Math.max(0.05, Math.min(0.12, prev + (Math.random() - 0.5) * 0.01)));
    }, 5000);

    return () => clearInterval(interval);
  }, [open]);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <TrendingUp className="h-6 w-6 text-success" />
            Grid Market Agent - Market Intelligence
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Current Grid Conditions */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              Current Grid Conditions
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-muted-foreground">Carbon Intensity</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded transition-all ${
                    carbonIntensity > 150 
                      ? 'text-red-600 bg-red-500/20' 
                      : 'text-success bg-success/20'
                  }`}>
                    {carbonIntensity > 150 ? 'Above Cap' : 'Below Cap'}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <p className={`text-2xl font-bold transition-all duration-300 ${
                    carbonIntensity > 150 ? 'text-red-600' : 'text-success'
                  }`}>
                    {Math.round(carbonIntensity)}
                  </p>
                  <p className="text-sm text-muted-foreground">/ 150 gCO2/kWh</p>
                </div>
                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      carbonIntensity > 150 ? 'bg-red-500' : 'bg-success'
                    }`}
                    style={{ width: `${Math.min((carbonIntensity / 150) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Cap: 150g CO2/kWh</p>
              </div>
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Current Price</p>
                <p className="text-2xl font-bold text-primary transition-all duration-300">
                  £{currentPrice.toFixed(2)}/kWh
                </p>
                <p className="text-xs text-primary mt-1">↓ £0.02 vs peak</p>
              </div>
              <div className="p-4 bg-secondary border border-border rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Grid Load</p>
                <p className="text-2xl font-bold">Medium</p>
                <p className="text-xs text-muted-foreground mt-1">42.3 GW demand</p>
              </div>
            </div>
          </div>

          {/* 24-Hour Forecast */}
          <div>
            <h3 className="text-lg font-semibold mb-4">24-Hour Carbon Intensity Forecast</h3>
            <div className="h-64 bg-secondary/30 rounded-lg p-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData}>
                  <defs>
                    <linearGradient id="carbonGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="hour" 
                    stroke="hsl(var(--muted-foreground))" 
                    interval={3}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--background))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                    formatter={(value: number) => [`${value}g CO2/kWh`, "Carbon"]}
                  />
                  <ReferenceLine 
                    x={`${currentHour}:00`} 
                    stroke="hsl(var(--primary))" 
                    strokeDasharray="3 3"
                    label={{ value: "Now", position: "top" }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="carbon" 
                    stroke="hsl(var(--success))" 
                    strokeWidth={2}
                    fill="url(#carbonGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Market Opportunities */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="h-5 w-5" />
              Optimization Opportunities
            </h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-secondary">
                  <tr>
                    <th className="text-left p-3 text-sm font-semibold">Time Window</th>
                    <th className="text-left p-3 text-sm font-semibold">Type</th>
                    <th className="text-left p-3 text-sm font-semibold">Carbon</th>
                    <th className="text-left p-3 text-sm font-semibold">Price</th>
                    <th className="text-left p-3 text-sm font-semibold">Potential</th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities.map((opp, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-background" : "bg-secondary/30"}>
                      <td className="p-3 text-sm font-mono">{opp.time}</td>
                      <td className="p-3 text-sm">{opp.type}</td>
                      <td className="p-3 text-sm text-success font-semibold">{opp.carbon}</td>
                      <td className="p-3 text-sm text-primary font-semibold">{opp.price}</td>
                      <td className="p-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          opp.potential === "High" 
                            ? "bg-success/20 text-success" 
                            : "bg-primary/20 text-primary"
                        }`}>
                          {opp.potential}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Savings Potential */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Today's Savings Potential
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-gradient-to-br from-success/10 to-success/5 border border-success/20 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Carbon Reduction</p>
                <p className="text-3xl font-bold text-success mb-1">180kg CO2</p>
                <p className="text-xs text-muted-foreground">By shifting to low-carbon windows</p>
              </div>
              <div className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">Cost Savings</p>
                <p className="text-3xl font-bold text-primary mb-1">£45</p>
                <p className="text-xs text-muted-foreground">By optimizing to off-peak hours</p>
              </div>
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
