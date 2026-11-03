// Left side: Group chat + list of users (with green dot when online)
function Sidebar({ users, onlineIds, activeKey, unread, onSelect, className = "" }) {
  return (
    <aside className={`sidebar ${className}`}>
      <button
        type="button"
        className={`chat-item ${activeKey === "group" ? "active" : ""}`}
        onClick={() => onSelect("group")}
      >
        <div className="avatar">G</div>
        <div className="chat-item-info">
          <strong>Group Chat</strong>
          <span>Everyone</span>
        </div>
        {unread.group > 0 && <b className="badge">{unread.group}</b>}
      </button>

      <p className="sidebar-title">People</p>

      {users.length === 0 && <p className="sidebar-empty">No other users yet</p>}

      {users.map((u) => {
        const key = `user:${u.id}`;
        const online = onlineIds.includes(u.id);
        return (
          <button
            key={u.id}
            type="button"
            className={`chat-item ${activeKey === key ? "active" : ""}`}
            onClick={() => onSelect(key)}
          >
            <div className="avatar small">
              {u.name.charAt(0).toUpperCase()}
              <i className={`dot ${online ? "online" : ""}`} />
            </div>
            <div className="chat-item-info">
              <strong>{u.name}</strong>
              <span>{online ? "Online" : "Offline"}</span>
            </div>
            {unread[key] > 0 && <b className="badge">{unread[key]}</b>}
          </button>
        );
      })}
    </aside>
  );
}

export default Sidebar;
