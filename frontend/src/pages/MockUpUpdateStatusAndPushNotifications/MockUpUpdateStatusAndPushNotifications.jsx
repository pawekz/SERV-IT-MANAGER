// MockUpUpdateStatusAndPushNotifications.jsx
// This React component provides a mockup UI for updating repair ticket statuses
// and managing real-time push notifications using WebSocket (STOMP over SockJS).
// It demonstrates notification CRUD, pagination, and live updates for a user.

import React, { useEffect, useState, useRef } from "react";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import { useNavigate } from "react-router-dom";
import api, { API_BASE_URL } from '../../config/ApiConfig.jsx';

// --- Inline styles for UI sections and elements ---
const sectionStyle = {
    background: "#fff",
    borderRadius: 10,
    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
    padding: 24,
    marginBottom: 32,
    marginRight: 24,
    flex: "1 1 0",
    minWidth: 320
};

const bellHeaderStyle = {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 6
};

const bellDescStyle = {
    fontSize: 13,
    color: "#555",
    marginBottom: 16
};

const bellButtonStyle = {
    background: "none",
    border: "none",
    cursor: "pointer",
    position: "relative"
};

const bellsRowStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    gap: 0,
    marginBottom: 40,
    flexWrap: "wrap"
};

// --- Main component ---
const MockUpUpdateStatusAndPushNotifications = () => {
    // --- State variables for notifications, UI, and connection status ---
    // Form state for updating repair status
    const [ticketNumber, setTicketNumber] = useState("");
    const [repairStatus, setRepairStatus] = useState("");

    // Notification lists
    const [notifications, setNotifications] = useState([]); // All notifications
    const [unreadNotifications, setUnreadNotifications] = useState([]); // Only unread
    const [notificationsPageable, setNotificationsPageable] = useState([]); // Paginated all
    const [unreadNotificationsPageable, setUnreadNotificationsPageable] = useState([]); // Paginated unread

    // UI state for dropdowns and notification indicators
    const [dropdownOpen, setDropdownOpen] = useState([false, false, false, false]); // Which bell dropdown is open
    const [unread, setUnread] = useState(false); // Any unread in all notifications
    const [unreadUnread, setUnreadUnread] = useState(false); // Any unread in unread notifications
    const [unreadPageable, setUnreadPageable] = useState(false); // Any unread in paginated all
    const [unreadUnreadPageable, setUnreadUnreadPageable] = useState(false); // Any unread in paginated unread
    const [connectionStatus, setConnectionStatus] = useState("Disconnected"); // WebSocket status
    const [error, setError] = useState(""); // Error for status update form
    const [loading, setLoading] = useState(false); // Loading for status update form

    // Notification "new" indicators for bells (turns green when new notification arrives)
    const [newNotif, setNewNotif] = useState(false);
    const [newNotifUnread, setNewNotifUnread] = useState(false);
    const [newNotifPageable, setNewNotifPageable] = useState(false);
    const [newNotifUnreadPageable, setNewNotifUnreadPageable] = useState(false);

    // For paginated notification lists
    const [page, setPage] = useState(0); // Page for all notifications
    const [unreadPage, setUnreadPage] = useState(0); // Page for unread notifications

    // --- Refs and navigation ---
    const stompClient = useRef(null); // WebSocket client instance
    // Refs for dropdowns to handle outside click
    const dropdownRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
    const navigate = useNavigate(); // For navigation on notification click

    // --- User info from localStorage (for API auth) ---
    const userEmail = localStorage.getItem("userEmail");
    const authToken = localStorage.getItem("authToken");

    // --- Fetch all notifications for user ---
    const fetchNotifications = async () => {
        if (!userEmail || !authToken) return;
        try {
            const res = await api.get(`/notification/getNotificationsFromUserEmail`, {
                params: { email: userEmail }
            });
            const data = res.data;
            setNotifications(data);
            setUnread(data.some(n => !n.isRead)); // Set unread indicator
        } catch {}
    };

    // --- Fetch only unread notifications for user ---
    const fetchUnreadNotifications = async () => {
        if (!userEmail || !authToken) return;
        try {
            const res = await api.get(`/notification/getAllUnreadNotifications`, {
                params: { email: userEmail }
            });
            const data = res.data;
            setUnreadNotifications(data);
            setUnreadUnread(data.length > 0); // Set unread indicator
        } catch {}
    };

    // --- Fetch paginated all notifications ---
    const fetchNotificationsPageable = async (pageNum = 0) => {
        if (!userEmail || !authToken) return;
        try {
            const res = await api.get(`/notification/getNotificationsFromUserEmailPageable`, {
                params: { email: userEmail, page: pageNum, size: 5 }
            });
            const data = res.data;
            setNotificationsPageable(data.content || []);
            setUnreadUnreadPageable((data.content || []).length > 0); // Set unread indicator
        } catch {}
    };

    // --- Fetch paginated unread notifications ---
    const fetchUnreadNotificationsPageable = async (pageNum = 0) => {
        if (!userEmail || !authToken) return;
        try {
            const res = await api.get(`/notification/getAllUnreadNotificationsFromUserPageable`, {
                params: { email: userEmail, page: pageNum, size: 5 }
            });
            const data = res.data;
            setUnreadNotificationsPageable(data.content || []);
            setUnreadUnreadPageable((data.content || []).length > 0);
        } catch (e) {
            setUnreadNotificationsPageable([]);
            setUnreadUnreadPageable(false);
        }
    };

    // --- Mark a single notification as read ---
    // fetchFn is a callback to refresh the notification list after marking as read
    const markNotificationAsRead = async (notificationId, fetchFn) => {
        if (!authToken) return;
        await api.patch(`/notification/markAsReadById`, null, {
            params: { notificationId }
        });
        await fetchFn(); // Refresh notifications
    };

    // --- Mark all notifications as read ---
    const markAllNotificationsAsRead = async (fetchFn) => {
        if (!authToken || !userEmail) return;
        await api.patch(`/notification/markAllAsRead`, null, {
            params: { email: userEmail }
        });
        await fetchFn(); // Refresh notifications
    };

    // --- Delete a single notification ---
    const deleteNotification = async (notificationId, fetchFn) => {
        if (!authToken) return;
        await api.delete(`/notification/deleteNotification/${notificationId}`);
        await fetchFn(); // Refresh notifications
    };

    // --- Delete all notifications for user ---
    const deleteAllNotifications = async (fetchFn) => {
        if (!authToken || !userEmail) return;
        await api.delete(`/notification/deleteAllNotifications`, {
            params: { email: userEmail }
        });
        await fetchFn(); // Refresh notifications
    };

    // --- WebSocket connection for real-time notifications ---
    useEffect(() => {
        if (!userEmail) return;
        // Create SockJS and STOMP client
        const socketFactory = () => new SockJS(`${API_BASE_URL}/ws`);
        const client = Stomp.over(socketFactory);
        stompClient.current = client;
        // Connect and subscribe to user-specific topic
        client.connect({}, () => {
            setConnectionStatus("Connected");
            client.subscribe(`/topic/notifications/${userEmail}`, () => {
                // Set "new" indicators and refresh all notification lists
                setNewNotif(true);
                setNewNotifUnread(true);
                setNewNotifPageable(true);
                setNewNotifUnreadPageable(true);
                fetchNotifications();
                fetchUnreadNotifications();
                fetchNotificationsPageable(page);
                fetchUnreadNotificationsPageable(unreadPage);
            });
        }, () => setConnectionStatus("Disconnected"));
        // Cleanup on unmount
        return () => {
            if (stompClient.current) {
                stompClient.current.disconnect();
            }
        };
    }, [userEmail, page, unreadPage]);

    // --- Fetch notifications on mount and when userEmail changes ---
    useEffect(() => { fetchNotifications(); }, [userEmail]);
    useEffect(() => { fetchUnreadNotifications(); }, [userEmail]);
    useEffect(() => { fetchNotificationsPageable(page); }, [userEmail, page]);
    useEffect(() => { fetchUnreadNotificationsPageable(unreadPage); }, [userEmail, unreadPage]);

    // --- Close dropdowns when clicking outside ---
    useEffect(() => {
        const handleClick = (e) => {
            dropdownRefs.forEach((ref, idx) => {
                if (ref.current && !ref.current.contains(e.target)) {
                    setDropdownOpen((prev) => prev.map((v, i) => i === idx ? false : v));
                }
            });
        };
        if (dropdownOpen.some(Boolean)) document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [dropdownOpen]);

    // --- Reset "new" indicators when dropdowns are opened ---
    useEffect(() => { if (dropdownOpen[0]) setNewNotif(false); }, [dropdownOpen[0]]);
    useEffect(() => { if (dropdownOpen[1]) setNewNotifUnread(false); }, [dropdownOpen[1]]);
    useEffect(() => { if (dropdownOpen[2]) setNewNotifPageable(false); }, [dropdownOpen[2]]);
    useEffect(() => { if (dropdownOpen[3]) setNewNotifUnreadPageable(false); }, [dropdownOpen[3]]);

    // --- Fetch notifications when dropdowns are opened ---
    useEffect(() => { if (dropdownOpen[0]) fetchNotifications(); }, [dropdownOpen[0]]);
    useEffect(() => { if (dropdownOpen[1]) fetchUnreadNotifications(); }, [dropdownOpen[1]]);
    useEffect(() => { if (dropdownOpen[2]) fetchNotificationsPageable(page); }, [dropdownOpen[2], page]);
    useEffect(() => { if (dropdownOpen[3]) fetchUnreadNotificationsPageable(unreadPage); }, [dropdownOpen[3], unreadPage]);

    // --- Handle repair status update form submission ---
    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        if (!ticketNumber || !repairStatus) {
            setError("Ticket number and status required");
            return;
        }
        setLoading(true);
        setError("");
        try {
            await api.patch(`/repairTicket/updateRepairStatus`, { ticketNumber, repairStatus });
        } catch {
            setError("Failed to update status");
        }
        setLoading(false);
    };

    // --- Handle bell icon click to open/close dropdowns ---
    const handleBellClick = (idx) => {
        setDropdownOpen((open) => open.map((v, i) => i === idx ? !v : false));
    };

    // --- Handle notification click: close dropdowns and navigate if ticketNumber exists ---
    const handleNotificationClick = (notif) => {
        setDropdownOpen([false, false, false, false]);
        if (notif.ticketNumber) {
            navigate(`/realtimestatus?ticketNumber=${notif.ticketNumber}`);
        }
    };

    // --- Render a bell section (notification dropdown) ---
    // This function renders each notification bell and its dropdown
    const renderBellSection = (
        idx, title, desc, bellActive, newNotif, dropdown, dropdownRef,
        notifications, unread, fetchFn, page, setPage, isPageable, endpoint
    ) => (
        <section style={sectionStyle}>
            <div style={bellHeaderStyle}>{title}</div>
            <div style={bellDescStyle}>{desc}</div>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>
                Endpoint: <span style={{ fontFamily: "monospace" }}>{endpoint}</span>
            </div>
            <button onClick={() => handleBellClick(idx)} style={bellButtonStyle} data-testid={`bell-btn-${idx}`}>
                <span style={{ fontSize: 32, color: bellActive || newNotif ? "#33e407" : "#888" }}>🔔</span>
                {(bellActive || newNotif) && (
                    <span style={{
                        position: "absolute",
                        top: 2,
                        right: 2,
                        width: 12,
                        height: 12,
                        background: "#33e407",
                        borderRadius: "50%",
                        border: "2px solid #fff"
                    }} />
                )}
            </button>
            {dropdown && (
                <div
                    ref={dropdownRef}
                    style={{
                        position: "absolute",
                        right: 0,
                        top: 48,
                        width: 340,
                        background: "#fff",
                        boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
                        borderRadius: 8,
                        zIndex: 100,
                        maxHeight: 400,
                        overflowY: "auto"
                    }}
                >
                    <div style={{ padding: 12, borderBottom: "1px solid #eee", fontWeight: "bold" }}>
                        {title}
                    </div>
                    {notifications.length > 0 && (
                        <div style={{ padding: "8px 12px", borderBottom: "1px solid #eee", textAlign: "right" }}>
                            <button
                                onClick={async (e) => {
                                    e.stopPropagation();
                                    await deleteAllNotifications(fetchFn);
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
                                        await markAllNotificationsAsRead(fetchFn);
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
                            <div style={{ position: "absolute", right: 10, top: 10, display: "flex", gap: 4 }}>
                                {!notif.isRead && (
                                    <button
                                        onClick={e => {
                                            e.stopPropagation();
                                            markNotificationAsRead(notif.notificationId, fetchFn);
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
                                        deleteNotification(notif.notificationId, fetchFn);
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
                    {isPageable && (
                        <div style={{
                            position: "sticky",
                            bottom: 0,
                            background: "#fff",
                            boxShadow: "0 -2px 8px rgba(0,0,0,0.04)",
                            display: "flex",
                            justifyContent: "space-between",
                            padding: 8,
                            zIndex: 101
                        }}>
                            <button
                                disabled={page === 0}
                                onClick={() => setPage(p => Math.max(0, p - 1))}
                                style={{
                                    fontSize: 12,
                                    background: "#eee",
                                    color: "#333",
                                    border: "none",
                                    borderRadius: 4,
                                    padding: "4px 10px",
                                    cursor: page === 0 ? "not-allowed" : "pointer"
                                }}
                            >
                                Prev
                            </button>
                            <span style={{ fontSize: 12, alignSelf: "center" }}>Page {page + 1}</span>
                            <button
                                disabled={notifications.length < 5}
                                onClick={() => setPage(p => p + 1)}
                                style={{
                                    fontSize: 12,
                                    background: "#eee",
                                    color: "#333",
                                    border: "none",
                                    borderRadius: 4,
                                    padding: "4px 10px",
                                    cursor: notifications.length < 5 ? "not-allowed" : "pointer"
                                }}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}
        </section>
    );

    // --- Main render: notification bells and status update form ---
    return (
        <div style={{ background: "#f4f4f4", minHeight: "100vh", padding: "40px 0" }}>
            {/* Notification bells row */}
            <div style={bellsRowStyle}>
                {renderBellSection(
                    0,
                    "All Notifications",
                    "Shows all notifications for the current user. Green bell means there are unread notifications. Click to view, mark as read, or delete.",
                    unread, newNotif, dropdownOpen[0], dropdownRefs[0], notifications, unread, fetchNotifications, null, null, false,
                    "/notification/getNotificationsFromUserEmail"
                )}
                {renderBellSection(
                    1,
                    "Unread Notifications",
                    "Shows only unread notifications. Green bell means there are unread notifications. Click to view, mark as read, or delete.",
                    unreadUnread, newNotifUnread, dropdownOpen[1], dropdownRefs[1], unreadNotifications, unreadUnread, fetchUnreadNotifications, null, null, false,
                    "/notification/getAllUnreadNotifications"
                )}
                {renderBellSection(
                    2,
                    "All Notifications (Pageable)",
                    "Paginated list of all notifications (5 per page). Use Prev/Next to navigate. Green bell means there are unread notifications.",
                    unreadPageable, newNotifPageable, dropdownOpen[2], dropdownRefs[2], notificationsPageable, unreadPageable, () => fetchNotificationsPageable(page), page, setPage, true,
                    "/notification/getNotificationsFromUserEmailPageable"
                )}
                {renderBellSection(
                    3,
                    "Unread Notifications (Pageable)",
                    "Paginated list of unread notifications (5 per page). Use Prev/Next to navigate. Green bell means there are unread notifications.",
                    unreadUnreadPageable, newNotifUnreadPageable, dropdownOpen[3], dropdownRefs[3], unreadNotificationsPageable, unreadUnreadPageable, () => fetchUnreadNotificationsPageable(unreadPage), unreadPage, setUnreadPage, true,
                    "/notification/getAllUnreadNotificationsFromUserPageable"
                )}
            </div>
            <div style={{ textAlign: "center", fontSize: 14, color: "#555", marginBottom: 40 }}>
                Test the notification system by clicking the bells above. You can also update repair ticket's repair statuses below to create new notifications.
            </div>
            {/* Repair status update form */}
            <section style={{ ...sectionStyle, marginTop: 40 }}>
                <h2 style={{ marginBottom: 20 }}>Update Repair Status</h2>
                <div style={{ fontSize: 13, color: "#555", marginBottom: 16 }}>
                    Enter a ticket number and select a new status. This will update the repair status and trigger a notification and sends an email to the user.
                </div>
                <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>
                    Endpoint: <span style={{ fontFamily: "monospace" }}>/repairTicket/updateRepairStatus</span>
                </div>
                <form onSubmit={handleUpdateStatus}>
                    <div style={{ marginBottom: 16 }}>
                        <label>Ticket Number</label>
                        <input
                            type="text"
                            value={ticketNumber}
                            placeholder="IORT-000001, IORT-000002, etc."
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
            </section>
            {/* WebSocket connection status */}
            <div style={{ marginTop: 32, color: "#888", textAlign: "center", fontSize: 15 }}>
                WebSocket connection status: <b>{connectionStatus}</b>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                    Real-time notifications are delivered via WebSocket. If disconnected, try refreshing the page.
                </div>
            </div>
        </div>
    );
};

export default MockUpUpdateStatusAndPushNotifications;

