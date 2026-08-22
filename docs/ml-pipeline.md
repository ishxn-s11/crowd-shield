# ML Risk Prediction Pipeline

## Overview

The ML pipeline predicts crowd risk scores using an ensemble of models:
rule-based + XGBoost + LSTM + Transformer.

## Feature Engineering

**43 features** extracted from crowd time-series data:

| Category | Features |
|----------|----------|
| Snapshot | density, velocity, flow, bottleneck, anomaly |
| Temporal derivatives | deltas at 1 and 5 frames |
| Rolling statistics | mean, std, min, max at 5/15/30 windows |
| Acceleration | 2nd derivative of density and speed |
| Interaction | density×velocity, density×conflict, etc. |
| Capacity | utilization ratio and trend |

## Models

### Rule-Based Engine
- Weighted factor scoring (0-100)
- Hysteresis and confirmation frames
- Always active (weight: 0.40)

### XGBoost Model
- 200 trees, depth 6
- Trained on synthetic crowd scenarios
- Test R² = 0.9975, MAE = 0.736

### LSTM Model
- 2-layer bidirectional LSTM
- Self-attention pooling
- Activates at history ≥ 5 frames

### Transformer Model
- Multi-head self-attention (4 heads)
- Causal masking for autoregressive prediction
- Activates at history ≥ 8 frames

## Ensemble Logic

```
final_score = Σ(model_score × model_weight) / Σ(weights)
```

Adaptive weights based on history length:
- Short (<5): Rule dominates
- Medium (5-8): LSTM activates
- Long (8+): Transformer activates

## Training

```bash
# Train XGBoost
cd crowdshield
python -m ml.training

# Train sequence models (requires PyTorch)
python -c "
from ml.train_sequence import train_all
train_all()
"
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/risk/ml` | XGBoost + Rule hybrid |
| `GET /api/risk/ensemble` | Full ensemble |
| `GET /api/ml/status` | Model status |
| `GET /api/ml/ensemble-status` | Ensemble status |
| `GET /api/ml/features` | Feature names |
