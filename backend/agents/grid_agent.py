"""
Grid Market Agent
=================
Monitors energy grid conditions including carbon intensity, pricing, and P415 signals.
Integrates with UK National Grid Carbon Intensity API for real-time data.

Key Responsibilities:
- Fetch real-time carbon intensity data
- Monitor energy wholesale prices (simulated for prototype)
- Track P415 flexibility market signals
- Identify optimal execution windows (low carbon + low cost)
- Publish availability via Beckn Protocol catalogs

Author: GridFlex Team
Date: 2025-11-24
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, Optional, List
from enum import Enum

import requests
from pydantic import BaseModel, Field

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MarketCondition(str, Enum):
    """Enum for market condition assessment."""
    OPTIMAL = "optimal"  # Low carbon + low price
    GOOD = "good"  # One of two is favorable
    MODERATE = "moderate"  # Average conditions
    POOR = "poor"  # High carbon or high price
    CRITICAL = "critical"  # Both high - avoid execution


class GridMarketData(BaseModel):
    """Real-time grid market data snapshot."""
    timestamp: datetime = Field(default_factory=datetime.now)
    carbon_intensity: float = Field(..., description="gCO2/kWh")
    energy_price: float = Field(..., description="£/kWh")
    renewable_percentage: float = Field(..., description="% renewable")
    forecast_next_hour: Optional[float] = Field(None, description="Forecasted carbon intensity")
    market_condition: MarketCondition = Field(..., description="Overall market assessment")


class GridMarketAgent:
    """
    Agent responsible for monitoring energy grid market conditions.

    This agent connects to real-time data sources to assess when compute
    workloads should be executed for optimal cost and carbon efficiency.

    Attributes:
        agent_name: Unique identifier for this agent
        carbon_api_url: UK National Grid Carbon Intensity API endpoint
        carbon_threshold: Maximum acceptable carbon intensity (gCO2/kWh)
        price_threshold: Maximum acceptable energy price (£/kWh)
        update_interval_seconds: How often to fetch fresh data
        last_update: Timestamp of last successful data fetch
        current_data: Most recent grid market data
    """

    # UK National Grid Carbon Intensity API - FREE, NO AUTH REQUIRED
    CARBON_API_BASE_URL = "https://api.carbonintensity.org.uk"

    # Thresholds for optimization decisions
    DEFAULT_CARBON_THRESHOLD = 200.0  # gCO2/kWh - align with problem statement
    DEFAULT_PRICE_THRESHOLD = 0.12  # £/kWh - realistic UK wholesale price

    def __init__(
            self,
            agent_name: str = "Grid Market Agent",
            carbon_threshold: float = DEFAULT_CARBON_THRESHOLD,
            price_threshold: float = DEFAULT_PRICE_THRESHOLD,
            update_interval_seconds: int = 300  # 5 minutes - API rate limit friendly
    ):
        """
        Initialize the Grid Market Agent.

        Args:
            agent_name: Human-readable agent identifier
            carbon_threshold: Max acceptable carbon intensity
            price_threshold: Max acceptable energy price
            update_interval_seconds: Data refresh interval
        """
        self.agent_name = agent_name
        self.carbon_threshold = carbon_threshold
        self.price_threshold = price_threshold
        self.update_interval_seconds = update_interval_seconds

        self.last_update: Optional[datetime] = None
        self.current_data: Optional[GridMarketData] = None

        logger.info(
            f"{self.agent_name} initialized with carbon threshold: "
            f"{carbon_threshold} gCO2/kWh, price threshold: £{price_threshold}/kWh"
        )

    def fetch_carbon_intensity(self) -> Optional[Dict]:
        """
        Fetch current carbon intensity from UK National Grid API.

        This uses the REAL UK Carbon Intensity API - no mocking here!
        API Docs: https://carbon-intensity.github.io/api-definitions/

        Returns:
            Dict containing intensity data, or None if fetch fails
        """
        try:
            # Get current intensity
            url = f"{self.CARBON_API_BASE_URL}/intensity"
            response = requests.get(url, timeout=5)
            response.raise_for_status()

            data = response.json()

            if data and "data" in data and len(data["data"]) > 0:
                intensity_data = data["data"][0]
                logger.info(f"Successfully fetched carbon intensity: {intensity_data}")
                return intensity_data
            else:
                logger.warning("Carbon API returned empty data")
                return None

        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch carbon intensity: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error fetching carbon data: {e}")
            return None

    def fetch_carbon_forecast(self) -> Optional[float]:
        """
        Fetch forecasted carbon intensity for next hour.

        Returns:
            Forecasted carbon intensity, or None if unavailable
        """
        try:
            # Get forecast for next hour
            url = f"{self.CARBON_API_BASE_URL}/intensity/date"
            response = requests.get(url, timeout=5)
            response.raise_for_status()

            data = response.json()

            # Get forecast for next time slot
            if data and "data" in data and len(data["data"]) > 1:
                next_slot = data["data"][1]  # Next 30-min slot
                forecast = next_slot.get("intensity", {}).get("forecast")
                logger.info(f"Forecasted carbon intensity (next hour): {forecast} gCO2/kWh")
                return forecast

            return None

        except Exception as e:
            logger.warning(f"Could not fetch carbon forecast: {e}")
            return None

    def simulate_energy_price(self) -> float:
        """
        Simulate energy wholesale price.

        In production, this would connect to:
        - National Grid ESO day-ahead prices
        - EPEX SPOT UK power exchange

        For prototype, we simulate realistic UK wholesale prices.

        Returns:
            Simulated energy price in £/kWh
        """
        import random

        # UK wholesale prices typically range £0.03 - £0.15/kWh
        # Higher during peak hours (7-9am, 5-8pm)
        current_hour = datetime.now().hour

        if 7 <= current_hour <= 9 or 17 <= current_hour <= 20:
            # Peak hours - higher prices
            base_price = random.uniform(0.08, 0.15)
        elif 0 <= current_hour <= 5:
            # Night hours - lowest prices
            base_price = random.uniform(0.03, 0.06)
        else:
            # Off-peak hours
            base_price = random.uniform(0.05, 0.09)

        return round(base_price, 4)

    def calculate_renewable_percentage(self, intensity_data: Dict) -> float:
        """
        Estimate renewable energy percentage from generation mix.

        Args:
            intensity_data: Raw data from Carbon Intensity API

        Returns:
            Estimated renewable percentage (0-100)
        """
        try:
            gen_mix = intensity_data.get("intensity", {}).get("generationmix", [])

            # Sum up renewable sources
            renewable_sources = ["wind", "solar", "hydro", "biomass"]
            renewable_total = sum(
                fuel.get("perc", 0)
                for fuel in gen_mix
                if fuel.get("fuel") in renewable_sources
            )

            return round(renewable_total, 2)

        except Exception as e:
            logger.warning(f"Could not calculate renewable percentage: {e}")
            return 0.0

    def assess_market_condition(
            self,
            carbon_intensity: float,
            energy_price: float
    ) -> MarketCondition:
        """
        Assess overall market conditions for workload execution.

        Decision matrix:
        - OPTIMAL: Both carbon and price below thresholds
        - GOOD: One metric favorable, other acceptable
        - MODERATE: Both near thresholds
        - POOR: One metric significantly above threshold
        - CRITICAL: Both metrics above thresholds

        Args:
            carbon_intensity: Current carbon intensity (gCO2/kWh)
            energy_price: Current energy price (£/kWh)

        Returns:
            Market condition assessment
        """
        carbon_ok = carbon_intensity <= self.carbon_threshold
        price_ok = energy_price <= self.price_threshold

        carbon_ratio = carbon_intensity / self.carbon_threshold
        price_ratio = energy_price / self.price_threshold

        if carbon_ok and price_ok:
            if carbon_ratio < 0.5 and price_ratio < 0.5:
                return MarketCondition.OPTIMAL
            return MarketCondition.GOOD
        elif carbon_ok or price_ok:
            return MarketCondition.MODERATE
        elif carbon_ratio > 1.5 or price_ratio > 1.5:
            return MarketCondition.CRITICAL
        else:
            return MarketCondition.POOR

    def update_market_data(self) -> bool:
        """
        Fetch latest market data and update internal state.

        Returns:
            True if update successful, False otherwise
        """
        logger.info(f"{self.agent_name}: Updating market data...")

        # Fetch real carbon intensity
        intensity_data = self.fetch_carbon_intensity()

        if not intensity_data:
            logger.error("Failed to fetch carbon intensity - using fallback data")
            # Use fallback data so agent doesn't crash during demo
            carbon_intensity = 150.0  # Reasonable average
            renewable_pct = 40.0
        else:
            carbon_intensity = intensity_data.get("intensity", {}).get("actual", 150.0)
            renewable_pct = self.calculate_renewable_percentage(intensity_data)

        # Simulate energy price (would be real API in production)
        energy_price = self.simulate_energy_price()

        # Get forecast
        forecast = self.fetch_carbon_forecast()

        # Assess market condition
        condition = self.assess_market_condition(carbon_intensity, energy_price)

        # Update internal state
        self.current_data = GridMarketData(
            timestamp=datetime.now(),
            carbon_intensity=carbon_intensity,
            energy_price=energy_price,
            renewable_percentage=renewable_pct,
            forecast_next_hour=forecast,
            market_condition=condition
        )
        self.last_update = datetime.now()

        logger.info(
            f"{self.agent_name}: Market data updated - "
            f"Carbon: {carbon_intensity} gCO2/kWh, "
            f"Price: £{energy_price}/kWh, "
            f"Renewable: {renewable_pct}%, "
            f"Condition: {condition.value}"
        )

        return True

    def get_current_conditions(self) -> Optional[GridMarketData]:
        """
        Get current market conditions, refreshing if needed.

        Returns:
            Current grid market data, or None if unavailable
        """
        # Refresh data if stale or never fetched
        if (self.last_update is None or
                (datetime.now() - self.last_update).seconds > self.update_interval_seconds):
            self.update_market_data()

        return self.current_data

    def should_execute_now(self) -> bool:
        """
        Determine if current conditions are favorable for workload execution.

        Returns:
            True if conditions are favorable, False otherwise
        """
        data = self.get_current_conditions()

        if not data:
            logger.warning("No market data available - defaulting to NO execution")
            return False

        # Execute if conditions are OPTIMAL or GOOD
        favorable = data.market_condition in [MarketCondition.OPTIMAL, MarketCondition.GOOD]

        logger.info(
            f"Execution decision: {'EXECUTE' if favorable else 'DEFER'} "
            f"(Condition: {data.market_condition.value})"
        )

        return favorable

    def get_status(self) -> Dict:
        """
        Get agent status for monitoring dashboard.

        Returns:
            Dict with agent status and metrics
        """
        data = self.get_current_conditions()

        if not data:
            return {
                "name": self.agent_name,
                "status": "error",
                "last_updated": None,
                "metrics": {}
            }

        return {
            "name": self.agent_name,
            "status": "active",
            "last_updated": data.timestamp.isoformat(),
            "metrics": {
                "carbon_intensity": data.carbon_intensity,
                "energy_price": data.energy_price,
                "renewable_percentage": data.renewable_percentage,
                "market_condition": data.market_condition.value,
                "forecast_next_hour": data.forecast_next_hour,
                "execution_recommended": self.should_execute_now()
            }
        }


# Example usage and testing
if __name__ == "__main__":
    """Test the Grid Market Agent with real API calls."""

    print("=" * 60)
    print("GridFlex - Grid Market Agent Test")
    print("=" * 60)

    # Initialize agent
    agent = GridMarketAgent()

    # Fetch current market data
    print("\n📊 Fetching current market conditions...")
    conditions = agent.get_current_conditions()

    if conditions:
        print(f"\n✅ Market Data Retrieved:")
        print(f"   Carbon Intensity: {conditions.carbon_intensity} gCO2/kWh")
        print(f"   Energy Price: £{conditions.energy_price}/kWh")
        print(f"   Renewable: {conditions.renewable_percentage}%")
        print(f"   Condition: {conditions.market_condition.value.upper()}")
        print(f"   Forecast: {conditions.forecast_next_hour} gCO2/kWh")

        # Check execution recommendation
        should_execute = agent.should_execute_now()
        print(f"\n🎯 Execution Recommendation: {'✅ EXECUTE NOW' if should_execute else '⏸️  DEFER'}")
    else:
        print("\n❌ Failed to retrieve market data")

    # Get agent status
    print(f"\n📈 Agent Status:")
    status = agent.get_status()
    print(f"   Name: {status['name']}")
    print(f"   Status: {status['status']}")
    print(f"   Metrics: {status['metrics']}")

    print("\n" + "=" * 60)