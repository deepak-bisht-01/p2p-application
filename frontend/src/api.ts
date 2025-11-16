import { MessageLogEntry, Peer, StatusSummary, FileInfo } from "./types";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "http://localhost:8000";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || response.statusText);
  }
  return response.json() as Promise<T>;
}

export async function fetchStatus(): Promise<StatusSummary> {
  const response = await fetch(`${API_BASE}/api/status`);
  return handleResponse<StatusSummary>(response);
}

export async function fetchPeers(): Promise<Peer[]> {
  const response = await fetch(`${API_BASE}/api/peers`);
  const data = await handleResponse<{ peers: Peer[] }>(response);
  return data.peers;
}

export async function fetchMessages(limit = 100): Promise<MessageLogEntry[]> {
  const response = await fetch(`${API_BASE}/api/messages?limit=${limit}`);
  const data = await handleResponse<{ messages: MessageLogEntry[] }>(response);
  return data.messages;
}

export async function connectPeer(host: string, port: number): Promise<void> {
  const response = await fetch(`${API_BASE}/api/peers/connect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ host, port })
  });
  await handleResponse(response);
}

export async function sendMessage(text: string, recipientId?: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, recipient_id: recipientId })
  });
  await handleResponse(response);
}

export async function fetchFiles(limit = 100): Promise<FileInfo[]> {
  const response = await fetch(`${API_BASE}/api/files?limit=${limit}`);
  const data = await handleResponse<{ files: FileInfo[] }>(response);
  return data.files;
}

export async function uploadFile(file: File): Promise<{ file_id: string; file_info: FileInfo }> {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await fetch(`${API_BASE}/api/files/upload`, {
    method: "POST",
    body: formData
  });
  return handleResponse<{ file_id: string; file_info: FileInfo }>(response);
}

export async function sendFile(recipientId: string | undefined, file: File, broadcast: boolean = false): Promise<void> {
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

export async function sendFileById(recipientId: string, fileId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/files/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipient_id: recipientId, file_id: fileId })
  });
  await handleResponse(response);
}

export function getFileDownloadUrl(fileId: string): string {
  return `${API_BASE}/api/files/${fileId}`;
}

export function getFilePreviewUrl(fileId: string): string {
  return `${API_BASE}/api/files/${fileId}/preview`;
}

export async function getFileInfo(fileId: string): Promise<FileInfo> {
  const response = await fetch(`${API_BASE}/api/files/${fileId}/info`);
  return handleResponse<FileInfo>(response);
}

