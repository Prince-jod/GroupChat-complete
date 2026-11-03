# GroupChat - Realtime Chat App (React + Node + Socket.IO + MySQL)

Group chat, personal (private) chat, online status, typing indicator, image/video/audio/file sharing,
and AI reply suggestions with Gemini.

## How to run

**1. Backend**
```
cd backend
npm install
```
Edit `backend/.env` (see `.env.example`). Add these new lines:
```
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=your_key        # free key: https://aistudio.google.com/apikey
```
```
npm run dev
```
The first start adds the new columns to your existing `Messages` table automatically
(your old messages stay and show up in the group chat).

**2. Frontend**
```
cd frontend
npm install
npm run dev
```
Open http://localhost:5173, sign up two users and chat. You can use two tabs of the same browser:
the login is stored per tab, so each tab can be a different user.

## Folder structure

```
backend/
  Server.js                  Express + HTTP server + Socket.IO start
  socket-io/
    index.js                 creates Socket.IO, joins rooms, registers handlers
    middleware.js            Socket auth (checks the JWT token)
    redisAdapter.js          optional - for scaling (REDIS_URL)
    handlers/
      chat.js                send_message + typing events
      presence.js            online users
  services/messageService.js validate + save + broadcast a message (used by socket and REST)
  controllers/               auth, messages, users, upload, ai
  middleware/                authMiddleware (REST), upload (multer)
  routes/                    auth, messages, users, upload, ai
  model/                     User, Message, associations
  uploads/                   shared files are stored here
frontend/src/
  api.js                     backend URL + fetch helper with token
  socket.js                  Socket.IO client (sends the token)
  components/
    Login.jsx, signup.jsx
    Chat.jsx                 main chat screen (all the logic)
    Sidebar.jsx              group + people list, online dots, unread badges
    MessageBubble.jsx        text / image / video / audio / file
    MessageInput.jsx         attach, AI suggestions, send
```

## How it works (simple)

| Step | What happens |
|---|---|
| Socket auth | Client connects with `auth: { token }`. `socket-io/middleware.js` verifies the JWT, otherwise the connection is refused. |
| Rooms | Every user joins room `group` and a personal room `user:<id>`. |
| Group message | Client emits `send_message` -> server saves it in MySQL -> `io.to("group").emit("group_message")`. |
| Personal message | Same event with `receiverId` -> server emits `private_message` only to the two personal rooms. Nobody else gets it. |
| Online / typing | `online_users` (list of ids) and `typing` events. |
| Media | File is uploaded with `POST /api/upload` (max 10 MB, SVG blocked, random file name), then sent as a normal message with `media: {url, type, name}`. |
| History | `GET /api/messages` (group) or `GET /api/messages?with=<userId>` (personal). `limit` and `before` give paging ("Load older messages"). |
| AI | `POST /api/ai/suggestions` sends the last 10 messages to Gemini and returns 3 short replies. Click the sparkle button next to the text box. |

Socket events: client -> server: `send_message`, `typing`, `get_online_users`.
Server -> client: `group_message`, `private_message`, `typing`, `online_users`.

## Ready to scale

- JWT is stateless, so you can run several backend copies.
- Set `REDIS_URL` and Socket.IO uses the Redis adapter, so messages reach users connected to different servers.
  Online users are read through Socket.IO, so this also works across servers.
  Behind a load balancer enable sticky sessions.
- Messages are loaded in pages of 50, and the `messages_conversation_idx` index keeps chat queries fast.
- For production move `uploads/` to S3 or similar object storage.
- There is a simple anti-spam limit (20 messages / 10 seconds per connection) and 10 AI requests / minute per user.

## Notes

- Gemini model is set with `GEMINI_MODEL` (default `gemini-2.5-flash`). Change it if Google retires that name.
- Never commit `backend/.env`. A `.gitignore` for the backend is included.
