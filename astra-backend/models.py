from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from datetime import datetime
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'astra.db')}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


class Astronaut(Base):
    __tablename__ = "astronauts"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    mission = Column(String, nullable=False)
    role = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    measurements = relationship("Measurement", back_populates="astronaut")
    checkins = relationship("WellnessCheckin", back_populates="astronaut")
    baselines = relationship("Baseline", back_populates="astronaut")


class Measurement(Base):
    __tablename__ = "measurements"
    id = Column(Integer, primary_key=True, index=True)
    astronaut_id = Column(Integer, ForeignKey("astronauts.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    heart_rate = Column(Float, nullable=True)
    hrv = Column(Float, nullable=True)
    blood_oxygen = Column(Float, nullable=True)
    body_temp = Column(Float, nullable=True)
    sleep_duration = Column(Float, nullable=True)
    activity_level = Column(Float, nullable=True)
    exercise_recovery = Column(Float, nullable=True)
    astronaut = relationship("Astronaut", back_populates="measurements")


class Baseline(Base):
    __tablename__ = "baselines"
    id = Column(Integer, primary_key=True, index=True)
    astronaut_id = Column(Integer, ForeignKey("astronauts.id"))
    metric = Column(String, nullable=False)
    mean = Column(Float, nullable=False)
    std = Column(Float, nullable=False)
    learned_at = Column(DateTime, default=datetime.utcnow)
    astronaut = relationship("Astronaut", back_populates="baselines")


class WellnessCheckin(Base):
    __tablename__ = "wellness_checkins"
    id = Column(Integer, primary_key=True, index=True)
    astronaut_id = Column(Integer, ForeignKey("astronauts.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    mood = Column(Integer, nullable=True)
    sleep_quality = Column(Integer, nullable=True)
    stress_level = Column(Integer, nullable=True)
    fatigue_level = Column(Integer, nullable=True)
    notes = Column(String, nullable=True)
    astronaut = relationship("Astronaut", back_populates="checkins")


class EnvironmentReading(Base):
    __tablename__ = "environment_readings"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    radiation_dose = Column(Float, nullable=True)
    radiation_source = Column(String, nullable=True)
    event_type = Column(String, nullable=True)
    description = Column(String, nullable=True)


class Alerts(Base):
    __tablename__ = "alerts"
    id = Column(Integer, primary_key=True, index=True)
    astronaut_id = Column(Integer, ForeignKey("astronauts.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    severity = Column(String, nullable=False)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    deviating_metrics = Column(JSON, nullable=True)
    anomaly_score = Column(Float, nullable=True)
    resolved = Column(Boolean, default=False)


class ReactionGameResult(Base):
    __tablename__ = "reaction_game_results"
    id = Column(Integer, primary_key=True, index=True)
    astronaut_id = Column(Integer, ForeignKey("astronauts.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    reaction_time_ms = Column(Float, nullable=True)
    accuracy = Column(Float, nullable=True)


Base.metadata.create_all(bind=engine)
