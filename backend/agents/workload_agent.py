"""
Workload Intelligence Agent
============================
Monitors AI compute workloads and identifies optimization opportunities.
Forecasts demand, manages job queues, and calculates flexibility windows.

Key Responsibilities:
- Track GPU datacenter workload queues
- Forecast compute demand patterns
- Identify deferrable vs. time-critical jobs
- Calculate flexible execution windows
- Maintain SLA compliance constraints

Author: GridFlex Team
Date: 2025-11-24
"""

import logging
import random
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from enum import Enum

from pydantic import BaseModel, Field

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class WorkloadType(str, Enum):
    """Types of AI compute workloads."""
    LLM_TRAINING = "llm_training"
    IMAGE_TRAINING = "image_training"
    INFERENCE_BATCH = "inference_batch"
    INFERENCE_REALTIME = "inference_realtime"
    DATA_PROCESSING = "data_processing"
    MODEL_FINETUNING = "model_finetuning"


class WorkloadPriority(str, Enum):
    """Job priority levels."""
    CRITICAL = "critical"  # Cannot defer - real-time inference
    HIGH = "high"  # Important but can defer 1-2 hours
    MEDIUM = "medium"  # Standard training jobs - defer 4-8 hours
    LOW = "low"  # Batch jobs - defer 12-24 hours


class JobStatus(str, Enum):
    """Job execution states."""
    QUEUED = "queued"
    RUNNING = "running"
    DEFERRED = "deferred"
    COMPLETED = "completed"
    FAILED = "failed"


class WorkloadJob(BaseModel):
    """Represents a single AI compute workload job."""
    job_id: str = Field(default_factory=lambda: f"job_{uuid.uuid4().hex[:8]}")
    workload_type: WorkloadType
    priority: WorkloadPriority
    energy_required_kwh: float = Field(..., gt=0, le=1000)
    estimated_duration_hours: float = Field(..., gt=0, le=72)
    deadline: Optional[datetime] = None
    deferrable: bool = True
    max_deferral_hours: int = Field(default=4, ge=0, le=48)
    status: JobStatus = Field(default=JobStatus.QUEUED)
    created_at: datetime = Field(default_factory=datetime.now)
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        """Pydantic configuration."""
        json_schema_extra = {
            "example": {
                "job_id": "job_a3f8d2e1",
                "workload_type": "llm_training",
                "priority": "medium",
                "energy_required_kwh": 150.5,
                "estimated_duration_hours": 6.0,
                "deadline": None,
                "deferrable": True,
                "max_deferral_hours": 8,
                "status": "queued"
            }
        }


class DemandForecast(BaseModel):
    """Forecasted compute demand for future time windows."""
    timestamp: datetime
    forecasted_jobs: int
    forecasted_energy_kwh: float
    confidence_score: float = Field(ge=0, le=1)


class WorkloadIntelligenceAgent:
    """
    Agent responsible for workload monitoring and demand forecasting.

    This agent maintains the job queue, forecasts future demand, and
    identifies which workloads can be safely deferred for optimization.

    Attributes:
        agent_name: Unique identifier for this agent
        job_queue: Current queue of pending jobs
        running_jobs: Currently executing jobs
        completed_jobs: Historical completed jobs
        total_jobs_monitored: Lifetime job count
        total_energy_saved_kwh: Cumulative energy optimization
    """

    def __init__(self, agent_name: str = "Workload Intelligence Agent"):
        """
        Initialize the Workload Intelligence Agent.

        Args:
            agent_name: Human-readable agent identifier
        """
        self.agent_name = agent_name
        self.job_queue: List[WorkloadJob] = []
        self.running_jobs: List[WorkloadJob] = []
        self.completed_jobs: List[WorkloadJob] = []

        # Metrics
        self.total_jobs_monitored = 0
        self.total_energy_saved_kwh = 0.0

        logger.info(f"{self.agent_name} initialized")

    def generate_simulated_job(
            self,
            workload_type: Optional[WorkloadType] = None,
            priority: Optional[WorkloadPriority] = None
    ) -> WorkloadJob:
        """
        Generate a simulated AI workload job for demonstration.

        In production, this would connect to actual datacenter job schedulers
        like Kubernetes, Slurm, or Ray clusters.

        Args:
            workload_type: Type of workload (random if None)
            priority: Job priority (random if None)

        Returns:
            Simulated WorkloadJob
        """
        # Random workload type if not specified
        if workload_type is None:
            workload_type = random.choice(list(WorkloadType))

        # Priority based on workload type if not specified
        if priority is None:
            if workload_type == WorkloadType.INFERENCE_REALTIME:
                priority = WorkloadPriority.CRITICAL
            elif workload_type == WorkloadType.LLM_TRAINING:
                priority = random.choice([WorkloadPriority.MEDIUM, WorkloadPriority.HIGH])
            else:
                priority = random.choice(list(WorkloadPriority))

        # Energy requirements based on workload type
        energy_ranges = {
            WorkloadType.LLM_TRAINING: (100, 500),
            WorkloadType.IMAGE_TRAINING: (50, 200),
            WorkloadType.INFERENCE_BATCH: (10, 50),
            WorkloadType.INFERENCE_REALTIME: (1, 10),
            WorkloadType.DATA_PROCESSING: (20, 100),
            WorkloadType.MODEL_FINETUNING: (50, 150)
        }
        energy_min, energy_max = energy_ranges[workload_type]
        energy_required = round(random.uniform(energy_min, energy_max), 2)

        # Duration based on workload type
        duration_ranges = {
            WorkloadType.LLM_TRAINING: (4, 24),
            WorkloadType.IMAGE_TRAINING: (2, 12),
            WorkloadType.INFERENCE_BATCH: (0.5, 4),
            WorkloadType.INFERENCE_REALTIME: (0.1, 0.5),
            WorkloadType.DATA_PROCESSING: (1, 6),
            WorkloadType.MODEL_FINETUNING: (2, 8)
        }
        duration_min, duration_max = duration_ranges[workload_type]
        duration = round(random.uniform(duration_min, duration_max), 2)

        # Deferrable jobs and max deferral hours
        if priority == WorkloadPriority.CRITICAL:
            deferrable = False
            max_deferral = 0
        elif priority == WorkloadPriority.HIGH:
            deferrable = True
            max_deferral = random.randint(1, 4)
        elif priority == WorkloadPriority.MEDIUM:
            deferrable = True
            max_deferral = random.randint(4, 12)
        else:  # LOW
            deferrable = True
            max_deferral = random.randint(12, 24)

        # Some high priority jobs have deadlines
        deadline = None
        if priority in [WorkloadPriority.CRITICAL, WorkloadPriority.HIGH]:
            if random.random() < 0.3:  # 30% have deadlines
                deadline = datetime.now() + timedelta(hours=random.randint(2, 12))

        job = WorkloadJob(
            workload_type=workload_type,
            priority=priority,
            energy_required_kwh=energy_required,
            estimated_duration_hours=duration,
            deadline=deadline,
            deferrable=deferrable,
            max_deferral_hours=max_deferral
        )

        logger.debug(f"Generated job: {job.job_id} ({workload_type.value}, {priority.value})")
        return job

    def add_job_to_queue(self, job: WorkloadJob) -> bool:
        """
        Add a new job to the workload queue.

        Args:
            job: WorkloadJob to add

        Returns:
            True if added successfully
        """
        self.job_queue.append(job)
        self.total_jobs_monitored += 1

        logger.info(
            f"Job {job.job_id} added to queue - "
            f"Type: {job.workload_type.value}, "
            f"Priority: {job.priority.value}, "
            f"Energy: {job.energy_required_kwh} kWh, "
            f"Deferrable: {job.deferrable}"
        )

        return True

    def populate_demo_queue(self, num_jobs: int = 10) -> None:
        """
        Populate queue with simulated jobs for demo purposes.

        Args:
            num_jobs: Number of jobs to generate
        """
        logger.info(f"Populating queue with {num_jobs} demo jobs...")

        for _ in range(num_jobs):
            job = self.generate_simulated_job()
            self.add_job_to_queue(job)

        logger.info(f"Queue populated with {num_jobs} jobs")

    def get_deferrable_jobs(self) -> List[WorkloadJob]:
        """
        Identify jobs that can be deferred for optimization.

        Returns:
            List of deferrable jobs from queue
        """
        deferrable = [job for job in self.job_queue if job.deferrable]

        logger.info(
            f"Found {len(deferrable)} deferrable jobs out of {len(self.job_queue)} total"
        )

        return deferrable

    def get_critical_jobs(self) -> List[WorkloadJob]:
        """
        Get jobs that must execute immediately (cannot defer).

        Returns:
            List of critical/non-deferrable jobs
        """
        critical = [
            job for job in self.job_queue
            if not job.deferrable or job.priority == WorkloadPriority.CRITICAL
        ]

        return critical

    def calculate_queue_energy_demand(self) -> float:
        """
        Calculate total energy demand of queued jobs.

        Returns:
            Total energy required (kWh)
        """
        total_energy = sum(job.energy_required_kwh for job in self.job_queue)
        return round(total_energy, 2)

    def forecast_demand(self, hours_ahead: int = 24) -> List[DemandForecast]:
        """
        Forecast compute demand for upcoming time windows.

        In production, this would use LSTM/Prophet models trained on
        historical datacenter workload patterns.

        For prototype, we simulate realistic demand curves:
        - Higher during business hours (9am-6pm)
        - Lower at night (12am-6am)
        - Medium during off-peak (6pm-12am, 6am-9am)

        Args:
            hours_ahead: Hours to forecast into future

        Returns:
            List of demand forecasts by hour
        """
        forecasts = []
        current_time = datetime.now()

        for hour_offset in range(hours_ahead):
            forecast_time = current_time + timedelta(hours=hour_offset)
            hour_of_day = forecast_time.hour

            # Simulate realistic demand patterns
            if 9 <= hour_of_day <= 18:
                # Business hours - high demand
                base_jobs = random.randint(15, 25)
                base_energy = random.uniform(800, 1200)
                confidence = 0.85
            elif 0 <= hour_of_day <= 6:
                # Night hours - low demand (ideal for deferred jobs!)
                base_jobs = random.randint(5, 10)
                base_energy = random.uniform(200, 400)
                confidence = 0.90
            else:
                # Off-peak - moderate demand
                base_jobs = random.randint(10, 15)
                base_energy = random.uniform(400, 700)
                confidence = 0.80

            forecast = DemandForecast(
                timestamp=forecast_time,
                forecasted_jobs=base_jobs,
                forecasted_energy_kwh=round(base_energy, 2),
                confidence_score=confidence
            )
            forecasts.append(forecast)

        logger.info(f"Generated {len(forecasts)} hour demand forecast")
        return forecasts

    def identify_optimal_execution_window(
            self,
            job: WorkloadJob
    ) -> Optional[datetime]:
        """
        Identify optimal time window to execute a deferrable job.

        This considers:
        - Job's max deferral constraint
        - Forecasted demand (prefer low-demand windows)
        - Job deadline (if any)

        Args:
            job: WorkloadJob to schedule

        Returns:
            Recommended execution start time, or None if should execute now
        """
        if not job.deferrable:
            return None  # Execute immediately

        # Get demand forecast
        forecast = self.forecast_demand(hours_ahead=job.max_deferral_hours)

        # Find lowest demand window within deferral constraint
        min_demand_slot = min(forecast, key=lambda f: f.forecasted_energy_kwh)

        # Check if deferring saves significant energy opportunity
        current_demand = forecast[0].forecasted_energy_kwh
        optimal_demand = min_demand_slot.forecasted_energy_kwh

        if optimal_demand < current_demand * 0.7:  # 30% lower demand
            logger.info(
                f"Job {job.job_id}: Optimal window found at {min_demand_slot.timestamp} "
                f"(demand: {optimal_demand} vs current: {current_demand})"
            )
            return min_demand_slot.timestamp

        # No significant benefit from deferring
        return None

    def get_queue_statistics(self) -> Dict:
        """
        Get comprehensive queue statistics for monitoring.

        Returns:
            Dict with queue metrics and breakdown
        """
        total_jobs = len(self.job_queue)
        deferrable_count = len(self.get_deferrable_jobs())
        critical_count = len(self.get_critical_jobs())
        total_energy = self.calculate_queue_energy_demand()

        # Breakdown by priority
        priority_breakdown = {
            priority.value: len([j for j in self.job_queue if j.priority == priority])
            for priority in WorkloadPriority
        }

        # Breakdown by type
        type_breakdown = {
            wtype.value: len([j for j in self.job_queue if j.workload_type == wtype])
            for wtype in WorkloadType
        }

        return {
            "total_jobs": total_jobs,
            "deferrable_jobs": deferrable_count,
            "critical_jobs": critical_count,
            "total_energy_kwh": total_energy,
            "running_jobs": len(self.running_jobs),
            "completed_jobs": len(self.completed_jobs),
            "priority_breakdown": priority_breakdown,
            "type_breakdown": type_breakdown,
            "total_monitored_lifetime": self.total_jobs_monitored
        }

    def get_status(self) -> Dict:
        """
        Get agent status for monitoring dashboard.

        Returns:
            Dict with agent status and metrics
        """
        stats = self.get_queue_statistics()

        return {
            "name": self.agent_name,
            "status": "active",
            "last_updated": datetime.now().isoformat(),
            "metrics": {
                "jobs_monitored": stats["total_jobs"],
                "deferrable_jobs": stats["deferrable_jobs"],
                "critical_jobs": stats["critical_jobs"],
                "total_energy_demand_kwh": stats["total_energy_kwh"],
                "running_jobs": stats["running_jobs"],
                "completed_jobs": stats["completed_jobs"],
                "avg_response_time_ms": random.randint(100, 300)  # Simulated
            }
        }


# Example usage and testing
if __name__ == "__main__":
    """Test the Workload Intelligence Agent."""

    print("=" * 60)
    print("GridFlex - Workload Intelligence Agent Test")
    print("=" * 60)

    # Initialize agent
    agent = WorkloadIntelligenceAgent()

    # Populate with demo jobs
    print("\n📋 Populating job queue with simulated workloads...")
    agent.populate_demo_queue(num_jobs=15)

    # Get queue statistics
    print(f"\n📊 Queue Statistics:")
    stats = agent.get_queue_statistics()
    print(f"   Total Jobs: {stats['total_jobs']}")
    print(f"   Deferrable: {stats['deferrable_jobs']}")
    print(f"   Critical: {stats['critical_jobs']}")
    print(f"   Total Energy Demand: {stats['total_energy_kwh']} kWh")

    # Show deferrable jobs
    print(f"\n✅ Deferrable Jobs:")
    deferrable = agent.get_deferrable_jobs()
    for job in deferrable[:5]:  # Show first 5
        print(f"   - {job.job_id}: {job.workload_type.value} "
              f"({job.energy_required_kwh} kWh, defer up to {job.max_deferral_hours}h)")

    # Forecast demand
    print(f"\n🔮 Demand Forecast (next 6 hours):")
    forecast = agent.forecast_demand(hours_ahead=6)
    for f in forecast:
        print(f"   {f.timestamp.strftime('%H:%M')}: "
              f"{f.forecasted_jobs} jobs, {f.forecasted_energy_kwh} kWh "
              f"(confidence: {f.confidence_score:.0%})")

    # Find optimal windows for deferrable jobs
    print(f"\n🎯 Optimal Execution Windows:")
    for job in deferrable[:3]:  # Test first 3 deferrable jobs
        optimal_time = agent.identify_optimal_execution_window(job)
        if optimal_time:
            print(f"   Job {job.job_id}: Defer to {optimal_time.strftime('%H:%M')} "
                  f"(saves energy)")
        else:
            print(f"   Job {job.job_id}: Execute now (no benefit from deferring)")

    # Get agent status
    print(f"\n📈 Agent Status:")
    status = agent.get_status()
    print(f"   Name: {status['name']}")
    print(f"   Status: {status['status']}")
    print(f"   Metrics: {status['metrics']}")

    print("\n" + "=" * 60)