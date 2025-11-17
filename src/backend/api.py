from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import mimetypes
import os
from pathlib import Path

from src.backend.service import p2p_service
from src.backend.file_manager import FileManager


class ConnectRequest(BaseModel):
    host: str
    port: int


class MessageRequest(BaseModel):
    recipient_id: Optional[str] = None
    text: str


class FileSendRequest(BaseModel):
    recipient_id: Optional[str] = None  # None means broadcast
    file_id: str


app = FastAPI(title="P2P Messaging API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/status")
def get_status():
    return p2p_service.get_status()


@app.get("/api/peers")
def get_peers():
    return {"peers": p2p_service.list_peers()}


@app.get("/api/peers/connected")
def get_connected_peers():
    return {"peers": p2p_service.list_connected_peers()}


@app.post("/api/peers/connect")
def connect_peer(request: ConnectRequest):
    success = p2p_service.connect_to_peer(request.host, request.port)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to connect to peer")
    return {"status": "connected"}


@app.post("/api/messages")
def create_message(request: MessageRequest):
    if request.recipient_id:
        success = p2p_service.send_text_message(request.recipient_id, request.text)
    else:
        success = p2p_service.broadcast_text_message(request.text)

    if not success:
        raise HTTPException(status_code=400, detail="Failed to queue message")
    return {"status": "queued"}


@app.get("/api/messages")
def list_messages(limit: int = 100):
    limit = max(1, min(limit, 500))
    return {"messages": p2p_service.get_messages(limit=limit)}


@app.post("/api/files/upload")
async def upload_file(file: UploadFile = File(...), folder_path: str = Form(None)):
    """Upload a file to the local storage"""
    try:
        file_data = await file.read()
        filename = file.filename or "unnamed"
        mime_type = file.content_type or mimetypes.guess_type(filename)[0] or "application/octet-stream"
        
        # Save file locally
        file_id = FileManager.generate_file_id(filename, p2p_service.identity.peer_id)
        success = p2p_service.file_manager.save_file(
            file_id, file_data, filename, mime_type, 
            p2p_service.identity.peer_id, None, folder_path
        )
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to save file")
        
        file_info = p2p_service.file_manager.get_file_info(file_id)
        return {"file_id": file_id, "file_info": file_info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/files/send")
async def send_file(request: FileSendRequest):
    """Send a file to a peer or broadcast to all peers (if recipient_id is None)"""
    file_info = p2p_service.get_file_info(request.file_id)
    if not file_info:
        raise HTTPException(status_code=404, detail="File not found")
    
    file_data = p2p_service.get_file(request.file_id)
    if not file_data:
        raise HTTPException(status_code=404, detail="File data not found")
    
    if request.recipient_id:
        success = p2p_service.send_file(
            request.recipient_id,
            file_data,
            file_info["filename"],
            file_info.get("mime_type", "application/octet-stream")
        )
    else:
        success = p2p_service.broadcast_file(
            file_data,
            file_info["filename"],
            file_info.get("mime_type", "application/octet-stream")
        )
    
    if not success:
        raise HTTPException(status_code=400, detail="Failed to send file")
    
    return {"status": "sent", "file_id": request.file_id}


@app.post("/api/files/send-direct")
async def send_file_direct(
    recipient_id: str = Form(None),
    broadcast: str = Form("false"),
    file: UploadFile = File(...)
):
    """Upload and send a file directly to a peer or broadcast to all peers"""
    try:
        file_data = await file.read()
        filename = file.filename or "unnamed"
        mime_type = file.content_type or mimetypes.guess_type(filename)[0] or "application/octet-stream"
        
        is_broadcast = broadcast.lower() == "true"
        
        if is_broadcast:
            success = p2p_service.broadcast_file(file_data, filename, mime_type)
        else:
            if not recipient_id:
                raise HTTPException(status_code=400, detail="recipient_id is required when not broadcasting")
            success = p2p_service.send_file(recipient_id, file_data, filename, mime_type)
        
        if not success:
            raise HTTPException(status_code=400, detail="Failed to send file")
        
        return {"status": "sent", "filename": filename, "broadcast": is_broadcast}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/files")
def list_files(limit: int = 100):
    """List all files"""
    limit = max(1, min(limit, 500))
    return {"files": p2p_service.list_files(limit=limit)}


@app.get("/api/files/{file_id}")
def download_file(file_id: str):
    """Download a file"""
    file_info = p2p_service.get_file_info(file_id)
    if not file_info:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Check if file is completed
    if file_info.get("status") != "completed":
        raise HTTPException(status_code=400, detail=f"File transfer is {file_info.get('status', 'incomplete')}")
    
    file_data = p2p_service.get_file(file_id)
    if not file_data:
        raise HTTPException(status_code=404, detail="File data not found")
    
    filename = file_info.get("filename", "file")
    mime_type = file_info.get("mime_type", "application/octet-stream")
    
    return Response(
        content=file_data,
        media_type=mime_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )


@app.get("/api/files/{file_id}/info")
def get_file_info(file_id: str):
    """Get file metadata"""
    file_info = p2p_service.get_file_info(file_id)
    if not file_info:
        raise HTTPException(status_code=404, detail="File not found")
    return file_info


@app.get("/api/files/{file_id}/preview")
def preview_file(file_id: str):
    """Preview a file (for images, text files, videos, etc.)"""
    file_info = p2p_service.get_file_info(file_id)
    if not file_info:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Allow preview even during transfer for partial content
    mime_type = file_info.get("mime_type", "application/octet-stream")
    filename = file_info.get("filename", "file")
    
    # For images and videos, return inline preview
    if mime_type.startswith("image/") or mime_type.startswith("video/"):
        # Check if file is being transferred
        if file_info.get("status") == "receiving":
            # Return partial content if available
            file_data = p2p_service.file_manager.get_partial_file(file_id)
            if file_data:
                return Response(
                    content=file_data, 
                    media_type=mime_type,
                    headers={
                        "Content-Disposition": f'inline; filename="{filename}"',
                        "X-Transfer-Status": "receiving"
                    }
                )
        elif file_info.get("status") == "completed":
            file_data = p2p_service.get_file(file_id)
            if not file_data:
                raise HTTPException(status_code=404, detail="File data not found")
            return Response(
                content=file_data, 
                media_type=mime_type,
                headers={"Content-Disposition": f'inline; filename="{filename}"'}
            )
    
    # For completed files only
    if file_info.get("status") != "completed":
        raise HTTPException(status_code=400, detail=f"File transfer is {file_info.get('status', 'incomplete')}")
    
    file_data = p2p_service.get_file(file_id)
    if not file_data:
        raise HTTPException(status_code=404, detail="File data not found")
    
    # For text files, return as text
    if mime_type.startswith("text/"):
        try:
            text_content = file_data.decode('utf-8')
            return Response(content=text_content, media_type=mime_type)
        except:
            pass
    
    # For other files, return as download
    return Response(
        content=file_data,
        media_type=mime_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )


@app.on_event("shutdown")
def shutdown_event():
    p2p_service.shutdown()

