# 🏥 Medi-Queue

### Smart Healthcare Appointment & Queue Management System

**Medi-Queue** is a full-stack healthcare management web application developed as a **Final Year Project**. It is designed to simplify the process of managing patient appointments and queues while providing a convenient digital experience for patients and healthcare providers.

The application provides a centralized platform where patients can interact with healthcare services digitally, while healthcare staff can efficiently manage appointments, queues, and patient information.

---

## 🌐 Live Demo

🚀 **Live Application:**
https://medi-queue-1.onrender.com

📂 **GitHub Repository:**
https://github.com/Dimpi-145/Medi-Queue

---

## ✨ Features

### 👤 Patient Features

* Patient registration and authentication
* Book healthcare appointments
* View and manage appointments
* Digital queue management
* Receive appointment/queue updates
* Generate and use digital QR codes
* Download appointment-related documents

### 🩺 Healthcare Provider Features

* Manage patient appointments
* Monitor and manage queues
* View relevant patient information
* Update appointment/queue status
* Manage healthcare service workflow

### ⚡ System Features

* Real-time communication and updates using Socket.IO
* Secure authentication using JWT
* Password hashing using bcrypt
* REST API based backend
* File upload and image management
* Email communication
* PDF generation
* Rate limiting and security middleware
* Responsive user interface

---

## 🛠️ Tech Stack

### Frontend

* ⚛️ React.js
* ⚡ Vite
* React Router
* Axios
* Socket.IO Client
* Sass
* React Icons
* Lucide React
* React Hot Toast
* QRCode
* jsPDF

### Backend

* 🟢 Node.js
* 🚂 Express.js
* 🍃 MongoDB
* Mongoose
* Socket.IO
* JWT
* bcrypt / bcryptjs
* Nodemailer
* Multer
* ImageKit
* Axios
* Helmet
* Express Rate Limit
* jsPDF

The technology choices are reflected in the project's frontend and backend dependency configurations.

---

## 🏗️ Project Architecture

Medi-Queue follows a full-stack client-server architecture:

```text
                    ┌─────────────────────┐
                    │       Patient       │
                    │      / Provider     │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   React Frontend    │
                    │     + Vite          │
                    └──────────┬──────────┘
                               │
                    REST API / Socket.IO
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Express Backend   │
                    │      Node.js        │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      MongoDB        │
                    │     + Mongoose      │
                    └─────────────────────┘
```

---

## 📁 Project Structure

```text
Medi-Queue/
│
├── Backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   ├── server.js
│   ├── package.json
│   └── ...
│
├── Frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── ...
│
└── README.md
```

> The exact internal folders may evolve as the project continues to be developed.

---

## 🚀 Getting Started

Follow these steps to run Medi-Queue locally.

### Prerequisites

Make sure you have the following installed:

* [Node.js](https://nodejs.org/)
* npm
* MongoDB / MongoDB Atlas
* Git

---

## 📥 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Dimpi-145/Medi-Queue.git
cd Medi-Queue
```

---

### 2. Backend Setup

Navigate to the backend directory:

```bash
cd Backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file inside the `Backend` directory.

Example:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

# Add other environment variables required by your deployment
```

Start the backend development server:

```bash
npm run dev
```

The backend will start using the development configuration defined in the project.

---

### 3. Frontend Setup

Open another terminal and navigate to the frontend:

```bash
cd Frontend
```

Install dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

The frontend will be available at the local URL provided by Vite.

---

## 🔐 Environment Variables

For security reasons, sensitive credentials should **never be committed to GitHub**.

Depending on your configuration, the backend may require environment variables for:

```env
PORT=
MONGO_URI=
JWT_SECRET=
EMAIL_USER=
EMAIL_PASSWORD=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_URL_ENDPOINT=
```

Use your own credentials and configuration values.

> ⚠️ Never expose database credentials, JWT secrets, API keys, email passwords, or other private credentials in the repository.

---

## 🔄 Real-Time Functionality

Medi-Queue uses **Socket.IO** to provide real-time communication between the frontend and backend.

This allows queue and appointment-related information to be updated without requiring users to manually refresh the application.

```text
Patient / Provider
        │
        ▼
 React Frontend
        │
        │ Socket.IO
        ▼
 Express + Socket.IO Server
        │
        ▼
    Application
      State
```

---

## 🔒 Security

The application implements several security mechanisms, including:

* JWT-based authentication
* Password hashing with bcrypt
* HTTP security headers using Helmet
* Rate limiting
* Environment variables for sensitive configuration
* Cookie-based authentication mechanisms
* Server-side request validation

---

## 📄 Additional Functionality

Medi-Queue also incorporates supporting functionality such as:

* 📧 Email notifications
* 📄 PDF generation
* 📷 Image/file uploads
* 🔳 QR code generation
* 🔄 Real-time updates
* 🔐 Authentication and authorization

---

## 🎯 Project Objective

The primary objective of Medi-Queue is to digitally streamline healthcare appointment and queue management.

Traditional healthcare facilities can involve long waiting times and inefficient manual queue management. Medi-Queue aims to provide a more organized digital workflow by allowing users to manage appointments and queue information through a centralized web application.

---

## 💡 What I Learned

Developing Medi-Queue provided practical experience in:

* Full-stack web application development
* React component architecture
* REST API development
* MongoDB database management
* Authentication and authorization
* Real-time communication with Socket.IO
* File and image handling
* API integration
* Frontend-backend integration
* Application security
* Deployment and production configuration
* Debugging and handling real-world application issues

---

## 🚀 Future Improvements

Some potential improvements for future versions include:

* 📱 Progressive Web App / mobile application
* 🔔 Push notifications
* 📊 Advanced healthcare analytics
* 🗺️ Location-based healthcare provider discovery
* 🤖 AI-assisted appointment prioritization
* 💬 Integrated patient-provider communication
* 📈 Advanced queue prediction
* 🏥 Multi-hospital support
* ☁️ Improved cloud infrastructure and scalability

---

## 👥 Contributors

**Medi-Queue** was developed as a Final Year Project.

* **Dimpi** — Frontend Developer
* **Kalyanshnu Saikia** — Backend Developer
* **Abidit Saikia** - UI/UX 
* **Amanjit Singh Bhamrah** - PPT
* **Preeti Saikia** - Project Report
---

## 📌 Project Status

🟢 **Completed — Final Year Project**

The project has been deployed and is available for demonstration.

---

## ⭐ Support

If you find this project interesting or useful, consider giving the repository a ⭐ on GitHub.

---

## 📜 License

This project was developed for **academic and educational purposes** as part of a Final Year Project.
