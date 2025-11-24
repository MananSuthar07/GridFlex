import { useState, useEffect } from "react";
import { Activity, Wifi, WifiOff, Loader2, Clock, TrendingDown, Zap } from "lucide-react";
import type { BackendTimeline } from "@/services/api";

interface SidebarProps {
  isDemo: boolean;
  connectionState?: "connecting" | "connected" | "disconnected";
  currentCarbon?: number;
  currentPrice?: number;
  timeline?: BackendTimeline[];
}

export const Sidebar = ({ 
  isDemo, 
  connectionState = "disconnected",
  currentCarbon = 171,
  currentPrice = 0.08,
  timeline = []
}: SidebarProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastUpdated, setLastUpdated] = useState(2);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const updateTimer = setInterval(() => {
      setLastUpdated((prev) => (prev >= 60 ? 2 : prev + 1));
    }, 5000);

    return () => clearInterval(updateTimer);
  }, []);

  const activeAgents = isDemo ? Math.floor(Math.random() * 2) + 3 : 3;

  // Optimal window configuration
  const optimalWindow = {
    startHour: 14,
    endHour: 17,
    carbon: 95,
    price: 0.06,
    location: "Glasgow Afternoon"
  };

  // Calculate time status
  const getTimeStatus = () => {
    const now = currentTime.getHours() + currentTime.getMinutes() / 60;
    const { startHour, endHour } = optimalWindow;
    
    if (now >= startHour && now < endHour) {
      const remaining = endHour - now;
      return {
        status: "active",
        message: `Active NOW (${remaining.toFixed(1)}h remaining)`,
        badge: "Execute NOW"
      };
    } else if (now < startHour) {
      const hoursUntil = startHour - now;
      return {
        status: "waiting",
        message: `Starts in ${hoursUntil.toFixed(1)} hours`,
        badge: "Deferring..."
      };
    } else {
      const hoursUntilNext = (24 - now) + startHour;
      return {
        status: "passed",
        message: `Next window in ${hoursUntilNext.toFixed(1)}h`,
        badge: "Avoid - High carbon"
      };
    }
  };

  const timeStatus = getTimeStatus();

  // Calculate comparison metrics
  const carbonSavings = currentCarbon && optimalWindow.carbon 
    ? Math.round(((currentCarbon - optimalWindow.carbon) / currentCarbon) * 100)
    : 44;
  
  const costSavings = currentPrice && optimalWindow.price
    ? Math.round(((currentPrice - optimalWindow.price) / currentPrice) * 100)
    : 38;

  // Count queued workloads (deferred jobs)
  const queuedJobs = timeline.filter(job => job.deferred).length;

  // Calculate progress bar position
  const getProgressPosition = () => {
    const now = currentTime.getHours() + currentTime.getMinutes() / 60;
    const { startHour, endHour } = optimalWindow;
    
    if (now < startHour) {
      return (now / startHour) * 50; // 0-50% before window
    } else if (now >= startHour && now < endHour) {
      return 50 + ((now - startHour) / (endHour - startHour)) * 50; // 50-100% during window
    } else {
      return 100;
    }
  };

  return (
    <aside className="w-64 bg-secondary border-r border-border flex flex-col p-6">
      {/* Live Clock */}
      <div className="mb-8">
        <p className="text-sm text-muted-foreground mb-1">Current Time</p>
        <p className="text-2xl font-bold text-foreground tabular-nums">
          {currentTime.toLocaleTimeString('en-US', { hour12: false })}
        </p>
        <p className="text-xs text-muted-foreground">
          {currentTime.toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>
      </div>

      {/* Backend Connection */}
      <div className="mb-8">
        <p className="text-sm text-muted-foreground mb-3">Backend Status</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {connectionState === "connected" ? (
              <>
                <Wifi className="h-4 w-4 text-success" />
                <span className="text-sm font-semibold text-success">CONNECTED</span>
              </>
            ) : connectionState === "connecting" ? (
              <>
                <Loader2 className="h-4 w-4 text-warning animate-spin" />
                <span className="text-sm font-semibold text-warning">CONNECTING...</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-destructive" />
                <span className="text-sm font-semibold text-destructive">DISCONNECTED</span>
              </>
            )}
          </div>
          {connectionState === "connecting" && (
            <p className="text-xs text-muted-foreground">
              Backend starting up...
            </p>
          )}
        </div>
      </div>

      {/* System Status */}
      <div className="mb-8">
        <p className="text-sm text-muted-foreground mb-3">System Status</p>
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-3 h-3 bg-success rounded-full"></div>
            <div className="absolute inset-0 w-3 h-3 bg-success rounded-full animate-ping opacity-75"></div>
          </div>
          <span className="text-sm font-semibold text-success">OPERATIONAL</span>
        </div>
      </div>

      {/* Active Agents */}
      <div className="mb-8">
        <p className="text-sm text-muted-foreground mb-2">Active Agents</p>
        <div className="flex items-baseline gap-2">
          <p className="text-5xl font-bold text-foreground">{activeAgents}</p>
          <Activity className="h-6 w-6 text-primary" />
        </div>
      </div>

      {/* Beckn Integration - Enhanced */}
      <div className="mb-8 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
        <p className="text-sm text-muted-foreground mb-3">Beckn Integration</p>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">✓ Active</span>
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">8 energy windows</span> discovered
          </p>
          
          {/* Optimal Window - Dynamic */}
          <div className="mt-3 pt-3 border-t border-emerald-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Optimal Window:</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                timeStatus.status === "active" 
                  ? "bg-emerald-500/20 text-emerald-600" 
                  : timeStatus.status === "waiting"
                  ? "bg-orange-500/20 text-orange-600"
                  : "bg-red-500/20 text-red-600"
              }`}>
                {timeStatus.badge}
              </span>
            </div>
            
            <div>
              <p className="text-sm font-semibold text-foreground">{optimalWindow.location}</p>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{timeStatus.message}</p>
              </div>
            </div>

            {/* Comparison Metrics */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-emerald-500/5 rounded p-2">
                <div className="flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-emerald-600" />
                  <p className="text-xs font-semibold text-emerald-600">{carbonSavings}% cleaner</p>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{optimalWindow.carbon}g vs {currentCarbon}g</p>
              </div>
              <div className="bg-emerald-500/5 rounded p-2">
                <div className="flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-emerald-600" />
                  <p className="text-xs font-semibold text-emerald-600">{costSavings}% cheaper</p>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">£{optimalWindow.price.toFixed(2)} vs £{currentPrice.toFixed(2)}</p>
              </div>
            </div>

            {/* Queued Workloads */}
            <div className="bg-emerald-500/5 rounded p-2">
              <div className="flex items-center gap-2">
                <Zap className="h-3 w-3 text-emerald-600" />
                <p className="text-xs font-semibold text-foreground">{queuedJobs} jobs queued</p>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Waiting for this window</p>
            </div>

            {/* Visual Timeline */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>00:00</span>
                <span className="text-emerald-600 font-medium">14:00-17:00</span>
                <span>24:00</span>
              </div>
              <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="absolute top-0 left-[50%] w-[25%] h-full bg-emerald-500/30"
                  style={{ left: '58.3%', width: '12.5%' }}
                ></div>
                <div 
                  className="absolute top-0 left-0 h-full w-1 bg-primary transition-all"
                  style={{ left: `${getProgressPosition()}%` }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full border-2 border-background"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Last Updated */}
      <div className="mt-auto pt-6 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Last Updated: <span className="font-medium">{lastUpdated} sec ago</span>
        </p>
      </div>
    </aside>
  );
};
