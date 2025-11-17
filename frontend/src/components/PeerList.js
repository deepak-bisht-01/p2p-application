import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { clsx } from "clsx";
import { memo } from "react";
export const PeerList = memo(function PeerList({ peers, selectedPeer, onSelect, onRefresh, isLoading, error }) {
    return (_jsxs("section", { className: "card card--peers", children: [_jsxs("header", { children: [_jsx("h2", { children: "Peers" }), _jsx("button", { type: "button", className: "btn btn--ghost", onClick: onRefresh, children: "Refresh" })] }), isLoading ? (_jsx("p", { className: "muted", children: "Loading peers\u2026" })) : error ? (_jsx("p", { className: "form__error", children: error })) : (_jsx("ul", { className: "peer-list", children: peers
                    .filter((peer) => peer.peer_id && peer.peer_id.length > 0)
                    .map((peer) => {
                    const isSelected = peer.peer_id === selectedPeer;
                    const isOnline = peer.status === "online";
                    return (_jsxs("li", { className: clsx("peer-list__item", {
                            "peer-list__item--selected": isSelected,
                            "peer-list__item--online": isOnline,
                            "peer-list__item--offline": !isOnline
                        }), onClick: () => onSelect(peer.peer_id), children: [_jsxs("div", { children: [_jsx("p", { className: "peer-list__id monospace", children: peer.peer_id }), _jsxs("p", { className: "peer-list__meta", children: [peer.address, ":", peer.port] })] }), _jsx("span", { className: "peer-list__status", children: isOnline ? "Online" : "Offline" })] }, peer.peer_id));
                }) })), peers.length === 0 && !isLoading ? (_jsx("p", { className: "muted", children: "No peers discovered yet. Connect to a peer to get started." })) : null] }));
});
