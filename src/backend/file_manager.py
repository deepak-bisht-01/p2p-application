import os
import hashlib
import json
import base64
import threading
from typing import Dict, Optional, List
from datetime import datetime
from pathlib import Path
import logging

logger = logging.getLogger("FileManager")


class FileManager:
    """Manages file storage and retrieval for P2P file sharing"""
    
    def __init__(self, storage_dir: str = "files"):
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(exist_ok=True)
        
        self.files: Dict[str, Dict] = {}  # file_id -> file metadata
        self.file_chunks: Dict[str, Dict[int, bytes]] = {}  # file_id -> {chunk_index: chunk_data}
        self.lock = threading.RLock()
        
        # Load existing files metadata
        self._load_metadata()
    
    def _load_metadata(self):
        """Load file metadata from disk"""
        metadata_file = self.storage_dir / "metadata.json"
        if metadata_file.exists():
            try:
                with open(metadata_file, 'r') as f:
                    data = json.load(f)
                    self.files = {k: v for k, v in data.items() if self._file_exists_on_disk(k)}
            except Exception as e:
                logger.warning(f"Failed to load file metadata: {e}")
    
    def _save_metadata(self):
        """Save file metadata to disk"""
        metadata_file = self.storage_dir / "metadata.json"
        try:
            with open(metadata_file, 'w') as f:
                json.dump(self.files, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save file metadata: {e}")
    
    def _file_exists_on_disk(self, file_id: str) -> bool:
        """Check if file exists on disk"""
        file_path = self.storage_dir / f"{file_id}"
        return file_path.exists()
    
    def register_file(self, file_id: str, filename: str, file_size: int, 
                       mime_type: str, sender_id: str, recipient_id: Optional[str] = None) -> bool:
        """Register a new file transfer"""
        with self.lock:
            if file_id in self.files:
                return False
            
            self.files[file_id] = {
                "file_id": file_id,
                "filename": filename,
                "file_size": file_size,
                "mime_type": mime_type,
                "sender_id": sender_id,
                "recipient_id": recipient_id,
                "status": "receiving",
                "chunks_received": 0,
                "total_chunks": 0,
                "created_at": datetime.utcnow().isoformat(),
                "completed_at": None
            }
            self.file_chunks[file_id] = {}
            self._save_metadata()
            return True
    
    def add_chunk(self, file_id: str, chunk_index: int, chunk_data: bytes, is_last: bool) -> bool:
        """Add a chunk to a file transfer"""
        with self.lock:
            if file_id not in self.files:
                return False
            
            self.file_chunks[file_id][chunk_index] = chunk_data
            self.files[file_id]["chunks_received"] = len(self.file_chunks[file_id])
            
            if is_last:
                self.files[file_id]["total_chunks"] = chunk_index + 1
                self.files[file_id]["status"] = "receiving"
            
            return True
    
    def complete_file(self, file_id: str) -> bool:
        """Complete file transfer and save to disk"""
        with self.lock:
            if file_id not in self.files:
                return False
            
            file_info = self.files[file_id]
            chunks = self.file_chunks.get(file_id, {})
            
            # Check if all chunks are received
            total_chunks = file_info.get("total_chunks", 0)
            if total_chunks == 0 or len(chunks) < total_chunks:
                logger.warning(f"File {file_id} incomplete: {len(chunks)}/{total_chunks} chunks")
                return False
            
            # Reassemble file
            file_path = self.storage_dir / file_id
            try:
                with open(file_path, 'wb') as f:
                    for i in range(total_chunks):
                        if i not in chunks:
                            logger.error(f"Missing chunk {i} for file {file_id}")
                            return False
                        f.write(chunks[i])
                
                # Update metadata
                file_info["status"] = "completed"
                file_info["completed_at"] = datetime.utcnow().isoformat()
                file_info["file_path"] = str(file_path)
                
                # Clean up chunks from memory
                del self.file_chunks[file_id]
                
                self._save_metadata()
                logger.info(f"File {file_id} ({file_info['filename']}) completed")
                return True
            except Exception as e:
                logger.error(f"Failed to save file {file_id}: {e}")
                return False
    
    def save_file(self, file_id: str, file_data: bytes, filename: str, 
                  mime_type: str, sender_id: str, recipient_id: Optional[str] = None) -> bool:
        """Save a complete file (for direct uploads)"""
        with self.lock:
            file_path = self.storage_dir / file_id
            try:
                with open(file_path, 'wb') as f:
                    f.write(file_data)
                
                self.files[file_id] = {
                    "file_id": file_id,
                    "filename": filename,
                    "file_size": len(file_data),
                    "mime_type": mime_type,
                    "sender_id": sender_id,
                    "recipient_id": recipient_id,
                    "status": "completed",
                    "file_path": str(file_path),
                    "created_at": datetime.utcnow().isoformat(),
                    "completed_at": datetime.utcnow().isoformat()
                }
                self._save_metadata()
                return True
            except Exception as e:
                logger.error(f"Failed to save file {file_id}: {e}")
                return False
    
    def get_file(self, file_id: str) -> Optional[bytes]:
        """Get file data by file_id"""
        with self.lock:
            if file_id not in self.files:
                return None
            
            file_path = self.storage_dir / file_id
            if not file_path.exists():
                return None
            
            try:
                with open(file_path, 'rb') as f:
                    return f.read()
            except Exception as e:
                logger.error(f"Failed to read file {file_id}: {e}")
                return None
    
    def get_file_info(self, file_id: str) -> Optional[Dict]:
        """Get file metadata"""
        with self.lock:
            return self.files.get(file_id)
    
    def list_files(self, limit: int = 100) -> List[Dict]:
        """List all files"""
        with self.lock:
            files_list = list(self.files.values())
            files_list.sort(key=lambda x: x.get("created_at", ""), reverse=True)
            return files_list[:limit]
    
    def delete_file(self, file_id: str) -> bool:
        """Delete a file"""
        with self.lock:
            if file_id not in self.files:
                return False
            
            file_path = self.storage_dir / file_id
            try:
                if file_path.exists():
                    file_path.unlink()
                del self.files[file_id]
                if file_id in self.file_chunks:
                    del self.file_chunks[file_id]
                self._save_metadata()
                return True
            except Exception as e:
                logger.error(f"Failed to delete file {file_id}: {e}")
                return False
    
    @staticmethod
    def generate_file_id(filename: str, sender_id: str) -> str:
        """Generate a unique file ID"""
        import uuid
        timestamp = datetime.utcnow().isoformat()
        unique_str = f"{filename}_{sender_id}_{timestamp}_{uuid.uuid4()}"
        return hashlib.sha256(unique_str.encode()).hexdigest()[:16]

