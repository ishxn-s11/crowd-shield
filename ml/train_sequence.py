"""Training pipeline for LSTM and Transformer sequence models.

Generates synthetic sequences, trains both models, and saves checkpoints.
"""
import os
import time
from dataclasses import dataclass
from typing import Optional

import numpy as np

try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import DataLoader
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

from .feature_engineering import CrowdFeatureExtractor, RiskLabelGenerator
from .synthetic_data import generate_scenario_sequence, SCENARIO_PRESETS
from .sequence_models import (
    LSTMRiskModel,
    TemporalTransformerRiskModel,
    CrowdSequenceDataset,
)

import structlog

logger = structlog.get_logger()


@dataclass
class SequenceTrainingConfig:
    """Training configuration for sequence models."""
    # Architecture
    input_dim: int = 43
    hidden_dim: int = 128
    d_model: int = 128
    nhead: int = 8
    num_lstm_layers: int = 2
    num_transformer_layers: int = 4
    dropout: float = 0.15
    seq_len: int = 30

    # Training
    epochs: int = 50
    batch_size: int = 64
    learning_rate: float = 1e-3
    weight_decay: float = 1e-4
    lr_patience: int = 8
    lr_factor: float = 0.5
    early_stop_patience: int = 12
    grad_clip: float = 1.0

    # Data
    num_samples_per_scenario: int = 40
    total_frames: int = 100
    val_split: float = 0.15
    seed: int = 42

    # Paths
    save_dir: str = "ml/models"
    lstm_filename: str = "lstm_risk_model.pt"
    transformer_filename: str = "transformer_risk_model.pt"


def generate_sequence_dataset(
    config: SequenceTrainingConfig,
) -> tuple[np.ndarray, np.ndarray, list[str]]:
    """Generate training dataset of sequences with risk labels.

    Returns:
        features: (N, seq_len, num_features)
        labels: (N,) risk scores
        feature_names: list of feature names
    """
    extractor = CrowdFeatureExtractor()
    label_gen = RiskLabelGenerator()

    all_features = []
    all_labels = []

    np.random.seed(config.seed)

    for scenario_name, scenario_config in SCENARIO_PRESETS.items():
        for _ in range(config.num_samples_per_scenario):
            # Vary parameters slightly
            import copy
            varied = copy.deepcopy(scenario_config)
            varied.area_sqm *= np.random.uniform(0.7, 1.3)
            varied.density_peak *= np.random.uniform(0.8, 1.2)
            varied.rise_time = max(5, varied.rise_time + np.random.randint(-5, 6))
            varied.fall_time = max(5, varied.fall_time + np.random.randint(-5, 6))

            # Generate time series
            history = generate_scenario_sequence(varied, config.total_frames)

            # Extract features for entire history first
            zone_config = {
                "area_sqm": varied.area_sqm,
                "max_capacity": int(varied.area_sqm * varied.density_peak * 1.2),
                "critical_density": varied.density_peak * 0.8,
            }
            
            # Build cumulative feature vectors for each timestep
            all_frame_feats = []
            for i in range(len(history)):
                # Use all history up to frame i (the extractor uses a window)
                cumulative = history[:i + 1]
                feat = extractor.extract(cumulative, zone_config)
                if feat is not None:
                    all_frame_feats.append(feat)
                else:
                    # Not enough history yet, use zeros
                    all_frame_feats.append(np.zeros(extractor.num_features, dtype=np.float32))
            
            # Create sliding windows of fixed length
            for i in range(config.seq_len, len(all_frame_feats)):
                seq = np.stack(all_frame_feats[i - config.seq_len:i])
                label = label_gen.generate_label(history[i])
                all_features.append(seq)
                all_labels.append(label)

    features = np.array(all_features, dtype=np.float32)
    labels = np.array(all_labels, dtype=np.float32)

    logger.info("dataset_generated",
                features_shape=features.shape,
                labels_shape=labels.shape,
                label_mean=round(float(labels.mean()), 2),
                label_std=round(float(labels.std()), 2))

    return features, labels, extractor.FEATURE_NAMES


def train_lstm(
    features: np.ndarray,
    labels: np.ndarray,
    config: SequenceTrainingConfig,
) -> dict:
    """Train the LSTM model."""
    if not HAS_TORCH:
        raise RuntimeError("PyTorch not available")

    device = torch.device('cpu')
    input_dim = features.shape[2]

    # Split train/val
    n = len(features)
    n_val = int(n * config.val_split)
    indices = np.random.permutation(n)
    train_idx = indices[n_val:]
    val_idx = indices[:n_val]

    train_dataset = CrowdSequenceDataset(features[train_idx], labels[train_idx])
    val_dataset = CrowdSequenceDataset(features[val_idx], labels[val_idx])

    train_loader = DataLoader(train_dataset, batch_size=config.batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=config.batch_size)

    # Create model
    model = LSTMRiskModel(
        input_dim=input_dim,
        hidden_dim=config.hidden_dim,
        num_layers=config.num_lstm_layers,
        dropout=config.dropout,
        bidirectional=True,
    ).to(device)

    optimizer = optim.AdamW(model.parameters(), lr=config.learning_rate, weight_decay=config.weight_decay)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=config.lr_patience, factor=config.lr_factor)
    criterion = nn.SmoothL1Loss()  # Huber loss

    logger.info("lstm_training_start",
                params=sum(p.numel() for p in model.parameters()),
                train_samples=len(train_dataset),
                val_samples=len(val_dataset))

    best_val_loss = float('inf')
    patience_counter = 0
    history = {"train_loss": [], "val_loss": [], "val_mae": []}

    for epoch in range(config.epochs):
        # Train
        model.train()
        train_losses = []
        for batch_x, batch_y in train_loader:
            batch_x, batch_y = batch_x.to(device), batch_y.to(device)
            optimizer.zero_grad()
            pred = model(batch_x)
            loss = criterion(pred, batch_y)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), config.grad_clip)
            optimizer.step()
            train_losses.append(loss.item())

        # Validate
        model.eval()
        val_losses = []
        val_errors = []
        with torch.no_grad():
            for batch_x, batch_y in val_loader:
                batch_x, batch_y = batch_x.to(device), batch_y.to(device)
                pred = model(batch_x)
                loss = criterion(pred, batch_y)
                mae = torch.mean(torch.abs(pred - batch_y))
                val_losses.append(loss.item())
                val_errors.append(mae.item())

        avg_train = np.mean(train_losses)
        avg_val = np.mean(val_losses)
        avg_mae = np.mean(val_errors)

        history["train_loss"].append(avg_train)
        history["val_loss"].append(avg_val)
        history["val_mae"].append(avg_mae)

        scheduler.step(avg_val)

        if (epoch + 1) % 5 == 0:
            logger.info("lstm_epoch",
                       epoch=epoch + 1,
                       train_loss=round(avg_train, 4),
                       val_loss=round(avg_val, 4),
                       val_mae=round(avg_mae, 3),
                       lr=round(optimizer.param_groups[0]['lr'], 6))

        # Early stopping
        if avg_val < best_val_loss:
            best_val_loss = avg_val
            patience_counter = 0
            # Save best model
            save_path = os.path.join(config.save_dir, config.lstm_filename)
            os.makedirs(config.save_dir, exist_ok=True)
            torch.save(model.state_dict(), save_path)
        else:
            patience_counter += 1
            if patience_counter >= config.early_stop_patience:
                logger.info("lstm_early_stop", epoch=epoch + 1, best_val_loss=round(best_val_loss, 4))
                break

    return {
        "model": "lstm",
        "best_val_loss": round(best_val_loss, 4),
        "best_val_mae": round(min(history["val_mae"]), 3),
        "epochs_trained": len(history["train_loss"]),
        "save_path": os.path.join(config.save_dir, config.lstm_filename),
    }


def train_transformer(
    features: np.ndarray,
    labels: np.ndarray,
    config: SequenceTrainingConfig,
) -> dict:
    """Train the Temporal Transformer model."""
    if not HAS_TORCH:
        raise RuntimeError("PyTorch not available")

    device = torch.device('cpu')
    input_dim = features.shape[2]

    # Split train/val
    n = len(features)
    n_val = int(n * config.val_split)
    indices = np.random.permutation(n)
    train_idx = indices[n_val:]
    val_idx = indices[:n_val]

    train_dataset = CrowdSequenceDataset(features[train_idx], labels[train_idx])
    val_dataset = CrowdSequenceDataset(features[val_idx], labels[val_idx])

    train_loader = DataLoader(train_dataset, batch_size=config.batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=config.batch_size)

    # Create model
    model = TemporalTransformerRiskModel(
        input_dim=input_dim,
        d_model=config.d_model,
        nhead=config.nhead,
        num_layers=config.num_transformer_layers,
        dim_feedforward=config.d_model * 2,
        dropout=config.dropout,
        max_seq_len=config.seq_len + 10,
    ).to(device)

    optimizer = optim.AdamW(model.parameters(), lr=config.learning_rate * 0.5, weight_decay=config.weight_decay)
    scheduler = optim.lr_scheduler.CosineAnnealingWarmRestarts(optimizer, T_0=10, T_mult=2)
    criterion = nn.SmoothL1Loss()

    logger.info("transformer_training_start",
                params=sum(p.numel() for p in model.parameters()),
                train_samples=len(train_dataset),
                val_samples=len(val_dataset))

    best_val_loss = float('inf')
    patience_counter = 0
    history = {"train_loss": [], "val_loss": [], "val_mae": []}

    for epoch in range(config.epochs):
        # Train
        model.train()
        train_losses = []
        for batch_x, batch_y in train_loader:
            batch_x, batch_y = batch_x.to(device), batch_y.to(device)
            optimizer.zero_grad()
            pred = model(batch_x)
            loss = criterion(pred, batch_y)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), config.grad_clip)
            optimizer.step()
            train_losses.append(loss.item())

        scheduler.step()

        # Validate
        model.eval()
        val_losses = []
        val_errors = []
        with torch.no_grad():
            for batch_x, batch_y in val_loader:
                batch_x, batch_y = batch_x.to(device), batch_y.to(device)
                pred = model(batch_x)
                loss = criterion(pred, batch_y)
                mae = torch.mean(torch.abs(pred - batch_y))
                val_losses.append(loss.item())
                val_errors.append(mae.item())

        avg_train = np.mean(train_losses)
        avg_val = np.mean(val_losses)
        avg_mae = np.mean(val_errors)

        history["train_loss"].append(avg_train)
        history["val_loss"].append(avg_val)
        history["val_mae"].append(avg_mae)

        if (epoch + 1) % 5 == 0:
            logger.info("transformer_epoch",
                       epoch=epoch + 1,
                       train_loss=round(avg_train, 4),
                       val_loss=round(avg_val, 4),
                       val_mae=round(avg_mae, 3))

        # Early stopping
        if avg_val < best_val_loss:
            best_val_loss = avg_val
            patience_counter = 0
            save_path = os.path.join(config.save_dir, config.transformer_filename)
            os.makedirs(config.save_dir, exist_ok=True)
            torch.save(model.state_dict(), save_path)
        else:
            patience_counter += 1
            if patience_counter >= config.early_stop_patience:
                logger.info("transformer_early_stop", epoch=epoch + 1)
                break

    return {
        "model": "transformer",
        "best_val_loss": round(best_val_loss, 4),
        "best_val_mae": round(min(history["val_mae"]), 3),
        "epochs_trained": len(history["train_loss"]),
        "save_path": os.path.join(config.save_dir, config.transformer_filename),
    }


def train_all(config: SequenceTrainingConfig | None = None) -> dict:
    """Train both LSTM and Transformer models.

    Returns training results for both models.
    """
    if config is None:
        config = SequenceTrainingConfig()

    logger.info("sequence_training_start")

    # Generate dataset
    t0 = time.time()
    features, labels, feature_names = generate_sequence_dataset(config)
    data_time = time.time() - t0

    logger.info("dataset_ready", samples=len(labels), time_s=round(data_time, 1))

    results = {}

    # Train LSTM
    logger.info("training_lstm")
    t0 = time.time()
    lstm_result = train_lstm(features, labels, config)
    lstm_result["training_time_s"] = round(time.time() - t0, 1)
    results["lstm"] = lstm_result
    logger.info("lstm_complete", **{k: v for k, v in lstm_result.items() if k != "model"})

    # Train Transformer
    logger.info("training_transformer")
    t0 = time.time()
    tf_result = train_transformer(features, labels, config)
    tf_result["training_time_s"] = round(time.time() - t0, 1)
    results["transformer"] = tf_result
    logger.info("transformer_complete", **{k: v for k, v in tf_result.items() if k != "model"})

    return results


if __name__ == "__main__":
    import sys

    print("=" * 60)
    print("CrowdShield Sequence Model Training")
    print("=" * 60)

    config = SequenceTrainingConfig(
        epochs=40,
        batch_size=64,
        num_samples_per_scenario=30,
        total_frames=100,
        seq_len=30,
    )

    results = train_all(config)

    print("\n" + "=" * 60)
    print("Training Results")
    print("=" * 60)
    for model_name, result in results.items():
        print(f"\n{model_name.upper()}:")
        for k, v in result.items():
            if k != "model":
                print(f"  {k}: {v}")

    print("\nModels saved to ml/models/")
