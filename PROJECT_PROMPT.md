# MediQueue - Complete Project Documentation

## PROJECT OVERVIEW
MediQueue is a medical appointment and queue management system built with a Node.js/Express backend and React frontend. It allows patients to book appointments, doctors to manage queues, and admins to oversee the entire system.

---

## PROJECT STRUCTURE

### Root Folders
- **Backend/** - Node.js Express server with MongoDB integration
- **Frontend/** - React + Vite application with SCSS styling

---

# BACKEND STRUCTURE & FILES

## Backend/package.json
```json
{
  "name": "backend",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1",
    "dev": "npx nodemon server.js"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "type": "commonjs",
  "dependencies": {
    "@imagekit/nodejs": "^7.5.0",
    "axios": "^1.15.2",
    "bcrypt": "^6.0.0",
    "bcryptjs": "^3.0.3",
    "cookie": "^1.1.1",
    "cookie-parser": "^1.4.7",
    "cookies-parser": "^1.2.0",
    "dotenv": "^17.4.2",
    "express": "^5.2.1",
    "express-fileupload": "^1.5.2",
    "form-data": "^4.0.5",
    "imagekit": "^6.0.0",
    "install": "^0.13.0",
    "jsonwebtoken": "^9.0.3",
    "jspdf": "^4.2.1",
    "mongoose": "^9.4.1",
    "multer": "^2.1.1",
    "parser": "^0.1.4",
    "socket.io": "^4.8.3"
  }
}
```

## Backend/server.js
```javascript
require('dotenv').config()
const app = require("./src/app")
const connectToDatabase = require ("./src/config/database")
const http = require("http")
const { Server } = require("socket.io")

const server = http.createServer(app)

connectToDatabase()

const io = new Server(server, {
    cors: {
        origin: "*"
    }
})

// make io available globally
app.set("io", io)

io.on("connection", (socket) => {
    console.log(" Client connected:", socket.id)

    socket.on("disconnect", () => {
        console.log(" Client disconnected:", socket.id)
    })
})

server.listen(3000, () => {
    console.log(" Server running on port 3000")
})
```

## Backend/src/app.js
```javascript
const express = require ('express');
const cookieParser = require ("cookie-parser")
const authRouter = require("./routes/auth.routes")
const appointmentRouter = require("./routes/appointment.routes")
const QueueRouter = require("./routes/queue.routes");
const DashboardRouter = require('./routes/dashboard.routes');
const prescriptionRouter = require("./routes/prescription.routes");
const adminRoutes = require("./routes/admin.routes");
const cors = require("cors");
const reportRouter = require("./routes/report.routes");

const app = express();

app.use(cors({
  origin: [ "http://localhost:5173"],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRouter)
app.use("/api/appointments", appointmentRouter)
app.use("/api/queue", QueueRouter )
app.use("/api/Dashboard", DashboardRouter )
app.use("/api/prescriptions", prescriptionRouter);
app.use("/api/reports", reportRouter);
app.use("/api/admin", adminRoutes);

module.exports = app;
```

## Backend/src/config/database.js
```javascript
const mongoose = require("mongoose");

async function connectToDatabase(){
    await mongoose.connect(process.env.MONGO_URL)
    console.log("connect to MongoDB")
}

module.exports = connectToDatabase
```

---

## DATABASE MODELS

### Backend/src/models/user.model.js
```javascript
// KEEP THIS FILE: src/models/user.model.js

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      required: [true, "Username is required"],
      trim: true,
    },

    email: {
      type: String,
      unique: true,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },

    role: {
      type: String,
      enum: ["patient", "doctor", "admin"],
      default: "patient",
    },

    phone: String,
    gender: {
      type: String,
      enum: ["male", "female", "others"]
    },
    age: Number,
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    specialization: String,
    department: {
      type: String,
      enum: [
        "General",
        "Cardiology",
        "Neurology",
        "Orthopedics",
        "Dermatology",
        "Pediatrics",
        "ENT",
      ],
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    profileImage: {
      type: String,
      default: "https://ik.imagekit.io/in2kqh3ai/cohort-2-insta-clone-posts/images.png"
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
```

### Backend/src/models/appointment.model.js
```javascript
const mongoose = require("mongoose")

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    date: {
      type: String,
      required: true
    },

    timeSlot: {
      type: String
    },

    queueNumber: {
      type: Number
    },

    status: {
      type: String,
      enum: ["pending", "approved", "completed", "cancelled"],
      default: "pending"
    },
    source: {
      type: String,
      enum: ["walk-in", "online"],
      default: "online"
    }
  },
  { timestamps: true }
)

module.exports = mongoose.model("Appointment", appointmentSchema)
```

### Backend/src/models/prescription.model.js
```javascript
const mongoose = require("mongoose");

const prescriptionSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  notes: String,
  medicines: [
    {
      name: String,
      dosage: String,
      duration: String,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Prescription", prescriptionSchema);
```

### Backend/src/models/report.model.js
```javascript
const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  fileUrl: {
    type: String,
    required: true,
  },

  token: {
    type: String,
    unique: true,
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Report", reportSchema);
```

---

## MIDDLEWARE

### Backend/src/middleware.js/auth.middleware.js
```javascript
const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const token =
      req.cookies.token ||
      req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "No token provided",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // { id, role }

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

module.exports = authMiddleware;
```

### Backend/src/middleware.js/role.middleware.js
```javascript
const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    next();
  };
};

module.exports = roleMiddleware;
```

---

## UTILITIES

### Backend/src/utils/jwt.js
```javascript
const jwt = require("jsonwebtoken");

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

module.exports = generateToken;
```

---

## CONTROLLERS

### Backend/src/controllers/auth.controllers.js
```javascript
const userModel = require('../models/user.model')
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const authRouter = require('../routes/auth.routes')
const generateToken = require("../utils/jwt");
const ImageKit = require('@imagekit/nodejs')
const Appointment = require("../models/appointment.model")

async function registerController(req, res) {
    try {
        let { username, email, password, gender, age, profileImage } = req.body;

        const isUserAlreadyExists = await userModel.findOne({
            $or: [{ username }, { email }]
        });

        if (isUserAlreadyExists) {
            return res.status(409).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // optional image upload
        if (req.file) {
            const client = new ImageKit({
                publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
                privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
                urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
            });
            const uploaded = await client.upload({
                file: req.file.buffer,
                fileName: Date.now() + "-profile"
            });

            profileImage = uploaded.url;
        }

        const user = await userModel.create({
            username,
            email,
            password: hashedPassword,
            role: "patient",
            gender: gender || "others",
            age: age || null,
            profileImage
        });

        const token = generateToken(user);

        res.cookie("token", token, {
            httpOnly: true,
        });

        res.status(201).json({
            message: "User Registered successfully",
            user: {
                email: user.email,
                username: user.username,
                role: user.role,
                profileImage: user.profileImage
            }
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
}

async function loginController (req, res){
    const {username, email, password} = req.body

    const user = await userModel.findOne({
        $or:[
            {
                username: username
            },
            {
                email:email
            }
        ]
    })

    if(!user){
        return res.status(404).json({
            message: "User not found"
        })
    }

     const isPasswordValid = await bcrypt.compare(password, user.password)

    if(!isPasswordValid){
        return res.status(401).json({
            message: "Password invalid"
        })
    }

    const token = generateToken(user);

    res.cookie("token", token, {
        httpOnly: true,
    });

    res.status(200).json({
        message:"User login successfully.",
        user:{
            username:user.username,
            email:user.email,
            role: user.role,
            profileImage: user.profileImage
        }
    })
}

async function getPatientById(req, res) {
    try {
        const { id } = req.params;
        const patient = await userModel.findById(id).select('-password');
        if (!patient || patient.role !== 'patient') {
            return res.status(404).json({ message: 'Patient not found' });
        }
        res.status(200).json(patient);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
}

module.exports = {
    registerController,
    loginController,
    getPatientById,
}
```

### Backend/src/controllers/appointment.controller.js
```javascript
const Appointment = require("../models/appointment.model")

// ================= BOOK =================
async function bookAppointment(req, res) {
    try {
        const { doctorId, date, timeSlot } = req.body

        // ✅ CHECK DUPLICATE (date + timeSlot)
        const existingAppointment = await Appointment.findOne({
            patientId: req.user.id,
            doctorId,
            date,
            timeSlot,
            status: { $in: ["pending", "approved"] }
        })

        if (existingAppointment) {
            return res.status(400).json({
                message: "You already booked this slot"
            })
        }

        // ✅ QUEUE PER DOCTOR + DATE
        const lastAppointment = await Appointment.findOne({
            doctorId,
            date
        }).sort({ queueNumber: -1 })

        const queueNumber = lastAppointment ? lastAppointment.queueNumber + 1 : 1

        const appointment = await Appointment.create({
            patientId: req.user.id,
            doctorId,
            date,
            timeSlot,
            queueNumber,
            status: "pending"
        })

        return res.status(201).json({
            message: "Appointment booked successfully",
            appointment
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message
        })
    }
}

// ================= PATIENT =================
async function getMyAppointments(req, res) {
    try {
        const appointments = await Appointment.find({
            patientId: req.user.id
        })
        .populate("doctorId", "username specialization")
        .sort({ date: -1 })

        const formattedAppointments = appointments.map(app => ({
            id: app._id,
            doctor: app.doctorId?.username || "Doctor",
            specialization: app.doctorId?.specialization || "",
            date: app.date,
            timeSlot: app.timeSlot,
            queueNumber: app.queueNumber,
            status: app.status
        }))

        return res.status(200).json(formattedAppointments)

    } catch (error) {
        return res.status(500).json({
            message: error.message
        })
    }
}

// ================= DOCTOR =================
async function getDoctorAppointments(req, res) {
    try {
        const appointments = await Appointment.find({
            doctorId: req.user.id
        })
        .populate("patientId", "username age gender")
        .sort({ queueNumber: 1 })

        const formattedAppointments = appointments.map(app => ({
            id: app._id,
            patient: app.patientId,
            date: app.date,
            timeSlot: app.timeSlot,
            queueNumber: app.queueNumber,
            status: app.status
        }))

        return res.status(200).json(formattedAppointments)

    } catch (error) {
        return res.status(500).json({
            message: error.message
        })
    }
}

const User = require("../models/user.model");

// ================= GET DOCTORS =================
async function getDoctors(req, res) {
  try {
    const { department } = req.query;

    const filter = {
      role: "doctor",
    };

    if (department) {
      filter.specialization = department;
    }

    const doctors = await User.find(filter).select(
      "username department specialization"
    );

    return res.status(200).json(doctors);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

// ================= CANCEL =================
async function cancelAppointment(req, res) {
    try {
        const appointment = await Appointment.findById(req.params.id)

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" })
        }

        if (appointment.patientId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not allowed" })
        }

        appointment.status = "cancelled"
        await appointment.save()

        return res.status(200).json({
            message: "Appointment cancelled"
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message
        })
    }
}

// ================= CALL NEXT =================
async function callNextPatient(req, res) {
    try {
        const nextAppointment = await Appointment.findOne({
            doctorId: req.user.id,
            status: "pending"
        }).sort({ queueNumber: 1 })

        if (!nextAppointment) {
            return res.status(404).json({
                message: "No patients in queue"
            })
        }

        nextAppointment.status = "approved"
        await nextAppointment.save()

        return res.json({
            message: "Next patient called",
            appointmentId: nextAppointment._id,
            queueNumber: nextAppointment.queueNumber
        })

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

// ================= COMPLETE =================
async function completeAppointment(req, res) {
    try {
        const appointment = await Appointment.findById(req.params.id)

        if (!appointment) {
            return res.status(404).json({ message: "Not found" })
        }

        appointment.status = "completed"
        await appointment.save()

        return res.json({
            message: "Appointment completed"
        })

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}

module.exports = {
    bookAppointment,
    getMyAppointments,
    getDoctorAppointments,
    getDoctors,
    cancelAppointment,
    callNextPatient,
    completeAppointment,
}
```

### Backend/src/controllers/queue.controller.js (Partial)
```javascript
const Appointment = require("../models/appointment.model")

async function getCurrentPatient(req, res) {
    try {
        const current = await Appointment.findOne({
            doctorId: req.user.id,
            status: "active"
        }).populate("patientId", "username age gender")

        if (!current) {
            return res.status(404).json({
                message: "No patient is being treated currently"
            })
        }

        return res.status(200).json({
            appointmentId: current._id,
            patient: current.patientId,
            queueNumber: current.queueNumber,
            status: current.status
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message
        })
    }
}

async function getLiveQueue(req, res) {
  try {
    let doctorId = req.user.id;

    if (req.user.role === "admin") {
      doctorId = req.query.doctorId;
    }

    const queue = await Appointment.find({
      doctorId,
      status: "pending",
    })
      .sort({ queueNumber: 1 })
      .populate("patientId", "username age gender");

    return res.status(200).json({
      doctorId,
      totalWaiting: queue.length,
      patients: queue,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

async function getQueuePosition(req, res) {
    try {
        const appointment = await Appointment.findById(req.params.id)

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" })
        }

        const count = await Appointment.countDocuments({
            doctorId: appointment.doctorId,
            date: appointment.date,
            status: "pending",
            queueNumber: { $lt: appointment.queueNumber }
        })

        return res.json({
            appointmentId: appointment._id,
            yourQueueNumber: appointment.queueNumber,
            patientsAhead: count
        })

    } catch (error) {
        res.status(500).json({ message: error.message })
    }
}
```

### Backend/src/controllers/prescription.controller.js
```javascript
const Prescription = require("../models/prescription.model");

// ================= CREATE PRESCRIPTION =================
async function createPrescription(req, res) {
  console.log("BODY RECEIVED:", req.body);

  try {
    const doctorId = req.user.id;
    const { patientId, notes, medicines } = req.body;

    const prescription = await Prescription.create({
      doctorId,
      patientId,
      notes,
      medicines,
    });

    return res.status(201).json(prescription);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// ================= GET PATIENT PRESCRIPTIONS =================
async function getPatientPrescriptions(req, res) {
  try {
    console.log("USER:", req.user);

    const patientId = req.user.id;

    const prescriptions = await Prescription.find({ patientId })
      .populate("doctorId", "username")
      .sort({ createdAt: -1 });

    return res.json(prescriptions);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
}

// GET ALL PRESCRIPTIONS (ADMIN)
async function getPrescriptions(req, res) {
  try {
    const prescriptions = await Prescription.find()
      .populate("patientId", "username")
      .populate("doctorId", "username")
      .sort({ createdAt: -1 });

    const formatted = prescriptions.map((p) => ({
      id: p._id,
      patientName: p.patientId?.username,
      doctorName: p.doctorId?.username,
      date: p.createdAt,
      fileName: p.fileName,
      fileUrl: p.fileUrl,
    }));

    res.status(200).json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  createPrescription,
  getPatientPrescriptions,
  getPrescriptions
};
```

### Backend/src/controllers/admin.contoller.js (Partial)
```javascript
const User = require("../models/user.model");
const Appointment = require("../models/appointment.model");
const bcrypt = require('bcrypt');

// ================= DASHBOARD STATS =================
async function getDashboardStats(req, res) {
  try {
    const totalPatients = await User.countDocuments({ role: "patient" });
    const totalDoctors = await User.countDocuments({ role: "doctor" });

    const patientsInQueue = await Appointment.countDocuments({
      status: "pending",
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appointmentsToday = await Appointment.countDocuments({
      date: { $gte: today },
    });

    return res.status(200).json({
      totalPatients,
      totalDoctors,
      patientsInQueue,
      appointmentsToday,
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

// ================= GET PATIENTS =================
async function getPatients(req, res) {
  try {
    const patients = await User.find({ role: "patient" }).select(
      "username email age gender phone doctorId"
    );

    const formatted = patients.map((p) => ({
      _id: p._id,
      username: p.username,
      email: p.email,
      age: p.age,
      gender: p.gender,
      phone: p.phone,
      doctorId: p.doctorId,
    }));

    return res.status(200).json(formatted);
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}

async function adminCreatePatient(req, res) {
  try {
    console.log("📝 Patient creation request received:", req.body);
    
    const { username, email, password, age, gender, phone, doctorId } = req.body;
    const safePassword = (password && String(password).trim().length >= 6) ? String(password).trim() : "patient123";
    
    console.log("🔐 Using password:", safePassword === "patient123" ? "default" : "custom");

    const existing = await User.findOne({ email });
    if (existing) {
      console.log("❌ Patient already exists with email:", email);
      return res.status(400).json({ message: "Patient already exists" });
    }

    const hashed = await bcrypt.hash(safePassword, 10);
    console.log("✅ Password hashed successfully");

    const patient = await User.create({
      username,
      email,
      password: hashed,
      role: "patient",
      age,
      gender,
      phone,
      doctorId: doctorId || undefined,
    });

    console.log("✅ Patient created successfully:", patient._id);

    return res.status(201).json({
      message: "Patient created successfully",
      patient: {
        _id: patient._id,
        username: patient.username,
        email: patient.email,
        age: patient.age,
        gender: patient.gender,
        phone: patient.phone,
        doctorId: patient.doctorId,
      },
    });
  } catch (error) {
    console.error("❌ Error creating patient:", error.message);
    console.error("Stack:", error.stack);
    return res.status(500).json({ message: error.message });
  }
}

async function admincreateDoctor(req, res) {
  try {
    const { username, email, password, specialization } = req.body;
    const safePassword = password && password.length >= 6 ? password : "doctor123";

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Doctor already exists" });
    }

    const hashed = await bcrypt.hash(safePassword, 10);

    const doctor = await User.create({
      username,
      email,
      password: hashed,
      role: "doctor",
      specialization,
    });

    return res.status(201).json({
      message: "Doctor created successfully",
      doctor: {
        _id: doctor._id,
        username: doctor.username,
        email: doctor.email,
        specialization: doctor.specialization,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

async function walkInRegister(req, res) {
  try {
    const {
      username,
      email,
      gender,
      age,
      doctorId
    } = req.body;

    if (!doctorId) {
      return res.status(400).json({
        message: "doctorId is required"
      });
    }

    const patient = await User.create({
      username,
      email,
      role: "patient",
      gender,
      age,
      password: await bcrypt.hash("walkin123", 10)
    });

    const last = await Appointment.findOne({ doctorId })
      .sort({ queueNumber: -1 });

    const queueNumber = last ? last.queueNumber + 1 : 1;

    const appointment = await Appointment.create({
      patientId: patient._id,
      doctorId,
      queueNumber,
      source: "walk-in"
    });

    return res.status(201).json({
      message: "Walk-in patient registered and queued",
      patient,
      appointment
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
}
```

### Backend/src/controllers/report.controller.js (Partial)
```javascript
const ReportModel = require("../models/report.model");
const generateToken = require("../utils/report.token");
const ImageKit = require("@imagekit/nodejs");

const imagekit = new ImageKit({
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
})

// ================= UPLOAD REPORT =================
async function uploadReport(req, res) {
  try {
    const patientId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No report file uploaded",
      });
    }

    const file = req.file;

    const fileBase64 = file.buffer.toString("base64");

    let uploadedFile;
    try {
      uploadedFile = await imagekit.files.upload({
        file: fileBase64,
        fileName: `${Date.now()}-${file.originalname}`,
        folder: "/reports",
      });
    } catch (ikError) {
      console.error("ImageKit Error:", ikError);
      throw ikError;
    }

    if (!uploadedFile || !uploadedFile.url) {
      return res.status(500).json({
        success: false,
        message: "ImageKit upload failed",
      });
    }

    const report = await ReportModel.create({
      patientId,
      fileUrl: uploadedFile.url,
      fileName: file.originalname,
      fileId: uploadedFile.fileId,
      token: generateToken(),
    });

    return res.status(201).json({
      success: true,
      message: "Report uploaded successfully",
      data: report,
    });
  } catch (err) {
    console.error("REPORT UPLOAD ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Server error during upload",
    });
  }
}

async function getMyReports(req, res) {
  try {
    const patientId = req.user.id;

    const reports = await ReportModel.find({ patientId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (err) {
    console.error("GET MY REPORTS ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Server error fetching reports",
    });
  }
}

async function getReportByToken(req, res) {
  try {
    const { token } = req.params;

    const report = await ReportModel.findOne({ token }).populate("patientId", "username");

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Invalid token",
      });
    }

    return res.status(200).json({
      success: true,
      data: report,
    });

  } catch (err) {
    console.error("GET REPORT BY TOKEN ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Server error fetching report",
    });
  }
}

module.exports = {
  uploadReport,
  getMyReports,
  getReportByToken,
};
```

---

## ROUTES

### Backend/src/routes/auth.routes.js
```javascript
const express = require('express')
const authController = require("../controllers/auth.controllers")
const adminController = require("../controllers/admin.contoller")
const authMiddleware = require("../middleware.js/auth.middleware")
const roleMiddleware = require("../middleware.js/role.middleware")
const appointmentController = require("../controllers/appointment.controller")

const authRouter = express.Router()

authRouter.post('/register', authController.registerController)
authRouter.post('/login', authController.loginController)

authRouter.post("/admin/create-patient",
  authMiddleware,
  roleMiddleware("admin"),
  adminController.adminCreatePatient
);

authRouter.post("/admin/create-doctor",
  authMiddleware,
  roleMiddleware("admin"),
  adminController.admincreateDoctor
);

authRouter.get("/patient-dashboard",authMiddleware,roleMiddleware("patient"),
(req, res) => {res.json({ message: "Welcome Patient" })
    }
)

authRouter.get("/admin-dashboard",authMiddleware,roleMiddleware("admin"),
    (req, res) => {res.json({ message: "Welcome Admin" })
    }
)

authRouter.get("/doctor-dashboard", authMiddleware, (req, res) => {
  res.json({ message: "Welcome Doctor", user: req.user });
});

authRouter.get("/patients/:id", authMiddleware, roleMiddleware("doctor"), authController.getPatientById);

module.exports = authRouter;
```

### Backend/src/routes/appointment.routes.js
```javascript
const express = require("express")
const appointmentRouter = express.Router()

const authMiddleware = require("../middleware.js/auth.middleware")
const roleMiddleware = require("../middleware.js/role.middleware")
const appointmentController = require("../controllers/appointment.controller")

const Appointment = require("../models/appointment.model")

appointmentRouter.post(
    "/book",
    authMiddleware,
    roleMiddleware("patient"),
    appointmentController.bookAppointment
)

appointmentRouter.get("/get-doctors",
    authMiddleware, 
    roleMiddleware("patient"), 
    appointmentController.getDoctors);

appointmentRouter.get(
    "/my",
    authMiddleware,
    roleMiddleware("patient"),
    appointmentController.getMyAppointments
)

appointmentRouter.get(
    "/doctor",
    authMiddleware,
    roleMiddleware("doctor"),
    appointmentController.getDoctorAppointments
)

appointmentRouter.put(
    "/cancel/:id",
    authMiddleware,
    roleMiddleware("patient"),
    appointmentController.cancelAppointment
)

appointmentRouter.put(
    "/complete/:id",
    authMiddleware,
    roleMiddleware("doctor"),
    appointmentController.completeAppointment
)

module.exports = appointmentRouter
```

### Backend/src/routes/queue.routes.js
```javascript
const express = require("express")
const QueueRouter = express.Router()

const queueController = require("../controllers/queue.controller")
const authMiddleware = require("../middleware.js/auth.middleware")
const roleMiddleware = require("../middleware.js/role.middleware")

QueueRouter.get(
    "/live",
    authMiddleware,
    roleMiddleware("doctor","admin"),
    queueController.getLiveQueue
)

QueueRouter.get(
    "/current",
    authMiddleware,
    roleMiddleware("doctor"),
    queueController.getCurrentPatient
)

QueueRouter.put(
    "/next",
    authMiddleware,
    roleMiddleware("doctor"),
    queueController.callNextPatient
)

QueueRouter.get(
    "/position/:id",
    authMiddleware,
    roleMiddleware("patient"),
    queueController.getQueuePosition
)

QueueRouter.post("/admin/add-to-queue",
  authMiddleware,
  roleMiddleware("admin"),
 queueController.addToQueue
);

QueueRouter.put(
  "/complete",
  authMiddleware,
  roleMiddleware("doctor"),
  queueController.completeCurrent
);

module.exports = QueueRouter
```

### Backend/src/routes/prescription.routes.js
```javascript
const express = require("express");
const PrescriptionRouter = express.Router();

const controller = require("../controllers/prescription.controller");
const auth = require("../middleware.js/auth.middleware");
const role = require("../middleware.js/role.middleware");

PrescriptionRouter.post(
  "/create",
  auth,
  role("doctor"),
  controller.createPrescription
);

PrescriptionRouter.get(
  "/my",
  auth,
  role("patient"),
  controller.getPatientPrescriptions
);

PrescriptionRouter.get(
  "/all",
  auth,
  role("admin"),
  controller.getPrescriptions
);

module.exports = PrescriptionRouter;
```

### Backend/src/routes/admin.routes.js
```javascript
const express = require("express");
const adminrouter = express.Router();

const authMiddleware = require("../middleware.js/auth.middleware");
const roleMiddleware = require("../middleware.js/role.middleware");
const adminController = require("../controllers/admin.contoller");

adminrouter.get(
  "/stats",
  authMiddleware,
  roleMiddleware("admin"),
  adminController.getDashboardStats
);

adminrouter.get(
  "/getpatients",
  authMiddleware,
  roleMiddleware("admin"),
  adminController.getPatients
);

adminrouter.get(
  "/getdoctors",
  authMiddleware,
  roleMiddleware("admin"),
  adminController.getDoctors
);

adminrouter.get(
  "/appointments",
  authMiddleware,
  roleMiddleware("admin"),
  adminController.getAppointments
);

adminrouter.post(
  "/book-appointment",
  authMiddleware,
  roleMiddleware("admin"),
  adminController.adminBookAppointment
);

adminrouter.post(
  "/create-doctor",
  authMiddleware,
  roleMiddleware("admin"),
  adminController.admincreateDoctor
);

adminrouter.post(
  "/create-patient",
  authMiddleware,
  roleMiddleware("admin"),
  adminController.adminCreatePatient
);

adminrouter.post(
  "/walkin-register",
  authMiddleware,
  roleMiddleware("admin"), 
  adminController.walkInRegister
);

module.exports = adminrouter;
```

---

# FRONTEND STRUCTURE & FILES

## Frontend/package.json
```json
{
  "name": "frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.15.2",
    "jspdf": "^4.2.1",
    "lucide-react": "^1.14.0",
    "qrcode": "^1.5.4",
    "react": "^19.2.5",
    "react-dom": "^19.2.5",
    "react-hot-toast": "^2.6.0",
    "react-icons": "^5.6.0",
    "react-router-dom": "^7.14.2",
    "sass": "^1.99.0",
    "socket.io-client": "^4.8.3"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.4",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.1",
    "eslint": "^9.39.4",
    "eslint-plugin-react-hooks": "^7.1.1",
    "eslint-plugin-react-refresh": "^0.5.2",
    "globals": "^17.5.0",
    "vite": "^8.0.9"
  }
}
```

## Frontend/vite.config.js
```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
```

## Frontend/index.html
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MediQueue</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

## Frontend/src/App.jsx
```javascript
import { RouterProvider } from "react-router-dom";
import { router } from "./features/app.route";
import { AuthProvider } from "./features/auth/auth.context";

import "./features/shared/global.scss";

function App() {
  return (
    <AuthProvider>
      <div className="app-root">
        <RouterProvider router={router} />
      </div>
    </AuthProvider>
  );
}

export default App;
```

## Frontend/src/features/app.route.jsx
```javascript
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
```

## Frontend/src/features/auth/auth.context.jsx
```javascript
import { createContext, useState, useContext } from "react";

export const authContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  const handleLogin = (user) => {
    setUser(user);
  };

  return (
    <authContext.Provider value={{ user, setUser, handleLogin  }}>
      {children}
    </authContext.Provider>
  );
};
```

## Frontend/src/utils/axios.js
```javascript
import axios from "axios";

const API = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

export default API;
```

## Frontend/src/features/auth/pages/Login.jsx
```javascript
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
      <div className="auth-container">
        <div className="auth-card">
          <h2>Welcome Back</h2>
          <p>Login to continue to MediQueue</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                name="username"
                placeholder="Enter username"
                value={formData.username}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <button className="auth-btn">
              Login
            </button>
          </form>

          <div className="auth-footer">
            Don't have an account?{" "}
            <Link to="/register">Create one</Link>
          </div>
        </div>
      </div>
    );
}

export default Login
```

## Frontend/src/features/patient/pages/PatientDashboard.jsx (Partial)
```javascript
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import ProfileCard from "../components/ProfileCard";
import QueueList from "../components/QueueList";
import AppointmentTable from "../components/AppointmentTable";
import PrescriptionList from "../components/PrescriptionList";
import AppointmentForm from "../components/AppointmentForm";
import History from "../components/History";
import Report from "../components/Report";
import ChatBox from "../components/chat/ChatBox";

import { getMyAppointments, bookAppointment } from "../services/appointment.api";
import { getPatientDashboard } from "../services/dashboard.api";
import { getMyPrescriptions } from "../services/prescription.api";
import { getMyReports } from "../services/report.api";

import "../../shared/global.scss";
import "../patientDashboard.scss";

const PatientDashboard = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Dashboard");

  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [reports, setReports] = useState([]);
  const [queueInfo, setQueueInfo] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [chatContext, setChatContext] = useState(null);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const openChat = (appointment) => {
    setChatContext({
      appointmentId: appointment.id,
      doctorId: appointment.doctorId,
      doctorName: appointment.doctor,
    });
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    await Promise.all([
      fetchDashboard(),
      fetchAppointments(),
      fetchPrescriptions(),
      fetchReportsCount(),
    ]);
  };

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await getPatientDashboard();
      setPatient(res.data?.patient || null);
      setQueueInfo(res.data?.queueInfo || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      const res = await getMyAppointments();
      const formatted = (res.data || []).map((item) => ({
        id: item._id,
        doctor: item.doctorId?.username || "Doctor",
        date: new Date(item.date).toLocaleDateString(),
        time: item.timeSlot,
        status: item.status,
      }));
      setAppointments(formatted);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPrescriptions = async () => {
    try {
      const res = await getMyPrescriptions();
      setPrescriptions(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReportsCount = async () => {
    try {
      const res = await getMyReports();
      setReports(res.data.data || []);
    } catch (err) {
      setReports([]);
    }
  };

  const handleBook = async (formData) => {
    try {
      await bookAppointment(formData);
      setShowModal(false);
      fetchAllData();
    } catch (err) {
      console.error(err);
    }
  };

  const currentQueueNumber = queueInfo?.queueNumber || "-";
  const patientsAhead = queueInfo?.patientsAhead || 0;

  return (
    <div className="patient-dashboard">
      <Navbar patient={patient} loading={loading} onLogout={handleLogout} />

      <div className="dashboard-shell">
        <Sidebar activeItem={activeTab} onSelect={setActiveTab} />

        <main className="dashboard-content">
          {activeTab === "Dashboard" && (
            <ProfileCard
              patient={patient}
              loading={loading}
              appointmentsCount={appointments.length}
              reportsAvailable={reports.length}
              onBookClick={() => setShowModal(true)}
            />
          )}

          {activeTab === "My Appointments" && (
            <AppointmentTable
              appointments={appointments}
              loading={loading}
              onChat={openChat}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default PatientDashboard;
```

## Frontend/src/features/doctor/pages/DoctorDashboard.jsx (Partial)
```javascript
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import "../doctorDashboard.scss";

import {
  getDoctorDashboard,
  getDoctorAppointments,
} from "../services/doctor.api";

const DoctorDashboard = () => {
  const [activeSection, setActiveSection] =
    useState("Dashboard");

  const [appointments, setAppointments] =
    useState([]);

  const [doctorInfo, setDoctorInfo] =
    useState(null);

  const [dashboardStats, setDashboardStats] =
    useState({
      totalWaiting: 0,
      completedToday: 0,
      cancelledToday: 0,
      currentPatient: null,
      nextPatient: null,
    });

  const [loadingAppointments, setLoadingAppointments] =
    useState(true);

  const [loadingDashboard, setLoadingDashboard] =
    useState(true);

  const navigate = useNavigate();

  // ================= SOCKET =================
  const [socket, setSocket] = useState(null);

  // ================= FETCH DATA =================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardRes, appointmentRes] =
          await Promise.all([
            getDoctorDashboard(),
            getDoctorAppointments(),
          ]);

        const doctor =
          dashboardRes.data?.doctor || null;

        const stats = {
          totalWaiting:
            dashboardRes.data?.totalWaiting || 0,

          completedToday:
            dashboardRes.data?.completedToday || 0,

          cancelledToday:
            dashboardRes.data?.cancelledToday || 0,

          currentPatient:
            dashboardRes.data?.currentPatient || null,

          nextPatient:
            dashboardRes.data?.nextPatient || null,
        };

        const appointmentData =
          appointmentRes.data?.data ||
          appointmentRes.data ||
          [];

        setDoctorInfo(doctor);

        setDashboardStats(stats);

        setAppointments(
          Array.isArray(appointmentData)
            ? appointmentData
            : []
        );
      } catch (err) {
        console.error(
          "Error fetching doctor data:",
          err
        );
      } finally {
        setLoadingDashboard(false);
        setLoadingAppointments(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="doctor-dashboard">
      <Navbar doctorInfo={doctorInfo} />
      <div className="dashboard-shell">
        <Sidebar activeSection={activeSection} onSelect={setActiveSection} />
        {/* Content will go here */}
      </div>
    </div>
  );
};

export default DoctorDashboard;
```

---

## API SERVICE FILES

Frontend API services follow this pattern:
- `src/features/auth/services/auth.api.js` - Authentication calls
- `src/features/patient/services/appointment.api.js` - Appointment operations
- `src/features/patient/services/dashboard.api.js` - Dashboard data
- `src/features/patient/services/prescription.api.js` - Prescription data
- `src/features/patient/services/report.api.js` - Report uploads and retrieval
- `src/features/doctor/services/doctor.api.js` - Doctor-specific operations
- `src/features/admin/services/api.js` - Admin operations

---

## KEY FEATURES

### 1. **User Roles**
   - **Patient**: Book appointments, view prescriptions, upload reports, see queue position
   - **Doctor**: Manage queue, call next patient, view patient details, create prescriptions
   - **Admin**: Create users, manage system, view stats, walk-in registration

### 2. **Appointment System**
   - Online appointment booking
   - Walk-in registration
   - Queue management with queue numbers
   - Status tracking (pending, approved, completed, cancelled)

### 3. **Queue Management**
   - Real-time queue updates via Socket.io
   - Doctor can call next patient
   - Patients can see their position in queue
   - Auto-incrementing queue numbers

### 4. **Prescriptions**
   - Doctors create prescriptions with medicines
   - Patients view their prescriptions
   - Admin can view all prescriptions

### 5. **Medical Reports**
   - Upload medical reports (stored via ImageKit)
   - Generate unique access tokens
   - Share reports securely

### 6. **Authentication**
   - JWT token-based authentication
   - Role-based middleware (auth + role validation)
   - Cookie storage with httpOnly flag
   - Password hashing with bcryptjs

### 7. **Real-time Communication**
   - Socket.io for live queue updates
   - Real-time patient notifications

---

## ENVIRONMENT VARIABLES NEEDED

### Backend (.env)
```
MONGO_URL=mongodb://connection_string
JWT_SECRET=your_jwt_secret
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=your_imagekit_url_endpoint
PORT=3000
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:3000/api
```

---

## API ENDPOINTS

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/patient-dashboard` - Patient dashboard access
- `GET /api/auth/doctor-dashboard` - Doctor dashboard access
- `GET /api/auth/admin-dashboard` - Admin dashboard access
- `GET /api/auth/patients/:id` - Get patient details (doctor only)

### Appointments
- `POST /api/appointments/book` - Book appointment
- `GET /api/appointments/my` - Get patient's appointments
- `GET /api/appointments/doctor` - Get doctor's appointments
- `GET /api/appointments/get-doctors` - Get list of doctors
- `PUT /api/appointments/cancel/:id` - Cancel appointment
- `PUT /api/appointments/complete/:id` - Mark appointment completed

### Queue
- `GET /api/queue/live` - Get live queue (doctor/admin)
- `GET /api/queue/current` - Get current patient being treated
- `PUT /api/queue/next` - Call next patient
- `GET /api/queue/position/:id` - Get patient's queue position

### Prescriptions
- `POST /api/prescriptions/create` - Create prescription (doctor)
- `GET /api/prescriptions/my` - Get patient prescriptions
- `GET /api/prescriptions/all` - Get all prescriptions (admin)

### Reports
- `POST /api/reports/upload` - Upload medical report
- `GET /api/reports/my` - Get patient's reports
- `GET /api/reports/:token` - Get report by token

### Admin
- `GET /api/admin/stats` - Dashboard stats
- `GET /api/admin/getpatients` - Get all patients
- `GET /api/admin/getdoctors` - Get all doctors
- `POST /api/admin/create-patient` - Create patient
- `POST /api/admin/create-doctor` - Create doctor
- `POST /api/admin/walkin-register` - Walk-in registration

---

## TECHNOLOGY STACK

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT + bcryptjs
- **File Upload**: ImageKit + Multer
- **Real-time**: Socket.io
- **PDF Generation**: jsPDF

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Routing**: React Router v7
- **HTTP Client**: Axios
- **Styling**: SCSS/SASS
- **Icons**: React Icons, Lucide React
- **Real-time**: Socket.io Client
- **PDF Generation**: jsPDF
- **QR Codes**: qrcode
- **Notifications**: React Hot Toast

---

## HOW TO RUN THE PROJECT

### Backend Setup
```bash
cd Backend
npm install
# Create .env file with required variables
npm run dev  # Runs on http://localhost:3000
```

### Frontend Setup
```bash
cd Frontend
npm install
npm run dev  # Runs on http://localhost:5173
```

---

## PROJECT STATUS & NOTES

- Socket.io integration for real-time queue updates
- ImageKit integration for secure file storage
- Role-based access control implemented
- JWT token authentication with 7-day expiry
- Multiple user roles (patient, doctor, admin)
- Complete appointment lifecycle management
- Queue management system with real-time updates
