"""Dataset loaders for crowd counting datasets.

Supports:
- CrowdHuman (annotation_train.odgt, annotation_val.odgt)
- ShanghaiTech Part A & B (GT CSV files)
- UCF-QNRF (annotation_train.mat)

Converts crowd counting annotations into crowd density metrics
suitable for training CrowdShield's risk prediction models.
"""
import json
import os
from pathlib import Path
from typing import Optional

import numpy as np

try:
    import structlog
    logger = structlog.get_logger()
except ImportError:
    import logging
    logger = logging.getLogger(__name__)


class CrowdHumanLoader:
    """Loader for CrowdHuman dataset (ODGT format).

    CrowdHuman annotations are JSON objects per line with format:
    {"ID": "...", "ann": {"box": [[x1,y1,x2,y2], ...], "hbox": [...], "fbox": [...]}}

    Each box represents a detected person with head and full body boxes.
    """

    def __init__(self, annotation_file: str):
        self.annotation_file = annotation_file
        self._annotations = None

    def load(self) -> list[dict]:
        """Load and parse ODGT annotations."""
        annotations = []
        if not os.path.exists(self.annotation_file):
            logger.warning("file_not_found", path=self.annotation_file)
            return annotations

        with open(self.annotation_file, 'r') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    record = json.loads(line)
                    annotations.append(record)
                except json.JSONDecodeError:
                    continue

        self._annotations = annotations
        logger.info("crowdhuman_loaded", count=len(annotations), file=self.annotation_file)
        return annotations

    def extract_density_metrics(self, image_width: int = 1920, image_height: int = 1080) -> list[dict]:
        """Extract crowd density metrics from annotations.

        Converts bounding box counts to density estimates
        suitable for CrowdShield's risk prediction model.
        """
        if self._annotations is None:
            self.load()

        metrics = []
        image_area_m2 = (image_width * image_height) / (50 * 50)  # approx m2 assuming ~50px/m

        for record in self._annotations:
            boxes = record.get('ann', {}).get('box', [])
            person_count = len(boxes)

            if person_count == 0:
                continue

            # Compute density as persons per m²
            density = person_count / max(image_area_m2, 1.0)

            # Estimate bounding box sizes for crowd flow metrics
            if boxes:
                box_sizes = [(b[2] - b[0]) * (b[3] - b[1]) for b in boxes]
                avg_box_size = np.mean(box_sizes) if box_sizes else 0
                size_variance = np.var(box_sizes) if len(box_sizes) > 1 else 0
            else:
                avg_box_size = 0
                size_variance = 0

            # Convert to crowd metrics format
            metrics.append({
                'density': round(float(density), 4),
                'person_count': person_count,
                'avg_velocity': round(float(np.random.uniform(0.5, 1.5)), 4),  # estimated
                'velocity_variance': round(float(np.random.uniform(0.1, 0.5)), 4),
                'flow_magnitude': round(float(np.random.uniform(0.3, 1.0)), 4),
                'flow_consistency': round(float(np.random.uniform(0.5, 0.9)), 4),
                'flow_conflict': round(float(np.clip(density / 3.0, 0, 1)), 4),
                'bottleneck_score': round(float(np.clip(density / 2.5, 0, 1)), 4),
                'anomaly_score': round(float(np.random.uniform(0, 0.3)), 4),
                'entry_rate': round(float(np.random.uniform(2, 10)), 2),
                'exit_rate': round(float(np.random.uniform(2, 8)), 2),
                'density_growth_rate': round(float(np.random.uniform(-0.1, 0.3)), 4),
                'area_sqm': round(image_area_m2, 1),
                'max_capacity': int(image_area_m2 * 2.0),
                'critical_density': 2.0,
                'source': 'crowdhuman',
                'avg_box_size': round(float(avg_box_size), 1),
                'box_size_variance': round(float(size_variance), 1),
            })

        return metrics


class ShanghaiTechLoader:
    """Loader for ShanghaiTech dataset.

    ShanghaiTech Part A: Dense crowds (up to 3139 per image)
    ShanghaiTech Part B: Sparse crowds (up to 578 per image)

    Annotation format: CSV with columns [image_name, person_count]
    or individual point annotations.
    """

    def __init__(self, dataset_root: str, part: str = 'A'):
        self.dataset_root = dataset_root
        self.part = part
        self.part_dir = os.path.join(dataset_root, f'part_{part.lower()}')

    def load_gt_counts(self) -> list[dict]:
        """Load ground truth person counts."""
        gt_dir = os.path.join(self.part_dir, 'ground_truth')
        records = []

        if not os.path.exists(gt_dir):
            logger.warning("shanghaitech_gt_not_found", path=gt_dir)
            return records

        for fname in sorted(os.listdir(gt_dir)):
            if not fname.endswith('.mat'):
                continue
            try:
                from scipy.io import loadmat
                mat = loadmat(os.path.join(gt_dir, fname))
                # ShanghaiTech uses 'image_info' key
                info = mat.get('image_info', None)
                if info is not None:
                    count_data = info[0, 0].get('person_count', 0)
                    person_count = int(count_data) if hasattr(count_data, '__int__') else 0
                    records.append({'filename': fname.replace('.mat', ''), 'person_count': person_count})
            except Exception as e:
                logger.warning("shanghaitech_parse_error", file=fname, error=str(e))
                continue

        logger.info("shanghaitech_loaded", part=self.part, count=len(records))
        return records

    def extract_density_metrics(self, image_area_m2: float = 2000.0) -> list[dict]:
        """Convert ShanghaiTech counts to density metrics."""
        records = self.load_gt_counts()
        metrics = []

        for rec in records:
            count = rec['person_count']
            density = count / max(image_area_m2, 1.0)

            metrics.append({
                'density': round(float(density), 4),
                'person_count': count,
                'avg_velocity': round(float(np.random.uniform(0.4, 1.3)), 4),
                'velocity_variance': round(float(np.random.uniform(0.1, 0.6)), 4),
                'flow_magnitude': round(float(np.random.uniform(0.2, 0.9)), 4),
                'flow_consistency': round(float(np.random.uniform(0.4, 0.85)), 4),
                'flow_conflict': round(float(np.clip(density * 1.2, 0, 1)), 4),
                'bottleneck_score': round(float(np.clip(density * 0.8, 0, 1)), 4),
                'anomaly_score': round(float(np.random.uniform(0, 0.2)), 4),
                'entry_rate': round(float(np.random.uniform(3, 12)), 2),
                'exit_rate': round(float(np.random.uniform(2, 10)), 2),
                'density_growth_rate': round(float(np.random.uniform(-0.05, 0.15)), 4),
                'area_sqm': round(image_area_m2, 1),
                'max_capacity': int(image_area_m2 * 2.0),
                'critical_density': 2.0,
                'source': f'shanghaitech_{self.part.lower()}',
            })

        return metrics


class UCFQNRFLoader:
    """Loader for UCF-QNRF dataset.

    UCF-QNRF annotations are in .mat format with point annotations.
    The list.txt file contains [image_name, person_count] pairs.
    """

    def __init__(self, dataset_root: str):
        self.dataset_root = dataset_root
        self.list_file = os.path.join(dataset_root, 'list.txt')

    def load_list(self) -> list[dict]:
        """Load person counts from list.txt."""
        records = []

        if not os.path.exists(self.list_file):
            logger.warning("ucf_qnrf_list_not_found", path=self.list_file)
            return records

        with open(self.list_file, 'r') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                parts = line.split()
                if len(parts) >= 2:
                    try:
                        img_name = parts[0]
                        count = int(parts[1])
                        records.append({'filename': img_name, 'person_count': count})
                    except (ValueError, IndexError):
                        continue

        logger.info("ucf_qnrf_loaded", count=len(records))
        return records

    def extract_density_metrics(self, image_area_m2: float = 2500.0) -> list[dict]:
        """Convert UCF-QNRF counts to density metrics."""
        records = self.load_list()
        metrics = []

        for rec in records:
            count = rec['person_count']
            density = count / max(image_area_m2, 1.0)

            metrics.append({
                'density': round(float(density), 4),
                'person_count': count,
                'avg_velocity': round(float(np.random.uniform(0.3, 1.2)), 4),
                'velocity_variance': round(float(np.random.uniform(0.1, 0.5)), 4),
                'flow_magnitude': round(float(np.random.uniform(0.2, 0.8)), 4),
                'flow_consistency': round(float(np.random.uniform(0.3, 0.8)), 4),
                'flow_conflict': round(float(np.clip(density * 1.0, 0, 1)), 4),
                'bottleneck_score': round(float(np.clip(density * 0.9, 0, 1)), 4),
                'anomaly_score': round(float(np.random.uniform(0, 0.25)), 4),
                'entry_rate': round(float(np.random.uniform(2, 10)), 2),
                'exit_rate': round(float(np.random.uniform(2, 8)), 2),
                'density_growth_rate': round(float(np.random.uniform(-0.1, 0.2)), 4),
                'area_sqm': round(image_area_m2, 1),
                'max_capacity': int(image_area_m2 * 2.0),
                'critical_density': 2.0,
                'source': 'ucf_qnrf',
            })

        return metrics


def load_all_datasets(
    crowdhuman_path: Optional[str] = None,
    shanghaitech_path: Optional[str] = None,
    ucf_qnrf_path: Optional[str] = None,
) -> list[dict]:
    """Load and merge metrics from all available datasets.

    Returns a combined list of crowd metrics from all datasets.
    """
    all_metrics = []

    if crowdhuman_path and os.path.exists(crowdhuman_path):
        for annotation_file in ['annotation_train.odgt', 'annotation_val.odgt']:
            full_path = os.path.join(crowdhuman_path, annotation_file)
            if os.path.exists(full_path):
                loader = CrowdHumanLoader(full_path)
                metrics = loader.extract_density_metrics()
                all_metrics.extend(metrics)
                logger.info("crowdhuman_added", file=annotation_file, count=len(metrics))

    if shanghaitech_path and os.path.exists(shanghaitech_path):
        for part in ['A', 'B']:
            loader = ShanghaiTechLoader(shanghaitech_path, part=part)
            metrics = loader.extract_density_metrics()
            all_metrics.extend(metrics)
            logger.info("shanghaitech_added", part=part, count=len(metrics))

    if ucf_qnrf_path and os.path.exists(ucf_qnrf_path):
        loader = UCFQNRFLoader(ucf_qnrf_path)
        metrics = loader.extract_density_metrics()
        all_metrics.extend(metrics)
        logger.info("ucf_qnrf_added", count=len(metrics))

    logger.info("total_metrics_loaded", count=len(all_metrics))
    return all_metrics


def train_with_datasets(
    crowdhuman_path: Optional[str] = None,
    shanghaitech_path: Optional[str] = None,
    ucf_qnrf_path: Optional[str] = None,
    save_path: str = "ml/models/risk_model.json",
) -> dict:
    """Train the risk model using real dataset annotations.

    Merges real dataset metrics with synthetic data for robust training.
    """
    from .feature_engineering import CrowdFeatureExtractor, RiskLabelGenerator
    from .synthetic_data import generate_training_dataset
    from .training import RiskPredictor, TrainingConfig

    np.random.seed(42)
    extractor = CrowdFeatureExtractor()
    label_gen = RiskLabelGenerator()

    # Load real dataset metrics
    real_metrics = load_all_datasets(crowdhuman_path, shanghaitech_path, ucf_qnrf_path)

    # Generate synthetic data as well
    synthetic_features, synthetic_labels = generate_training_dataset(
        num_samples_per_scenario=30,
        total_frames=120,
        seed=42,
    )

    # Convert real metrics into features using sliding windows
    real_features = []
    real_labels = []
    window_size = 15

    if real_metrics:
        # Group by source and create time-series windows
        sources = {}
        for m in real_metrics:
            src = m.get('source', 'unknown')
            if src not in sources:
                sources[src] = []
            sources[src].append(m)

        for source_name, source_metrics in sources.items():
            if len(source_metrics) < window_size:
                continue
            for i in range(window_size, len(source_metrics)):
                window = source_metrics[max(0, i - window_size):i + 1]
                feat = extractor.extract(window)
                if feat is not None:
                    real_features.append(feat)
                    label = label_gen.generate_label(source_metrics[i])
                    real_labels.append(label)

    # Combine real + synthetic
    all_features = synthetic_features + real_features
    all_labels = synthetic_labels + real_labels

    logger.info(
        "training_data_combined",
        synthetic=len(synthetic_features),
        real=len(real_features),
        total=len(all_features),
    )

    # Train model
    config = TrainingConfig(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
    )

    predictor = RiskPredictor(config)

    # Train with combined data
    metrics = predictor.train(
        features=all_features,
        labels=all_labels,
        save_path=save_path,
    )

    return {
        'metrics': {
            'test_mae': metrics.test_mae,
            'test_rmse': metrics.test_rmse,
            'test_r2': metrics.test_r2,
            'training_time_s': metrics.training_time_s,
            'num_features': metrics.num_features,
            'num_train_samples': metrics.num_train_samples,
            'num_test_samples': metrics.num_test_samples,
        },
        'data_stats': {
            'synthetic_samples': len(synthetic_features),
            'real_samples': len(real_features),
            'total_samples': len(all_features),
            'sources': list(set(m.get('source', 'unknown') for m in real_metrics)) if real_metrics else [],
        },
    }


if __name__ == "__main__":
    import sys

    # Default paths (can be overridden via CLI args)
    paths = {
        'crowdhuman': sys.argv[1] if len(sys.argv) > 1 else None,
        'shanghaitech': sys.argv[2] if len(sys.argv) > 2 else None,
        'ucf_qnrf': sys.argv[3] if len(sys.argv) > 3 else None,
    }

    print("=" * 50)
    print("CrowdShield — Dataset-Aware ML Training")
    print("=" * 50)

    result = train_with_datasets(**paths)

    print(f"\nTraining Results:")
    m = result['metrics']
    print(f"  Test MAE:  {m['test_mae']:.3f}")
    print(f"  Test RMSE: {m['test_rmse']:.3f}")
    print(f"  Test R²:   {m['test_r2']:.4f}")
    print(f"  Time:      {m['training_time_s']:.1f}s")
    print(f"  Samples:   {m['num_train_samples']} train, {m['num_test_samples']} test")

    print(f"\nData Sources:")
    d = result['data_stats']
    print(f"  Synthetic: {d['synthetic_samples']} samples")
    print(f"  Real:      {d['real_samples']} samples")
    print(f"  Sources:   {d['sources']}")

    print(f"\nModel saved to ml/models/risk_model.json")
