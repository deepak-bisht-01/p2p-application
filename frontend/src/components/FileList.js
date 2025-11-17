import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, memo } from "react";
import { getFileDownloadUrl, getFilePreviewUrl, deleteFile } from "../api";
export const FileList = memo(function FileList({ files, isLoading, error, onRefresh }) {
    const [previewFileId, setPreviewFileId] = useState(null);
    const [videoBuffering, setVideoBuffering] = useState({});
    const [deletingFileId, setDeletingFileId] = useState(null);
    async function handleDelete(fileId, filename) {
        if (!confirm(`Are you sure you want to delete "${filename}"?`)) {
            return;
        }
        setDeletingFileId(fileId);
        try {
            await deleteFile(fileId);
            if (onRefresh) {
                onRefresh();
            }
        }
        catch (err) {
            alert(`Failed to delete file: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
        finally {
            setDeletingFileId(null);
        }
    }
    function formatFileSize(bytes) {
        if (bytes < 1024)
            return `${bytes} B`;
        if (bytes < 1024 * 1024)
            return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    function formatDate(dateString) {
        try {
            return new Date(dateString).toLocaleString();
        }
        catch {
            return dateString;
        }
    }
    function isPreviewable(mimeType) {
        return (mimeType.startsWith("image/") ||
            mimeType.startsWith("text/") ||
            mimeType.startsWith("video/") ||
            mimeType === "application/json");
    }
    function handlePreview(file) {
        if (previewFileId === file.file_id) {
            setPreviewFileId(null);
        }
        else {
            setPreviewFileId(file.file_id);
        }
    }
    function getStatusBadgeColor(status) {
        switch (status) {
            case 'completed':
                return '#4caf50';
            case 'receiving':
                return '#2196f3';
            case 'failed':
                return '#f44336';
            default:
                return '#9e9e9e';
        }
    }
    function renderProgressBar(file) {
        if (file.status !== 'receiving' || !file.total_chunks) {
            return null;
        }
        const chunksReceived = file.chunks_received || 0;
        const totalChunks = file.total_chunks || 1;
        const progress = (chunksReceived / totalChunks) * 100;
        return (_jsxs("div", { style: { marginTop: "0.75rem" }, children: [_jsxs("div", { style: {
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "0.25rem",
                        fontSize: "0.85rem"
                    }, children: [_jsxs("span", { style: { color: "#2196f3", fontWeight: "500" }, children: ["Receiving... ", chunksReceived, "/", totalChunks, " chunks"] }), _jsxs("span", { style: { color: "#666" }, children: [progress.toFixed(1), "%"] })] }), _jsx("div", { style: {
                        width: "100%",
                        height: "8px",
                        backgroundColor: "#e0e0e0",
                        borderRadius: "4px",
                        overflow: "hidden"
                    }, children: _jsx("div", { style: {
                            width: `${progress}%`,
                            height: "100%",
                            backgroundColor: "#2196f3",
                            transition: "width 0.3s ease",
                            borderRadius: "4px"
                        } }) })] }));
    }
    return (_jsxs("section", { className: "card card--files", children: [_jsxs("header", { style: { display: "flex", justifyContent: "space-between", alignItems: "center" }, children: [_jsx("h2", { children: "Files" }), onRefresh && (_jsx("button", { className: "btn btn--ghost", type: "button", onClick: onRefresh, disabled: isLoading, children: "Refresh" }))] }), _jsx("div", { className: "file-list", children: isLoading ? (_jsx("p", { className: "muted", children: "Loading files\u2026" })) : error ? (_jsx("p", { className: "form__error", children: error })) : files.length === 0 ? (_jsx("p", { className: "muted", children: "No files yet. Send a file to see it here." })) : (_jsx("div", { style: { display: "flex", flexDirection: "column", gap: "1rem" }, children: files.map((file) => (_jsxs("article", { className: "file-entry", children: [_jsxs("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" }, children: [_jsxs("div", { style: { flex: 1 }, children: [_jsxs("div", { style: { display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }, children: [_jsx("strong", { children: file.filename }), _jsx("span", { className: "badge", style: {
                                                            fontSize: "0.75rem",
                                                            backgroundColor: getStatusBadgeColor(file.status),
                                                            color: "white",
                                                            padding: "2px 8px",
                                                            borderRadius: "12px"
                                                        }, children: file.status })] }), _jsxs("div", { style: { fontSize: "0.85rem", color: "#666", marginBottom: "0.25rem" }, children: [formatFileSize(file.file_size), " \u2022 ", file.mime_type] }), _jsxs("div", { style: { fontSize: "0.8rem", color: "#999" }, children: ["From: ", file.sender_id.substring(0, 8), "... \u2022 ", formatDate(file.created_at)] }), renderProgressBar(file)] }), _jsxs("div", { style: { display: "flex", gap: "0.5rem", flexShrink: 0 }, children: ["                    ", isPreviewable(file.mime_type) && (file.status === "completed" || (file.status === "receiving" && file.mime_type.startsWith("video/"))) && (_jsx("button", { className: "btn btn--ghost", type: "button", onClick: () => handlePreview(file), style: { fontSize: "0.85rem" }, children: previewFileId === file.file_id ? "Hide" : "Preview" })), file.status === "completed" && (_jsx("a", { href: getFileDownloadUrl(file.file_id), download: file.filename, className: "btn btn--primary", style: { fontSize: "0.85rem", textDecoration: "none" }, children: "Download" })), _jsx("button", { className: "btn btn--ghost", type: "button", onClick: () => handleDelete(file.file_id, file.filename), disabled: deletingFileId === file.file_id, style: {
                                                    fontSize: "0.85rem",
                                                    color: "#f44336",
                                                    opacity: deletingFileId === file.file_id ? 0.5 : 1
                                                }, children: deletingFileId === file.file_id ? "Deleting..." : "Delete" })] })] }), previewFileId === file.file_id && (file.status === "completed" || file.status === "receiving") && (_jsxs("div", { style: {
                                    marginTop: "1rem",
                                    padding: "1rem",
                                    backgroundColor: "#f5f5f5",
                                    borderRadius: "4px",
                                    border: "1px solid #ddd",
                                    position: "relative"
                                }, children: [file.status === "receiving" && (_jsx("div", { style: {
                                            position: "absolute",
                                            top: "0.5rem",
                                            right: "0.5rem",
                                            backgroundColor: "#2196f3",
                                            color: "white",
                                            padding: "0.25rem 0.75rem",
                                            borderRadius: "12px",
                                            fontSize: "0.75rem",
                                            fontWeight: "600"
                                        }, children: "Transfer in progress..." })), file.mime_type.startsWith("image/") ? (_jsx("img", { src: getFilePreviewUrl(file.file_id), alt: file.filename, style: { maxWidth: "100%", maxHeight: "400px", display: "block", margin: "0 auto" } })) : file.mime_type.startsWith("video/") ? (_jsxs("div", { style: { position: "relative" }, children: [videoBuffering[file.file_id] && (_jsx("div", { style: {
                                                    position: "absolute",
                                                    top: "50%",
                                                    left: "50%",
                                                    transform: "translate(-50%, -50%)",
                                                    backgroundColor: "rgba(0,0,0,0.7)",
                                                    color: "white",
                                                    padding: "1rem 2rem",
                                                    borderRadius: "8px",
                                                    fontSize: "1rem",
                                                    fontWeight: "600",
                                                    zIndex: 10
                                                }, children: "Buffering..." })), _jsxs("video", { controls: true, style: { maxWidth: "100%", maxHeight: "400px", display: "block", margin: "0 auto" }, onWaiting: () => setVideoBuffering(prev => ({ ...prev, [file.file_id]: true })), onCanPlay: () => setVideoBuffering(prev => ({ ...prev, [file.file_id]: false })), onPlaying: () => setVideoBuffering(prev => ({ ...prev, [file.file_id]: false })), children: [_jsx("source", { src: getFilePreviewUrl(file.file_id), type: file.mime_type }), "Your browser does not support the video tag."] })] })) : file.mime_type.startsWith("text/") || file.mime_type === "application/json" ? (_jsx("iframe", { src: getFilePreviewUrl(file.file_id), style: {
                                            width: "100%",
                                            height: "300px",
                                            border: "1px solid #ddd",
                                            borderRadius: "4px"
                                        }, title: `Preview of ${file.filename}` })) : null] }))] }, file.file_id))) })) })] }));
});
