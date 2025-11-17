import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo } from "react";
function formatTimestamp(entry) {
    const timestamp = entry.sent_at || entry.received_at;
    if (!timestamp) {
        return "—";
    }
    return new Date(timestamp).toLocaleTimeString();
}
export const MessagePanel = memo(function MessagePanel({ messages, isLoading, error }) {
    return (_jsxs("section", { className: "card card--messages", children: [_jsx("header", { children: _jsx("h2", { children: "Message Log" }) }), _jsx("div", { className: "message-log", children: isLoading ? (_jsx("p", { className: "muted", children: "Loading messages\u2026" })) : error ? (_jsx("p", { className: "form__error", children: error })) : messages.length === 0 ? (_jsx("p", { className: "muted", children: "No messages yet. Start a conversation to see updates here." })) : (messages.map((message, index) => (_jsxs("article", { className: `message-entry message-entry--${message.direction}`, children: [_jsxs("header", { children: [_jsx("span", { className: "badge", children: message.direction === "incoming" ? "Incoming" : "Outgoing" }), _jsx("span", { className: "timestamp", children: formatTimestamp(message) })] }), _jsx("pre", { children: JSON.stringify(message.payload, null, 2) })] }, `${message.payload.message_id ?? index}-${message.direction}-${index}`)))) })] }));
});
