import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, memo } from "react";
export const ConnectPeerForm = memo(function ConnectPeerForm({ onConnect, isBusy }) {
    const [host, setHost] = useState("127.0.0.1");
    const [port, setPort] = useState(5001);
    const [error, setError] = useState(null);
    async function handleSubmit(event) {
        event.preventDefault();
        setError(null);
        if (!host || !port) {
            setError("Provide host and port");
            return;
        }
        try {
            await onConnect(host.trim(), Number(port));
        }
        catch (err) {
            setError(err.message || "Failed to connect");
        }
    }
    return (_jsxs("section", { className: "card card--form", children: [_jsx("h2", { children: "Connect to Peer" }), _jsxs("form", { className: "form", onSubmit: handleSubmit, children: [_jsxs("div", { className: "form__group", children: [_jsx("label", { htmlFor: "host", children: "Host" }), _jsx("input", { id: "host", name: "host", type: "text", value: host, onChange: (event) => setHost(event.target.value), placeholder: "127.0.0.1" })] }), _jsxs("div", { className: "form__group", children: [_jsx("label", { htmlFor: "port", children: "Port" }), _jsx("input", { id: "port", name: "port", type: "number", min: 1, max: 65535, value: port, onChange: (event) => setPort(Number(event.target.value)) })] }), error ? _jsx("p", { className: "form__error", children: error }) : null, _jsx("button", { className: "btn btn--primary", type: "submit", disabled: isBusy, children: isBusy ? "Connecting…" : "Connect" })] })] }));
});
