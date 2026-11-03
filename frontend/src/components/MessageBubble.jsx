import { mediaSrc } from "../api";

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Shows the file inside a message: image / video / audio / download link
function Media({ msg }) {
  const src = mediaSrc(msg.mediaUrl);

  if (msg.mediaType === "image") {
    return (
      <a href={src} target="_blank" rel="noreferrer">
        <img className="media-image" src={src} alt={msg.mediaName || "image"} loading="lazy" />
      </a>
    );
  }
  if (msg.mediaType === "video") {
    return <video className="media-video" src={src} controls preload="metadata" />;
  }
  if (msg.mediaType === "audio") {
    return <audio className="media-audio" src={src} controls preload="metadata" />;
  }
  return (
    <a className="media-file" href={src} target="_blank" rel="noreferrer" download={msg.mediaName}>
      📎 {msg.mediaName || "Download file"}
    </a>
  );
}

function MessageBubble({ msg, isMine, showSender }) {
  return (
    <div className={`message-row ${isMine ? "sent-row" : "received-row"}`}>
      <div className="message">
        {showSender && !isMine && <strong className="message-sender">{msg.User?.name || "User"}</strong>}
        {msg.mediaUrl && <Media msg={msg} />}
        {msg.text && <p>{msg.text}</p>}
        <span>{formatTime(msg.createdAt)}</span>
      </div>
    </div>
  );
}

export default MessageBubble;
