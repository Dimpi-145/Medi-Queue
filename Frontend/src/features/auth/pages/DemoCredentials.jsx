import React, { useState, useRef } from 'react'
import '../style/form.scss'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { login } from '../services/auth.api'

const DemoCredentials = () => {
  const navigate = useNavigate()
  const { handleLogin } = useAuth()

  const [formData, setFormData] = useState({
    role: 'patient',
    username: 'john@example.com',
    password: 'patient123'
  })

  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const formRef = useRef(null)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (formRef.current && !formRef.current.reportValidity()) return
    setError(null)

    try {
      const response = await login(formData.username, formData.password)
      const user = response.user
      const token = response.token

      if (formData.role && formData.role !== user.role) {
        setError('Selected role does not match account role')
        return
      }

      handleLogin(user)
      if (token) localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('role', user.role)
      localStorage.setItem('userId', user._id)
      if (user.role === 'doctor') localStorage.setItem('doctorId', user._id)

      const routes = {
        doctor: '/doctor-dashboard',
        patient: '/patient-dashboard',
        admin: '/admin-dashboard'
      }

      navigate(routes[user?.role] || '/')
    } catch (err) {
      console.log('DEMO LOGIN ERROR', err.response?.data)
      setError(err.response?.data?.message || 'Login failed')
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Demo Login</h2>
        <p>Enter demo credentials (prefilled) to try the app.</p>

        <form ref={formRef} onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Role</label>
            <select name="role" value={formData.role} onChange={handleChange} required>
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              placeholder="Enter username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(s => !s)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
            <button className="auth-btn">Login as Demo</button>
            <button type="button" className="auth-btn" onClick={() => navigate(-1)}>
              Back
            </button>
          </div>

          {error && <div style={{ color: 'var(--danger, #c00)', marginTop: 8 }}>{error}</div>}
        </form>
      </div>
    </div>
  )
}

export default DemoCredentials
