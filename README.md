# CrowdShield 🛡️

> Predict the surge. Prevent the stampede. Save lives.

CrowdShield is an AI-powered crowd safety platform that combines computer vision, machine learning, and real-time monitoring to predict and prevent crowd-related incidents. It provides live density monitoring, risk assessment, and early warning systems for large gatherings.

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│  Dashboard   │────▶│   API Server  │────▶│  ML Pipeline  │
│  (React/Vite)│     │  (FastAPI)   │     │  (PyTorch)    │
└─────────────┘     └──────┬───────┘     └───────────────┘
                           │
                    ┌──────┴───────┐
                    │  Vision Svc  │
                    │  (YOLO/CV)   │
                    └──────────────┘
```

## 🚀 Features

- **Real-time Crowd Density Monitoring** — YOLO-based person detection with density estimation
- **Predictive Risk Engine** — ML-powered risk assessment with configurable thresholds
- **Computer Vision Pipeline** — Person detection, tracking, and zone analytics
- **Interactive Dashboard** — Live WebSocket updates with venue visualization
- **Mobile App** — On-the-go alerts and camera feeds (React Native/Expo)
- **Desktop Command Center** — Electron app for security operations
- **Multi-language Support** — English, Hindi, and Spanish
- **Docker Deployment** — Full containerized stack with docker-compose

## 📁 Project Structure

```
crowd-shield/
├── apps/
│   └── dashboard/          # React + Vite frontend
├── desktop/                # Electron desktop app
├── docs/                   # Project documentation
├── infrastructure/
│   └── docker/             # Dockerfiles for all services
├── ml/                     # Machine learning models & training
├── mobile/                 # React Native mobile app
├── packages/
│   ├── shared-types/       # Shared TypeScript types
│   └── ui/                 # Shared UI components
├── scripts/                # Startup scripts
├── services/
│   ├── api/                # FastAPI backend
│   └── vision/             # Computer vision service
├── tests/                  # Test suites
├── docker-compose.yml      # Full stack orchestration
└── .env.example            # Environment configuration template
```

## 🛠️ Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- Docker & Docker Compose (optional)

### Quick Start with Docker

```bash
git clone https://github.com/ishxn-s11/crowd-shield.git
cd crowd-shield
cp .env.example .env
docker-compose up --build
```

### Manual Setup

```bash
# API Server
cd services/api
pip install -r requirements.txt
python run.py

# Vision Service
cd services/vision
pip install -r requirements.txt
python run.py

# Dashboard
cd apps/dashboard
npm install
npm run dev
```

## 🧪 Testing

```bash
python -m pytest tests/
```

## 📄 License

MIT License

---

## 👥 Contributors

| | Name | Role |
|---|------|------|
| 👤 | **Ishan Singh** | Project Owner & Lead Developer |
| 🤖 | **Buffy (Codebuff)** | AI Coding Agent — Documentation, CI/CD, Testing, Infrastructure |

<sub>Built with ❤️ by the CrowdShield team and [Codebuff](https://codebuff.com) 🤖</sub>
