export interface Peer {
  peer_id: string;
  address: string;
  port: number;
  status: string;
  metadata?: Record<string, unknown>;
  last_seen: string;
  public_key?: string | null;
}

export interface MessageLogEntry {
  direction: "incoming" | "outgoing";
  payload: Record<string, unknown>;
  sent_at?: string;
  received_at?: string;
}

export interface StatusSummary {
  peer_id: string;
  port: number;
  messages_processed: number;
  messages_failed: number;
  queue_size: number;
  active_connections: string[];
}

export interface FileInfo {
  file_id: string;
  filename: string;
  file_size: number;
  mime_type: string;
  sender_id: string;
  recipient_id?: string | null;
  status: string;
  created_at: string;
  completed_at?: string | null;
  file_path?: string;
  chunks_received?: number;
  total_chunks?: number;
}

