"""LSTM Temporal Risk Prediction Model.

Processes sequences of crowd metrics through LSTM layers to capture
temporal dependencies that XGBoost cannot model.

Architecture:
    Input: (batch, seq_len, num_features)
    → LSTM encoder (2 layers, bidirectional)
    → Attention pooling
    → Fully connected head → risk score (0-100)
"""
import os
import time
from dataclasses import dataclass, field
from typing import Optional

import numpy as np

try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import Dataset, DataLoader
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

from .feature_engineering import CrowdFeatureExtractor, FeatureConfig, RiskLabelGenerator

import structlog

logger = structlog.get_logger()


# ─── Dataset ───────────────────────────────────────────────────

class CrowdSequenceDataset(Dataset):
    """Dataset of crowd metric sequences with risk labels.

    Each sample is a window of consecutive metric snapshots
    with the risk label at the final time step.
    """

    def __init__(
        self,
        features: np.ndarray,   # (N, seq_len, num_features)
        labels: np.ndarray,     # (N,)
    ):
        self.features = torch.FloatTensor(features)
        self.labels = torch.FloatTensor(labels)

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        return self.features[idx], self.labels[idx]


# ─── LSTM Model ────────────────────────────────────────────────

class LSTMRiskModel(nn.Module):
    """LSTM-based risk prediction model with attention.

    Architecture:
        1. Linear projection of input features
        2. LSTM encoder (captures temporal patterns)
        3. Self-attention pooling (focuses on important timesteps)
        4. Regression head → risk score (0-100)
    """

    def __init__(
        self,
        input_dim: int = 43,
        hidden_dim: int = 128,
        num_layers: int = 2,
        dropout: float = 0.2,
        bidirectional: bool = True,
    ):
        super().__init__()
        self.input_dim = input_dim
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        self.bidirectional = bidirectional
        self.num_directions = 2 if bidirectional else 1

        # Feature projection
        self.input_proj = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.ReLU(),
            nn.Dropout(dropout),
        )

        # LSTM encoder
        self.lstm = nn.LSTM(
            input_size=hidden_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0,
            bidirectional=bidirectional,
        )

        # Self-attention pooling
        lstm_out_dim = hidden_dim * self.num_directions
        self.attention = nn.Sequential(
            nn.Linear(lstm_out_dim, lstm_out_dim // 2),
            nn.Tanh(),
            nn.Linear(lstm_out_dim // 2, 1),
        )

        # Regression head
        self.head = nn.Sequential(
            nn.Linear(lstm_out_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Dropout(dropout * 0.5),
            nn.Linear(hidden_dim // 2, 1),
            nn.Sigmoid(),  # Output 0-1, scaled to 0-100
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: (batch, seq_len, input_dim)

        Returns:
            risk_scores: (batch,) values in [0, 100]
        """
        # Project features
        h = self.input_proj(x)  # (batch, seq, hidden)

        # LSTM encoding
        lstm_out, (h_n, c_n) = self.lstm(h)  # lstm_out: (batch, seq, hidden*directions)

        # Self-attention pooling
        attn_weights = self.attention(lstm_out)  # (batch, seq, 1)
        attn_weights = torch.softmax(attn_weights, dim=1)
        context = torch.sum(lstm_out * attn_weights, dim=1)  # (batch, hidden*directions)

        # Predict risk score
        score = self.head(context)  # (batch, 1)
        score = score.squeeze(-1) * 100.0  # Scale to 0-100

        return score

    def get_attention_weights(self, x: torch.Tensor) -> torch.Tensor:
        """Get attention weights for explainability."""
        with torch.no_grad():
            h = self.input_proj(x)
            lstm_out, _ = self.lstm(h)
            attn_weights = self.attention(lstm_out)
            attn_weights = torch.softmax(attn_weights, dim=1)
            return attn_weights.squeeze(-1)


# ─── Temporal Transformer Model ────────────────────────────────

class PositionalEncoding(nn.Module):
    """Sinusoidal positional encoding for transformer input."""

    def __init__(self, d_model: int, max_len: int = 128):
        super().__init__()
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-np.log(10000.0) / d_model))
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        pe = pe.unsqueeze(0)  # (1, max_len, d_model)
        self.register_buffer('pe', pe)

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return x + self.pe[:, :x.size(1)]


class TemporalTransformerRiskModel(nn.Module):
    """Transformer-based risk prediction model.

    Uses multi-head self-attention to capture complex temporal
    dependencies and long-range patterns in crowd dynamics.

    Architecture:
        1. Linear projection + positional encoding
        2. Transformer encoder (multi-head attention layers)
        3. Global attention pooling
        4. Regression head → risk score (0-100)

    Advantages over LSTM:
        - Parallelizable (faster training)
        - Better long-range dependency modeling
        - Interpretable attention maps
    """

    def __init__(
        self,
        input_dim: int = 43,
        d_model: int = 128,
        nhead: int = 8,
        num_layers: int = 4,
        dim_feedforward: int = 256,
        dropout: float = 0.15,
        max_seq_len: int = 128,
    ):
        super().__init__()
        self.input_dim = input_dim
        self.d_model = d_model

        # Input projection
        self.input_proj = nn.Sequential(
            nn.Linear(input_dim, d_model),
            nn.LayerNorm(d_model),
            nn.ReLU(),
            nn.Dropout(dropout),
        )

        # Positional encoding
        self.pos_encoding = PositionalEncoding(d_model, max_seq_len)

        # Transformer encoder
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=dim_feedforward,
            dropout=dropout,
            batch_first=True,
            activation='gelu',
        )
        self.transformer = nn.TransformerEncoder(
            encoder_layer,
            num_layers=num_layers,
        )

        # Temporal attention pooling
        self.temporal_attn = nn.Sequential(
            nn.Linear(d_model, d_model // 2),
            nn.Tanh(),
            nn.Linear(d_model // 2, 1),
        )

        # Regression head
        self.head = nn.Sequential(
            nn.Linear(d_model, d_model),
            nn.LayerNorm(d_model),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(d_model, d_model // 2),
            nn.GELU(),
            nn.Dropout(dropout * 0.5),
            nn.Linear(d_model // 2, 1),
            nn.Sigmoid(),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        """
        Args:
            x: (batch, seq_len, input_dim)

        Returns:
            risk_scores: (batch,) values in [0, 100]
        """
        # Project and add positional encoding
        h = self.input_proj(x)
        h = self.pos_encoding(h)

        # Transformer encoding
        # Create causal mask for autoregressive prediction
        seq_len = x.size(1)
        mask = torch.triu(torch.ones(seq_len, seq_len, device=x.device), diagonal=1).bool()

        h = self.transformer(h, mask=mask)  # (batch, seq, d_model)

        # Temporal attention pooling
        attn_weights = self.temporal_attn(h)  # (batch, seq, 1)
        attn_weights = torch.softmax(attn_weights, dim=1)
        context = torch.sum(h * attn_weights, dim=1)  # (batch, d_model)

        # Predict risk
        score = self.head(context)
        score = score.squeeze(-1) * 100.0

        return score

    def get_attention_weights(self, x: torch.Tensor) -> torch.Tensor:
        """Get attention weights for explainability."""
        with torch.no_grad():
            h = self.input_proj(x)
            h = self.pos_encoding(h)
            seq_len = x.size(1)
            mask = torch.triu(torch.ones(seq_len, seq_len, device=x.device), diagonal=1).bool()
            h = self.transformer(h, mask=mask)
            attn_weights = self.temporal_attn(h)
            attn_weights = torch.softmax(attn_weights, dim=1)
            return attn_weights.squeeze(-1)


# ─── Ensemble Model ────────────────────────────────────────────

class EnsembleRiskModel:
    """Hybrid ensemble combining XGBoost + LSTM + Transformer.

    Each model votes on the risk score, and the ensemble
    combines predictions with learned weights.

    Prediction strategy:
        - For short histories (<10 frames): rely more on XGBoost
        - For medium histories (10-30): balanced weighting
        - For long histories (>30): rely more on sequence models
    """

    def __init__(self):
        self.xgboost_predictor = None
        self.lstm_model: Optional[LSTMRiskModel] = None
        self.transformer_model: Optional[TemporalTransformerRiskModel] = None
        self._feature_extractor = CrowdFeatureExtractor()
        self._label_generator = RiskLabelGenerator()
        self._sequence_buffer: dict[str, list[np.ndarray]] = {}
        self._device = 'cpu'
        self._lstm_seq_len = 30
        self._transformer_seq_len = 30

    @property
    def is_ready(self) -> bool:
        return any([
            self.xgboost_predictor is not None,
            self.lstm_model is not None,
            self.transformer_model is not None,
        ])

    def load_xgboost(self, path: str):
        """Load XGBoost model."""
        from .training import RiskPredictor
        self.xgboost_predictor = RiskPredictor()
        self.xgboost_predictor.load(path)
        logger.info("xgboost_loaded", path=path)

    def load_lstm(self, path: str, input_dim: int = 43):
        """Load LSTM model weights."""
        if not HAS_TORCH:
            logger.warning("torch_not_available")
            return
        self.lstm_model = LSTMRiskModel(input_dim=input_dim)
        self.lstm_model.load_state_dict(torch.load(path, map_location=self._device, weights_only=True))
        self.lstm_model.eval()
        logger.info("lstm_loaded", path=path)

    def load_transformer(self, path: str, input_dim: int = 43):
        """Load Transformer model weights."""
        if not HAS_TORCH:
            logger.warning("torch_not_available")
            return
        self.transformer_model = TemporalTransformerRiskModel(input_dim=input_dim)
        self.transformer_model.load_state_dict(torch.load(path, map_location=self._device, weights_only=True))
        self.transformer_model.eval()
        logger.info("transformer_loaded", path=path)

    def predict(
        self,
        zone_id: str,
        metrics: dict,
        features: Optional[np.ndarray] = None,
    ) -> dict:
        """Predict risk score using ensemble.

        Args:
            zone_id: Zone identifier
            metrics: Current crowd metrics dict
            features: Pre-computed feature vector (optional)

        Returns:
            Prediction dict with score, level, confidence, individual model scores
        """
        # Buffer feature vectors for sequence models
        if features is None:
            features = self._feature_extractor.extract([metrics])
            if features is None:
                features = np.zeros(self._feature_extractor.num_features, dtype=np.float32)

        if zone_id not in self._sequence_buffer:
            self._sequence_buffer[zone_id] = []
        self._sequence_buffer[zone_id].append(features)

        # Keep buffer bounded
        max_len = max(self._lstm_seq_len, self._transformer_seq_len) + 10
        if len(self._sequence_buffer[zone_id]) > max_len:
            self._sequence_buffer[zone_id] = self._sequence_buffer[zone_id][-max_len:]

        history = self._sequence_buffer[zone_id]

        # ── Individual model predictions ──
        scores = {}
        weights = {}

        # 1. XGBoost (snapshot only)
        if self.xgboost_predictor and self.xgboost_predictor.is_trained:
            ml_result = self.xgboost_predictor.predict_from_history(
                [metrics],  # single frame
                {"area_sqm": metrics.get("area_sqm", 1000),
                 "max_capacity": metrics.get("max_capacity", 1000),
                 "critical_density": metrics.get("critical_density", 2.0)},
            )
            if ml_result:
                scores["xgboost"] = ml_result["risk_score"]
                weights["xgboost"] = self._get_xgboost_weight(len(history))

        # 2. LSTM (sequence)
        if self.lstm_model and HAS_TORCH:
            lstm_score = self._predict_sequence(self.lstm_model, history, self._lstm_seq_len)
            if lstm_score is not None:
                scores["lstm"] = lstm_score
                weights["lstm"] = self._get_lstm_weight(len(history))

        # 3. Transformer (sequence)
        if self.transformer_model and HAS_TORCH:
            tf_score = self._predict_sequence(self.transformer_model, history, self._transformer_seq_len)
            if tf_score is not None:
                scores["transformer"] = tf_score
                weights["transformer"] = self._get_transformer_weight(len(history))

        # ── Rule-based baseline ──
        rule_score = self._label_generator.generate_label(metrics)
        scores["rule"] = rule_score
        weights["rule"] = self._get_rule_weight(len(history))

        # ── Weighted combination ──
        total_weight = sum(weights.values())
        if total_weight > 0:
            ensemble_score = sum(scores[k] * weights[k] for k in scores) / total_weight
        else:
            ensemble_score = rule_score

        # Clamp to [0, 100]
        ensemble_score = float(np.clip(ensemble_score, 0, 100))

        # Risk level
        if ensemble_score >= 75:
            level = "CRITICAL"
        elif ensemble_score >= 50:
            level = "HIGH"
        elif ensemble_score >= 25:
            level = "MODERATE"
        else:
            level = "LOW"

        return {
            "risk_score": round(ensemble_score, 1),
            "risk_level": level,
            "model_used": "ensemble",
            "model_scores": {k: round(v, 1) for k, v in scores.items()},
            "model_weights": {k: round(v, 3) for k, v in weights.items()},
            "history_length": len(history),
            "confidence": min(0.95, 0.5 + len(history) * 0.01),
        }

    def _predict_sequence(self, model, history: list, seq_len: int) -> Optional[float]:
        """Run sequence model prediction on buffered history."""
        if not HAS_TORCH or len(history) < 5:
            return None

        # Pad or truncate to seq_len
        if len(history) >= seq_len:
            seq = history[-seq_len:]
        else:
            # Pad with zeros at the beginning
            pad_len = seq_len - len(history)
            pad = [np.zeros(self._feature_extractor.num_features, dtype=np.float32)] * pad_len
            seq = pad + list(history)

        # Convert to tensor: (1, seq_len, num_features)
        x = torch.FloatTensor(np.array(seq)).unsqueeze(0).to(self._device)

        try:
            with torch.no_grad():
                score = model(x)
            return float(score.cpu().item())
        except Exception as e:
            logger.warning("sequence_prediction_failed", error=str(e))
            return None

    def _get_xgboost_weight(self, history_len: int) -> float:
        """XGBoost is strong for snapshots, weaker for sequences."""
        return max(0.3, 1.0 - history_len * 0.01)

    def _get_lstm_weight(self, history_len: int) -> float:
        """LSTM needs some history to be useful."""
        if history_len < 5:
            return 0.0
        return min(1.0, 0.3 + history_len * 0.02)

    def _get_transformer_weight(self, history_len: int) -> float:
        """Transformer shines with longer sequences."""
        if history_len < 10:
            return 0.0
        return min(1.2, 0.3 + history_len * 0.025)

    def _get_rule_weight(self, history_len: int) -> float:
        """Rule-based is a stable baseline, always contributes."""
        return 0.4

    def get_attention(self, zone_id: str) -> Optional[dict]:
        """Get attention weights for explainability."""
        if zone_id not in self._sequence_buffer:
            return None
        history = self._sequence_buffer[zone_id]
        if not history or not HAS_TORCH:
            return None

        result = {}
        seq_len = self._transformer_seq_len

        if len(history) >= seq_len:
            seq = history[-seq_len:]
        else:
            pad_len = seq_len - len(history)
            pad = [np.zeros(self._feature_extractor.num_features, dtype=np.float32)] * pad_len
            seq = pad + list(history)

        x = torch.FloatTensor(np.array(seq)).unsqueeze(0).to(self._device)

        if self.transformer_model:
            attn = self.transformer_model.get_attention_weights(x)
            result["transformer"] = attn.cpu().numpy().tolist()[0]

        if self.lstm_model:
            attn = self.lstm_model.get_attention_weights(x)
            result["lstm"] = attn.cpu().numpy().tolist()[0]

        return result

    def clear_buffer(self, zone_id: Optional[str] = None):
        if zone_id:
            self._sequence_buffer.pop(zone_id, None)
        else:
            self._sequence_buffer.clear()


# ─── Singleton ──
ensemble_model = EnsembleRiskModel()
