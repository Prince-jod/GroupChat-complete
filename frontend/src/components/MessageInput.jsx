import { useRef } from "react";

// Bottom bar: attach file, AI suggestions, text box, send button
function MessageInput({
  text,
  onTextChange,
  onSend,
  attachment,
  onPickFile,
  onRemoveAttachment,
  uploading,
  suggestions,
  onSuggest,
  suggesting,
  onUseSuggestion,
  aiError,
}) {
  const fileRef = useRef(null);
  const canSend = (text.trim() || attachment) && !uploading;

  return (
    <div className="input-wrapper">
      {(suggestions.length > 0 || aiError) && (
        <div className="suggestions">
          {aiError && <span className="ai-error">{aiError}</span>}
          {suggestions.map((s) => (
            <button key={s} type="button" onClick={() => onUseSuggestion(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      {(attachment || uploading) && (
        <div className="attachment-chip">
          {uploading ? "Uploading..." : `📎 ${attachment.name}`}
          {!uploading && (
            <button type="button" onClick={onRemoveAttachment} aria-label="Remove file">
              ✕
            </button>
          )}
        </div>
      )}

      <form className="message-form" onSubmit={onSend}>
        <input
          ref={fileRef}
          type="file"
          hidden
          accept="image/*,video/*,audio/*,.pdf,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onPickFile(file);
            e.target.value = ""; // allow choosing the same file again
          }}
        />

        <button type="button" className="icon-button" title="Attach file" onClick={() => fileRef.current.click()}>
          📎
        </button>

        <button
          type="button"
          className="icon-button"
          title="AI reply suggestions"
          onClick={onSuggest}
          disabled={suggesting}
        >
          {suggesting ? "…" : "✨"}
        </button>

        <input
          type="text"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          aria-label="Type a message"
          maxLength={4000}
        />

        <button type="submit" className="send-button" disabled={!canSend}>
          Send ➤
        </button>
      </form>
    </div>
  );
}

export default MessageInput;
