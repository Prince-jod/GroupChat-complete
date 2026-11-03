import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Signup from "./components/signup";
import Login from "./components/Login";
import Chat from "./components/Chat";
import { getToken } from "./api";

// Only logged-in users can open the chat
function Protected({ children }) {
  return getToken() ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Navigate to={getToken() ? "/chat" : "/login"} replace />}
        />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/chat"
          element={
            <Protected>
              <Chat />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
