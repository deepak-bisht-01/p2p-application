import { useState } from "react";
import { FileInfo } from "../types";
import { getFileDownloadUrl, getFilePreviewUrl } from "../api";

interface Props {
  files: FileInfo[];
  isLoading: boolean;
  error: string | null;
  onRefresh?: () => void;
}

export function FileList({ files, isLoading, error, onRefresh }: Props) {
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);

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
                      <span className="badge" style={{ fontSize: "0.75rem" }}>
                        {file.status}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.25rem" }}>
                      {formatFileSize(file.file_size)} • {file.mime_type}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#999" }}>
                      From: {file.sender_id.substring(0, 8)}... • {formatDate(file.created_at)}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                    {isPreviewable(file.mime_type) && file.status === "completed" && (
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
                {previewFileId === file.file_id && file.status === "completed" && (
                  <div
                    style={{
                      marginTop: "1rem",
                      padding: "1rem",
                      backgroundColor: "#f5f5f5",
                      borderRadius: "4px",
                      border: "1px solid #ddd"
                    }}
                  >
                    {file.mime_type.startsWith("image/") ? (
                      <img
                        src={getFilePreviewUrl(file.file_id)}
                        alt={file.filename}
                        style={{ maxWidth: "100%", maxHeight: "400px", display: "block", margin: "0 auto" }}
                      />
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
}

