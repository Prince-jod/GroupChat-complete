import { io } from "socket.io-client";
import { API_URL, getToken } from "./api";

// autoConnect is false: we connect only after login (Chat page).
// The JWT token is sent with every connection and checked by the server.
const socket = io(API_URL, {
  autoConnect: false,
  auth: (cb) => cb({ token: getToken() }),
});

export default socket;
