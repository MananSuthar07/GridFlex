"""
Beckn Protocol Client
=====================
Client for interacting with DEG BAP Sandbox.
Implements discover, select, init, confirm workflows.

Author: GridFlex Team
Date: 2025-11-24
"""

import logging
import uuid
from datetime import datetime
from typing import Dict, List, Optional

import requests
from pydantic import BaseModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class BecknClient:
    """
    Client for Beckn Protocol BAP Sandbox interactions.

    This client acts as the BAP (Beckn Application Platform) and communicates
    with the sandbox which handles BPP (Beckn Provider Platform) interactions.

    Attributes:
        base_url: BAP Sandbox base URL
        bap_id: Our BAP identifier
        bap_uri: Our BAP callback URI
        timeout: Request timeout in seconds
    """

    # DEG BAP Sandbox base URL
    BASE_URL = "https://deg-hackathon-bap-sandbox.becknprotocol.io/api"

    # Our BAP identifiers (using sandbox test credentials)
    BAP_ID = "ev-charging.sandbox1.com"
    BAP_URI = "https://ev-charging.sandbox1.com.com/bap"

    # Domain for compute energy
    DOMAIN = "beckn.one:DEG:compute-energy:1.0"

    def __init__(
            self,
            base_url: str = BASE_URL,
            bap_id: str = BAP_ID,
            bap_uri: str = BAP_URI,
            timeout: int = 30
    ):
        """
        Initialize Beckn client.

        Args:
            base_url: BAP Sandbox API base URL
            bap_id: Our BAP identifier
            bap_uri: Our BAP callback URI
            timeout: Request timeout in seconds
        """
        self.base_url = base_url
        self.bap_id = bap_id
        self.bap_uri = bap_uri
        self.timeout = timeout

        logger.info(f"Beckn client initialized: {base_url}")

    def _generate_context(self, action: str, transaction_id: Optional[str] = None) -> Dict:
        """
        Generate Beckn context object.

        Args:
            action: Beckn action (discover, select, init, confirm, etc.)
            transaction_id: Optional transaction ID (generate new if None)

        Returns:
            Context dictionary
        """
        from datetime import timezone
        if transaction_id is None:
            transaction_id = str(uuid.uuid4())

        return {
            "version": "2.0.0",
            "action": action,
            "domain": self.DOMAIN,
            "timestamp": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
            "message_id": str(uuid.uuid4()),
            "transaction_id": transaction_id,
            "bap_id": self.bap_id,
            "bap_uri": self.bap_uri,
            "ttl": "PT30S",
            "schema_context": [
                "https://raw.githubusercontent.com/beckn/protocol-specifications-new/refs/heads/draft/schema/ComputeEnergy/v1/context.jsonld"
            ]
        }

    def discover(
            self,
            carbon_threshold: Optional[float] = None,
            renewable_min: Optional[float] = None,
            location: Optional[str] = None
    ) -> Optional[Dict]:
        """
        Discover available energy windows via Beckn protocol.

        This is the first step in the Beckn journey - finding available
        compute energy windows that match our requirements.

        Args:
            carbon_threshold: Maximum carbon intensity (gCO2/kWh)
            renewable_min: Minimum renewable percentage
            location: Preferred grid location (e.g., "London", "Glasgow")

        Returns:
            Discovered catalogs with available windows, or None if failed
        """
        try:
            context = self._generate_context("discover")

            # Build message with filters (matching Postman format)
            message = {
                "text_search": "Grid flexibility windows"
            }

            # Add JSONPath filter if criteria specified
            if renewable_min:
                message["filters"] = {
                    "type": "jsonpath",
                    "expression": f"$[?(@.beckn:itemAttributes.beckn:gridParameters.renewableMix >= {renewable_min})]"
                }

            payload = {
                "context": context,
                "message": message
            }

            logger.info(f"Beckn discover: renewable>{renewable_min}")

            response = requests.post(
                f"{self.base_url}/discover",
                json=payload,
                timeout=self.timeout
            )

            response.raise_for_status()
            data = response.json()

            logger.info(f"Beckn discover successful: {len(data.get('message', {}).get('catalogs', []))} catalogs found")

            return data

        except requests.exceptions.RequestException as e:
            logger.error(f"Beckn discover failed: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error in discover: {e}")
            return None

    def select(
            self,
            transaction_id: str,
            item_id: str,
            provider_id: str
    ) -> Optional[Dict]:
        """
        Select a specific energy window.

        Second step in Beckn journey - selecting a specific window from
        the discovered options.

        Args:
            transaction_id: Transaction ID from discover
            item_id: ID of selected energy window item
            provider_id: ID of the provider

        Returns:
            Selection response with quote, or None if failed
        """
        try:
            context = self._generate_context("select", transaction_id)

            payload = {
                "context": context,
                "message": {
                    "order": {
                        "provider": {"id": provider_id},
                        "items": [{"id": item_id}]
                    }
                }
            }

            logger.info(f"Beckn select: item={item_id}, provider={provider_id}")

            response = requests.post(
                f"{self.base_url}/select",
                json=payload,
                timeout=self.timeout
            )

            response.raise_for_status()
            data = response.json()

            logger.info("Beckn select successful")

            return data

        except requests.exceptions.RequestException as e:
            logger.error(f"Beckn select failed: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error in select: {e}")
            return None

    def init(
            self,
            transaction_id: str,
            item_id: str,
            provider_id: str,
            workload_details: Dict
    ) -> Optional[Dict]:
        """
        Initialize order with workload details.

        Third step - providing our workload requirements and getting
        confirmation details.

        Args:
            transaction_id: Transaction ID from previous steps
            item_id: Selected item ID
            provider_id: Provider ID
            workload_details: Our workload requirements (energy, duration, etc.)

        Returns:
            Initialization response with order details, or None if failed
        """
        try:
            context = self._generate_context("init", transaction_id)

            payload = {
                "context": context,
                "message": {
                    "order": {
                        "provider": {"id": provider_id},
                        "items": [{"id": item_id}],
                        "billing": {
                            "name": "GridFlex",
                            "email": "billing@gridflex.com"
                        },
                        "fulfillments": [{
                            "customer": {
                                "person": {"name": "GridFlex Orchestrator"}
                            },
                            "stops": [{
                                "type": "start",
                                "time": {
                                    "timestamp": workload_details.get("start_time")
                                }
                            }]
                        }]
                    }
                }
            }

            logger.info(f"Beckn init: item={item_id}")

            response = requests.post(
                f"{self.base_url}/init",
                json=payload,
                timeout=self.timeout
            )

            response.raise_for_status()
            data = response.json()

            logger.info("Beckn init successful")

            return data

        except requests.exceptions.RequestException as e:
            logger.error(f"Beckn init failed: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error in init: {e}")
            return None

    def confirm(
            self,
            transaction_id: str,
            order_id: str
    ) -> Optional[Dict]:
        """
        Confirm the order.

        Final step - confirming the booking and getting confirmation.

        Args:
            transaction_id: Transaction ID from previous steps
            order_id: Order ID from init response

        Returns:
            Confirmation response, or None if failed
        """
        try:
            context = self._generate_context("confirm", transaction_id)

            payload = {
                "context": context,
                "message": {
                    "order": {
                        "id": order_id
                    }
                }
            }

            logger.info(f"Beckn confirm: order={order_id}")

            response = requests.post(
                f"{self.base_url}/confirm",
                json=payload,
                timeout=self.timeout
            )

            response.raise_for_status()
            data = response.json()

            logger.info("Beckn confirm successful - order confirmed!")

            return data

        except requests.exceptions.RequestException as e:
            logger.error(f"Beckn confirm failed: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error in confirm: {e}")
            return None

    def update_workload_shift(
            self,
            transaction_id: str,
            order_id: str,
            new_start_time: str,
            reason: str = "Grid conditions changed"
    ) -> Optional[Dict]:
        """
        Send workload shift update via Beckn.

        Notifies grid that compute workload timing has changed.

        Args:
            transaction_id: Transaction ID from order
            order_id: Order ID to update
            new_start_time: New execution start time (ISO format)
            reason: Reason for shift

        Returns:
            Update response, or None if failed
        """
        try:
            context = self._generate_context("update", transaction_id)

            payload = {
                "context": context,
                "message": {
                    "order": {
                        "id": order_id,
                        "status": "rescheduled",
                        "fulfillments": [{
                            "state": {
                                "descriptor": {
                                    "code": "rescheduled",
                                    "name": reason
                                }
                            },
                            "stops": [{
                                "type": "start",
                                "time": {
                                    "timestamp": new_start_time
                                }
                            }]
                        }]
                    }
                }
            }

            logger.info(f"Beckn update (workload shift): order={order_id}, new_time={new_start_time}")

            response = requests.post(
                f"{self.base_url}/update",
                json=payload,
                timeout=self.timeout
            )

            response.raise_for_status()
            data = response.json()

            logger.info("Beckn update (workload shift) successful")

            return data

        except requests.exceptions.RequestException as e:
            logger.error(f"Beckn update failed: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error in update: {e}")
            return None

    def update_carbon_intensity(
            self,
            transaction_id: str,
            order_id: str,
            current_carbon: float,
            current_energy_kwh: float,
            progress_percent: int
    ) -> Optional[Dict]:
        """
        Send real-time execution update with carbon tracking.

        Updates grid on job progress and actual carbon consumption.

        Args:
            transaction_id: Transaction ID from order
            order_id: Order ID to update
            current_carbon: Current carbon intensity (gCO2/kWh)
            current_energy_kwh: Energy consumed so far
            progress_percent: Job completion percentage (0-100)

        Returns:
            Update response, or None if failed
        """
        try:
            context = self._generate_context("update", transaction_id)

            payload = {
                "context": context,
                "message": {
                    "order": {
                        "id": order_id,
                        "status": "in-progress",
                        "fulfillments": [{
                            "state": {
                                "descriptor": {
                                    "code": "in-progress",
                                    "name": f"{progress_percent}% complete"
                                }
                            },
                            "tracking": {
                                "status": "active",
                                "location": {
                                    "descriptor": {
                                        "name": f"Energy consumed: {current_energy_kwh} kWh"
                                    }
                                }
                            }
                        }],
                        "quote": {
                            "price": {
                                "value": round(current_energy_kwh * 0.10, 2),
                                "currency": "GBP"
                            }
                        },
                        "tags": [{
                            "descriptor": {"name": "carbon_tracking"},
                            "list": [
                                {"descriptor": {"name": "current_carbon_intensity"}, "value": str(current_carbon)},
                                {"descriptor": {"name": "energy_consumed_kwh"}, "value": str(current_energy_kwh)},
                                {"descriptor": {"name": "progress_percent"}, "value": str(progress_percent)}
                            ]
                        }]
                    }
                }
            }

            logger.info(
                f"Beckn update (carbon): order={order_id}, carbon={current_carbon}, progress={progress_percent}%")

            response = requests.post(
                f"{self.base_url}/update",
                json=payload,
                timeout=self.timeout
            )

            response.raise_for_status()
            data = response.json()

            logger.info("Beckn update (carbon tracking) successful")

            return data

        except requests.exceptions.RequestException as e:
            logger.error(f"Beckn update failed: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error in update: {e}")
            return None

    def execute_full_journey(
            self,
            carbon_threshold: float = 200.0,
            renewable_min: float = 70.0,
            workload_energy_kwh: float = 150.0,
            workload_start_time: Optional[str] = None
    ) -> Optional[Dict]:
        """
        Execute complete Beckn journey: discover → select → init → confirm.

        This is the full orchestration flow that demonstrates agentic behavior.

        Args:
            carbon_threshold: Max carbon intensity
            renewable_min: Min renewable percentage
            workload_energy_kwh: Energy requirement
            workload_start_time: Preferred start time (ISO format)

        Returns:
            Final confirmation with order details, or None if any step failed
        """
        logger.info("=" * 60)
        logger.info("Starting Beckn full journey orchestration")
        logger.info("=" * 60)

        # Step 1: Discover
        logger.info("STEP 1/4: Discovering available energy windows...")
        discover_response = self.discover(
            carbon_threshold=carbon_threshold,
            renewable_min=renewable_min
        )

        if not discover_response:
            logger.error("Discover failed - aborting journey")
            return None

        # Extract best window (lowest carbon)
        catalogs = discover_response.get("message", {}).get("catalogs", [])
        if not catalogs:
            logger.error("No catalogs found - aborting journey")
            return None

        items = catalogs[0].get("beckn:items", [])
        if not items:
            logger.error("No items found - aborting journey")
            return None

        # Find item with lowest carbon intensity
        best_item = min(
            items,
            key=lambda x: x.get("beckn:itemAttributes", {})
            .get("beckn:gridParameters", {})
            .get("carbonIntensity", 999)
        )

        item_id = best_item.get("beckn:id")
        provider_id = best_item.get("beckn:provider", {}).get("beckn:id")
        carbon_intensity = best_item.get("beckn:itemAttributes", {}).get("beckn:gridParameters", {}).get(
            "carbonIntensity")

        logger.info(f"Selected best window: {item_id} (carbon: {carbon_intensity} gCO2/kWh)")

        transaction_id = discover_response.get("context", {}).get("transaction_id")

        # Step 2: Select
        logger.info("STEP 2/4: Selecting energy window...")
        select_response = self.select(transaction_id, item_id, provider_id)

        if not select_response:
            logger.error("Select failed - aborting journey")
            return None

        # Step 3: Init
        logger.info("STEP 3/4: Initializing order...")
        from datetime import timezone
        workload_details = {
            "energy_kwh": workload_energy_kwh,
            "start_time": workload_start_time or datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
        }

        init_response = self.init(transaction_id, item_id, provider_id, workload_details)

        if not init_response:
            logger.error("Init failed - aborting journey")
            return None

        order_id = init_response.get("message", {}).get("order", {}).get("id", str(uuid.uuid4()))

        # Step 4: Confirm
        logger.info("STEP 4/4: Confirming order...")
        confirm_response = self.confirm(transaction_id, order_id)

        if not confirm_response:
            logger.error("Confirm failed - journey incomplete")
            return None

        logger.info("=" * 60)
        logger.info("✅ Beckn journey completed successfully!")
        logger.info(f"Order ID: {order_id}")
        logger.info(f"Carbon Intensity: {carbon_intensity} gCO2/kWh")
        logger.info("=" * 60)

        return confirm_response


# Test the client
if __name__ == "__main__":
    """Test Beckn client with sandbox."""

    print("=" * 60)
    print("GridFlex - Beckn Protocol Client Test")
    print("=" * 60)

    client = BecknClient()

    # Test discover
    print("\n🔍 Testing Discover...")
    result = client.discover(carbon_threshold=200, renewable_min=70)

    if result:
        catalogs = result.get("message", {}).get("catalogs", [])
        print(f"✅ Found {len(catalogs)} catalogs")

        if catalogs:
            items = catalogs[0].get("beckn:items", [])
            print(f"✅ Found {len(items)} energy windows")

            for item in items[:3]:
                name = item.get("beckn:descriptor", {}).get("schema:name")
                carbon = item.get("beckn:itemAttributes", {}).get("beckn:gridParameters", {}).get("carbonIntensity")
                renewable = item.get("beckn:itemAttributes", {}).get("beckn:gridParameters", {}).get("renewableMix")
                print(f"   - {name}: {carbon} gCO2/kWh, {renewable}% renewable")

    # Test full journey
    print("\n🚀 Testing Full Journey...")
    journey_result = client.execute_full_journey(
        carbon_threshold=200,
        renewable_min=70,
        workload_energy_kwh=150
    )

    if journey_result:
        print("\n✅ Full Beckn journey successful!")
    else:
        print("\n❌ Journey failed")

    print("\n" + "=" * 60)