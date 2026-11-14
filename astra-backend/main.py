from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import os

from models import (
    Base, engine, SessionLocal, Astronaut, Measurement,
    Baseline, WellnessCheckin, EnvironmentReading, Alerts,
    ReactionGameResult,
)
from ai_engine import PersonalizedAnomalyEngine, TrendForecaster
from knowledge_base import retrieve_relevant, format_answer
from telemetry import (
    generate_astronauts, generate_demo_scenario_measurements,
    generate_radiation_events, generate_wellness_checkins,
    generate_reaction_game_results,
)

app = FastAPI(
    title="ASTRA API",
    description="Autonomous Spaceflight Tracking & Risk Assessment — AI-Powered Astronaut Health Intelligence",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.middleware("http")
async def cors_headers_middleware(request, call_next):
    response: Response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
    response.headers["Access-Control-Expose-Headers"] = "*"
    return response


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


anomaly_engine = PersonalizedAnomalyEngine()
forecaster = TrendForecaster(window=7)


# ---------- Pydantic schemas ----------

class AstronautCreate(BaseModel):
    name: str
    mission: str
    role: str


class MeasurementCreate(BaseModel):
    heart_rate: Optional[float] = None
    hrv: Optional[float] = None
    blood_oxygen: Optional[float] = None
    body_temp: Optional[float] = None
    sleep_duration: Optional[float] = None
    activity_level: Optional[float] = None
    exercise_recovery: Optional[float] = None


class WellnessCheckinCreate(BaseModel):
    mood: Optional[int] = None
    sleep_quality: Optional[int] = None
    stress_level: Optional[int] = None
    fatigue_level: Optional[int] = None
    notes: Optional[str] = None


class ReactionGameResultCreate(BaseModel):
    reaction_time_ms: Optional[float] = None
    accuracy: Optional[float] = None


class EnvironmentReadingCreate(BaseModel):
    radiation_dose: Optional[float] = None
    radiation_source: Optional[str] = None
    event_type: Optional[str] = None
    description: Optional[str] = None


class AnomalyResult(BaseModel):
    anomaly_score: float
    severity: str
    deviating_metrics: list
    explanation: str


# ---------- Astronaut endpoints ----------

@app.post("/api/astronauts", response_model=dict)
def create_astronaut(data: AstronautCreate, db: Session = Depends(get_db)):
    existing = db.query(Astronaut).filter(Astronaut.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Astronaut already exists")
    a = Astronaut(name=data.name, mission=data.mission, role=data.role)
    db.add(a)
    db.commit()
    db.refresh(a)
    return {"id": a.id, "name": a.name, "mission": a.mission, "role": a.role}


@app.get("/api/astronauts", )
def list_astronauts(db: Session = Depends(get_db)):
    from fastapi.encoders import jsonable_encoder
    return jsonable_encoder([{"id": a.id, "name": a.name, "mission": a.mission, "role": a.role} for a in db.query(Astronaut).all()])


@app.get("/api/astronauts/{astronaut_id}", response_model=dict)
def get_astronaut(astronaut_id: int, db: Session = Depends(get_db)):
    a = db.query(Astronaut).filter(Astronaut.id == astronaut_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Astronaut not found")
    return {"id": a.id, "name": a.name, "mission": a.mission, "role": a.role}


# ---------- Measurements ----------

@app.post("/api/astronauts/{astronaut_id}/measurements", response_model=dict)
def add_measurement(astronaut_id: int, data: MeasurementCreate, db: Session = Depends(get_db)):
    a = db.query(Astronaut).filter(Astronaut.id == astronaut_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Astronaut not found")
    m = Measurement(astronaut_id=astronaut_id, **data.model_dump(exclude_unset=True))
    db.add(m)
    db.commit()
    db.refresh(m)

    # Update AI engine
    metrics = data.model_dump(exclude_unset=True)
    anomaly_engine.add_measurement(astronaut_id, metrics)
    baselines = anomaly_engine.train_baselines(astronaut_id)

    # Persist baselines
    for metric, b in baselines.items():
        existing = db.query(Baseline).filter(
            Baseline.astronaut_id == astronaut_id, Baseline.metric == metric
        ).first()
        if existing:
            existing.mean = b['mean']
            existing.std = b['std']
            existing.learned_at = datetime.utcnow()
        else:
            db.add(Baseline(astronaut_id=astronaut_id, metric=metric, **b))
    db.commit()

    return {"id": m.id, "timestamp": m.timestamp.isoformat()}


@app.get("/api/astronauts/{astronaut_id}/measurements")
def get_measurements(astronaut_id: int, limit: int = 50, db: Session = Depends(get_db)):
    a = db.query(Astronaut).filter(Astronaut.id == astronaut_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Astronaut not found")
    rows = db.query(Measurement).filter(Measurement.astronaut_id == astronaut_id).order_by(desc(Measurement.timestamp)).limit(limit).all()
    result = [{"id": m.id, "timestamp": m.timestamp.isoformat() if m.timestamp else None, "heart_rate": m.heart_rate, "hrv": m.hrv, "blood_oxygen": m.blood_oxygen, "body_temp": m.body_temp, "sleep_duration": m.sleep_duration, "activity_level": m.activity_level, "exercise_recovery": m.exercise_recovery} for m in rows]
    return result


# ---------- Anomaly detection ----------

@app.post("/api/astronauts/{astronaut_id}/detect", response_model=AnomalyResult)
def detect_anomaly(astronaut_id: int, data: MeasurementCreate, db: Session = Depends(get_db)):
    a = db.query(Astronaut).filter(Astronaut.id == astronaut_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Astronaut not found")
    metrics = data.model_dump(exclude_unset=True)
    result = anomaly_engine.detect(astronaut_id, metrics)

    if result['severity'] != 'normal':
        existing = db.query(Alerts).filter(
            Alerts.astronaut_id == astronaut_id,
            Alerts.severity == result['severity'],
            Alerts.resolved == False,
        ).order_by(Alerts.timestamp.desc()).first()

        title_map = {
            'watch': 'Health Pattern to Monitor',
            'critical': 'Critical Health Alert',
        }
        title = title_map.get(result['severity'], 'Health Alert')
        desc = result['explanation']

        if not existing or existing.title != title or abs(existing.anomaly_score - result['anomaly_score']) > 0.5:
            alert = Alerts(
                astronaut_id=astronaut_id,
                severity=result['severity'],
                title=title,
                description=desc,
                deviating_metrics=result['deviating_metrics'],
                anomaly_score=result['anomaly_score'],
            )
            db.add(alert)
            db.commit()

    return result


# ---------- Baselines ----------

@app.get("/api/astronauts/{astronaut_id}/baselines", )
def get_baselines(astronaut_id: int, db: Session = Depends(get_db)):
    a = db.query(Astronaut).filter(Astronaut.id == astronaut_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Astronaut not found")
    rows = db.query(Baseline).filter(Baseline.astronaut_id == astronaut_id).all()
    return [{"id": b.id, "metric": b.metric, "value": b.value, "window_days": b.window_days, "updated_at": b.updated_at.isoformat() if b.updated_at else None} for b in rows]


# ---------- Forecasts ----------

@app.get("/api/astronauts/{astronaut_id}/forecast/{metric}", response_model=dict)
def get_forecast(astronaut_id: int, metric: str, db: Session = Depends(get_db)):
    a = db.query(Astronaut).filter(Astronaut.id == astronaut_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Astronaut not found")
    measurements = db.query(Measurement).filter(Measurement.astronaut_id == astronaut_id).order_by(
        Measurement.timestamp
    ).all()
    if not measurements:
        raise HTTPException(status_code=404, detail="No measurements found")
    series = [getattr(m, metric) for m in measurements if getattr(m, metric) is not None]
    if not series:
        raise HTTPException(status_code=404, detail=f"No data for metric '{metric}'")
    return forecaster.analyze(series)


@app.get("/api/astronauts/{astronaut_id}/forecasts", )
def get_all_forecasts(astronaut_id: int, db: Session = Depends(get_db)):
    a = db.query(Astronaut).filter(Astronaut.id == astronaut_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Astronaut not found")
    measurements = db.query(Measurement).filter(Measurement.astronaut_id == astronaut_id).order_by(
        Measurement.timestamp
    ).all()
    if not measurements:
        return []
    metrics = ['heart_rate', 'hrv', 'blood_oxygen', 'body_temp', 'sleep_duration', 'activity_level', 'exercise_recovery']
    results = []
    for metric in metrics:
        series = [getattr(m, metric) for m in measurements if getattr(m, metric) is not None]
        if series:
            results.append(forecaster.analyze(series))
    return results


# ---------- Wellness checkins ----------

@app.post("/api/astronauts/{astronaut_id}/checkins", response_model=dict)
def add_checkin(astronaut_id: int, data: WellnessCheckinCreate, db: Session = Depends(get_db)):
    a = db.query(Astronaut).filter(Astronaut.id == astronaut_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Astronaut not found")
    c = WellnessCheckin(astronaut_id=astronaut_id, **data.model_dump(exclude_unset=True))
    db.add(c)
    db.commit()
    db.refresh(c)
    return {"id": c.id, "timestamp": c.timestamp.isoformat()}


@app.get("/api/astronauts/{astronaut_id}/checkins", )
def get_checkins(astronaut_id: int, limit: int = 50, db: Session = Depends(get_db)):
    a = db.query(Astronaut).filter(Astronaut.id == astronaut_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Astronaut not found")
    return db.query(WellnessCheckin).filter(WellnessCheckin.astronaut_id == astronaut_id).order_by(
        desc(WellnessCheckin.timestamp)
    ).limit(limit).all()


# ---------- Reaction game ----------

@app.post("/api/astronauts/{astronaut_id}/reaction", response_model=dict)
def add_reaction_result(astronaut_id: int, data: ReactionGameResultCreate, db: Session = Depends(get_db)):
    a = db.query(Astronaut).filter(Astronaut.id == astronaut_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Astronaut not found")
    r = ReactionGameResult(astronaut_id=astronaut_id, **data.model_dump(exclude_unset=True))
    db.add(r)
    db.commit()
    db.refresh(r)
    return {"id": r.id, "timestamp": r.timestamp.isoformat()}


@app.get("/api/astronauts/{astronaut_id}/reaction", )
def get_reaction_results(astronaut_id: int, limit: int = 50, db: Session = Depends(get_db)):
    a = db.query(Astronaut).filter(Astronaut.id == astronaut_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Astronaut not found")
    return db.query(ReactionGameResult).filter(ReactionGameResult.astronaut_id == astronaut_id).order_by(
        desc(ReactionGameResult.timestamp)
    ).limit(limit).all()


# ---------- Environment ----------

@app.post("/api/environment", response_model=dict)
def add_environment_reading(data: EnvironmentReadingCreate, db: Session = Depends(get_db)):
    r = EnvironmentReading(**data.model_dump(exclude_unset=True))
    db.add(r)
    db.commit()
    db.refresh(r)
    return {"id": r.id, "timestamp": r.timestamp.isoformat()}


@app.get("/api/environment", )
def get_environment_readings(limit: int = 100, db: Session = Depends(get_db)):
    return db.query(EnvironmentReading).order_by(desc(EnvironmentReading.timestamp)).limit(limit).all()


@app.get("/api/environment/cumulative", response_model=dict)
def get_cumulative_radiation(db: Session = Depends(get_db)):
    readings = db.query(EnvironmentReading).order_by(EnvironmentReading.timestamp).all()
    total_dose = sum(r.radiation_dose for r in readings if r.radiation_dose is not None)
    return {
        'total_dose_mGy': round(total_dose, 3),
        'readings_count': len(readings),
        'latest_reading': readings[-1].radiation_dose if readings else None,
        'latest_source': readings[-1].radiation_source if readings else None,
    }


# ---------- Alerts ----------

@app.get("/api/astronauts/{astronaut_id}/alerts", )
def get_alerts(astronaut_id: int, resolved: Optional[bool] = None, db: Session = Depends(get_db)):
    a = db.query(Astronaut).filter(Astronaut.id == astronaut_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Astronaut not found")
    q = db.query(Alerts).filter(Alerts.astronaut_id == astronaut_id)
    if resolved is not None:
        q = q.filter(Alerts.resolved == resolved)
    return q.order_by(desc(Alerts.timestamp)).all()


@app.put("/api/alerts/{alert_id}/resolve", response_model=dict)
def resolve_alert(alert_id: int, db: Session = Depends(get_db)):
    a = db.query(Alerts).filter(Alerts.id == alert_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Alert not found")
    a.resolved = True
    db.commit()
    return {"id": a.id, "resolved": True}


@app.get("/api/alerts", )
def get_all_alerts(severity: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Alerts)
    if severity:
        q = q.filter(Alerts.severity == severity)
    return q.order_by(desc(Alerts.timestamp)).limit(50).all()


# ---------- Mission Control ----------

@app.get("/api/mission-control/overview", )
def mission_control_overview(db: Session = Depends(get_db)):
    astronauts = db.query(Astronaut).all()
    result = []
    for a in astronauts:
        latest = db.query(Measurement).filter(Measurement.astronaut_id == a.id).order_by(
            desc(Measurement.timestamp)
        ).first()
        open_alerts = db.query(Alerts).filter(
            Alerts.astronaut_id == a.id, Alerts.resolved == False
        ).count()
        critical = db.query(Alerts).filter(
            Alerts.astronaut_id == a.id, Alerts.severity == 'critical', Alerts.resolved == False
        ).count()
        watch = db.query(Alerts).filter(
            Alerts.astronaut_id == a.id, Alerts.severity == 'watch', Alerts.resolved == False
        ).count()
        result.append({
            'id': a.id,
            'name': a.name,
            'role': a.role,
            'mission': a.mission,
            'latest_measurement': {
                'heart_rate': latest.heart_rate if latest else None,
                'hrv': latest.hrv if latest else None,
                'blood_oxygen': latest.blood_oxygen if latest else None,
                'body_temp': latest.body_temp if latest else None,
                'sleep_duration': latest.sleep_duration if latest else None,
                'activity_level': latest.activity_level if latest else None,
                'exercise_recovery': latest.exercise_recovery if latest else None,
            } if latest else None,
            'alerts': {'critical': critical, 'watch': watch, 'total_open': open_alerts},
        })
    return result


# ---------- Copilot ----------

@app.post("/api/copilot/ask", response_model=dict)
def copilot_ask(question: dict, db: Session = Depends(get_db)):
    query = question.get('question', '').strip()
    if not query:
        return {'answer': 'Please ask a health-related question.', 'sources': []}
    docs = retrieve_relevant(query)
    answer, sources = format_answer(query, docs)
    return {'answer': answer, 'sources': sources, 'relevant_topics': [d['title'] for d in docs]}


# ---------- Demo / seed data ----------

@app.post("/api/demo/seed", response_model=dict)
def seed_demo_data(db: Session = Depends(get_db)):
    astronauts = generate_astronauts()
    created = []
    for ast_data in astronauts:
        existing = db.query(Astronaut).filter(Astronaut.name == ast_data['name']).first()
        if existing:
            continue
        a = Astronaut(name=ast_data['name'], mission=ast_data['mission'], role=ast_data['role'])
        db.add(a)
        created.append(a)
    db.commit()

    # Alex gets anomaly scenario starting Day 3 (of 14, representing days before Day 147)
    alex = db.query(Astronaut).filter(Astronaut.name == 'Alex Chen').first()
    if alex:
        measurements = generate_demo_scenario_measurements('Alex Chen', num_days=14, anomaly_day=2)
        for m in measurements:
            m_data = {k: v for k, v in m.items() if k != 'day_offset'}
            db.add(Measurement(astronaut_id=alex.id, **m_data))
        db.commit()

        for m in measurements:
            anomaly_engine.add_measurement(alex.id, m)
        anomaly_engine.train_baselines(alex.id)

        checkins = generate_wellness_checkins(alex.id, num_days=14, anomaly_day=2)
        for c in checkins:
            db.add(WellnessCheckin(astronaut_id=alex.id, **c))
        db.commit()

        reaction_results = generate_reaction_game_results(num_days=14, anomaly_day=2)
        for r in reaction_results:
            db.add(ReactionGameResult(astronaut_id=alex.id, **r))
        db.commit()

        # Run detection on latest measurement to generate alerts
        latest = db.query(Measurement).filter(Measurement.astronaut_id == alex.id).order_by(
            desc(Measurement.timestamp)
        ).first()
        if latest:
            metrics = {
                'heart_rate': latest.heart_rate,
                'hrv': latest.hrv,
                'blood_oxygen': latest.blood_oxygen,
                'body_temp': latest.body_temp,
                'sleep_duration': latest.sleep_duration,
                'activity_level': latest.activity_level,
                'exercise_recovery': latest.exercise_recovery,
            }
            result = anomaly_engine.detect(alex.id, metrics)
            if result['severity'] != 'normal':
                alert = Alerts(
                    astronaut_id=alex.id,
                    severity=result['severity'],
                    title='Health Pattern to Monitor' if result['severity'] == 'watch' else 'Critical Health Alert',
                    description=result['explanation'],
                    deviating_metrics=result['deviating_metrics'],
                    anomaly_score=result['anomaly_score'],
                )
                db.add(alert)
                db.commit()

    # Maria and James get stable data
    for name in ['Maria Santos', 'James Okafor']:
        a = db.query(Astronaut).filter(Astronaut.name == name).first()
        if a:
            measurements = generate_demo_scenario_measurements(name, num_days=14, anomaly_day=None)
            for m in measurements:
                m_data = {k: v for k, v in m.items() if k != 'day_offset'}
                db.add(Measurement(astronaut_id=a.id, **m_data))
            db.commit()
            for m in measurements:
                anomaly_engine.add_measurement(a.id, m)
            anomaly_engine.train_baselines(a.id)

    # Radiation environment data
    if not db.query(EnvironmentReading).first():
        events = generate_radiation_events(days=14)
        for e in events:
            db.add(EnvironmentReading(**e))
        db.commit()

    return {
        'status': 'seeded',
        'astronauts': [a.name for a in created] if created else ['already seeded'],
        'message': 'Demo data initialized. Alex Chen shows a developing anomaly scenario (Day 147 of Mars transit).',
    }


@app.post("/api/demo/simulate-measurement/{astronaut_id}", response_model=dict)
def simulate_next_measurement(astronaut_id: int, db: Session = Depends(get_db)):
    a = db.query(Astronaut).filter(Astronaut.id == astronaut_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Astronaut not found")
    latest = db.query(Measurement).filter(Measurement.astronaut_id == astronaut_id).order_by(
        desc(Measurement.timestamp)
    ).first()
    if not latest:
        raise HTTPException(status_code=404, detail="No prior measurements")

    # Slightly evolve the latest values
    import random as _random
    _random.seed(a.id)
    m = Measurement(
        astronaut_id=astronaut_id,
        heart_rate=latest.heart_rate + _random.gauss(0, 1.0) if latest.heart_rate else None,
        hrv=latest.hrv + _random.gauss(0, 1.5) if latest.hrv else None,
        blood_oxygen=latest.blood_oxygen + _random.gauss(0, 0.2) if latest.blood_oxygen else None,
        body_temp=latest.body_temp + _random.gauss(0, 0.05) if latest.body_temp else None,
        sleep_duration=latest.sleep_duration + _random.gauss(0, 0.3) if latest.sleep_duration else None,
        activity_level=latest.activity_level + _random.gauss(0, 0.3) if latest.activity_level else None,
        exercise_recovery=latest.exercise_recovery + _random.gauss(0, 1.5) if latest.exercise_recovery else None,
    )
    db.add(m)
    db.commit()

    metrics = {
        'heart_rate': m.heart_rate,
        'hrv': m.hrv,
        'blood_oxygen': m.blood_oxygen,
        'body_temp': m.body_temp,
        'sleep_duration': m.sleep_duration,
        'activity_level': m.activity_level,
        'exercise_recovery': m.exercise_recovery,
    }
    anomaly_engine.add_measurement(astronaut_id, metrics)
    result = anomaly_engine.detect(astronaut_id, metrics)

    if result['severity'] != 'normal':
        title_map = {'watch': 'Health Pattern to Monitor', 'critical': 'Critical Health Alert'}
        alert = Alerts(
            astronaut_id=astronaut_id,
            severity=result['severity'],
            title=title_map.get(result['severity'], 'Health Alert'),
            description=result['explanation'],
            deviating_metrics=result['deviating_metrics'],
            anomaly_score=result['anomaly_score'],
        )
        db.add(alert)
        db.commit()

    return {
        'measurement_id': m.id,
        'anomaly': result,
    }


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "ASTRA", "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
