# P2P File Sharing Application

A peer-to-peer messaging and file sharing application with a modern React frontend and Python backend.

## Quick Links

- 📘 [Quick Start Guide](QUICK_START.md) - Get started in 5 minutes
- 🚀 [Deployment Guide](DEPLOYMENT.md) - Production deployment instructions
- 🔧 [Troubleshooting](TROUBLESHOOTING.md) - Common issues and solutions
- 📋 [Setup for Two Devices](SETUP_TWO_DEVICES.md) - Multi-device file sharing

## Features

- **P2P Networking**: Direct peer-to-peer connections for messaging
- **Real-time Dashboard**: React-based UI for monitoring peers and messages
- **REST API**: FastAPI backend exposing peer operations
- **Message Queue**: Thread-safe message processing with priority support
- **Peer Registry**: Automatic peer discovery and status tracking

## Project Structure

```
P2P-file-sharing-application/
├── src/                    # Python backend source
│   ├── backend/           # API and service layer
│   ├── core/              # Core P2P networking
│   ├── security/          # Identity and validation
│   └── cli/               # Command-line interface
├── frontend/              # React frontend
│   └── src/
│       ├── components/    # React components
│       ├── api.ts         # API client
│       └── types.ts       # TypeScript types
├── config/                # Configuration files
├── logs/                  # Application logs
└── requirements.txt       # Python dependencies
```

## Prerequisites

- Python 3.9+
- Node.js 18+ and npm
- (Optional) Docker and Docker Compose

## Installation

### Backend

1. Install Python dependencies:
```bash
cd P2P-file-sharing-application
pip install -r requirements.txt
```

### Frontend

1. Install Node.js dependencies:
```bash
cd frontend
npm install
```

## Running the Application

### Option 1: Run API Server with Startup Script (Recommended)

```bash
# From project root
python start_api.py --port 5000 --api-port 8000
```

This starts:
- P2P peer on port 5000
- FastAPI server on port 8000

### Option 2: Run API Server with Uvicorn Directly

```bash
# Set peer port (optional, defaults to 5000)
export PEER_PORT=5000  # On Windows: set PEER_PORT=5000

# Start the API server
python -m uvicorn src.backend.api:app --host 0.0.0.0 --port 8000
```

### Frontend Development Server

In a separate terminal:

```bash
cd frontend

# Set API URL if different from default
export VITE_API_BASE_URL=http://localhost:8000  # On Windows: set VITE_API_BASE_URL=http://localhost:8000

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173` (or the port Vite assigns).

## Usage

1. **Start the API server** (see above)
2. **Start the frontend** (see above)
3. **Open the dashboard** in your browser
4. **Connect to peers** by entering their host and port
5. **Send messages** by selecting a peer and typing a message

## Docker Deployment

Build and run with Docker Compose:

```bash
docker-compose up --build
```

This starts multiple peer instances on ports 5001, 5002, and 5003.

## Configuration

### Environment Variables

- `PEER_PORT`: Port for the P2P peer node (default: 5000)
- `VITE_API_BASE_URL`: Frontend API base URL (default: http://localhost:8000)

### Logging

Logging configuration is in `config/logging.yaml`. Logs are written to the `logs/` directory.

## API Endpoints

- `GET /api/status` - Get peer status and statistics
- `GET /api/peers` - List all known peers
- `GET /api/peers/connected` - List connected peers
- `POST /api/peers/connect` - Connect to a peer
- `POST /api/messages` - Send a message
- `GET /api/messages` - Get message history

## Development

### Running Tests

```bash
pytest tests/
```

### CLI Mode

You can also run the application in CLI mode:

```bash
p2p-chat --port 5000
```

## Troubleshooting

- **Port already in use**: Change the port using `--port` flag or `PEER_PORT` environment variable
- **Frontend can't connect**: Ensure the API server is running and `VITE_API_BASE_URL` is set correctly
- **Peer connection fails**: Check firewall settings and ensure peers are accessible on the specified ports

## License

[Your License Here]

