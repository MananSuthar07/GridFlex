"""
GridFlex Backend API
====================
FastAPI backend that orchestrates the three-agent system.
Provides REST endpoints for dashboard, demo triggers, and system monitoring.

Endpoints:
- GET /health - Health check
- GET /agents/status - Status of all 3 agents
- GET /grid/current - Current grid market conditions
- GET /workload/queue - Current workload queue
- POST /optimize - Trigger optimization for queue
- GET /metrics/system - System-wide performance metrics
- GET /decisions/recent - Recent optimization decisions
- POST /demo/trigger - Trigger demo flow with simulated jobs

Author: GridFlex Team
Date: 2025-11-24
"""

import logging
from datetime import datetime
from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Import our agents
from agents.workload_agent import WorkloadIntelligenceAgent, WorkloadType, WorkloadPriority
from agents.grid_agent import GridMarketAgent
from agents.orchestrator_agent import OrchestratorAgent

# Import Beckn client
from beckn_client import BecknClient

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="GridFlex API",
    description="Intelligent Compute-Energy Convergence Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware - allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to specific domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize agents globally (single instance for demo)
workload_agent = WorkloadIntelligenceAgent()
grid_agent = GridMarketAgent()
orchestrator = OrchestratorAgent()
beckn_client = BecknClient()

logger.info("GridFlex agents initialized successfully")


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    timestamp: datetime
    version: str
    agents_online: int


class OptimizeRequest(BaseModel):
    """Request to trigger optimization."""
    job_ids: Optional[List[str]] = Field(
        None,
        description="Specific job IDs to optimize (None = optimize entire queue)"
    )


class DemoTriggerRequest(BaseModel):
    """Request to trigger demo flow."""
    num_jobs: int = Field(
        default=10,
        ge=1,
        le=50,
        description="Number of demo jobs to generate"
    )
    include_critical: bool = Field(
        default=True,
        description="Include critical priority jobs"
    )


# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/", tags=["System"])
async def root():
    """Root endpoint - API information."""
    return {
        "service": "GridFlex API",
        "version": "1.0.0",
        "description": "Intelligent Compute-Energy Convergence Platform",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """
    Health check endpoint.
    Returns system status and agent availability.
    """
    agents_online = 3  # All 3 agents initialized

    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(),
        version="1.0.0",
        agents_online=agents_online
    )


@app.get("/agents/status", tags=["Agents"])
async def get_agents_status():
    """
    Get status of all three agents.
    Returns current state, metrics, and last update time.
    """
    try:
        workload_status = workload_agent.get_status()
        grid_status = grid_agent.get_status()
        orchestrator_status = orchestrator.get_status()

        return {
            "timestamp": datetime.now().isoformat(),
            "agents": {
                "workload_intelligence": workload_status,
                "grid_market": grid_status,
                "orchestrator": orchestrator_status
            }
        }
    except Exception as e:
        logger.error(f"Error getting agent status: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/grid/current", tags=["Grid Market"])
async def get_current_grid_conditions():
    """
    Get current energy grid market conditions.
    Includes real UK carbon intensity, simulated pricing, and market assessment.
    """
    try:
        conditions = grid_agent.get_current_conditions()

        if not conditions:
            raise HTTPException(
                status_code=503,
                detail="Unable to fetch grid conditions"
            )

        return {
            "timestamp": conditions.timestamp.isoformat(),
            "carbon_intensity_gco2_kwh": conditions.carbon_intensity,
            "energy_price_gbp_kwh": conditions.energy_price,
            "renewable_percentage": conditions.renewable_percentage,
            "forecast_next_hour": conditions.forecast_next_hour,
            "market_condition": conditions.market_condition.value,
            "execution_recommended": grid_agent.should_execute_now()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching grid conditions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/workload/queue", tags=["Workload"])
async def get_workload_queue():
    """
    Get current workload queue with job details.
    Returns all queued, running, and completed jobs.
    """
    try:
        stats = workload_agent.get_queue_statistics()

        # Convert jobs to dicts for JSON serialization
        queued_jobs = [
            {
                "job_id": job.job_id,
                "workload_type": job.workload_type.value,
                "priority": job.priority.value,
                "energy_required_kwh": job.energy_required_kwh,
                "estimated_duration_hours": job.estimated_duration_hours,
                "deferrable": job.deferrable,
                "max_deferral_hours": job.max_deferral_hours,
                "status": job.status.value,
                "created_at": job.created_at.isoformat()
            }
            for job in workload_agent.job_queue
        ]

        return {
            "timestamp": datetime.now().isoformat(),
            "statistics": stats,
            "queued_jobs": queued_jobs,
            "deferrable_count": len(workload_agent.get_deferrable_jobs()),
            "critical_count": len(workload_agent.get_critical_jobs())
        }
    except Exception as e:
        logger.error(f"Error fetching workload queue: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/optimize", tags=["Optimization"])
async def optimize_workload_queue(request: OptimizeRequest = None):
    """
    Trigger optimization for workload queue.
    Analyzes current grid conditions and makes scheduling decisions.
    """
    try:
        # Get current grid conditions
        grid_data = grid_agent.get_current_conditions()
        if not grid_data:
            raise HTTPException(
                status_code=503,
                detail="Cannot optimize - grid data unavailable"
            )

        # Get jobs to optimize
        if request and request.job_ids:
            # Optimize specific jobs
            jobs_to_optimize = [
                job for job in workload_agent.job_queue
                if job.job_id in request.job_ids
            ]
        else:
            # Optimize entire queue
            jobs_to_optimize = workload_agent.job_queue

        if not jobs_to_optimize:
            return {
                "message": "No jobs to optimize",
                "decisions": [],
                "summary": {
                    "total_jobs": 0,
                    "executed_immediately": 0,
                    "deferred": 0,
                    "cost_saved_gbp": 0.0,
                    "carbon_reduced_kg": 0.0
                }
            }

        # Convert jobs to dicts for orchestrator
        jobs_dict = [
            {
                "job_id": job.job_id,
                "energy_required_kwh": job.energy_required_kwh,
                "deferrable": job.deferrable,
                "max_deferral_hours": job.max_deferral_hours,
                "priority": job.priority.value
            }
            for job in jobs_to_optimize
        ]

        # Get grid conditions as dict
        grid_dict = {
            "carbon_intensity": grid_data.carbon_intensity,
            "energy_price": grid_data.energy_price,
            "forecast_next_hour": grid_data.forecast_next_hour
        }

        # Make optimization decisions
        decisions = orchestrator.optimize_job_queue(jobs_dict, grid_dict)

        # Format decisions for response
        decisions_response = [
            {
                "decision_id": d.decision_id,
                "timestamp": d.timestamp.isoformat(),
                "job_id": d.job_id,
                "action": d.action.value,
                "rationale": d.rationale.value,
                "explanation": d.explanation,
                "estimated_cost_savings_gbp": d.estimated_cost_savings_gbp,
                "estimated_carbon_reduction_kg": d.estimated_carbon_reduction_gco2 / 1000,
                "defer_until": d.defer_until.isoformat() if d.defer_until else None
            }
            for d in decisions
        ]

        # Summary
        execute_count = sum(1 for d in decisions if d.action.value == "execute_now")
        defer_count = sum(1 for d in decisions if d.action.value == "defer")
        total_cost = sum(d.estimated_cost_savings_gbp for d in decisions)
        total_carbon = sum(d.estimated_carbon_reduction_gco2 for d in decisions) / 1000

        logger.info(
            f"Optimization complete: {len(decisions)} decisions made, "
            f"£{total_cost:.2f} saved, {total_carbon:.1f} kgCO2 reduced"
        )

        return {
            "message": "Optimization complete",
            "decisions": decisions_response,
            "summary": {
                "total_jobs": len(decisions),
                "executed_immediately": execute_count,
                "deferred": defer_count,
                "cost_saved_gbp": round(total_cost, 2),
                "carbon_reduced_kg": round(total_carbon, 2)
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during optimization: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/metrics/system", tags=["Metrics"])
async def get_system_metrics():
    """
    Get comprehensive system-wide metrics.
    Aggregates data from all agents for dashboard display.
    """
    try:
        orchestrator_status = orchestrator.get_status()
        workload_stats = workload_agent.get_queue_statistics()
        grid_conditions = grid_agent.get_current_conditions()

        return {
            "timestamp": datetime.now().isoformat(),
            "optimization": {
                "total_cost_saved_gbp": orchestrator_status["metrics"]["total_cost_saved_gbp"],
                "total_carbon_reduced_kg": orchestrator_status["metrics"]["total_carbon_reduced_kg"],
                "jobs_optimized": orchestrator_status["metrics"]["decisions_made"],
                "avg_decision_time_ms": orchestrator_status["metrics"]["avg_decision_time_ms"],
                "sla_compliance_rate": orchestrator_status["metrics"]["sla_compliance_rate"]
            },
            "workload": {
                "total_jobs_monitored": workload_stats["total_monitored_lifetime"],
                "current_queue_size": workload_stats["total_jobs"],
                "deferrable_jobs": workload_stats["deferrable_jobs"],
                "total_energy_demand_kwh": workload_stats["total_energy_kwh"]
            },
            "grid": {
                "current_carbon_intensity": grid_conditions.carbon_intensity if grid_conditions else None,
                "current_price": grid_conditions.energy_price if grid_conditions else None,
                "renewable_percentage": grid_conditions.renewable_percentage if grid_conditions else None
            },
            "uptime_percentage": 99.9  # Simulated - would track actual uptime
        }

    except Exception as e:
        logger.error(f"Error fetching system metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/decisions/recent", tags=["Optimization"])
async def get_recent_decisions(limit: int = 10):
    """
    Get recent optimization decisions.
    For displaying in dashboard decision feed.
    """
    try:
        decisions = orchestrator.get_recent_decisions(limit=limit)
        return {
            "timestamp": datetime.now().isoformat(),
            "count": len(decisions),
            "decisions": decisions
        }
    except Exception as e:
        logger.error(f"Error fetching recent decisions: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/demo/trigger", tags=["Demo"])
async def trigger_demo_flow(request: DemoTriggerRequest = DemoTriggerRequest()):
    """
    Trigger complete demo flow.
    Generates simulated jobs, optimizes them, and returns results.
    Perfect for live demonstrations.
    """
    try:
        logger.info(f"Demo triggered: generating {request.num_jobs} jobs")

        # Clear existing queue for clean demo
        workload_agent.job_queue.clear()

        # Generate demo jobs
        workload_agent.populate_demo_queue(num_jobs=request.num_jobs)

        # Get current grid conditions
        grid_data = grid_agent.get_current_conditions()

        # Trigger optimization
        jobs_dict = [
            {
                "job_id": job.job_id,
                "energy_required_kwh": job.energy_required_kwh,
                "deferrable": job.deferrable,
                "max_deferral_hours": job.max_deferral_hours,
                "priority": job.priority.value
            }
            for job in workload_agent.job_queue
        ]

        grid_dict = {
            "carbon_intensity": grid_data.carbon_intensity,
            "energy_price": grid_data.energy_price,
            "forecast_next_hour": grid_data.forecast_next_hour
        }

        decisions = orchestrator.optimize_job_queue(jobs_dict, grid_dict)

        # Return comprehensive demo results
        return {
            "message": "Demo flow completed successfully",
            "jobs_generated": len(workload_agent.job_queue),
            "grid_conditions": {
                "carbon_intensity": grid_data.carbon_intensity,
                "energy_price": grid_data.energy_price,
                "market_condition": grid_data.market_condition.value
            },
            "optimization_summary": {
                "decisions_made": len(decisions),
                "executed_immediately": sum(1 for d in decisions if d.action.value == "execute_now"),
                "deferred": sum(1 for d in decisions if d.action.value == "defer"),
                "total_cost_saved_gbp": round(sum(d.estimated_cost_savings_gbp for d in decisions), 2),
                "total_carbon_reduced_kg": round(sum(d.estimated_carbon_reduction_gco2 for d in decisions) / 1000, 2)
            },
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Error in demo flow: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# STARTUP/SHUTDOWN EVENTS
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize system on startup."""
    logger.info("=" * 60)
    logger.info("GridFlex Backend Starting...")
    logger.info("=" * 60)
    logger.info("Initializing agents...")

    # Populate with some initial demo data
    workload_agent.populate_demo_queue(num_jobs=5)

    logger.info("GridFlex Backend Ready!")
    logger.info(f"API Docs: http://localhost:8000/docs")
    logger.info("=" * 60)


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    logger.info("GridFlex Backend Shutting Down...")


@app.post("/beckn/execute-journey", tags=["Beckn Protocol"])
async def execute_beckn_journey(
        carbon_threshold: float = 200.0,
        renewable_min: float = 70.0,
        workload_energy_kwh: float = 150.0
):
    """
    Execute complete Beckn protocol journey.
    Demonstrates full discover→select→init→confirm workflow.
    """
    try:
        logger.info("Executing Beckn journey via API...")

        result = beckn_client.execute_full_journey(
            carbon_threshold=carbon_threshold,
            renewable_min=renewable_min,
            workload_energy_kwh=workload_energy_kwh
        )

        if not result:
            raise HTTPException(
                status_code=500,
                detail="Beckn journey failed"
            )

        return {
            "status": "success",
            "message": "Beckn journey completed successfully",
            "order_id": result.get("message", {}).get("order", {}).get("id"),
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Error in Beckn journey: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# RUN SERVER (for local testing)
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Auto-reload on code changes
        log_level="info"
    )