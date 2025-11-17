import { FormEvent, useState, useRef, memo, useCallback } from "react";
import { sendFile } from "../api";

interface Props {
  selectedPeer: string | null;
  isBusy: boolean;
  onFileSent?: () => void;
}

export const FileUpload = memo(function FileUpload({ selectedPeer, isBusy, onFileSent }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [files, setFiles] = useState<FileList | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [broadcast, setBroadcast] = useState(false);
  const [isFolder, setIsFolder] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (isFolder) {
      if (!files || files.length === 0) {
        setError("Please select a folder.");
        return;
      }
    } else {
      if (!file) {
        setError("Please select a file.");
        return;
      }
    }

    if (!broadcast && !selectedPeer) {
      setError("Please select a peer or enable broadcast.");
      return;
    }

    setIsSending(true);
    try {
      if (isFolder && files) {
        // Upload folder: send each file with its relative path
        for (let i = 0; i < files.length; i++) {
          const fileItem = files[i];
          // Extract relative path from webkitRelativePath
          const relativePath = (fileItem as any).webkitRelativePath || fileItem.name;
          const folderPath = relativePath.substring(0, relativePath.lastIndexOf('/'));
          
          await sendFile(selectedPeer || undefined, fileItem, broadcast);
        }
      } else if (file) {
        await sendFile(selectedPeer || undefined, file, broadcast);
      }
      
      setFile(null);
      setFiles(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (folderInputRef.current) {
        folderInputRef.current.value = "";
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

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
    setFiles(null);
    setIsFolder(false);
  }

  function handleFolderChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFiles = event.target.files;
    setFiles(selectedFiles);
    setFile(null);
    setIsFolder(true);
  }
  
  // Set webkitdirectory attribute using ref
  const setupFolderInput = useCallback((element: HTMLInputElement | null) => {
    if (element) {
      element.setAttribute('webkitdirectory', '');
      element.setAttribute('directory', '');
    }
    if (folderInputRef.current !== element) {
      (folderInputRef as any).current = element;
    }
  }, []);

  return (
    <section className="card card--form">
      <h2>Send File</h2>
      <form className="form" onSubmit={handleSubmit}>
        <div className="form__group">
          <label htmlFor="file">File or Folder</label>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <label className="btn btn--ghost" style={{ margin: 0, cursor: "pointer" }}>
              <input
                type="radio"
                name="upload-type"
                checked={!isFolder}
                onChange={() => {
                  setIsFolder(false);
                  setFiles(null);
                }}
                style={{ marginRight: "0.25rem" }}
              />
              Single File
            </label>
            <label className="btn btn--ghost" style={{ margin: 0, cursor: "pointer" }}>
              <input
                type="radio"
                name="upload-type"
                checked={isFolder}
                onChange={() => {
                  setIsFolder(true);
                  setFile(null);
                }}
                style={{ marginRight: "0.25rem" }}
              />
              Folder
            </label>
          </div>
          
          {!isFolder ? (
            <input
              id="file"
              name="file"
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              disabled={isBusy || isSending}
              style={{ marginTop: "0.5rem" }}
            />
          ) : (
            <input
              id="folder"
              name="folder"
              type="file"
              ref={setupFolderInput}
              onChange={handleFolderChange}
              disabled={isBusy || isSending}
              multiple
              style={{ marginTop: "0.5rem" }}
            />
          )}
          
          {file && (
            <div className="file-info" style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#666" }}>
              <strong>{file.name}</strong> ({formatFileSize(file.size)})
            </div>
          )}
          {files && files.length > 0 && (
            <div className="file-info" style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#666" }}>
              <strong>{files.length} files</strong> in folder
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
          disabled={isBusy || isSending || (!file && !files) || (!broadcast && !selectedPeer)}
        >
          {isSending ? "Sending…" : broadcast ? "Broadcast File" : "Send File"}
        </button>
      </form>
    </section>
  );
});

