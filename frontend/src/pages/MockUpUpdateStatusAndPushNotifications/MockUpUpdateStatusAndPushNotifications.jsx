import React, { useEffect, useState, useRef } from "react";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import { useNavigate } from "react-router-dom";

// API and WebSocket endpoints
const WEBSOCKET_URL = "http://localhost:8080/ws";
const NOTIF_API_URL = "http://localhost:8080/notification/getNotificationsFromUserEmail";
const MARK_READ_BY_ID_API_URL = "http://localhost:8080/notification/markAsReadById";
const MARK_ALL_READ_API_URL = "http://localhost:8080/notification/markAllAsRead";
const API_URL = "http://localhost:8080/repairTicket/updateRepairStatus";
const DELETE_NOTIF_API_URL = "http://localhost:8080/notification/deleteNotification";
const DELETE_ALL_NOTIF_API_URL = "http://localhost:8080/notification/deleteAllNotifications";

// Main component for updating repair status and handling push notifications
const MockUpUpdateStatusAndPushNotifications = () => {
    // State variables for form, notifications, UI, and connection
    const [ticketNumber, setTicketNumber] = useState("");
    const [repairStatus, setRepairStatus] = useState("");
    const [notifications, setNotifications] = useState([]);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [unread, setUnread] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState("Disconnected");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [newNotif, setNewNotif] = useState(false);

    // Refs for WebSocket client and dropdown
    const stompClient = useRef(null);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Get user info from localStorage
    const userEmail = localStorage.getItem("userEmail");
    const authToken = localStorage.getItem("authToken");

    // Fetch notifications for the user
    const fetchNotifications = async () => {
        if (!userEmail || !authToken) return;
        try {
            const res = await fetch(`${NOTIF_API_URL}?email=${encodeURIComponent(userEmail)}`, {
                headers: { Authorization: `Bearer ${authToken}` }
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data);
                setUnread(data.some(n => !n.isRead));
            }
        } catch (err) {}
    };

    // Mark a single notification as read
    const markNotificationAsRead = async (notificationId) => {
        if (!authToken) return;
        await fetch(`${MARK_READ_BY_ID_API_URL}?notificationId=${notificationId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`
            }
        });
        await fetchNotifications();
    };

    // Mark all notifications as read
    const markAllNotificationsAsRead = async () => {
        if (!authToken || !userEmail) return;
        await fetch(`${MARK_ALL_READ_API_URL}?email=${encodeURIComponent(userEmail)}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authToken}`
            }
        });
        await fetchNotifications();
    };

    // Delete a single notification
    const deleteNotification = async (notificationId) => {
        if (!authToken) return;
        await fetch(`${DELETE_NOTIF_API_URL}/${notificationId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${authToken}`
            }
        });
        await fetchNotifications();
    };

    // Delete all notifications for the user
    const deleteAllNotifications = async () => {
        if (!authToken || !userEmail) return;
        await fetch(`${DELETE_ALL_NOTIF_API_URL}?email=${encodeURIComponent(userEmail)}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${authToken}`
            }
        });
        await fetchNotifications();
    };

    // Set up WebSocket connection for real-time notifications
    useEffect(() => {
        if (!userEmail) return;
        const socketFactory = () => new SockJS(WEBSOCKET_URL);
        const client = Stomp.over(socketFactory);
        stompClient.current = client;
        client.connect({}, () => {
            setConnectionStatus("Connected");
            // Subscribe to notifications for this user
            client.subscribe(`/topic/notifications/${userEmail}`, (msg) => {
                setNewNotif(true);
                fetchNotifications();
            });
        }, () => setConnectionStatus("Disconnected"));
        // Cleanup on unmount
        return () => {
            if (stompClient.current) {
                stompClient.current.disconnect();
            }
        };
    }, [userEmail]);

    // Fetch notifications when userEmail changes
    useEffect(() => { fetchNotifications(); }, [userEmail]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        if (dropdownOpen) document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [dropdownOpen]);

    // Reset new notification indicator when dropdown opens
    useEffect(() => {
        if (dropdownOpen) {
            setNewNotif(false);
        }
    }, [dropdownOpen]);

    // Refresh notifications when dropdown opens
    useEffect(() => {
        if (dropdownOpen) {
            fetchNotifications();
        }
    }, [dropdownOpen]);

    // Handle form submission to update repair status
    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        if (!ticketNumber || !repairStatus) {
            setError("Ticket number and status required");
            return;
        }
        setLoading(true);
        setError("");
        try {
            await fetch(API_URL, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`
                },
                body: JSON.stringify({ ticketNumber, repairStatus })
            });
        } catch {
            setError("Failed to update status");
        }
        setLoading(false);
    };

    // Toggle notification dropdown
    const handleBellClick = async () => {
        setDropdownOpen((open) => !open);
    };

    // Handle clicking a notification (navigate to ticket status page)
    const handleNotificationClick = (notif) => {
        setDropdownOpen(false);
        if (notif.ticketNumber) {
            navigate(`/realtimestatus?ticketNumber=${notif.ticketNumber}`);
        }
    };

    // Render UI: notification bell, dropdown, and update status form
    return (
        <div style={{ maxWidth: 400, margin: "40px auto", fontFamily: "Arial" }}>
            {/* Notification bell and dropdown */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 20 }}>
                <div style={{ position: "relative" }}>
                    <button
                        onClick={handleBellClick}
                        style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            position: "relative"
                        }}
                    >
                        {/* Bell icon with green dot if unread/new notifications */}
                        <span style={{ fontSize: 28, color: unread || newNotif ? "#33e407" : "#888" }}>🔔</span>
                        {(unread || newNotif) && (
                            <span style={{
                                position: "absolute",
                                top: 2,
                                right: 2,
                                width: 10,
                                height: 10,
                                background: "#33e407",
                                borderRadius: "50%",
                                border: "2px solid #fff"
                            }} />
                        )}
                    </button>
                    {/* Dropdown with notifications */}
                    {dropdownOpen && (
                        <div
                            ref={dropdownRef}
                            style={{
                                position: "absolute",
                                right: 0,
                                top: 36,
                                width: 320,
                                background: "#fff",
                                boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
                                borderRadius: 8,
                                zIndex: 100,
                                maxHeight: 400,
                                overflowY: "auto"
                            }}
                        >
                            <div style={{ padding: 12, borderBottom: "1px solid #eee", fontWeight: "bold" }}>
                                Notifications
                            </div>
                            {/* Actions: Delete all, Mark all as read */}
                            {notifications.length > 0 && (
                                <div style={{ padding: "8px 12px", borderBottom: "1px solid #eee", textAlign: "right" }}>
                                    <button
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            await deleteAllNotifications();
                                        }}
                                        style={{
                                            fontSize: 12,
                                            background: "#e40733",
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: 4,
                                            padding: "4px 10px",
                                            cursor: "pointer",
                                            marginRight: 8
                                        }}
                                    >
                                        Delete All
                                    </button>
                                    {unread && (
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                await markAllNotificationsAsRead();
                                            }}
                                            style={{
                                                fontSize: 12,
                                                background: "#33e407",
                                                color: "#fff",
                                                border: "none",
                                                borderRadius: 4,
                                                padding: "4px 10px",
                                                cursor: "pointer"
                                            }}
                                        >
                                            Mark all as Read
                                        </button>
                                    )}
                                </div>
                            )}
                            {/* List of notifications */}
                            {notifications.map((notif) => (
                                <div
                                    key={notif.notificationId}
                                    onClick={() => handleNotificationClick(notif)}
                                    style={{
                                        padding: 12,
                                        background: notif.isRead ? "#f9f9f9" : "#e6ffe6",
                                        borderBottom: "1px solid #eee",
                                        cursor: notif.ticketNumber ? "pointer" : "default",
                                        position: "relative"
                                    }}
                                >
                                    <div style={{ fontWeight: notif.isRead ? "normal" : "bold" }}>
                                        {notif.message}
                                    </div>
                                    <div style={{ fontSize: 12, color: "#888" }}>
                                        {notif.createdAt}
                                    </div>
                                    {/* Actions for each notification */}
                                    <div style={{ position: "absolute", right: 10, top: 10, display: "flex", gap: 4 }}>
                                        {!notif.isRead && (
                                            <button
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    markNotificationAsRead(notif.notificationId);
                                                }}
                                                style={{
                                                    fontSize: 11,
                                                    background: "#33e407",
                                                    color: "#fff",
                                                    border: "none",
                                                    borderRadius: 4,
                                                    padding: "2px 8px",
                                                    cursor: "pointer"
                                                }}
                                            >
                                                Mark as Read
                                            </button>
                                        )}
                                        <button
                                            onClick={e => {
                                                e.stopPropagation();
                                                deleteNotification(notif.notificationId);
                                            }}
                                            style={{
                                                fontSize: 11,
                                                background: "#e40733",
                                                color: "#fff",
                                                border: "none",
                                                borderRadius: 4,
                                                padding: "2px 8px",
                                                cursor: "pointer"
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {/* Form to update repair status */}
            <form onSubmit={handleUpdateStatus} style={{ background: "#f4f4f4", padding: 24, borderRadius: 8 }}>
                <h2 style={{ marginBottom: 20 }}>Update Repair Status</h2>
                <div style={{ marginBottom: 16 }}>
                    <label>Ticket Number</label>
                    <input
                        type="text"
                        value={ticketNumber}
                        onChange={e => setTicketNumber(e.target.value)}
                        style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                    />
                </div>
                <div style={{ marginBottom: 16 }}>
                    <label>Repair Status</label>
                    <select
                        value={repairStatus}
                        onChange={e => setRepairStatus(e.target.value)}
                        style={{ width: "100%", padding: 8, borderRadius: 4, border: "1px solid #ccc" }}
                    >
                        <option value="">Select status</option>
                        <option value="RECEIVED">RECEIVED</option>
                        <option value="DIAGNOSING">DIAGNOSING</option>
                        <option value="AWAITING_PARTS">AWAITING_PARTS</option>
                        <option value="REPAIRING">REPAIRING</option>
                        <option value="READY_FOR_PICKUP">READY_FOR_PICKUP</option>
                        <option value="COMPLETED">COMPLETED</option>
                    </select>
                </div>
                {error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}
                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        background: "#33e407",
                        color: "#fff",
                        border: "none",
                        borderRadius: 4,
                        padding: "10px 20px",
                        cursor: "pointer",
                        fontWeight: "bold"
                    }}
                >
                    {loading ? "Updating..." : "Update Status"}
                </button>
            </form>
            {/* WebSocket connection status */}
            <div style={{ marginTop: 24, color: "#888", textAlign: "center" }}>
                WebSocket: {connectionStatus}
            </div>
        </div>
    );
};

export default MockUpUpdateStatusAndPushNotifications;