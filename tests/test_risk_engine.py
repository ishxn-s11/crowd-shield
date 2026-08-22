"""Tests for CrowdShield risk engine and simulation."""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'services', 'api'))

from app.services.simulation import (
    CrowdSimulation, RiskEngine, RecommendationEngine,
    SimZone, SimGate, SCENARIOS
)


def test_risk_engine_low_density():
    """Low density should yield low risk."""
    engine = RiskEngine()
    zone = SimZone("Z1", "Test Zone", area_sqm=1000, max_capacity=1000)
    zone.person_count = 100  # 0.1 p/m²
    zone.avg_velocity = 1.2
    zone.flow_conflict = 0.0
    zone.bottleneck_score = 0.0
    zone.anomaly_score = 0.0
    zone.velocity_variance = 0.1
    
    risk = engine.calculate_risk(zone)
    assert risk["risk_score"] < 25, f"Expected LOW risk, got {risk['risk_score']}"
    assert risk["risk_level"] == "LOW"


def test_risk_engine_critical_density():
    """High density + low speed should yield critical risk."""
    engine = RiskEngine()
    zone = SimZone("Z1", "Danger Zone", area_sqm=100, max_capacity=100, critical_density=2.0)
    zone.person_count = 250  # 2.5 p/m²
    zone.avg_velocity = 0.2
    zone.flow_conflict = 0.8
    zone.bottleneck_score = 0.9
    zone.anomaly_score = 0.7
    zone.velocity_variance = 1.0
    
    # Run multiple times to trigger confirmation
    for _ in range(5):
        risk = engine.calculate_risk(zone)
    
    assert risk["risk_score"] >= 50, f"Expected HIGH/CRITICAL risk, got {risk['risk_score']}"
    assert risk["risk_level"] in ("HIGH", "CRITICAL")


def test_risk_engine_contributing_factors():
    """Risk calculation should include contributing factors."""
    engine = RiskEngine()
    zone = SimZone("Z1", "Test Zone", area_sqm=1000, max_capacity=1000)
    zone.person_count = 800
    zone.avg_velocity = 0.5
    zone.flow_conflict = 0.4
    zone.bottleneck_score = 0.3
    zone.anomaly_score = 0.2
    zone.velocity_variance = 0.5
    
    risk = engine.calculate_risk(zone)
    assert "contributing_factors" in risk
    assert len(risk["contributing_factors"]) > 0
    for factor in risk["contributing_factors"]:
        assert "factor" in factor
        assert "contribution" in factor
        assert "value" in factor


def test_simulation_initialization():
    """Simulation should initialize venue with zones and gates."""
    sim = CrowdSimulation()
    sim.initialize_demo_venue()
    
    assert len(sim.zones) == 7, f"Expected 7 zones, got {len(sim.zones)}"
    assert len(sim.gates) == 7, f"Expected 7 gates, got {len(sim.gates)}"
    assert sim.zones["Z1"].name == "Main Entrance"
    assert sim.zones["Z4"].name == "Stadium"
    assert sim.gates["G3"].gate_type == "entry"
    assert sim.gates["E1"].gate_type == "exit"


def test_scenario_definitions():
    """All scenarios should be properly defined."""
    required = ["normal", "crowd_surge", "rising_density", "gate_blocked",
                 "reverse_flow", "panic_like", "recovery"]
    for key in required:
        assert key in SCENARIOS, f"Missing scenario: {key}"
        scenario = SCENARIOS[key]
        assert "name" in scenario
        assert "phases" in scenario
        assert len(scenario["phases"]) > 0


def test_recommendation_engine():
    """Recommendation engine should generate actions for high-risk zones."""
    engine = RecommendationEngine()
    zones = {
        "Z1": SimZone("Z1", "Danger Zone", area_sqm=100, max_capacity=100, critical_density=2.0),
    }
    zones["Z1"].person_count = 250  # 2.5 p/m²
    zones["Z1"].avg_velocity = 0.2
    zones["Z1"].risk_score = 85
    zones["Z1"].risk_level = "CRITICAL"
    
    gates = {
        "G1": SimGate("G1", "Gate 1", "entry", "Z1"),
        "E1": SimGate("E1", "Exit A", "exit", "Z1"),
    }
    
    recs = engine.generate(zones, gates)
    assert len(recs) > 0, "Expected recommendations for critical zone"
    for rec in recs:
        assert rec.priority in ("HIGH", "MEDIUM", "LOW")
        assert rec.confidence > 0


def test_simulation_state():
    """Simulation state should contain all required fields."""
    sim = CrowdSimulation()
    sim.initialize_demo_venue()
    state = sim.get_state()
    
    required_keys = ["timestamp", "scenario", "overall_risk", "overall_risk_level",
                     "zones", "gates", "alerts", "recommendations", "total_persons"]
    for key in required_keys:
        assert key in state, f"Missing key in state: {key}"
    
    assert state["overall_risk_level"] in ("LOW", "MODERATE", "HIGH", "CRITICAL")
    assert state["total_persons"] > 0
    assert len(state["zones"]) == 7


def test_gate_blocking():
    """Blocking a gate should affect simulation."""
    sim = CrowdSimulation()
    sim.initialize_demo_venue()
    
    # Block exit E1
    sim.gates["E1"].is_blocked = True
    state = sim.get_state()
    assert state["gates"]["E1"]["is_blocked"] is True
    
    # Open it
    sim.gates["E1"].is_blocked = False
    state = sim.get_state()
    assert state["gates"]["E1"]["is_blocked"] is False


if __name__ == "__main__":
    tests = [
        test_risk_engine_low_density,
        test_risk_engine_critical_density,
        test_risk_engine_contributing_factors,
        test_simulation_initialization,
        test_scenario_definitions,
        test_recommendation_engine,
        test_simulation_state,
        test_gate_blocking,
    ]
    
    passed = 0
    failed = 0
    for test in tests:
        try:
            test()
            print(f"  PASS {test.__name__}")
            passed += 1
        except Exception as e:
            print(f"  FAIL {test.__name__}: {e}")
            failed += 1
    
    print(f"\n{'='*40}")
    print(f"Results: {passed} passed, {failed} failed")
    sys.exit(1 if failed > 0 else 0)
