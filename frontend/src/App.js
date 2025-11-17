import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { connectPeer, fetchMessages, fetchPeers, fetchStatus, fetchFiles, sendMessage } from "./api";
import "./App.css";
import { StatusSummaryCard } from "./components/StatusSummaryCard";
import { PeerList } from "./components/PeerList";
import { ConnectPeerForm } from "./components/ConnectPeerForm";
import { MessageComposer } from "./components/MessageComposer";
import { MessagePanel } from "./components/MessagePanel";
import { FileUpload } from "./components/FileUpload";
import { FileList } from "./components/FileList";
const POLL_INTERVAL = 5000;
const FILE_POLL_INTERVAL = 2000; // Fast polling for file transfers to show download button promptly
function usePolling(callback, deps = [], interval = POLL_INTERVAL) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const mountedRef = useRef(true);
    const dataRef = useRef(null);
    const fetchData = useCallback(async () => {
        if (!mountedRef.current)
            return;
        // Only show loading on first fetch
        if (dataRef.current === null) {
            setLoading(true);
        }
        try {
            const result = await callback();
            if (!mountedRef.current)
                return;
            // Only update if data actually changed (deep comparison for primitive arrays)
            const resultStr = JSON.stringify(result);
            const currentStr = JSON.stringify(dataRef.current);
            if (resultStr !== currentStr) {
                dataRef.current = result;
                setData(result);
            }
            setError(null);
        }
        catch (err) {
            if (!mountedRef.current)
                return;
            setError(err instanceof Error ? err.message : "Failed to load data");
        }
        finally {
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
    const [selectedPeer, setSelectedPeer] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const { data: status, loading: statusLoading, refresh: refreshStatus, error: statusError } = usePolling(fetchStatus, []);
    const { data: peers, loading: peersLoading, refresh: refreshPeers, error: peersError } = usePolling(fetchPeers, []);
    const { data: messages, loading: messagesLoading, refresh: refreshMessages, error: messagesError } = usePolling(() => fetchMessages(200), []);
    const { data: files, loading: filesLoading, refresh: refreshFiles, error: filesError } = usePolling(() => fetchFiles(100), [], FILE_POLL_INTERVAL);
    const handleConnect = useCallback(async (host, port) => {
        setIsConnecting(true);
        try {
            await connectPeer(host, port);
            await Promise.all([refreshPeers(), refreshStatus()]);
        }
        finally {
            setIsConnecting(false);
        }
    }, [refreshPeers, refreshStatus]);
    const handleSend = useCallback(async (text, recipientId) => {
        setIsSending(true);
        try {
            await sendMessage(text, recipientId);
            await Promise.all([refreshMessages()]);
        }
        finally {
            setIsSending(false);
        }
    }, [refreshMessages]);
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
    return (_jsxs("div", { className: "app", children: [_jsxs("header", { className: "app__header", children: [_jsx("h1", { children: "P2P Messaging Dashboard" }), _jsx("p", { className: "muted", children: "Monitor peers, connect to the network, and exchange messages in real time." })] }), _jsxs("main", { className: "app__grid", children: [_jsxs("div", { className: "app__column", children: [_jsx(StatusSummaryCard, { status: status ?? null, isLoading: statusLoading, error: statusError }), _jsx(ConnectPeerForm, { onConnect: handleConnect, isBusy: isConnecting }), _jsx(MessageComposer, { onSend: handleSend, selectedPeer: selectedPeer, isBusy: isSending }), _jsx(FileUpload, { selectedPeer: selectedPeer, isBusy: isSending || isConnecting, onFileSent: handleFileSent })] }), _jsxs("div", { className: "app__column app__column--grow", children: [_jsx(PeerList, { peers: peersWithoutSelf, selectedPeer: selectedPeer, onSelect: setSelectedPeer, onRefresh: refreshPeers, isLoading: peersLoading, error: peersError }), _jsx(MessagePanel, { messages: messages ?? [], isLoading: messagesLoading, error: messagesError }), _jsx(FileList, { files: files ?? [], isLoading: filesLoading, error: filesError, onRefresh: refreshFiles })] })] }), _jsxs("footer", { className: "app__footer", children: [_jsxs("span", { children: ["API endpoint: ", import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"] }), _jsx("button", { type: "button", className: "btn btn--ghost", onClick: () => {
                            void Promise.all([refreshStatus(), refreshPeers(), refreshMessages(), refreshFiles()]).catch(() => undefined);
                        }, children: "Refresh All" })] })] }));
}
