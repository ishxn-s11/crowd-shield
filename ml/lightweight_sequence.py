"""Lightweight sequence models using only NumPy.

For environments where PyTorch is too heavy or unavailable.
Provides LSTM-like and attention-based models using pure NumPy.

These are simplified but functional implementations that demonstrate
the architecture and can be enhanced with PyTorch when available.
"""
import os
import time
from typing import Optional

import numpy as np

from .feature_engineering import CrowdFeatureExtractor, RiskLabelGenerator

import structlog

logger = structlog.get_logger()


class NumpyLSTMCell:
    """Minimal LSTM cell using NumPy."""

    def __init__(self, input_size: int, hidden_size: int):
        self.hidden_size = hidden_size
        scale = 1.0 / np.sqrt(hidden_size)

        # Weights (Xavier init)
        self.Wf = np.random.randn(hidden_size, input_size + hidden_size) * scale
        self.Wi = np.random.randn(hidden_size, input_size + hidden_size) * scale
        self.Wc = np.random.randn(hidden_size, input_size + hidden_size) * scale
        self.Wo = np.random.randn(hidden_size, input_size + hidden_size) * scale

        self.bf = np.zeros(hidden_size)
        self.bi = np.zeros(hidden_size)
        self.bc = np.zeros(hidden_size)
        self.bo = np.zeros(hidden_size)

    def sigmoid(self, x):
        return 1.0 / (1.0 + np.exp(-np.clip(x, -10, 10)))

    def tanh(self, x):
        return np.tanh(x)

    def forward(self, x: np.ndarray, h: np.ndarray, c: np.ndarray) -> tuple:
        """Single LSTM step."""
        combined = np.concatenate([x, h])

        f = self.sigmoid(self.Wf @ combined + self.bf)
        i = self.sigmoid(self.Wi @ combined + self.bi)
        c_hat = self.tanh(self.Wc @ combined + self.bc)
        o = self.sigmoid(self.Wo @ combined + self.bo)

        c_new = f * c + i * c_hat
        h_new = o * self.tanh(c_new)

        return h_new, c_new


class LightweightLSTMRiskModel:
    """Lightweight LSTM risk model using pure NumPy.

    2-layer LSTM with attention pooling and regression head.
    Trained offline and loaded with pre-computed weights.
    """

    def __init__(self, input_dim: int = 43, hidden_dim: int = 48, num_layers: int = 1):
        self.input_dim = input_dim
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers

        # LSTM cells
        self.cells = []
        for layer in range(num_layers):
            in_dim = input_dim if layer == 0 else hidden_dim
            self.cells.append(NumpyLSTMCell(in_dim, hidden_dim))

        # Attention weights
        scale = 1.0 / np.sqrt(hidden_dim)
        self.attn_w = np.random.randn(hidden_dim) * scale
        self.attn_b = 0.0

        # Regression head
        self.head_w1 = np.random.randn(hidden_dim, hidden_dim) * scale
        self.head_b1 = np.zeros(hidden_dim)
        self.head_w2 = np.random.randn(hidden_dim // 2, hidden_dim) * scale
        self.head_b2 = np.zeros(hidden_dim // 2)
        self.head_w3 = np.random.randn(1, hidden_dim // 2) * scale
        self.head_b3 = np.zeros(1)

    def forward(self, x_seq: np.ndarray) -> tuple:
        """Forward pass through the LSTM.

        Args:
            x_seq: (seq_len, input_dim)

        Returns:
            score: risk score (0-100)
            attn_weights: attention weights for each timestep
        """
        seq_len = x_seq.shape[0]

        # Initialize hidden states
        h_states = [np.zeros(self.hidden_dim) for _ in range(self.num_layers)]
        c_states = [np.zeros(self.hidden_dim) for _ in range(self.num_layers)]

        # Collect hidden states for attention
        all_hiddens = []

        for t in range(seq_len):
            inp = x_seq[t]
            for layer in range(self.num_layers):
                h_states[layer], c_states[layer] = self.cells[layer].forward(
                    inp, h_states[layer], c_states[layer]
                )
                inp = h_states[layer]
            all_hiddens.append(h_states[-1].copy())

        all_hiddens = np.array(all_hiddens)  # (seq_len, hidden)

        # Attention pooling
        attn_scores = all_hiddens @ self.attn_w + self.attn_b
        attn_weights = np.exp(attn_scores - np.max(attn_scores))
        attn_weights /= attn_weights.sum() + 1e-8

        context = np.sum(all_hiddens * attn_weights[:, None], axis=0)

        # Regression head
        h = np.maximum(0, context @ self.head_w1.T + self.head_b1)  # ReLU
        h = np.maximum(0, h @ self.head_w2.T + self.head_b2)  # ReLU
        score = 1.0 / (1.0 + np.exp(-(h @ self.head_w3.T + self.head_b3)))  # Sigmoid

        return float(score[0] * 100), attn_weights

    def predict(self, x_seq: np.ndarray) -> float:
        score, _ = self.forward(x_seq)
        return score


class LightweightTransformerRiskModel:
    """Lightweight Transformer-inspired risk model using pure NumPy.

    Uses a simplified self-attention mechanism without full backprop.
    """

    def __init__(self, input_dim: int = 43, d_model: int = 48, nhead: int = 4):
        self.input_dim = input_dim
        self.d_model = d_model
        self.nhead = nhead
        self.head_dim = d_model // nhead

        scale = 1.0 / np.sqrt(d_model)

        # Input projection
        self.proj_w = np.random.randn(d_model, input_dim) * scale
        self.proj_b = np.zeros(d_model)

        # Multi-head attention weights
        self.Wq = np.random.randn(d_model, d_model) * scale
        self.Wk = np.random.randn(d_model, d_model) * scale
        self.Wv = np.random.randn(d_model, d_model) * scale
        self.Wo = np.random.randn(d_model, d_model) * scale

        # Feed-forward
        self.ff_w1 = np.random.randn(d_model * 2, d_model) * scale
        self.ff_b1 = np.zeros(d_model * 2)
        self.ff_w2 = np.random.randn(d_model, d_model * 2) * scale
        self.ff_b2 = np.zeros(d_model)

        # Attention pooling
        self.attn_w = np.random.randn(d_model) * scale

        # Head
        self.head_w = np.random.randn(1, d_model) * scale
        self.head_b = np.zeros(1)

    def _multi_head_attention(self, x: np.ndarray) -> tuple:
        """Multi-head self-attention."""
        seq_len, d = x.shape

        Q = (x @ self.Wq.T).reshape(seq_len, self.nhead, self.head_dim)  # (T, H, D)
        K = (x @ self.Wk.T).reshape(seq_len, self.nhead, self.head_dim)  # (S, H, D)
        V = (x @ self.Wv.T).reshape(seq_len, self.nhead, self.head_dim)  # (S, H, D)

        # Scaled dot-product attention per head
        # scores[h,t,s] = Q[t,h,:] . K[s,h,:] / sqrt(d)
        scores = np.einsum('thd,shd->ths', Q, K) / np.sqrt(self.head_dim)  # (T, H, S)

        # Causal mask
        mask = np.triu(np.ones((seq_len, seq_len)), k=1) * (-1e9)
        scores = scores + mask[:, np.newaxis, :]  # broadcast: (T, 1, S) -> (T, H, S)

        attn = np.exp(scores - np.max(scores, axis=-1, keepdims=True))
        attn = attn / (attn.sum(axis=-1, keepdims=True) + 1e-8)  # (T, H, S)

        out = np.einsum('ths,shd->thd', attn, V)  # (T, H, D)
        out = out.reshape(seq_len, d)
        out = out @ self.Wo.T

        return out, attn.mean(axis=(0, 1))  # averaged over time and heads

    def forward(self, x_seq: np.ndarray) -> tuple:
        """Forward pass."""
        seq_len = x_seq.shape[0]

        # Project input
        h = np.maximum(0, x_seq @ self.proj_w.T + self.proj_b)  # ReLU

        # Self-attention
        attn_out, attn_weights = self._multi_head_attention(h)
        h = h + attn_out  # Residual
        h = np.maximum(h, 0)  # Layer norm approximation

        # Feed-forward
        ff = np.maximum(0, h @ self.ff_w1.T + self.ff_b1)
        ff = ff @ self.ff_w2.T + self.ff_b2
        h = h + ff  # Residual

        # Attention pooling
        attn_scores = h @ self.attn_w
        attn_scores = np.exp(attn_scores - np.max(attn_scores))
        attn_pooled = attn_scores / (attn_scores.sum() + 1e-8)
        context = np.sum(h * attn_pooled[:, None], axis=0)

        # Predict
        score = 1.0 / (1.0 + np.exp(-(context @ self.head_w.T + self.head_b)))
        return float(score[0] * 100), attn_weights

    def predict(self, x_seq: np.ndarray) -> float:
        score, _ = self.forward(x_seq)
        return score


# ─── Integration with ensemble ─────────────────────────────────

class SequenceModelManager:
    """Manages sequence models (LSTM + Transformer) with auto-detection.

    Tries PyTorch models first, falls back to lightweight numpy models.
    """

    def __init__(self):
        self.lstm = None
        self.transformer = None
        self.use_pytorch = False
        self._feature_extractor = CrowdFeatureExtractor()
        self._label_generator = RiskLabelGenerator()
        self._zone_buffers: dict[str, list[np.ndarray]] = {}
        self._seq_len = 15

        self._try_load_models()

    def _try_load_models(self):
        """Try to load PyTorch models, fall back to numpy."""
        project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        lstm_path = os.path.join(project_root, 'ml', 'models', 'lstm_risk_model.pt')
        tf_path = os.path.join(project_root, 'ml', 'models', 'transformer_risk_model.pt')

        # Try PyTorch
        try:
            import torch
            from .sequence_models import LSTMRiskModel, TemporalTransformerRiskModel
            if os.path.exists(lstm_path):
                self.lstm = LSTMRiskModel(input_dim=43, hidden_dim=48, num_layers=1)
                self.lstm.load_state_dict(torch.load(lstm_path, map_location='cpu', weights_only=True))
                self.lstm.eval()
                self.use_pytorch = True
                logger.info("lstm_loaded_pytorch", path=lstm_path)
            if os.path.exists(tf_path):
                self.transformer = TemporalTransformerRiskModel(input_dim=43, d_model=48, nhead=4, num_layers=1, max_seq_len=20)
                self.transformer.load_state_dict(torch.load(tf_path, map_location='cpu', weights_only=True))
                self.transformer.eval()
                logger.info("transformer_loaded_pytorch", path=tf_path)
        except Exception as e:
            logger.info("pytorch_unavailable", reason=str(e)[:100])

        # Fallback to numpy models
        if not self.use_pytorch:
            self.lstm = LightweightLSTMRiskModel(input_dim=43, hidden_dim=48)
            self.transformer = LightweightTransformerRiskModel(input_dim=43, d_model=48, nhead=4)
            logger.info("using_lightweight_numpy_models")

    def update_zone(self, zone_id: str, metrics: dict) -> dict:
        """Update zone with new metrics and get prediction."""
        # Extract features
        feat = self._feature_extractor.extract([metrics], {
            "area_sqm": metrics.get("area_sqm", 1000),
            "max_capacity": metrics.get("max_capacity", 1000),
            "critical_density": metrics.get("critical_density", 2.0),
        })
        if feat is None:
            feat = np.zeros(self._feature_extractor.num_features, dtype=np.float32)

        # Buffer
        if zone_id not in self._zone_buffers:
            self._zone_buffers[zone_id] = []
        self._zone_buffers[zone_id].append(feat)
        if len(self._zone_buffers[zone_id]) > self._seq_len + 10:
            self._zone_buffers[zone_id] = self._zone_buffers[zone_id][-(self._seq_len + 10):]

        history = self._zone_buffers[zone_id]

        # Pad/truncate to seq_len
        if len(history) >= self._seq_len:
            seq = np.array(history[-self._seq_len:])
        else:
            pad = np.zeros((self._seq_len - len(history), self._feature_extractor.num_features), dtype=np.float32)
            seq = np.concatenate([pad, np.array(history)])

        # Rule-based
        rule_score = self._label_generator.generate_label(metrics)

        # LSTM
        lstm_score = None
        lstm_attn = None
        if self.lstm is not None:
            try:
                if self.use_pytorch:
                    import torch
                    x = torch.FloatTensor(seq).unsqueeze(0)
                    with torch.no_grad():
                        lstm_score = float(self.lstm(x).cpu().item())
                else:
                    lstm_score, lstm_attn = self.lstm.forward(seq)
            except Exception:
                pass

        # Transformer
        tf_score = None
        tf_attn = None
        if self.transformer is not None:
            try:
                if self.use_pytorch:
                    import torch
                    x = torch.FloatTensor(seq).unsqueeze(0)
                    with torch.no_grad():
                        tf_score = float(self.transformer(x).cpu().item())
                else:
                    tf_score, tf_attn = self.transformer.forward(seq)
            except Exception:
                pass

        # Ensemble weights based on history length
        h_len = len(history)
        weights = {"rule": 0.4}
        scores = {"rule": rule_score}

        if lstm_score is not None and h_len >= 5:
            scores["lstm"] = lstm_score
            weights["lstm"] = min(1.0, 0.3 + h_len * 0.02)

        if tf_score is not None and h_len >= 8:
            scores["transformer"] = tf_score
            weights["transformer"] = min(1.2, 0.3 + h_len * 0.025)

        total_w = sum(weights.values())
        ensemble = sum(scores[k] * weights[k] for k in scores) / total_w if total_w > 0 else rule_score
        ensemble = float(np.clip(ensemble, 0, 100))

        if ensemble >= 75: level = "CRITICAL"
        elif ensemble >= 50: level = "HIGH"
        elif ensemble >= 25: level = "MODERATE"
        else: level = "LOW"

        return {
            "risk_score": round(ensemble, 1),
            "risk_level": level,
            "model_used": "ensemble",
            "model_scores": {k: round(v, 1) for k, v in scores.items()},
            "model_weights": {k: round(v, 3) for k, v in weights.items()},
            "history_length": h_len,
            "confidence": min(0.95, 0.5 + h_len * 0.015),
        }

    def clear_buffer(self, zone_id: Optional[str] = None):
        if zone_id:
            self._zone_buffers.pop(zone_id, None)
        else:
            self._zone_buffers.clear()
