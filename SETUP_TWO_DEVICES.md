# Setting Up Two Devices for P2P File Sharing

## Scenario 1: Two Devices on Different Machines (Recommended)

### Device 1 (First Machine):
1. **Start Backend Server:**
   ```bash
   python start_api.py --port 5000 --api-port 8000
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Note your IP address:**
   - Windows: `ipconfig` (look for IPv4 Address)
   - Linux/Mac: `ifconfig` or `ip addr`
   - Example: `192.168.1.100`

### Device 2 (Second Machine):
1. **Start Backend Server:**
   ```bash
   python start_api.py --port 5000 --api-port 8000
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Note your IP address** (different from Device 1)
   - Example: `192.168.1.101`

### Connect the Devices:
1. On **Device 2**, in the "Connect to Peer" form:
   - Host: `192.168.1.100` (Device 1's IP)
   - Port: `5000`
   - Click "Connect"

2. On **Device 1**, in the "Connect to Peer" form:
   - Host: `192.168.1.101` (Device 2's IP)
   - Port: `5000`
   - Click "Connect"

Now both devices can send files to each other!

---

## Scenario 2: Two Devices on Same Machine (Different Ports)

### Device 1 (Terminal 1):
1. **Start Backend Server:**
   ```bash
   python start_api.py --port 5000 --api-port 8000
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```
   - Frontend will be on `http://localhost:5173`

### Device 2 (Terminal 2):
1. **Start Backend Server:**
   ```bash
   python start_api.py --port 5001 --api-port 8001
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   # Set different API URL
   set VITE_API_BASE_URL=http://localhost:8001  # Windows
   # OR
   export VITE_API_BASE_URL=http://localhost:8001  # Linux/Mac
   
   npm run dev
   ```
   - Frontend will be on `http://localhost:5174` (or another port)

### Connect the Devices:
1. On **Device 2** (port 8001), in the "Connect to Peer" form:
   - Host: `localhost` or `127.0.0.1`
   - Port: `5000` (Device 1's peer port)
   - Click "Connect"

2. On **Device 1** (port 8000), in the "Connect to Peer" form:
   - Host: `localhost` or `127.0.0.1`
   - Port: `5001` (Device 2's peer port)
   - Click "Connect"

---

## Testing File Sharing

### Send File to Specific Peer:
1. Select a peer from the peer list
2. Choose a file
3. Click "Send File" (broadcast unchecked)

### Broadcast File to All Peers:
1. Choose a file
2. Check "Broadcast to all peers"
3. Click "Broadcast File"
4. All connected peers will receive the file

### Download/Preview Files:
- All received files appear in the "Files" section
- Click "Download" to save the file
- Click "Preview" to view images/text files in the browser

---

## Troubleshooting

### "Connection Refused" Error:
- Make sure the backend server is running on that device
- Check that the correct port is being used
- Verify firewall isn't blocking the connection

### Can't See Peers:
- Make sure both devices have their backend servers running
- Verify you connected using the correct IP address and port
- Check that both devices are on the same network (for different machines)

### Files Not Appearing:
- Check the browser console for errors
- Verify the file transfer completed (check status in file list)
- Refresh the file list

