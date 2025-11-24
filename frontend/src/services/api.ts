const API_BASE_URL = 'https://gridflex-backend-152882144214.europe-west2.run.app';

export interface BackendAgent {
  jobs_monitored: number;
  deferrable: number;
  efficiency: number;
  carbon_intensity: number;
  energy_price: number;
  decisions_per_min: number;
  response_time: string; // Backend returns formatted string like "2.8min"
  queue_size: number;
}

export interface BackendTimeline {
  id: string;
  type: string;
  start_hour: number;
  duration: number;
  energy_kwh: number;
  deferred: boolean;
}

export interface BackendDecision {
  timestamp: string;
  agent: string;
  action: string;
  status: string;
  cost_savings_gbp?: number;
  carbon_reduction_kg?: number;
}

export interface BackendCharts {
  cost_trend_7days: { day: string; savings: number }[];
  carbon_by_hour: { hour: string; carbon: number }[];
  workload_distribution: { training: number; inference: number; processing: number };
  energy_pattern_24h: { hour: number; usage: number }[];
}

export interface BackendResponse {
  agents: {
    workload: BackendAgent;
    grid: BackendAgent;
    orchestrator: BackendAgent;
  };
  optimization: {
    timeline: BackendTimeline[];
    recent_decisions: BackendDecision[];
    daily_cost_comparison: {
      without_gridflex: number;
      with_gridflex: number;
      savings_percent: number;
    };
    daily_carbon_comparison: {
      without_gridflex_kg: number;
      with_gridflex_kg: number;
      reduction_percent: number;
    };
  };
  impact: {
    total_cost_saved_gbp: number;
    total_carbon_reduced_tonnes: number;
    system_uptime_percent: number;
    trees_equivalent: number;
  };
  charts: BackendCharts;
  timestamp: string;
}

export interface DemoResponse {
  success: boolean;
  data?: BackendResponse;
  message?: string;
}

export interface ConnectionStatus {
  connected: boolean;
  latency?: number;
  error?: string;
}

export const testConnection = async (): Promise<ConnectionStatus> => {
  const startTime = Date.now();
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });
    
    const latency = Date.now() - startTime;
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return {
      connected: true,
      latency,
    };
  } catch (error) {
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

const fetchWithRetry = async (url: string, retryCount = 0): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError' && retryCount === 0) {
      console.log('⏱️ Timeout - Backend cold start detected. Retrying in 5 seconds...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      return fetchWithRetry(url, retryCount + 1);
    }
    
    throw error;
  }
};

export const generateDemo = async (): Promise<DemoResponse> => {
  try {
    console.log('🔄 Fetching from backend...');
    const response = await fetchWithRetry(`${API_BASE_URL}/demo/generate`);
    
    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }
    
    const rawData = await response.json();
    console.log('✅ Backend response received successfully');
    
    // Handle different response formats
    // If backend returns { status: "success", agents: {...}, ... }
    if (rawData.status === "success" || rawData.agents) {
      return {
        success: true,
        data: {
          agents: rawData.agents,
          optimization: rawData.optimization,
          impact: rawData.impact,
          charts: rawData.charts,
          timestamp: rawData.timestamp || new Date().toISOString(),
        }
      };
    }
    
    // If backend already returns { success: true, data: {...} }
    if (rawData.success && rawData.data) {
      return rawData;
    }
    
    // Fallback: assume the entire response is the data
    return {
      success: true,
      data: rawData as BackendResponse,
    };
    
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('❌ Backend timeout after retry');
      throw new Error('Backend timeout - cold start taking too long');
    }
    console.error('❌ API Error:', error);
    throw error;
  }
};
