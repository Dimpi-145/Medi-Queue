import { createBrowserRouter, Navigate } from "react-router-dom"
import Login from "./auth/pages/Login"
import Register from "./auth/pages/Register"
import PatientDashboard from "./patient/pages/PatientDashboard"
import DoctorDashboard from "./doctor/pages/DoctorDashboard"
import DoctorPatientDetails from "./doctor/pages/DoctorPatientDetails"
import AdminDashboard from "../features/admin/pages/AdminDashboard"
import Homepage from "./homepage/homepage"
import Terms from "./homepage/Terms"
import Privacy from "./homepage/Privacy"


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
        path: "/doctor-dashboard",
        element: <DoctorDashboard />
    },
    {
        path: "/doctor-dashboard/patient/:patientId",
        element: <DoctorPatientDetails />
    },
    {
        path: "/admin-dashboard",
        element: <AdminDashboard />
    },
    {
        path: "/terms",
        element: <Terms />
    },
    {
        path: "/privacy",
        element: <Privacy />
    }
])