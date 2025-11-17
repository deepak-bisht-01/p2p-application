// Use relative path for API calls to leverage Vite proxy
// In production, set VITE_API_BASE_URL environment variable
const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "";
async function handleResponse(response) {
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(errorBody || response.statusText);
    }
    return response.json();
}
export async function fetchStatus() {
    const response = await fetch(`${API_BASE}/api/status`);
    return handleResponse(response);
}
export async function fetchPeers() {
    const response = await fetch(`${API_BASE}/api/peers`);
    const data = await handleResponse(response);
    return data.peers;
}
export async function fetchMessages(limit = 100) {
    const response = await fetch(`${API_BASE}/api/messages?limit=${limit}`);
    const data = await handleResponse(response);
    return data.messages;
}
export async function connectPeer(host, port) {
    const response = await fetch(`${API_BASE}/api/peers/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ host, port })
    });
    await handleResponse(response);
}
export async function sendMessage(text, recipientId) {
    const response = await fetch(`${API_BASE}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, recipient_id: recipientId })
    });
    await handleResponse(response);
}
export async function fetchFiles(limit = 100) {
    const response = await fetch(`${API_BASE}/api/files?limit=${limit}`);
    const data = await handleResponse(response);
    return data.files;
}
export async function uploadFile(file) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${API_BASE}/api/files/upload`, {
        method: "POST",
        body: formData
    });
    return handleResponse(response);
}
export async function sendFile(recipientId, file, broadcast = false) {
    const formData = new FormData();
    formData.append("file", file);
    if (recipientId && !broadcast) {
        formData.append("recipient_id", recipientId);
    }
    formData.append("broadcast", broadcast.toString());
    const response = await fetch(`${API_BASE}/api/files/send-direct`, {
        method: "POST",
        body: formData
    });
    await handleResponse(response);
}
export async function sendFileById(recipientId, fileId) {
    const response = await fetch(`${API_BASE}/api/files/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient_id: recipientId, file_id: fileId })
    });
    await handleResponse(response);
}
export function getFileDownloadUrl(fileId) {
    return `${API_BASE}/api/files/${fileId}`;
}
export function getFilePreviewUrl(fileId) {
    return `${API_BASE}/api/files/${fileId}/preview`;
}
export async function getFileInfo(fileId) {
    const response = await fetch(`${API_BASE}/api/files/${fileId}/info`);
    return handleResponse(response);
}
export async function deleteFile(fileId) {
    const response = await fetch(`${API_BASE}/api/files/${fileId}`, {
        method: "DELETE"
    });
    await handleResponse(response);
}
