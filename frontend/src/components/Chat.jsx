import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./styles/Chat.css";
import socket from "../socket";
import { apiFetch, getUser, clearSession } from "../api";
import Sidebar from "./Sidebar";
import MessageBubble from "./MessageBubble";
import MessageInput from "./MessageInput";

function Chat() {
  const navigate = useNavigate();
  const [me] = useState(getUser); // fixed for this tab

  // ---------- state ----------
  const [users, setUsers] = useState([]);
  const [onlineIds, setOnlineIds] = useState([]);
  const [activeKey, setActiveKey] = useState("group"); // "group" or "user:<id>"
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [unread, setUnread] = useState({});
  const [typingInfo, setTypingInfo] = useState(null); // { key, name }
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [suggesting, setSuggesting] = useState(false);
  const [aiError, setAiError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [connected, setConnected] = useState(socket.connected);

  const areaRef = useRef(null);
  const bottomRef = useRef(null);
  const prevHeightRef = useRef(null); // used to keep scroll position when loading older messages
  const typingTimer = useRef(null);
  const typingClear = useRef(null);
  const iAmTyping = useRef(false);
  const usersRef = useRef(null); // latest people list (null = not loaded yet)

  const isGroup = activeKey === "group";
  const receiverId = isGroup ? null : Number(activeKey.split(":")[1]);
  const activeUser = users.find((u) => u.id === receiverId);

  // ---------- helpers ----------
  const logout = useCallback(() => {
    socket.disconnect();
    clearSession();
    navigate("/login");
  }, [navigate]);

  const handleError = useCallback(
    (err) => {
      if (err.status === 401) logout();
    },
    [logout]
  );

  const addMessage = useCallback((msg) => {
    setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
  }, []);

  const bumpUnread = useCallback((key) => {
    setUnread((prev) => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
  }, []);

  const loadUsers = useCallback(() => {
    apiFetch("/api/users")
      .then((res) => {
        usersRef.current = res.data;
        setUsers(res.data);
      })
      .catch(handleError);
  }, [handleError]);

  // ---------- 1) connect the socket (once) ----------
  useEffect(() => {
    function onOnline(ids) {
      setOnlineIds(ids);
      // somebody new is online but not in my list yet (new signup) -> reload the list
      const known = usersRef.current;
      if (known && ids.some((id) => id !== me?.id && !known.some((u) => u.id === id))) {
        loadUsers();
      }
    }
    function onConnect() {
      setConnected(true);
      socket.emit("get_online_users", onOnline);
    }
    function onDisconnect() {
      setConnected(false);
    }
    function onConnectError(err) {
      // wrong / expired token -> back to login
      if (/token|authentication|user not found/i.test(err.message)) logout();
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("online_users", onOnline);
    socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("online_users", onOnline);
      socket.disconnect();
    };
  }, [logout, loadUsers, me?.id]);

  // ---------- 2) load the people list ----------
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // ---------- 3) load messages whenever the chat changes ----------
  useEffect(() => {
    let cancelled = false;

    const query = receiverId ? `?with=${receiverId}` : "";
    apiFetch(`/api/messages${query}`)
      .then((res) => {
        if (cancelled) return;
        setMessages(res.data);
        setHasMore(res.hasMore);
      })
      .catch(handleError);

    return () => {
      cancelled = true;
    };
  }, [activeKey, receiverId, handleError]);

  // ---------- 4) live messages ----------
  useEffect(() => {
    function onGroup(msg) {
      if (activeKey === "group") addMessage(msg);
      else if (msg.userId !== me?.id) bumpUnread("group");
    }

    function onPrivate(msg) {
      const otherId = msg.userId === me?.id ? msg.receiverId : msg.userId;
      const key = `user:${otherId}`;
      if (key === activeKey) addMessage(msg);
      else if (msg.userId !== me?.id) bumpUnread(key);
    }

    socket.on("group_message", onGroup);
    socket.on("private_message", onPrivate);
    return () => {
      socket.off("group_message", onGroup);
      socket.off("private_message", onPrivate);
    };
  }, [activeKey, me?.id, addMessage, bumpUnread]);

  // ---------- 5) "is typing..." ----------
  useEffect(() => {
    function onTyping({ userId, name, isTyping, group }) {
      const key = group ? "group" : `user:${userId}`;
      clearTimeout(typingClear.current);
      if (!isTyping) {
        setTypingInfo((cur) => (cur?.key === key ? null : cur));
        return;
      }
      setTypingInfo({ key, name });
      typingClear.current = setTimeout(() => setTypingInfo(null), 3000);
    }
    socket.on("typing", onTyping);
    return () => {
      socket.off("typing", onTyping);
      clearTimeout(typingClear.current);
    };
  }, []);

  // ---------- 6) scrolling ----------
  useLayoutEffect(() => {
    const area = areaRef.current;
    if (prevHeightRef.current !== null && area) {
      // older messages were added at the top: keep the view where it was
      area.scrollTop = area.scrollHeight - prevHeightRef.current;
      prevHeightRef.current = null;
    } else {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ---------- actions ----------
  async function loadOlder() {
    if (!messages.length) return;
    try {
      const query = `?limit=50&before=${messages[0].id}${receiverId ? `&with=${receiverId}` : ""}`;
      const res = await apiFetch(`/api/messages${query}`);
      prevHeightRef.current = areaRef.current.scrollHeight;
      setMessages((prev) => [...res.data, ...prev]);
      setHasMore(res.hasMore);
    } catch (err) {
      handleError(err);
    }
  }

  function stopTyping() {
    clearTimeout(typingTimer.current);
    if (iAmTyping.current) {
      iAmTyping.current = false;
      socket.emit("typing", { receiverId, isTyping: false });
    }
  }

  function handleTextChange(value) {
    setText(value);
    if (!iAmTyping.current) {
      iAmTyping.current = true;
      socket.emit("typing", { receiverId, isTyping: true });
    }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(stopTyping, 1500);
  }

  function handleSend(e) {
    e.preventDefault();
    const clean = text.trim();
    if ((!clean && !attachment) || uploading) return;

    if (!socket.connected) {
      alert("Not connected to the server. Please wait...");
      return;
    }

    stopTyping();
    socket.emit("send_message", { receiverId, text: clean, media: attachment }, (res) => {
      if (!res?.ok) alert(res?.error || "Could not send message");
    });

    // the message itself comes back through the socket event
    setText("");
    setAttachment(null);
    setSuggestions([]);
  }

  async function handlePickFile(file) {
    try {
      setUploading(true);
      const form = new FormData();
      form.append("file", file);
      const res = await apiFetch("/api/upload", { method: "POST", body: form });
      setAttachment({ url: res.url, type: res.type, name: res.name });
    } catch (err) {
      handleError(err);
      alert(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSuggest() {
    try {
      setSuggesting(true);
      setAiError("");
      const res = await apiFetch("/api/ai/suggestions", {
        method: "POST",
        body: JSON.stringify({ with: receiverId }),
      });
      setSuggestions(res.suggestions);
    } catch (err) {
      handleError(err);
      setAiError(err.message);
      setTimeout(() => setAiError(""), 5000);
    } finally {
      setSuggesting(false);
    }
  }

  function selectChat(key) {
    if (key === activeKey) return setSidebarOpen(false);
    stopTyping();
    setMessages([]);
    setHasMore(false);
    setSuggestions([]);
    setAiError("");
    setTypingInfo(null);
    setUnread((prev) => ({ ...prev, [key]: 0 }));
    setActiveKey(key);
    setSidebarOpen(false);
  }

  // ---------- header text ----------
  const title = isGroup ? "Group Chat" : activeUser?.name || "Chat";
  let subtitle = isGroup
    ? `${onlineIds.length} online`
    : onlineIds.includes(receiverId)
    ? "Online"
    : "Offline";
  if (typingInfo?.key === activeKey) {
    subtitle = isGroup ? `${typingInfo.name} is typing...` : "typing...";
  }

  return (
    <div className="chat-layout">
      <Sidebar
        className={sidebarOpen ? "open" : ""}
        users={users}
        onlineIds={onlineIds}
        activeKey={activeKey}
        unread={unread}
        onSelect={selectChat}
      />

      <div className="chat-container">
        <header className="chat-header">
          <div className="chat-profile">
            <button type="button" className="menu-button" onClick={() => setSidebarOpen((o) => !o)} aria-label="Chats">
              ☰
            </button>
            <div className="avatar">{title.charAt(0).toUpperCase()}</div>
            <div>
              <h2>{title}</h2>
              <p>{subtitle}</p>
            </div>
          </div>

          <div className="header-actions">
            <span className={`status ${connected ? "on" : "off"}`}>{connected ? "● Live" : "○ Connecting..."}</span>
            <span className="welcome-user">Hi, {me?.name || "User"}</span>
            <button className="logout-button" onClick={logout} type="button">
              Logout
            </button>
          </div>
        </header>

        <main className="messages-area" ref={areaRef}>
          {hasMore && (
            <button type="button" className="load-older" onClick={loadOlder}>
              Load older messages
            </button>
          )}

          {messages.length === 0 ? (
            <div className="empty-chat">
              <p>No messages yet</p>
              <span>Start the conversation!</span>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} isMine={msg.userId === me?.id} showSender={isGroup} />
            ))
          )}
          <div ref={bottomRef} />
        </main>

        <MessageInput
          text={text}
          onTextChange={handleTextChange}
          onSend={handleSend}
          attachment={attachment}
          onPickFile={handlePickFile}
          onRemoveAttachment={() => setAttachment(null)}
          uploading={uploading}
          suggestions={suggestions}
          onSuggest={handleSuggest}
          suggesting={suggesting}
          onUseSuggestion={(s) => {
            setText(s);
            setSuggestions([]);
          }}
          aiError={aiError}
        />
      </div>
    </div>
  );
}

export default Chat;
