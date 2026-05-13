import { createBrowserRouter } from "react-router-dom"

import Login from "./auth/pages/Login"
import Register from "./auth/pages/Register"

import PatientDashboard from "./patient/pages/PatientDashboard"

import DoctorDashboard from "./doctor/pages/DoctorDashboard"
import DoctorPatientDetails from "./doctor/pages/DoctorPatientDetails"

import AdminDashboard from "../features/admin/pages/AdminDashboard"

import Homepage from "./homepage/homepage"
import Terms from "./homepage/Terms"
import Privacy from "./homepage/Privacy"
import Support from "./homepage/support"

import VideoRoom from "./video/VideoRoom"

import DemoCredentials from "./auth/pages/DemoCredentials"

import ChatConsultation from "./patient/pages/ChatConsultation"
import DoctorChatConsultation from "./doctor/pages/DoctorChatConsultation"

export const router = createBrowserRouter([
    {
        path: "/",
        element: <Homepage />
    },

    {
        path: "/login",
        element: <Login />
    },

    {
        path: "/register",
        element: <Register />
    },

    {
        path: "/patient-dashboard",
        element: <PatientDashboard />
    },

    {
        path: "/patient/chat/:appointmentId",
        element: <ChatConsultation />
    },

    {
        path: "/doctor-dashboard",
        element: <DoctorDashboard />
    },

    {
        path: "/doctor-dashboard/patient/:patientId",
        element: <DoctorPatientDetails />
    },

    {
        path: "/doctor/chat/:appointmentId",
        element: <DoctorChatConsultation />
    },

    {
        path: "/admin-dashboard",
        element: <AdminDashboard />
    },

    {
        path: "/video-room/:roomId",
        element: <VideoRoom />
    },

    {
        path: "/demo-login",
        element: <DemoCredentials />
    },

    {
        path: "/terms",
        element: <Terms />
    },

    {
        path: "/privacy",
        element: <Privacy />
    },

    {
        path: "/support",
        element: <Support />
    }
])