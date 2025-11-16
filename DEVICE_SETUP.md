# Device-Specific Setup Guide

Each device needs its own configuration. Use environment variables so you can commit code without hardcoding ports.

## Setup Instructions

### Device 1 (Port 8000)

1. **Create `.env` file in `frontend/` directory:**
   ```bash
   cd frontend
   # Copy the example file
   cp .env.example .env
   # Or create manually with:
   # VITE_API_BASE_URL=http://localhost:8000
   ```

2. **Start Backend:**
   ```bash
   python start_api.py --port 5000 --api-port 8000
   ```

3. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

### Device 2 (Port 8001)

1. **Create `.env` file in `frontend/` directory:**
   ```bash
   cd frontend
   # Create .env file with:
   # VITE_API_BASE_URL=http://localhost:8001
   ```
   
   On Windows, create `frontend/.env` file with:
   ```
   VITE_API_BASE_URL=http://localhost:8001
   ```

2. **Start Backend:**
   ```bash
   python start_api.py --port 5001 --api-port 8001
   ```

3. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

## Important Notes

- **`.env` files are gitignored** - Each device can have its own `.env` file
- **Default port is 8000** - If no `.env` file exists, it defaults to port 8000
- **Restart frontend after creating `.env`** - Vite needs to be restarted to pick up environment variables

## Quick Setup Commands

### Device 1:
```bash
# Create .env
echo VITE_API_BASE_URL=http://localhost:8000 > frontend/.env
# Start backend
python start_api.py --port 5000 --api-port 8000
# Start frontend (in new terminal)
cd frontend && npm run dev
```

### Device 2:
```bash
# Create .env
echo VITE_API_BASE_URL=http://localhost:8001 > frontend/.env
# Start backend
python start_api.py --port 5001 --api-port 8001
# Start frontend (in new terminal)
cd frontend && npm run dev
```

## Windows PowerShell Commands

### Device 1:
```powershell
# Create .env
Set-Content -Path "frontend\.env" -Value "VITE_API_BASE_URL=http://localhost:8000"
# Start backend
python start_api.py --port 5000 --api-port 8000
```

### Device 2:
```powershell
# Create .env
Set-Content -Path "frontend\.env" -Value "VITE_API_BASE_URL=http://localhost:8001"
# Start backend
python start_api.py --port 5001 --api-port 8001
```

