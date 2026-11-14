import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error
from collections import defaultdict
import warnings
warnings.filterwarnings('ignore')

METRIC_LABELS = {
    'heart_rate': 'Heart Rate',
    'hrv': 'Heart Rate Variability',
    'blood_oxygen': 'Blood Oxygen Saturation',
    'body_temp': 'Body Temperature',
    'sleep_duration': 'Sleep Duration',
    'activity_level': 'Physical Activity Level',
    'exercise_recovery': 'Exercise Recovery',
}

METRIC_UNITS = {
    'heart_rate': 'BPM',
    'hrv': 'ms',
    'blood_oxygen': '%SpO2',
    'body_temp': '°C',
    'sleep_duration': 'hours',
    'activity_level': 'index',
    'exercise_recovery': 'min',
}

NORMAL_RANGES = {
    'heart_rate': (55, 85),
    'hrv': (25, 70),
    'blood_oxygen': (95, 100),
    'body_temp': (36.0, 37.5),
    'sleep_duration': (6, 9),
    'activity_level': (2, 8),
    'exercise_recovery': (15, 45),
}


class PersonalizedAnomalyEngine:
    def __init__(self, contamination=0.15, random_state=42):
        self.contamination = contamination
        self.random_state = random_state
        self.models = {}
        self.baselines = {}
        self.history = defaultdict(list)
        self._warmup_samples = 5

    def add_measurement(self, astronaut_id, metrics):
        for key, value in metrics.items():
            if value is not None:
                self.history[astronaut_id].append({key: value})

    def train_baselines(self, astronaut_id):
        if astronaut_id not in self.history:
            return {}
        records = self.history[astronaut_id]
        if len(records) < self._warmup_samples:
            return {}
        df = pd.DataFrame(records)
        df = df.dropna(how='all')
        baselines = {}
        for col in df.columns:
            if df[col].dtype in ('float64', 'int64') and len(df[col].dropna()) >= self._warmup_samples:
                mean = float(df[col].mean())
                std = float(df[col].std())
                if std == 0 or np.isnan(std):
                    std = abs(mean * 0.1) if mean != 0 else 1.0
                baselines[col] = {'mean': mean, 'std': std}
                self.baselines[f"{astronaut_id}:{col}"] = {'mean': mean, 'std': std}
        if baselines:
            X = df[list(baselines.keys())].values
            X = np.nan_to_num(X, nan=0.0)
            clf = IsolationForest(
                contamination=self.contamination,
                random_state=self.random_state,
                n_estimators=100,
                max_samples='auto',
            )
            clf.fit(X)
            self.models[astronaut_id] = clf
        return baselines

    def get_baseline(self, astronaut_id, metric):
        key = f"{astronaut_id}:{metric}"
        if key in self.baselines:
            return self.baselines[key]
        if astronaut_id in self.history:
            records = self.history[astronaut_id]
            vals = [r.get(metric) for r in records if r.get(metric) is not None]
            if len(vals) >= self._warmup_samples:
                arr = np.array(vals, dtype=float)
                mean = float(arr.mean())
                std = float(arr.std())
                if std == 0 or np.isnan(std):
                    std = abs(mean * 0.1) if mean != 0 else 1.0
                return {'mean': mean, 'std': std}
        return None

    def detect(self, astronaut_id, current_metrics):
        if astronaut_id not in self.models and astronaut_id not in self.baselines:
            self.train_baselines(astronaut_id)
        baselines = {}
        for k, v in self.baselines.items():
            aid, metric = k.split(':', 1)
            if aid == astronaut_id:
                baselines[metric] = v
        if not baselines:
            return self._threshold_only(astronaut_id, current_metrics)
        feature_order = list(baselines.keys())
        X = np.array([[current_metrics.get(m, np.nan) for m in feature_order]])
        X = np.nan_to_num(X, nan=0.0)
        if astronaut_id in self.models:
            score = float(self.models[astronaut_id].score_samples(X)[0])
            anomaly_score = float(-score)
        else:
            zscores = []
            for m in feature_order:
                b = baselines[m]
                val = current_metrics.get(m)
                if val is not None and b['std'] > 0:
                    z = abs(val - b['mean']) / b['std']
                    zscores.append(z)
            anomaly_score = float(np.mean(zscores)) if zscores else 0.0
        deviators = []
        for m, b in baselines.items():
            val = current_metrics.get(m)
            if val is not None and b['std'] > 0:
                z = (val - b['mean']) / b['std']
                if abs(z) > 1.5:
                    direction = 'elevated' if z > 0 else 'reduced'
                    deviators.append({
                        'metric': m,
                        'label': METRIC_LABELS.get(m, m),
                        'unit': METRIC_UNITS.get(m, ''),
                        'current': round(float(val), 2),
                        'baseline': round(float(b['mean']), 2),
                        'deviation': round(float(z), 2),
                        'direction': direction,
                    })
        for m in current_metrics:
            if m not in baselines and current_metrics[m] is not None:
                rng = NORMAL_RANGES.get(m)
                if rng:
                    val = current_metrics[m]
                    if val < rng[0] or val > rng[1]:
                        deviators.append({
                            'metric': m,
                            'label': METRIC_LABELS.get(m, m),
                            'unit': METRIC_UNITS.get(m, ''),
                            'current': round(float(val), 2),
                            'baseline': round(float(np.mean(rng)), 2),
                            'deviation': round(float(abs(val - np.mean(rng)) / (rng[1]-rng[0]) * 4), 2),
                            'direction': 'elevated' if val > rng[1] else 'reduced',
                        })
        deviators.sort(key=lambda d: abs(d['deviation']), reverse=True)
        severity = self._assess_severity(anomaly_score, len(deviators), deviators)
        explanation = self._generate_explanation(astronaut_id, current_metrics, deviators, severity)
        return {
            'anomaly_score': round(min(anomaly_score, 10.0), 3),
            'severity': severity,
            'deviating_metrics': deviators,
            'explanation': explanation,
        }

    def _assess_severity(self, anomaly_score, deviator_count, deviators):
        critical = any(d['deviation'] > 3.0 for d in deviators)
        high_z = sum(1 for d in deviators if d['deviation'] > 2.0)
        if critical or anomaly_score > 6.0 or high_z >= 3:
            return 'critical'
        if anomaly_score > 3.5 or high_z >= 1 or deviator_count >= 3:
            return 'watch'
        return 'normal'

    def _threshold_only(self, astronaut_id, current_metrics):
        deviators = []
        for m, val in current_metrics.items():
            if val is not None:
                rng = NORMAL_RANGES.get(m)
                if rng:
                    mid = np.mean(rng)
                    if val < rng[0] or val > rng[1]:
                        deviators.append({
                            'metric': m,
                            'label': METRIC_LABELS.get(m, m),
                            'unit': METRIC_UNITS.get(m, ''),
                            'current': round(float(val), 2),
                            'baseline': round(float(mid), 2),
                            'deviation': round(float(abs(val - mid) / (rng[1]-rng[0]) * 4), 2),
                            'direction': 'elevated' if val > rng[1] else 'reduced',
                        })
        deviators.sort(key=lambda d: abs(d['deviation']), reverse=True)
        anomaly_score = float(np.mean([abs(d['deviation']) for d in deviators])) if deviators else 0.0
        severity = self._assess_severity(anomaly_score, len(deviators), deviators)
        return {
            'anomaly_score': round(min(anomaly_score, 10.0), 3),
            'severity': severity,
            'deviating_metrics': deviators,
            'explanation': self._generate_explanation(astronaut_id, current_metrics, deviators, severity),
        }

    def _generate_explanation(self, astronaut_id, current, deviators, severity):
        if not deviators:
            return "All monitored health indicators are within the expected personal range for this astronaut. No unusual patterns detected."
        parts = []
        elevated = [d for d in deviators if d['direction'] == 'elevated']
        reduced = [d for d in deviators if d['direction'] == 'reduced']
        if elevated:
            names = [d['label'].lower() for d in elevated[:3]]
            if len(names) == 1:
                parts.append(f"{names[0]} is elevated compared with the personal baseline")
            else:
                parts.append(f"{', '.join(names[:-1])} and {names[-1]} are elevated compared with the personal baseline")
        if reduced:
            names = [d['label'].lower() for d in reduced[:3]]
            if len(names) == 1:
                parts.append(f"{names[0]} is reduced compared with the personal baseline")
            else:
                parts.append(f"{', '.join(names[:-1])} and {names[-1]} are reduced compared with the personal baseline")
        if len(deviators) >= 3:
            parts.append("The combination of changes suggests a coordinated physiological shift rather than isolated variation")
        if severity == 'critical':
            parts.append("This pattern warrants prompt further assessment")
        elif severity == 'watch':
            parts.append("This pattern is worth monitoring over the next few measurements")
        if not parts:
            parts.append("Minor variations from the personal baseline were detected")
        return ". ".join(parts) + "."

    def forecast(self, astronaut_id, metric, steps=5):
        if astronaut_id not in self.history:
            return None
        records = self.history[astronaut_id]
        vals = [r.get(metric) for r in records if r.get(metric) is not None]
        if len(vals) < 3:
            return None
        series = pd.Series(vals, dtype=float).dropna()
        if len(series) < 3:
            return None
        x = np.arange(len(series)).reshape(-1, 1)
        y = series.values
        model = LinearRegression()
        model.fit(x, y)
        slope = float(model.coef_[0])
        preds = model.predict(np.arange(len(series) + steps).reshape(-1, 1))
        trend = 'increasing' if slope > 0.01 * abs(series.mean()) else 'decreasing' if slope < -0.01 * abs(series.mean()) else 'stable'
        return {
            'metric': metric,
            'label': METRIC_LABELS.get(metric, metric),
            'unit': METRIC_UNITS.get(metric, ''),
            'current': round(float(series.iloc[-1]), 2),
            'trend': trend,
            'slope_per_day': round(float(slope), 4),
            'forecast': [round(float(p), 2) for p in preds[-steps:]],
            'forecast_labels': [f'D+{i+1}' for i in range(steps)],
        }


class TrendForecaster:
    def __init__(self, window=7):
        self.window = window

    def analyze(self, series):
        if len(series) < 2:
            return None
        s = pd.Series(series, dtype=float).dropna()
        if len(s) < 2:
            return None
        ma = s.rolling(window=min(self.window, len(s)), min_periods=1).mean()
        recent = s.iloc[-1] if len(s) > 0 else None
        prev = s.iloc[-min(self.window, len(s))] if len(s) >= min(self.window, len(s)) else s.iloc[0]
        change = float(recent - prev) if recent is not None and prev is not None else 0.0
        pct_change = float((change / abs(prev)) * 100) if prev and prev != 0 else 0.0
        direction = 'increasing' if change > 0 else 'decreasing' if change < 0 else 'stable'
        return {
            'current': round(float(recent), 2) if recent is not None else None,
            'moving_average': [round(float(v), 2) for v in ma.values],
            'change': round(change, 2),
            'percent_change': round(pct_change, 1),
            'direction': direction,
        }
