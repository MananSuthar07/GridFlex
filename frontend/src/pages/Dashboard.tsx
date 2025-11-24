import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { AgentStatus } from "@/components/dashboard/AgentStatus";
import { Optimization } from "@/components/dashboard/Optimization";
import { Impact } from "@/components/dashboard/Impact";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Github, RefreshCw } from "lucide-react";
import { generateDemo } from "@/services/api";
import { mapBackendToAgentData, mapBackendToImpactData, mapBackendToOptimizationData, mapBackendToCharts } from "@/services/dataMapper";
import type { BackendResponse } from "@/services/api";
import gridflexLogo from "@/assets/gridflex-logo.jpeg";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("agents");
  const [backendData, setBackendData] = useState<BackendResponse | null>(null);
  const [lastUpdated, setLastUpdated] = useState(0);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [connectionState, setConnectionState] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [highlightState, setHighlightState] = useState({
    workload: false,
    grid: false,
    orchestrator: false,
  });

  // Fetch data from backend
  const fetchData = async (isInitial = false) => {
    if (isInitial) {
      setConnectionState("connecting");
    }
    
    try {
      const response = await generateDemo();
      
      if (response.success && response.data) {
        setBackendData(response.data);
        setLastUpdated(0);
        setConnectionState("connected");
        
        if (isInitial) {
          setIsLoadingInitial(false);
          toast.success("Dashboard connected to backend", { duration: 2000 });
        }
      } else {
        console.error('Invalid response format:', response);
        throw new Error(response.message || "Failed to fetch data");
      }
    } catch (error) {
      console.error("Failed to fetch backend data:", error);
      setConnectionState("disconnected");
      
      if (isInitial) {
        setIsLoadingInitial(false);
        toast.error("⚠️ Backend connection failed", {
          duration: 5000,
        });
      } else if (!backendData) {
        console.warn('No cached data available');
      }
    }
  };

  // Initial data fetch on mount
  useEffect(() => {
    fetchData(true);
  }, []);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 5000);

    return () => clearInterval(interval);
  }, [backendData]);

  // Last updated counter
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const runDemo = async () => {
    setIsLoadingDemo(true);
    const loadingToast = toast.loading("Running demo...");

    try {
      const response = await generateDemo();
      
      if (response.success && response.data) {
        // Update data immediately
        setBackendData(response.data);
        setLastUpdated(0);
        setConnectionState("connected");
        
        // Show success and highlight all agents
        toast.success("🎯 Demo Generated - Optimization Complete", { id: loadingToast });
        
        // Pulse all agent cards
        setHighlightState({ workload: true, grid: true, orchestrator: true });
        
        setTimeout(() => {
          setHighlightState({ workload: false, grid: false, orchestrator: false });
        }, 1500);
        
        // Auto-switch to Impact tab after 2 seconds
        setTimeout(() => {
          setActiveTab("impact");
          
          // Flash hero metrics
          if (response.data.impact) {
            const impactData = mapBackendToImpactData(response.data);
            
            // Show final success toast
            setTimeout(() => {
              toast.success(
                `✓ Saved £${impactData.cost_saved.toLocaleString()}, reduced ${impactData.carbon_reduced} tonnes CO2`,
                { duration: 5000 }
              );
            }, 500);
          }
        }, 2000);
        
        setIsLoadingDemo(false);
      } else {
        console.error('Invalid demo response:', response);
        throw new Error(response.message || "Failed to generate demo");
      }
    } catch (error) {
      console.error("Demo generation failed:", error);
      toast.error("⚠️ Backend connection failed - Check console for details", { id: loadingToast });
      setIsLoadingDemo(false);
    }
  };

  // Map backend data for components with safe checks
  const agentData = backendData && backendData.agents ? mapBackendToAgentData(backendData) : null;
  const impactData = backendData && backendData.impact ? mapBackendToImpactData(backendData) : null;
  const optimizationData = backendData && backendData.optimization ? mapBackendToOptimizationData(backendData) : null;
  const chartData = backendData && backendData.charts ? mapBackendToCharts(backendData) : null;

  if (isLoadingInitial) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <RefreshCw className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading GridFlex Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Sidebar */}
      <Sidebar 
        isDemo={false} 
        connectionState={connectionState}
        currentCarbon={backendData?.agents.grid.carbon_intensity}
        currentPrice={backendData?.agents.grid.energy_price}
        timeline={backendData?.optimization.timeline}
      />

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b bg-card">
            <div className="container mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src={gridflexLogo} 
                    alt="GridFlex Logo" 
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">GridFlex</h1>
                    <p className="text-xs text-muted-foreground">Intelligent Compute-Energy Convergence</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-6">
                  <TabsList>
                    <TabsTrigger value="agents">Agent Status</TabsTrigger>
                    <TabsTrigger value="optimization">Optimization</TabsTrigger>
                    <TabsTrigger value="impact">Impact</TabsTrigger>
                  </TabsList>
                  
                  <Button onClick={runDemo} disabled={isLoadingDemo} size="lg">
                    {isLoadingDemo ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Running...
                      </>
                    ) : (
                      "Run Demo"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Dashboard Content */}
          <main className="container mx-auto p-6 flex-1">
            <TabsContent value="agents" className="mt-0">
              {agentData ? (
                <AgentStatus
                  agentData={agentData}
                  highlightState={highlightState}
                />
              ) : (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-foreground">Agent Status</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-[400px] bg-card rounded-lg border animate-pulse">
                        <div className="p-6 space-y-4">
                          <div className="h-6 bg-muted rounded w-3/4"></div>
                          <div className="h-4 bg-muted rounded w-1/2"></div>
                          <div className="h-32 bg-muted rounded mt-8"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-center text-muted-foreground">Loading agent data...</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="optimization" className="mt-0">
              {optimizationData ? (
                <Optimization optimizationData={optimizationData} />
              ) : (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-foreground">Real-Time Optimization View</h2>
                  <div className="h-64 bg-card rounded-lg border animate-pulse"></div>
                  <p className="text-center text-muted-foreground">Loading optimization data...</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="impact" className="mt-0">
              {impactData && chartData ? (
                <Impact impactData={impactData} chartData={chartData} />
              ) : (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-foreground">Impact Dashboard</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-32 bg-card rounded-lg border animate-pulse"></div>
                    ))}
                  </div>
                  <p className="text-center text-muted-foreground">Loading impact metrics...</p>
                </div>
              )}
            </TabsContent>
          </main>

          {/* Footer */}
          <footer className="border-t bg-card mt-auto">
            <div className="container mx-auto px-6 py-4">
              <div className="flex items-center justify-center text-sm text-muted-foreground relative">
                <div className="flex flex-col gap-1 items-center text-center">
                  <p className="font-semibold text-foreground">Intelligent Compute-Energy Convergence Platform</p>
                  <p>Built for DEG Hackathon 2025 | London</p>
                  <div className="flex items-center gap-2 flex-wrap justify-center">
                    <span>Created by</span>
                    <a 
                      href="https://www.linkedin.com/in/meetbhorania/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium"
                    >
                      Meet Bhorania
                    </a>
                    <span>&</span>
                    <a 
                      href="https://www.linkedin.com/in/manansuthar/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-medium"
                    >
                      Manan Suthar
                    </a>
                  </div>
                </div>
                <a 
                  href="https://github.com/MananSuthar07/GridFlex.git" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-foreground transition-colors absolute right-0"
                >
                  <Github className="h-4 w-4" />
                  <span className="hidden sm:inline">GitHub</span>
                </a>
              </div>
            </div>
          </footer>
        </div>
      </Tabs>
    </div>
  );
};

export default Dashboard;
