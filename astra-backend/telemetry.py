import random
import math
from datetime import datetime, timedelta

random.seed(42)


def _sigmoid(x, center=0, width=1):
    return 1 / (1 + math.exp(-(x - center) / width))


def generate_astronauts():
    return [
        {
            'name': 'Alex Chen',
            'mission': 'Mars Transit Mission - Artemis VII',
            'role': 'Mission Specialist',
            'day': 147,
        },
        {
            'name': 'Maria Santos',
            'mission': 'Mars Transit Mission - Artemis VII',
            'role': 'Flight Engineer',
            'day': 147,
        },
        {
            'name': 'James Okafor',
            'mission': 'Mars Transit Mission - Artemis VII',
            'role': 'Commander',
            'day': 147,
        },
    ]


def generate_demo_scenario_measurements(astronaut_name, num_days=14, anomaly_day=None):
    """Generate simulated telemetry with optional anomaly injection."""
    base_hr = random.uniform(58, 68)
    base_hrv = random.uniform(38, 52)
    base_spo2 = random.uniform(97, 99)
    base_temp = random.uniform(36.4, 36.9)
    base_sleep = random.uniform(7.0, 8.0)
    base_activity = random.uniform(4.0, 6.0)
    base_recovery = random.uniform(22, 30)

    measurements = []
    start = datetime.utcnow() - timedelta(days=num_days)

    for i in range(num_days):
        day_offset = i - num_days + 1
        is_anomaly = anomaly_day is not None and i >= anomaly_day

        # Gradual drift starting at anomaly_day
        drift = 0
        if is_anomaly:
            drift = (i - anomaly_day + 1)

        hr = base_hr + drift * random.uniform(1.2, 2.0) + random.gauss(0, 1.5)
        hrv = base_hrv - drift * random.uniform(1.0, 1.8) + random.gauss(0, 2.0)
        spo2 = base_spo2 + random.gauss(0, 0.3)
        temp = base_temp + random.gauss(0, 0.1)
        sleep = max(3.5, base_sleep - drift * random.uniform(0.3, 0.6) + random.gauss(0, 0.4))
        activity = base_activity - drift * random.uniform(0.1, 0.3) + random.gauss(0, 0.4)
        recovery = base_recovery + drift * random.uniform(1.5, 3.0) + random.gauss(0, 2.0)

        measurements.append({
            'heart_rate': round(max(45, min(120, hr)), 1),
            'hrv': round(max(8, min(90, hrv)), 1),
            'blood_oxygen': round(max(90, min(100, spo2)), 1),
            'body_temp': round(max(35.5, min(38.5, temp)), 2),
            'sleep_duration': round(max(2.0, min(12.0, sleep)), 2),
            'activity_level': round(max(0, min(12, activity)), 2),
            'exercise_recovery': round(max(5, min(90, recovery)), 1),
            'day_offset': day_offset,
        })
    return measurements


def generate_radiation_events(days=14):
    events = []
    start = datetime.utcnow() - timedelta(days=days)
    base_dose = random.uniform(0.4, 0.8)
    for i in range(days):
        dose = base_dose + random.gauss(0, 0.05)
        source = 'Galactic Cosmic Rays'
        event = None
        desc = None
        r = random.random()
        if r < 0.10:
            dose *= random.uniform(1.5, 2.5)
            source = 'Solar Particle Event'
            event = 'SPE'
            desc = f"Minor solar particle event detected; shielding effective."
        elif r < 0.18:
            dose *= random.uniform(1.2, 1.5)
            source = 'Trapped Belt Passage'
            event = 'Belt Passage'
            desc = "Brief passage through elevated radiation belt region."
        events.append({
            'timestamp': start + timedelta(days=i),
            'radiation_dose': round(dose, 3),
            'radiation_source': source,
            'event_type': event,
            'description': desc,
        })
    return events


def generate_wellness_checkins(astronaut_id, num_days=14, anomaly_day=None):
    checkins = []
    start = datetime.utcnow() - timedelta(days=num_days)
    base_mood = random.randint(6, 8)
    base_stress = random.randint(2, 4)
    base_fatigue = random.randint(2, 3)

    for i in range(num_days):
        drift = 0
        if anomaly_day is not None and i >= anomaly_day:
            drift = (i - anomaly_day + 1)

        mood = max(1, min(10, base_mood - drift * random.choice([0, 0, 1, 1, 1])))
        stress = min(10, base_stress + drift * random.choice([0, 1, 1]))
        fatigue = min(10, base_fatigue + drift * random.choice([0, 1, 1, 1]))
        sleep_q = max(1, min(10, int(random.uniform(6, 9) - drift * 0.5)))

        notes = None
        if drift >= 2:
            notes = "Feeling more tired than usual. Sleep hasn't been great."
        elif drift >= 1:
            notes = "A bit off today. Not sure why."

        checkins.append({
            'timestamp': start + timedelta(days=i),
            'mood': mood,
            'sleep_quality': sleep_q,
            'stress_level': stress,
            'fatigue_level': fatigue,
            'notes': notes,
        })
    return checkins


def generate_reaction_game_results(num_days=14, anomaly_day=None):
    results = []
    start = datetime.utcnow() - timedelta(days=num_days)
    base_rt = random.uniform(220, 280)
    for i in range(num_days):
        drift = 0
        if anomaly_day is not None and i >= anomaly_day:
            drift = (i - anomaly_day + 1)
        rt = base_rt + drift * random.uniform(5, 20) + random.gauss(0, 15)
        accuracy = max(60, min(100, 95 - drift * random.uniform(1, 2) + random.gauss(0, 2)))
        results.append({
            'timestamp': start + timedelta(days=i),
            'reaction_time_ms': round(max(120, min(600, rt)), 1),
            'accuracy': round(accuracy, 1),
        })
    return results
