import json
import time
from typing import Dict, Any, Optional
from enum import Enum

class MessageType(Enum):
    HANDSHAKE = "handshake"
    TEXT = "text"
    ACK = "ack"
    PING = "ping"
    PONG = "pong"
    ERROR = "error"
    FILE_TRANSFER_REQUEST = "file_transfer_request"
    FILE_TRANSFER_CHUNK = "file_transfer_chunk"
    FILE_TRANSFER_COMPLETE = "file_transfer_complete"
    FILE_TRANSFER_ACK = "file_transfer_ack"

class MessageProtocol:
    VERSION = "1.0"
    
    @staticmethod
    def create_message(msg_type: MessageType, sender_id: str, 
                      recipient_id: str = None, content: Any = None, 
                      message_id: str = None) -> Dict[str, Any]:
        """Create a message following the protocol"""
        import uuid
        
        message = {
            "version": MessageProtocol.VERSION,
            "type": msg_type.value,
            "sender_id": sender_id,
            "message_id": message_id or str(uuid.uuid4()),
            "timestamp": time.time()
        }
        
        if recipient_id:
            message["recipient_id"] = recipient_id
            
        if content is not None:
            message["content"] = content
            
        return message
    
    @staticmethod
    def encode_message(message: Dict[str, Any]) -> bytes:
        """Encode message to bytes"""
        return json.dumps(message).encode('utf-8')
    
    @staticmethod
    def decode_message(data: bytes) -> Optional[Dict[str, Any]]:
        """Decode message from bytes"""
        try:
            message = json.loads(data.decode('utf-8'))
            # Validate required fields
            required = ["version", "type", "sender_id", "message_id", "timestamp"]
            if all(field in message for field in required):
                return message
        except Exception as e:
            pass
        return None
    
    @staticmethod
    def create_handshake(peer_id: str, peer_info: Dict[str, Any]) -> bytes:
        """Create handshake message"""
        message = MessageProtocol.create_message(
            MessageType.HANDSHAKE,
            peer_id,
            content=peer_info
        )
        return MessageProtocol.encode_message(message)
    
    @staticmethod
    def create_text_message(sender_id: str, recipient_id: str, text: str) -> bytes:
        """Create text message"""
        message = MessageProtocol.create_message(
            MessageType.TEXT,
            sender_id,
            recipient_id,
            content={"text": text}
        )
        return MessageProtocol.encode_message(message)
    
    @staticmethod
    def create_file_transfer_request(sender_id: str, recipient_id: str, 
                                     file_id: str, filename: str, 
                                     file_size: int, mime_type: str) -> bytes:
        """Create file transfer request message"""
        message = MessageProtocol.create_message(
            MessageType.FILE_TRANSFER_REQUEST,
            sender_id,
            recipient_id,
            content={
                "file_id": file_id,
                "filename": filename,
                "file_size": file_size,
                "mime_type": mime_type
            }
        )
        return MessageProtocol.encode_message(message)
    
    @staticmethod
    def create_file_transfer_chunk(sender_id: str, recipient_id: str,
                                   file_id: str, chunk_index: int,
                                   chunk_data: str, is_last: bool) -> bytes:
        """Create file transfer chunk message (chunk_data should be base64 encoded)"""
        message = MessageProtocol.create_message(
            MessageType.FILE_TRANSFER_CHUNK,
            sender_id,
            recipient_id,
            content={
                "file_id": file_id,
                "chunk_index": chunk_index,
                "chunk_data": chunk_data,
                "is_last": is_last
            }
        )
        return MessageProtocol.encode_message(message)
    
    @staticmethod
    def create_file_transfer_complete(sender_id: str, recipient_id: str,
                                     file_id: str) -> bytes:
        """Create file transfer complete message"""
        message = MessageProtocol.create_message(
            MessageType.FILE_TRANSFER_COMPLETE,
            sender_id,
            recipient_id,
            content={"file_id": file_id}
        )
        return MessageProtocol.encode_message(message)
    
    @staticmethod
    def create_file_transfer_ack(sender_id: str, recipient_id: str,
                                file_id: str, success: bool) -> bytes:
        """Create file transfer acknowledgment message"""
        message = MessageProtocol.create_message(
            MessageType.FILE_TRANSFER_ACK,
            sender_id,
            recipient_id,
            content={"file_id": file_id, "success": success}
        )
        return MessageProtocol.encode_message(message)