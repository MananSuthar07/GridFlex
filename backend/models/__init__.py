"""
GridFlex Data Models
====================
Pydantic models for type safety, validation, and API documentation.
All models follow strict typing and include validation rules.

Author: GridFlex Team
Date: 2025-11-24
"""

from datetime import datetime
from enum import Enum
from typing import Dict, Optional

from pydantic import BaseModel, Field, field_validator


class AgentStatusEnum(str, Enum):
    """Enum for agent operational states."""
    ACTIVE = "active"
    IDLE = "idle"
    ERROR = "error"
    INITIALIZING = "initializing"


class JobPriorityEnum(str, Enum):
    """Enum for workload job priorities."""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class JobStatusEnum(str, Enum):
    """Enum for workload job execution states."""
    QUEUED = "queued"
    RUNNING = "running"
    DEFERRED = "deferred"
    COMPLETED = "completed"
    FAILED = "failed"


class OptimizationActionEnum(str, Enum):
    """Enum for optimization decision actions."""
    DEFER = "defer"
    EXECUTE_NOW = "execute_now"
    SHIFT_REGION = "shift_region"
    CANCEL = "cancel"


class AgentStatus(BaseModel):
    """
    Represents the current status and metrics of an agent.

    Attributes:
        name: Human-readable agent identifier
        status: Current operational state
        last_updated: Timestamp of last status update
        metrics: Agent-specific performance metrics
    """
    name: str = Field(..., description="Agent identifier", min_length=1)
    status: AgentStatusEnum = Field(..., description="Current agent state")
    last_updated: datetime = Field(
        default_factory=datetime.now,
        description="Last update timestamp"
    )
    metrics: Dict[str, float] = Field(
        default_factory=dict,
        description="Agent-specific metrics (e.g., jobs_monitored, decisions_made)"
    )

    class Config:
        """Pydantic configuration."""
        json_schema_extra = {
            "example": {
                "name": "Workload Intelligence Agent",
                "status": "active",
                "last_updated": "2025-11-24T10:30:00Z",
                "metrics": {
                    "jobs_monitored": 247,
                    "deferrable_jobs": 45,
                    "avg_response_time_ms": 150
                }
            }
        }


class WorkloadJob(BaseModel):
    """
    Represents an AI compute workload job.

    Attributes:
        job_id: Unique identifier for the job
        energy_required: Energy consumption in kilowatt-hours
        priority: Job execution priority level
        deferrable: Whether job can be delayed without SLA breach
        deadline: Optional hard deadline for completion
        current_status: Current execution state
    """
    job_id: str = Field(..., description="Unique job identifier", pattern=r"^job_\w+$")
    energy_required: float = Field(
        ...,
        description="Energy requirement in kWh",
        gt=0,
        le=1000
    )
    priority: JobPriorityEnum = Field(..., description="Job priority level")
    deferrable: bool = Field(..., description="Can job be deferred?")
    deadline: Optional[datetime] = Field(
        None,
        description="Hard deadline (None if flexible)"
    )
    current_status: JobStatusEnum = Field(
        default=JobStatusEnum.QUEUED,
        description="Current job state"
    )

    @field_validator('energy_required')
    @classmethod
    def validate_energy_positive(cls, value: float) -> float:
        """Ensure energy requirement is realistic."""
        if value <= 0:
            raise ValueError("Energy requirement must be positive")
        if value > 1000:
            raise ValueError("Energy requirement exceeds datacenter capacity (1000 kWh)")
        return value

    class Config:
        """Pydantic configuration."""
        json_schema_extra = {
            "example": {
                "job_id": "job_llm_training_001",
                "energy_required": 150.5,
                "priority": "medium",
                "deferrable": True,
                "deadline": None,
                "current_status": "queued"
            }
        }


class GridData(BaseModel):
    """
    Real-time energy grid data snapshot.

    Attributes:
        timestamp: Data collection timestamp
        carbon_intensity: Grid carbon intensity in grams CO2 per kWh
        energy_price: Current wholesale energy price in GBP per kWh
        renewable_percentage: Percentage of renewable energy in grid mix
    """
    timestamp: datetime = Field(
        default_factory=datetime.now,
        description="Data snapshot timestamp"
    )
    carbon_intensity: float = Field(
        ...,
        description="Carbon intensity (gCO2/kWh)",
        ge=0,
        le=1000
    )
    energy_price: float = Field(
        ...,
        description="Energy price (£/kWh)",
        ge=0,
        le=1.0
    )
    renewable_percentage: float = Field(
        ...,
        description="Renewable energy percentage",
        ge=0,
        le=100
    )

    @field_validator('carbon_intensity')
    @classmethod
    def validate_carbon_intensity(cls, value: float) -> float:
        """Validate carbon intensity is within realistic bounds."""
        if value < 0:
            raise ValueError("Carbon intensity cannot be negative")
        if value > 1000:
            raise ValueError("Carbon intensity exceeds realistic maximum")
        return value

    class Config:
        """Pydantic configuration."""
        json_schema_extra = {
            "example": {
                "timestamp": "2025-11-24T10:30:00Z",
                "carbon_intensity": 95.3,
                "energy_price": 0.08,
                "renewable_percentage": 42.5
            }
        }


class OptimizationDecision(BaseModel):
    """
    Represents an optimization decision made by the orchestrator.

    Attributes:
        decision_id: Unique decision identifier
        timestamp: When decision was made
        action: What action to take
        job_id: Target job for this decision
        reason: Human-readable explanation
        estimated_savings: Projected cost savings in GBP
        carbon_reduction: Projected carbon reduction in gCO2
    """
    decision_id: str = Field(..., description="Unique decision ID", pattern=r"^dec_\w+$")
    timestamp: datetime = Field(
        default_factory=datetime.now,
        description="Decision timestamp"
    )
    action: OptimizationActionEnum = Field(..., description="Optimization action")
    job_id: str = Field(..., description="Target job ID")
    reason: str = Field(
        ...,
        description="Decision rationale",
        min_length=10,
        max_length=500
    )
    estimated_savings: float = Field(
        ...,
        description="Estimated cost savings (£)",
        ge=0
    )
    carbon_reduction: float = Field(
        ...,
        description="Estimated carbon reduction (gCO2)",
        ge=0
    )

    class Config:
        """Pydantic configuration."""
        json_schema_extra = {
            "example": {
                "decision_id": "dec_20251124_001",
                "timestamp": "2025-11-24T10:30:00Z",
                "action": "defer",
                "job_id": "job_llm_training_001",
                "reason": "High carbon intensity detected (250 gCO2/kWh). Deferring to 02:00-06:00 window with <100 gCO2/kWh.",
                "estimated_savings": 12.50,
                "carbon_reduction": 150.75
            }
        }


class SystemMetrics(BaseModel):
    """
    Aggregated system-wide performance metrics.

    Attributes:
        total_cost_saved: Cumulative cost savings in GBP
        total_carbon_reduced: Cumulative carbon reduction in metric tons CO2
        jobs_optimized: Total number of optimized jobs
        uptime_percentage: System availability percentage
    """
    total_cost_saved: float = Field(
        ...,
        description="Total cost saved (£)",
        ge=0
    )
    total_carbon_reduced: float = Field(
        ...,
        description="Total carbon reduced (metric tons CO2)",
        ge=0
    )
    jobs_optimized: int = Field(
        ...,
        description="Total jobs optimized",
        ge=0
    )
    uptime_percentage: float = Field(
        ...,
        description="System uptime (%)",
        ge=0,
        le=100
    )

    class Config:
        """Pydantic configuration."""
        json_schema_extra = {
            "example": {
                "total_cost_saved": 45230.50,
                "total_carbon_reduced": 2.3,
                "jobs_optimized": 1847,
                "uptime_percentage": 99.94
            }
        }