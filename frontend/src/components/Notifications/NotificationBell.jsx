import React, { useEffect, useState, useRef } from "react";
import SockJS from "sockjs-client";
import { Stomp } from "@stomp/stompjs";
import { Bell as BellIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

// Simple bell component that shows real-time notifications for the current user.
// It replicates (in a compact form) the logic previously found in
// `MockUpUpdateStatusAndPushNotifications.jsx`.
//
// Usage: <NotificationBell />
// Automatically reads `authToken` + `userEmail` from localStorage.
// The dropdown lists all notifications, lets the user mark them as read / delete,
// and connects to the WebSocket endpoint for live updates.
export default function NotificationBell() {
  const navigate = useNavigate();

  // ---------------------------------------------------------------------------
  // State management
  // ---------------------------------------------------------------------------
  const [notifications, setNotifications] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false); // any unread? (green dot)
  const [newNotif, setNewNotif] = useState(false);   // new notification indicator

  // WebSocket connection status (optional UI feedback)
  const [connectionStatus, setConnectionStatus] = useState("Disconnected");

  // refs
  const stompClient = useRef(null);
  const dropdownRef = useRef(null);

  // ---------------------------------------------------------------------------
  // Helpers – values from localStorage
  // ---------------------------------------------------------------------------
  const authToken = localStorage.getItem("authToken");
  const userEmail = localStorage.getItem("userEmail");

  // ---------------------------------------------------------------------------
  // Fetch notifications (all for now – can be extended later)
  // ---------------------------------------------------------------------------
  const fetchNotifications = async () => {
    if (!authToken || !userEmail) return;
    try {
      const res = await fetch(
        `http://localhost:8080/notification/getNotificationsFromUserEmail?email=${encodeURIComponent(
          userEmail
        )}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        setNotifications(data || []);
        setHasUnread((data || []).some((n) => !n.isRead));
      }
    } catch (err) {
      console.warn("Failed to fetch notifications", err);
    }
  };

  // ---------------------------------------------------------------------------
  // WebSocket (STOMP) – live updates
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!userEmail) return;

    const socketFactory = () => new SockJS("http://localhost:8080/ws");
    const client = Stomp.over(socketFactory);
    stompClient.current = client;

    client.connect(
      {},
      () => {
        setConnectionStatus("Connected");
        client.subscribe(`/topic/notifications/${userEmail}`, () => {
          setNewNotif(true);
          fetchNotifications();
        });
      },
      (error) => {
        console.error("WebSocket connection error", error);
        setConnectionStatus("Disconnected");
      }
    );

    return () => {
      if (stompClient.current) stompClient.current.disconnect();
    };
  }, [userEmail]);

  // ---------------------------------------------------------------------------
  // Initial fetch + periodic refresh (optional)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    fetchNotifications();
    // Optional: refresh every n minutes
    const id = setInterval(fetchNotifications, 60 * 1000);
    return () => clearInterval(id);
  }, [userEmail]);

  // ---------------------------------------------------------------------------
  // Close dropdown when clicking outside
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [dropdownOpen]);

  // ---------------------------------------------------------------------------
  // Actions – mark as read / delete / delete all
  // ---------------------------------------------------------------------------
  const markAsRead = async (notificationId) => {
    if (!authToken) return;
    await fetch(
      `http://localhost:8080/notification/markAsReadById?notificationId=${notificationId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    fetchNotifications();
  };

  const deleteNotification = async (notificationId) => {
    if (!authToken) return;
    await fetch(`http://localhost:8080/notification/deleteNotification/${notificationId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${authToken}` },
    });
    fetchNotifications();
  };

  const deleteAllNotifications = async () => {
    if (!authToken || !userEmail) return;
    await fetch(
      `http://localhost:8080/notification/deleteAllNotifications?email=${encodeURIComponent(
        userEmail
      )}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );
    fetchNotifications();
  };

  const markAllAsRead = async () => {
    if (!authToken || !userEmail) return;
    await fetch(
      `http://localhost:8080/notification/markAllAsRead?email=${encodeURIComponent(userEmail)}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    fetchNotifications();
  };

  // ---------------------------------------------------------------------------
  // UI helpers
  // ---------------------------------------------------------------------------
  const handleBellClick = () => {
    setDropdownOpen((open) => !open);
    setNewNotif(false);
  };

  const handleNotificationClick = (notif) => {
    setDropdownOpen(false);
    const type = notif.status || notif.type; // backend uses status field
    if (type === 'QUOTATION_APPROVED' || type === 'QUOTATION_REJECTED' || type === 'QUOTATION_PENDING' || type === 'QUOTATION_REMINDER' || type === 'QUOTATION_EXPIRED') {
      if (notif.ticketNumber) {
        navigate(`/quotationviewer/${encodeURIComponent(notif.ticketNumber)}`);
      }
    } else if (notif.ticketNumber) {
      navigate(`/realtimestatus?ticketNumber=${notif.ticketNumber}`);
    }
  };

  // Format createdAt to 'MMM DD, YYYY h:mm A'
  const formatDate = (iso) => {
    if (!iso) return "";
    try {
      return dayjs(iso).format("MMM D, YYYY h:mm A");
    } catch {
      const d = new Date(iso);
      return d.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleBellClick}
        className="relative w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200"
      >
        <BellIcon className="h-5 w-5 text-gray-600" />
        {(hasUnread || newNotif) && (
          <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-[#33e407]" />
        )}
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="px-4 py-3 border-b flex justify-between items-center">
            <span className="font-semibold">Notifications</span>
            {notifications.length > 0 && (
              <button
                onClick={deleteAllNotifications}
                className="text-xs text-red-600 hover:underline"
              >
                Clear All
              </button>
            )}
          </div>

          {notifications.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-gray-500">No notifications</div>
          )}

          {notifications.map((notif) => (
            <div
              key={notif.notificationId}
              onClick={() => handleNotificationClick(notif)}
              className={`px-4 py-3 border-b cursor-pointer hover:bg-gray-50 relative ${
                notif.isRead ? "bg-white" : "bg-green-50"
              }`}
            >
              <div className={`text-sm ${notif.isRead ? "" : "font-semibold"}`}>{notif.message}</div>
              <div className="text-xs text-gray-500 mt-1">{formatDate(notif.createdAt)}</div>

              {/* action buttons (only show on hover?) */}
              <div className="absolute top-2 right-2 space-x-2 opacity-0 hover:opacity-100 transition-opacity">
                {!notif.isRead && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAsRead(notif.notificationId);
                    }}
                    className="text-xs text-green-600 hover:underline"
                  >
                    Mark as read
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notif.notificationId);
                  }}
                  className="text-xs text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {hasUnread && (
            <div className="px-4 py-2 text-center text-xs bg-gray-50">
              <button
                onClick={markAllAsRead}
                className="text-green-600 hover:underline"
              >
                Mark all as read
              </button>
            </div>
          )}

          {/* Optional connection status */}
          <div className="px-4 py-2 text-center text-[10px] text-gray-400">
            WS: {connectionStatus}
          </div>
        </div>
      )}
    </div>
  );
} 