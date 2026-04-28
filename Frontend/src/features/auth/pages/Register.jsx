import React, { useState } from 'react'
import '../style/form.scss'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../services/auth.api'

const Register = () => {

    const navigate = useNavigate()

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: ""
    })

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        try {
            await register({
                username: formData.username,
                email: formData.email,
                password: formData.password
            })

            console.log("REGISTER SUCCESS")

            navigate("/")

        } catch (err) {
            console.error("REGISTER ERROR:", err.response?.data)
        }
    }

    return (
        <main>
            <div className="form-container">
                <h1>Register</h1>

                <form onSubmit={handleSubmit}>

                    <input
                        type="text"
                        name="username"
                        placeholder="Enter username"
                        value={formData.username}
                        onChange={handleChange}
                    />

                    <input
                        type="email"
                        name="email"
                        placeholder="Enter email"
                        value={formData.email}
                        onChange={handleChange}
                    />

                    <input
                        type="password"
                        name="password"
                        placeholder="Enter password"
                        value={formData.password}
                        onChange={handleChange}
                    />

                    <button className="button primary-button">
                        Register
                    </button>

                </form>

                <p>
                    Already have an account ? <Link to="/">Login</Link>
                </p>
            </div>
        </main>
    )
}

export default Register