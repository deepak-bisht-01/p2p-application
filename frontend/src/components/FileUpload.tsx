import { FormEvent, useState, useRef } from "react";
import { sendFile } from "../api";

interface Props {
  selectedPeer: string | null;
  isBusy: boolean;
  onFileSent?: () => void;
}

export function FileUpload({ selectedPeer, isBusy, onFileSent }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [broadcast, setBroadcast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!file) {
      setError("Please select a file.");
      return;
    }

    if (!broadcast && !selectedPeer) {
      setError("Please select a peer or enable broadcast.");
      return;
    }

    setIsSending(true);
    try {
      await sendFile(selectedPeer || undefined, file, broadcast);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (onFileSent) {
        onFileSent();
      }
    } catch (err) {
      setError((err as Error).message || "Failed to send file");
    } finally {
      setIsSending(false);
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return (
    <section className="card card--form">
      <h2>Send File</h2>
      <form className="form" onSubmit={handleSubmit}>
        <div className="form__group">
          <label htmlFor="file">File</label>
          <input
            id="file"
            name="file"
            type="file"
            ref={fileInputRef}
            onChange={(event) => setFile(event.target.files?.[0] || null)}
            disabled={isBusy || isSending}
          />
          {file && (
            <div className="file-info" style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#666" }}>
              <strong>{file.name}</strong> ({formatFileSize(file.size)})
            </div>
          )}
        </div>
        <div className="form__group form__group--inline">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={broadcast}
              onChange={(event) => setBroadcast(event.target.checked)}
            />
            Broadcast to all peers
          </label>
          {!broadcast && selectedPeer ? (
            <span className="muted monospace">Selected peer: {selectedPeer}</span>
          ) : null}
        </div>
        {error ? <p className="form__error">{error}</p> : null}
        <button
          className="btn btn--primary"
          type="submit"
          disabled={isBusy || isSending || !file || (!broadcast && !selectedPeer)}
        >
          {isSending ? "Sending…" : broadcast ? "Broadcast File" : "Send File"}
        </button>
      </form>
    </section>
  );
}

