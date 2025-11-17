import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  connectPeer,
  fetchMessages,
  fetchPeers,
  fetchStatus,
  fetchFiles,
  sendMessage
} from "./api";
import "./App.css";
import { StatusSummaryCard } from "./components/StatusSummaryCard";
import { PeerList } from "./components/PeerList";
import { ConnectPeerForm } from "./components/ConnectPeerForm";
import { MessageComposer } from "./components/MessageComposer";
import { MessagePanel } from "./components/MessagePanel";
import { FileUpload } from "./components/FileUpload";
import { FileList } from "./components/FileList";
import { MessageLogEntry, Peer, StatusSummary, FileInfo } from "./types";

const POLL_INTERVAL = 5_000;
const FILE_POLL_INTERVAL = 3_000; // Moderate polling for file transfers to reduce flickering

function usePolling<T>(callback: () => Promise<T>, deps: unknown[] = [], interval: number = POLL_INTERVAL) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const dataRef = useRef<T | null>(null);

  const fetchData = useCallback(async () => {
    if (!mountedRef.current) return;
    
    // Only show loading on first fetch
    if (dataRef.current === null) {
      setLoading(true);
    }
    
    try {
      const result = await callback();
      if (!mountedRef.current) return;
      
      // Only update if data actually changed (deep comparison for primitive arrays)
      const resultStr = JSON.stringify(result);
      const currentStr = JSON.stringify(dataRef.current);
      
      if (resultStr !== currentStr) {
        dataRef.current = result;
        setData(result);
      }
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    void fetchData();
    const timer = window.setInterval(() => {
      void fetchData();
    }, interval);
    return () => {
      mountedRef.current = false;
      window.clearInterval(timer);
    };
  }, [fetchData, interval]);

  return { data, loading, refresh: fetchData, error };
}

export default function App() {
  const [selectedPeer, setSelectedPeer] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const {
    data: status,
    loading: statusLoading,
    refresh: refreshStatus,
    error: statusError
  } = usePolling<StatusSummary>(fetchStatus, []);

  const {
    data: peers,
    loading: peersLoading,
    refresh: refreshPeers,
    error: peersError
  } = usePolling<Peer[]>(fetchPeers, []);

  const {
    data: messages,
    loading: messagesLoading,
    refresh: refreshMessages,
    error: messagesError
  } = usePolling<MessageLogEntry[]>(() => fetchMessages(200), []);

  const {
    data: files,
    loading: filesLoading,
    refresh: refreshFiles,
    error: filesError
  } = usePolling<FileInfo[]>(() => fetchFiles(100), [], FILE_POLL_INTERVAL);

  const handleConnect = useCallback(
    async (host: string, port: number) => {
      setIsConnecting(true);
      try {
        await connectPeer(host, port);
        await Promise.all([refreshPeers(), refreshStatus()]);
      } finally {
        setIsConnecting(false);
      }
    },
    [refreshPeers, refreshStatus]
  );

  const handleSend = useCallback(
    async (text: string, recipientId?: string) => {
      setIsSending(true);
      try {
        await sendMessage(text, recipientId);
        await Promise.all([refreshMessages()]);
      } finally {
        setIsSending(false);
      }
    },
    [refreshMessages]
  );

  const handleFileSent = useCallback(async () => {
    await Promise.all([refreshFiles(), refreshMessages()]);
  }, [refreshFiles, refreshMessages]);

  useEffect(() => {
    if (!peers || peers.length === 0) {
      setSelectedPeer(null);
      return;
    }

    if (selectedPeer) {
      const stillExists = peers.some((peer) => peer.peer_id === selectedPeer);
      if (!stillExists) {
        setSelectedPeer(null);
      }
    }
  }, [peers, selectedPeer]);

  const peersWithoutSelf = useMemo(() => {
    if (!peers || !status) {
      return peers ?? [];
    }
    return peers.filter((peer) => peer.peer_id !== status.peer_id);
  }, [peers, status]);

  return (
    <div className="app">
      <header className="app__header">
        <h1>P2P Messaging Dashboard</h1>
        <p className="muted">
          Monitor peers, connect to the network, and exchange messages in real time.
        </p>
      </header>

      <main className="app__grid">
        <div className="app__column">
          <StatusSummaryCard
            status={status ?? null}
            isLoading={statusLoading}
            error={statusError}
          />
          <ConnectPeerForm onConnect={handleConnect} isBusy={isConnecting} />
          <MessageComposer onSend={handleSend} selectedPeer={selectedPeer} isBusy={isSending} />
          <FileUpload
            selectedPeer={selectedPeer}
            isBusy={isSending || isConnecting}
            onFileSent={handleFileSent}
          />
        </div>

        <div className="app__column app__column--grow">
          <PeerList
            peers={peersWithoutSelf}
            selectedPeer={selectedPeer}
            onSelect={setSelectedPeer}
            onRefresh={refreshPeers}
            isLoading={peersLoading}
            error={peersError}
          />
          <MessagePanel
            messages={messages ?? []}
            isLoading={messagesLoading}
            error={messagesError}
          />
          <FileList
            files={files ?? []}
            isLoading={filesLoading}
            error={filesError}
            onRefresh={refreshFiles}
          />
        </div>
      </main>

      <footer className="app__footer">
        <span>API endpoint: {import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}</span>
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => {
            void Promise.all([refreshStatus(), refreshPeers(), refreshMessages(), refreshFiles()]).catch(
              () => undefined
            );
          }}
        >
          Refresh All
        </button>
      </footer>
    </div>
  );
}

