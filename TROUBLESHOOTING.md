# Troubleshooting Guide

## Connection Refused Errors (ERR_CONNECTION_REFUSED)

If you see errors like `Failed to load resource: net::ERR_CONNECTION_REFUSED` in the browser console:

### Solution 1: Restart Both Servers

1. **Using PowerShell script (Recommended)**:
   ```powershell
   .\restart-servers.ps1
   ```

2. **Manual restart**:
   - Stop all running servers (Ctrl+C in their terminals)
   - Backend: `python start_api.py --port 5000 --api-port 8000`
   - Frontend: `cd frontend && npm run dev`

### Solution 2: Clear Browser Cache

After restarting servers, you may need to:
1. **Hard refresh** the browser: `Ctrl + Shift + R` (or `Ctrl + F5`)
2. **Clear browser cache** for localhost
3. **Close all browser tabs** for the app and reopen

### Solution 3: Check Server Status

Verify both servers are running:
```powershell
netstat -ano | findstr ":8000 :5173"
```

You should see:
- `0.0.0.0:8000` LISTENING (backend API)
- `0.0.0.0:5173` LISTENING (frontend dev server)

### Solution 4: Check Firewall

If on Windows, ensure Windows Firewall allows connections:
1. Open Windows Defender Firewall
2. Allow Python and Node.js through the firewall
3. Or temporarily disable firewall for testing

## Configuration Files Changed

The following files were updated to fix the connection issue:

1. **`frontend/vite.config.ts`**:
   - Added `host: '0.0.0.0'` to bind to all interfaces
   - Added proxy configuration for `/api` routes

2. **`frontend/src/api.ts`**:
   - Changed to use relative URLs (leverages Vite proxy)
   - Falls back to `VITE_API_BASE_URL` environment variable if set

## Running on Two Different Devices

If running peers on two different computers:

1. **On each device**, set the API base URL to point to localhost:
   ```bash
   # In frontend/.env
   VITE_API_BASE_URL=http://localhost:8000
   ```

2. **Find your local IP** on each device:
   ```powershell
   ipconfig
   ```
   Look for "IPv4 Address" (e.g., 192.168.1.100)

3. **Connect peers** using the actual IP addresses:
   - Device 1 IP: 192.168.1.100
   - Device 2 IP: 192.168.1.101
   - In the UI, connect using: `192.168.1.101:5000` (not localhost)

4. **Ensure P2P ports are open**:
   - Default P2P port: 5000
   - Backend API port: 8000
   - Frontend dev port: 5173

## Still Having Issues?

1. Check the browser console for specific error messages
2. Check backend logs in the terminal running `start_api.py`
3. Verify Python dependencies: `pip install -r requirements.txt`
4. Verify frontend dependencies: `cd frontend && npm install`
5. Try accessing the API directly: `http://localhost:8000/api/status`
