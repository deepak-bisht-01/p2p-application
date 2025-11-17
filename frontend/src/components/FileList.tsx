import { useState, memo } from "react";
import { FileInfo } from "../types";
import { getFileDownloadUrl, getFilePreviewUrl } from "../api";

interface Props {
  files: FileInfo[];
  isLoading: boolean;
  error: string | null;
  onRefresh?: () => void;
}

export const FileList = memo(function FileList({ files, isLoading, error, onRefresh }: Props) {
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);
  const [videoBuffering, setVideoBuffering] = useState<{[key: string]: boolean}>({});

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  }

  function isPreviewable(mimeType: string): boolean {
    return (
      mimeType.startsWith("image/") ||
      mimeType.startsWith("text/") ||
      mimeType.startsWith("video/") ||
      mimeType === "application/json"
    );
  }

  function handlePreview(file: FileInfo) {
    if (previewFileId === file.file_id) {
      setPreviewFileId(null);
    } else {
      setPreviewFileId(file.file_id);
    }
  }

  function getStatusBadgeColor(status: string): string {
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

  function renderProgressBar(file: FileInfo) {
    if (file.status !== 'receiving' || !file.total_chunks) {
      return null;
    }

    const chunksReceived = file.chunks_received || 0;
    const totalChunks = file.total_chunks || 1;
    const progress = (chunksReceived / totalChunks) * 100;

    return (
      <div style={{ marginTop: "0.75rem" }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: "0.25rem",
          fontSize: "0.85rem"
        }}>
          <span style={{ color: "#2196f3", fontWeight: "500" }}>
            Receiving... {chunksReceived}/{totalChunks} chunks
          </span>
          <span style={{ color: "#666" }}>{progress.toFixed(1)}%</span>
        </div>
        <div style={{
          width: "100%",
          height: "8px",
          backgroundColor: "#e0e0e0",
          borderRadius: "4px",
          overflow: "hidden"
        }}>
          <div style={{
            width: `${progress}%`,
            height: "100%",
            backgroundColor: "#2196f3",
            transition: "width 0.3s ease",
            borderRadius: "4px"
          }} />
        </div>
      </div>
    );
  }

  return (
    <section className="card card--files">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Files</h2>
        {onRefresh && (
          <button className="btn btn--ghost" type="button" onClick={onRefresh} disabled={isLoading}>
            Refresh
          </button>
        )}
      </header>
      <div className="file-list">
        {isLoading ? (
          <p className="muted">Loading files…</p>
        ) : error ? (
          <p className="form__error">{error}</p>
        ) : files.length === 0 ? (
          <p className="muted">No files yet. Send a file to see it here.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {files.map((file) => (
              <article key={file.file_id} className="file-entry">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <strong>{file.filename}</strong>
                      <span 
                        className="badge" 
                        style={{ 
                          fontSize: "0.75rem",
                          backgroundColor: getStatusBadgeColor(file.status),
                          color: "white",
                          padding: "2px 8px",
                          borderRadius: "12px"
                        }}
                      >
                        {file.status}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.25rem" }}>
                      {formatFileSize(file.file_size)} • {file.mime_type}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#999" }}>
                      From: {file.sender_id.substring(0, 8)}... • {formatDate(file.created_at)}
                    </div>
                    {renderProgressBar(file)}
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                    {isPreviewable(file.mime_type) && (file.status === "completed" || (file.status === "receiving" && file.mime_type.startsWith("video/"))) && (
                      <button
                        className="btn btn--ghost"
                        type="button"
                        onClick={() => handlePreview(file)}
                        style={{ fontSize: "0.85rem" }}
                      >
                        {previewFileId === file.file_id ? "Hide" : "Preview"}
                      </button>
                    )}
                    {file.status === "completed" && (
                      <a
                        href={getFileDownloadUrl(file.file_id)}
                        download={file.filename}
                        className="btn btn--primary"
                        style={{ fontSize: "0.85rem", textDecoration: "none" }}
                      >
                        Download
                      </a>
                    )}
                  </div>
                </div>
                {previewFileId === file.file_id && (file.status === "completed" || file.status === "receiving") && (
                  <div
                    style={{
                      marginTop: "1rem",
                      padding: "1rem",
                      backgroundColor: "#f5f5f5",
                      borderRadius: "4px",
                      border: "1px solid #ddd",
                      position: "relative"
                    }}
                  >
                    {file.status === "receiving" && (
                      <div style={{
                        position: "absolute",
                        top: "0.5rem",
                        right: "0.5rem",
                        backgroundColor: "#2196f3",
                        color: "white",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "12px",
                        fontSize: "0.75rem",
                        fontWeight: "600"
                      }}>
                        Transfer in progress...
                      </div>
                    )}
                    {file.mime_type.startsWith("image/") ? (
                      <img
                        src={getFilePreviewUrl(file.file_id)}
                        alt={file.filename}
                        style={{ maxWidth: "100%", maxHeight: "400px", display: "block", margin: "0 auto" }}
                      />
                    ) : file.mime_type.startsWith("video/") ? (
                      <div style={{ position: "relative" }}>
                        {videoBuffering[file.file_id] && (
                          <div style={{
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
                          }}>
                            Buffering...
                          </div>
                        )}
                        <video
                          controls
                          style={{ maxWidth: "100%", maxHeight: "400px", display: "block", margin: "0 auto" }}
                          onWaiting={() => setVideoBuffering(prev => ({ ...prev, [file.file_id]: true }))}
                          onCanPlay={() => setVideoBuffering(prev => ({ ...prev, [file.file_id]: false }))}
                          onPlaying={() => setVideoBuffering(prev => ({ ...prev, [file.file_id]: false }))}
                        >
                          <source src={getFilePreviewUrl(file.file_id)} type={file.mime_type} />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                    ) : file.mime_type.startsWith("text/") || file.mime_type === "application/json" ? (
                      <iframe
                        src={getFilePreviewUrl(file.file_id)}
                        style={{
                          width: "100%",
                          height: "300px",
                          border: "1px solid #ddd",
                          borderRadius: "4px"
                        }}
                        title={`Preview of ${file.filename}`}
                      />
                    ) : null}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
});

