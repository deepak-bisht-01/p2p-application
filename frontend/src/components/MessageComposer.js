import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, memo } from "react";
export const MessageComposer = memo(function MessageComposer({ onSend, selectedPeer, isBusy }) {
    const [text, setText] = useState("");
    const [broadcast, setBroadcast] = useState(false);
    const [error, setError] = useState(null);
    async function handleSubmit(event) {
        event.preventDefault();
        setError(null);
        if (!text.trim()) {
            setError("Enter a message to send.");
            return;
        }
        if (!broadcast && !selectedPeer) {
            setError("Select a peer or enable broadcast.");
            return;
        }
        try {
            await onSend(text.trim(), broadcast ? undefined : selectedPeer || undefined);
            setText("");
        }
        catch (err) {
            setError(err.message || "Failed to send message");
        }
    }
    return (_jsxs("section", { className: "card card--form", children: [_jsx("h2", { children: "Send Message" }), _jsxs("form", { className: "form", onSubmit: handleSubmit, children: [_jsxs("div", { className: "form__group", children: [_jsx("label", { htmlFor: "message", children: "Message" }), _jsx("textarea", { id: "message", name: "message", value: text, onChange: (event) => setText(event.target.value), rows: 3, placeholder: "Hello, peer!" })] }), _jsxs("div", { className: "form__group form__group--inline", children: [_jsxs("label", { className: "checkbox", children: [_jsx("input", { type: "checkbox", checked: broadcast, onChange: (event) => setBroadcast(event.target.checked) }), "Broadcast to all peers"] }), !broadcast && selectedPeer ? (_jsxs("span", { className: "muted monospace", children: ["Selected peer: ", selectedPeer] })) : null] }), error ? _jsx("p", { className: "form__error", children: error }) : null, _jsx("button", { className: "btn btn--primary", type: "submit", disabled: isBusy, children: isBusy ? "Sending…" : "Send" })] })] }));
});
