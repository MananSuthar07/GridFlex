import { TrendingUp, CheckCircle2, Leaf, PoundSterling, Briefcase, Shield, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";

interface ImpactProps {
  impactData: {
    cost_saved: number;
    carbon_reduced: number;
    uptime: number;
    trees_equivalent: number;
  };
  chartData: {
    costTrend: { day: string; savings: number }[];
    carbonByHour: { hour: string; carbon: number }[];
    workloadDistribution: { name: string; value: number; color: string }[];
    energyPattern: { hour: number; usage: number }[];
  };
}

export const Impact = ({ impactData, chartData }: ImpactProps) => {
  // Debug logging to verify data
  console.log('Impact data:', impactData);
  console.log('Charts data:', chartData);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Impact Dashboard</h2>

      {/* Hero Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20 hover:shadow-lg transition-all duration-500 animate-scale-in">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <h3 className="text-sm font-medium text-muted-foreground">Cost Saved</h3>
          </div>
          <p className="text-3xl font-bold text-foreground transition-all duration-500">
            £{(impactData.cost_saved || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Since deployment</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20 hover:shadow-lg transition-all duration-500 animate-scale-in">
          <div className="flex items-center gap-3 mb-2">
            <Leaf className="h-5 w-5 text-green-500" />
            <h3 className="text-sm font-medium text-muted-foreground">Carbon Reduced</h3>
          </div>
          <p className="text-3xl font-bold text-foreground transition-all duration-500">
            {(impactData.carbon_reduced || 0).toFixed(2)} Tonnes CO2
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Equal to {(impactData.trees_equivalent || 0).toLocaleString()} trees planted
          </p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20 hover:shadow-lg transition-all duration-500 animate-scale-in">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle2 className="h-5 w-5 text-purple-500" />
            <h3 className="text-sm font-medium text-muted-foreground">System Uptime</h3>
          </div>
          <p className="text-3xl font-bold text-foreground transition-all duration-500">
            {(impactData.uptime || 0).toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
        </Card>
      </div>

      {/* Secondary Metrics - Hackathon Requirements */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-amber-500/10 to-amber-600/10 border-amber-500/30 hover:shadow-lg transition-all">
          <div className="flex items-center gap-2 mb-2">
            <PoundSterling className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded">P415</span>
          </div>
          <p className="text-2xl font-bold text-foreground">
            £{Math.round((impactData.cost_saved || 0) * 0.15).toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Flexibility Revenue</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 border-cyan-500/20 hover:shadow-lg transition-all">
          <div className="flex items-center gap-2 mb-2">
            <Briefcase className="h-4 w-4 text-cyan-500" />
            <h3 className="text-xs font-medium text-muted-foreground">Jobs Optimized</h3>
          </div>
          <p className="text-2xl font-bold text-foreground">450</p>
          <p className="text-xs text-muted-foreground mt-1">AI workloads managed</p>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20 hover:shadow-lg transition-all">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-red-500" />
            <h3 className="text-xs font-medium text-muted-foreground">Carbon Cap</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-bold text-foreground">171</p>
            <p className="text-sm text-muted-foreground">/ 150</p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-medium text-red-600 bg-red-500/20 px-2 py-0.5 rounded">Above Cap</span>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border-emerald-500/20 hover:shadow-lg transition-all">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Beckn Protocol</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">✓ Active</p>
          <p className="text-xs text-muted-foreground mt-1">8 windows discovered</p>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cost Savings Trend */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Cost Savings Trend (7 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData.costTrend || []}>
              <defs>
                <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="savings" 
                stroke="#10B981" 
                strokeWidth={2}
                fill="url(#costGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Carbon Intensity */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Carbon Intensity by Hour (Today)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData.carbonByHour.filter((_, i) => i % 3 === 0)} layout="vertical" margin={{ left: 10 }}>
              <XAxis type="number" domain={[0, 300]} stroke="#6B7280" fontSize={12} />
              <YAxis type="category" dataKey="hour" stroke="#6B7280" fontSize={10} width={50} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="carbon" radius={[0, 4, 4, 0]}>
                {chartData.carbonByHour.filter((_, i) => i % 3 === 0).map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.carbon > 200 ? '#EF4444' : entry.carbon > 100 ? '#F59E0B' : '#10B981'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Workload Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Workload Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData.workloadDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.workloadDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry: any) => `${value} (${entry.payload.value}%)`}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Energy Usage Pattern */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Energy Usage Pattern (24h)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData.energyPattern.filter((_, i) => i % 4 === 0)}>
              <defs>
                <linearGradient id="usageGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="hour" stroke="#6B7280" fontSize={12} />
              <YAxis stroke="#6B7280" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => [`${value.toFixed(1)} kWh`, 'Usage']}
              />
              <Area 
                type="monotone" 
                dataKey="usage" 
                stroke="#2563EB" 
                strokeWidth={2}
                fill="url(#usageGradient)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};
