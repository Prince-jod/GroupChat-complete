import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_URL, saveSession } from "../api";

function Login() {
    const [formData, setFormData] = useState({
        identifier: "",
        password: ""
    });

    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    function handleChange(e) {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setMessage("");

        try {
            setLoading(true);

            const response = await fetch(
                `${API_URL}/api/auth/login`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(formData)
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Login failed");
            }

            // Save token and user information
            saveSession(data.token, data.user);

            // Open chat page
            navigate("/chat");

        } catch (error) {
            setMessage(
                error.message || "Unable to connect to the server"
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="auth-container">
            <form className="auth-card" onSubmit={handleSubmit}>
                <h1>Welcome Back!</h1>
                <p>Login to continue chatting.</p>

                <label htmlFor="identifier">
                    Email or Phone Number
                </label>

                <input
                    id="identifier"
                    type="text"
                    name="identifier"
                    placeholder="Enter email or phone number"
                    value={formData.identifier}
                    onChange={handleChange}
                    required
                />

                <label htmlFor="password">Password</label>

                <input
                    id="password"
                    type="password"
                    name="password"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />

                <button type="submit" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                </button>

                {message && <p role="status">{message}</p>}

                <p className="auth-footer">
                    Don't have an account?{" "}
                    <Link to="/signup">Sign Up</Link>
                </p>
            </form>
        </div>
    );
}

export default Login;
