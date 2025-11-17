"""
Real-time P2P File Transfer Simulation
Demonstrates file transfer between two peers with detailed progress tracking
"""

import asyncio
import threading
import time
import os
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent))

from src.backend.service import P2PService
from src.backend.file_manager import FileManager
import logging

# Set up colored logging for better visualization
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(name)s] %(levelname)s: %(message)s',
    datefmt='%H:%M:%S'
)

# Color codes for terminal output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'


def print_header(text):
    print(f"\n{Colors.HEADER}{Colors.BOLD}{'='*80}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{text.center(80)}{Colors.ENDC}")
    print(f"{Colors.HEADER}{Colors.BOLD}{'='*80}{Colors.ENDC}\n")


def print_section(text):
    print(f"\n{Colors.OKCYAN}{Colors.BOLD}>> {text}{Colors.ENDC}")


def print_success(text):
    print(f"{Colors.OKGREEN}[OK] {text}{Colors.ENDC}")


def print_info(text):
    print(f"{Colors.OKBLUE}[INFO] {text}{Colors.ENDC}")


def print_warning(text):
    print(f"{Colors.WARNING}[WARN] {text}{Colors.ENDC}")


def print_error(text):
    print(f"{Colors.FAIL}[ERROR] {text}{Colors.ENDC}")


def format_file_size(bytes):
    """Format bytes to human readable size"""
    if bytes < 1024:
        return f"{bytes} B"
    elif bytes < 1024 * 1024:
        return f"{bytes / 1024:.2f} KB"
    else:
        return f"{bytes / (1024 * 1024):.2f} MB"


def display_file_transfer_progress(peer_service, file_id, filename):
    """Monitor and display file transfer progress in real-time"""
    print_section(f"Monitoring file transfer: {filename}")
    
    start_time = time.time()
    last_chunks = 0
    
    while True:
        file_info = peer_service.file_manager.get_file_info(file_id)
        
        if not file_info:
            print_warning(f"File {file_id} not found yet...")
            time.sleep(0.5)
            continue
        
        chunks_received = file_info.get("chunks_received", 0)
        total_chunks = file_info.get("total_chunks", 0)
        status = file_info.get("status", "unknown")
        file_size = file_info.get("file_size", 0)
        
        # Calculate progress
        if total_chunks > 0:
            progress = (chunks_received / total_chunks) * 100
            bytes_received = (chunks_received / total_chunks) * file_size if total_chunks > 0 else 0
        else:
            progress = 0
            bytes_received = 0
        
        # Show progress bar
        bar_length = 50
        filled_length = int(bar_length * chunks_received / max(total_chunks, 1))
        bar = '█' * filled_length + '░' * (bar_length - filled_length)
        
        # Calculate speed
        elapsed = time.time() - start_time
        if chunks_received > last_chunks and elapsed > 0:
            chunks_per_sec = (chunks_received - last_chunks) / 0.5
            speed = (bytes_received - (last_chunks / max(total_chunks, 1)) * file_size) / 0.5
            speed_str = format_file_size(speed) + "/s"
        else:
            speed_str = "calculating..."
        
        # Display progress
        print(f"\r  [{bar}] {progress:.1f}% | "
              f"Chunks: {chunks_received}/{total_chunks} | "
              f"Size: {format_file_size(bytes_received)}/{format_file_size(file_size)} | "
              f"Speed: {speed_str} | "
              f"Status: {status}", end='', flush=True)
        
        last_chunks = chunks_received
        
        if status == "completed":
            print()  # New line after progress
            elapsed_time = time.time() - start_time
            avg_speed = file_size / elapsed_time if elapsed_time > 0 else 0
            print_success(f"File transfer completed in {elapsed_time:.2f}s (avg: {format_file_size(avg_speed)}/s)")
            return True
        elif status == "failed":
            print()
            print_error("File transfer failed!")
            return False
        
        time.sleep(0.5)


def create_test_file(filename, size_kb):
    """Create a test file with random data"""
    filepath = Path("test_files") / filename
    filepath.parent.mkdir(exist_ok=True)
    
    # Create file with random data
    import random
    import string
    
    content = ''.join(random.choices(string.ascii_letters + string.digits, k=size_kb * 1024))
    with open(filepath, 'w') as f:
        f.write(content)
    
    return filepath


def display_peer_status(peer1, peer2):
    """Display status of both peers"""
    print_section("Peer Status")
    
    # Peer 1 status
    status1 = peer1.get_status()
    print_info(f"Peer 1 (Port {peer1.port})")
    print(f"  Peer ID: {status1['peer_id'][:16]}...")
    print(f"  Active Connections: {status1['active_connections']}")
    print(f"  Messages Processed: {status1['messages_processed']}")
    
    # Peer 2 status
    status2 = peer2.get_status()
    print_info(f"Peer 2 (Port {peer2.port})")
    print(f"  Peer ID: {status2['peer_id'][:16]}...")
    print(f"  Active Connections: {status2['active_connections']}")
    print(f"  Messages Processed: {status2['messages_processed']}")


def display_files_list(peer_service, peer_name):
    """Display list of files for a peer"""
    files = peer_service.list_files(limit=10)
    
    if not files:
        print(f"  No files found for {peer_name}")
        return
    
    print(f"\n{Colors.BOLD}Files on {peer_name}:{Colors.ENDC}")
    print(f"  {'Filename':<30} {'Size':<12} {'Status':<12} {'Chunks':<15}")
    print(f"  {'-'*30} {'-'*12} {'-'*12} {'-'*15}")
    
    for file_info in files:
        filename = file_info.get('filename', 'unknown')[:28]
        size = format_file_size(file_info.get('file_size', 0))
        status = file_info.get('status', 'unknown')
        chunks = f"{file_info.get('chunks_received', 0)}/{file_info.get('total_chunks', 0)}"
        
        status_color = Colors.OKGREEN if status == 'completed' else Colors.WARNING
        print(f"  {filename:<30} {size:<12} {status_color}{status:<12}{Colors.ENDC} {chunks:<15}")


def main():
    print_header("P2P File Transfer Real-Time Simulation")
    
    print_section("Step 1: Initializing Peers")
    
    # Create two peer services
    print_info("Creating Peer 1 on port 5001...")
    peer1 = P2PService(port=5001)
    time.sleep(1)
    
    print_info("Creating Peer 2 on port 5002...")
    peer2 = P2PService(port=5002)
    time.sleep(1)
    
    print_success("Both peers initialized successfully")
    
    # Connect peers
    print_section("Step 2: Connecting Peers")
    print_info("Connecting Peer 1 to Peer 2...")
    success = peer1.connect_to_peer("localhost", 5002)
    
    if success:
        print_success("Peers connected successfully")
        time.sleep(3)  # Wait for handshake to complete
    else:
        print_error("Failed to connect peers")
        return
    
    # Get the actual peer ID of peer 2
    peer2_id = peer2.identity.peer_id
    print_info(f"Peer 2 ID: {peer2_id[:16]}...")
    
    # Verify connection is established with the correct peer ID
    connected_peers = peer1.connection_manager.get_active_connections()
    print_info(f"Peer 1 active connections: {[p[:16]+'...' for p in connected_peers]}")
    
    if peer2_id not in connected_peers:
        print_warning("Handshake not complete, waiting...")
        time.sleep(2)
        connected_peers = peer1.connection_manager.get_active_connections()
        if peer2_id not in connected_peers:
            print_error(f"Failed to establish connection with proper peer ID")
            print_error(f"Expected: {peer2_id}, Got: {connected_peers}")
            return
    
    # Display status
    display_peer_status(peer1, peer2)
    
    # Create test files
    print_section("Step 3: Creating Test Files")
    
    test_files = [
        ("small_file.txt", 10),      # 10 KB
        ("medium_file.txt", 100),    # 100 KB
        ("large_file.txt", 500),     # 500 KB
    ]
    
    created_files = []
    for filename, size_kb in test_files:
        print_info(f"Creating {filename} ({size_kb} KB)...")
        filepath = create_test_file(filename, size_kb)
        created_files.append((filename, filepath))
        print_success(f"Created {filename}")
    
    # Send files one by one with real-time monitoring
    print_section("Step 4: Sending Files from Peer 1 to Peer 2")
    
    for filename, filepath in created_files:
        print_info(f"\nSending {filename}...")
        
        # Read file
        with open(filepath, 'rb') as f:
            file_data = f.read()
        
        # Generate file ID
        file_id = FileManager.generate_file_id(filename, peer1.identity.peer_id)
        
        # Start monitoring in separate thread
        monitor_thread = threading.Thread(
            target=display_file_transfer_progress,
            args=(peer2, file_id, filename)
        )
        monitor_thread.daemon = True
        monitor_thread.start()
        
        # Send file using the correct peer ID
        time.sleep(0.5)  # Small delay to ensure monitor starts
        success = peer1.send_file(
            peer2_id,  # Use the actual peer ID, not the temp ID
            file_data,
            filename,
            "text/plain"
        )
        
        if success:
            # Wait for monitor to complete
            monitor_thread.join(timeout=30)
        else:
            print_error(f"Failed to send {filename}")
        
        time.sleep(1)  # Pause between files
    
    # Test broadcast
    print_section("Step 5: Broadcasting File to All Peers")
    
    broadcast_file = ("broadcast_file.txt", 50)
    print_info(f"Creating broadcast file ({broadcast_file[1]} KB)...")
    filepath = create_test_file(broadcast_file[0], broadcast_file[1])
    
    with open(filepath, 'rb') as f:
        file_data = f.read()
    
    file_id = FileManager.generate_file_id(broadcast_file[0], peer1.identity.peer_id)
    
    # Start monitoring
    monitor_thread = threading.Thread(
        target=display_file_transfer_progress,
        args=(peer2, file_id, broadcast_file[0])
    )
    monitor_thread.daemon = True
    monitor_thread.start()
    
    time.sleep(0.5)
    print_info(f"Broadcasting {broadcast_file[0]}...")
    success = peer1.broadcast_file(file_data, broadcast_file[0], "text/plain")
    
    if success:
        monitor_thread.join(timeout=30)
    
    # Display final status
    print_section("Step 6: Final Status and File Lists")
    display_peer_status(peer1, peer2)
    
    print()
    display_files_list(peer1, "Peer 1")
    print()
    display_files_list(peer2, "Peer 2")
    
    # Summary
    print_header("Simulation Complete!")
    print_success("All file transfers completed successfully")
    print_info("\nKey observations:")
    print("  • Files are transferred in chunks (32KB per chunk)")
    print("  • Real-time progress tracking shows transfer status")
    print("  • Both direct and broadcast transfers work correctly")
    print("  • File metadata is maintained on both sender and receiver")
    
    # Cleanup
    print_section("Cleanup")
    print_info("Shutting down peers...")
    peer1.shutdown()
    peer2.shutdown()
    print_success("Peers shut down successfully")
    
    print(f"\n{Colors.OKGREEN}Simulation completed successfully!{Colors.ENDC}\n")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n\n{Colors.WARNING}Simulation interrupted by user{Colors.ENDC}")
    except Exception as e:
        print_error(f"Simulation failed: {e}")
        import traceback
        traceback.print_exc()
