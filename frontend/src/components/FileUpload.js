import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, memo, useCallback } from "react";
import { sendFile } from "../api";
export const FileUpload = memo(function FileUpload({ selectedPeer, isBusy, onFileSent }) {
    const [file, setFile] = useState(null);
    const [files, setFiles] = useState(null);
    const [error, setError] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const [broadcast, setBroadcast] = useState(false);
    const [isFolder, setIsFolder] = useState(false);
    const fileInputRef = useRef(null);
    const folderInputRef = useRef(null);
    async function handleSubmit(event) {
        event.preventDefault();
        setError(null);
        if (isFolder) {
            if (!files || files.length === 0) {
                setError("Please select a folder.");
                return;
            }
        }
        else {
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
                    const relativePath = fileItem.webkitRelativePath || fileItem.name;
                    const folderPath = relativePath.substring(0, relativePath.lastIndexOf('/'));
                    await sendFile(selectedPeer || undefined, fileItem, broadcast);
                }
            }
            else if (file) {
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
        }
        catch (err) {
            setError(err.message || "Failed to send file");
        }
        finally {
            setIsSending(false);
        }
    }
    function formatFileSize(bytes) {
        if (bytes < 1024)
            return `${bytes} B`;
        if (bytes < 1024 * 1024)
            return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
    function handleFileChange(event) {
        const selectedFile = event.target.files?.[0] || null;
        setFile(selectedFile);
        setFiles(null);
        setIsFolder(false);
    }
    function handleFolderChange(event) {
        const selectedFiles = event.target.files;
        setFiles(selectedFiles);
        setFile(null);
        setIsFolder(true);
    }
    // Set webkitdirectory attribute using ref
    const setupFolderInput = useCallback((element) => {
        if (element) {
            element.setAttribute('webkitdirectory', '');
            element.setAttribute('directory', '');
        }
        if (folderInputRef.current !== element) {
            folderInputRef.current = element;
        }
    }, []);
    return (_jsxs("section", { className: "card card--form", children: [_jsx("h2", { children: "Send File" }), _jsxs("form", { className: "form", onSubmit: handleSubmit, children: [_jsxs("div", { className: "form__group", children: [_jsx("label", { htmlFor: "file", children: "File or Folder" }), _jsxs("div", { style: { display: "flex", gap: "0.5rem", flexWrap: "wrap" }, children: [_jsxs("label", { className: "btn btn--ghost", style: { margin: 0, cursor: "pointer" }, children: [_jsx("input", { type: "radio", name: "upload-type", checked: !isFolder, onChange: () => {
                                                    setIsFolder(false);
                                                    setFiles(null);
                                                }, style: { marginRight: "0.25rem" } }), "Single File"] }), _jsxs("label", { className: "btn btn--ghost", style: { margin: 0, cursor: "pointer" }, children: [_jsx("input", { type: "radio", name: "upload-type", checked: isFolder, onChange: () => {
                                                    setIsFolder(true);
                                                    setFile(null);
                                                }, style: { marginRight: "0.25rem" } }), "Folder"] })] }), !isFolder ? (_jsx("input", { id: "file", name: "file", type: "file", ref: fileInputRef, onChange: handleFileChange, disabled: isBusy || isSending, style: { marginTop: "0.5rem" } })) : (_jsx("input", { id: "folder", name: "folder", type: "file", ref: setupFolderInput, onChange: handleFolderChange, disabled: isBusy || isSending, multiple: true, style: { marginTop: "0.5rem" } })), file && (_jsxs("div", { className: "file-info", style: { marginTop: "0.5rem", fontSize: "0.9rem", color: "#666" }, children: [_jsx("strong", { children: file.name }), " (", formatFileSize(file.size), ")"] })), files && files.length > 0 && (_jsxs("div", { className: "file-info", style: { marginTop: "0.5rem", fontSize: "0.9rem", color: "#666" }, children: [_jsxs("strong", { children: [files.length, " files"] }), " in folder"] }))] }), _jsxs("div", { className: "form__group form__group--inline", children: [_jsxs("label", { className: "checkbox", children: [_jsx("input", { type: "checkbox", checked: broadcast, onChange: (event) => setBroadcast(event.target.checked) }), "Broadcast to all peers"] }), !broadcast && selectedPeer ? (_jsxs("span", { className: "muted monospace", children: ["Selected peer: ", selectedPeer] })) : null] }), error ? _jsx("p", { className: "form__error", children: error }) : null, _jsx("button", { className: "btn btn--primary", type: "submit", disabled: isBusy || isSending || (!file && !files) || (!broadcast && !selectedPeer), children: isSending ? "Sending…" : broadcast ? "Broadcast File" : "Send File" })] })] }));
});
