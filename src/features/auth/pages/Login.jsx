import React, { useState } from 'react'
import '../style/form.scss'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { login } from '../services/auth.api'

const Login = () => {

    const navigate = useNavigate()
    const { handleLogin } = useAuth()

    const [formData, setFormData] = useState({
        username: "",
        password: ""
    })

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await login(
                formData.username,
                formData.password
            );

            handleLogin(response.user);

            const routes = {
                doctor: "/doctor-dashboard",
                patient: "/patient-dashboard",
                admin: "/admin-dashboard"
            };

            navigate(routes[response.user?.role] || "/");

        } catch (err) {
            console.log("LOGIN ERROR:", err.response?.data);
        }
    };

    return (
        <main>
            <div className="form-container">
                <h1>Login</h1>

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        name="username"
                        placeholder="Enter username"
                        value={formData.username}
                        onChange={handleChange}
                    />

                    <input
                        type="password"
                        name="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleChange}
                    />

                    <button className="button primary-button">
                        Login
                    </button>
                </form>

                <p>
                    Don't have an account ? <Link to="/register">Create One.</Link>
                </p>
            </div>
        </main>
    )
}

export default Login
