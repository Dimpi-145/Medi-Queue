const mongoose = require('mongoose');
const User = require('./src/models/user.model');
const Appointment = require('./src/models/appointment.model');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Connected to database');

    // Clear existing data
    await User.deleteMany({});
    await Appointment.deleteMany({});
    console.log('Cleared existing data');

    // Create admin
    const admin = await User.create({
      username: 'Admin User',
      email: 'admin@hospital.com',
      password: await bcrypt.hash('admin123', 10),
      role: 'admin'
    });
    console.log('Created admin:', admin.username);

    // Create doctors
    const doctors = [
      {
        username: 'Dr. Smith',
        email: 'smith@hospital.com',
        password: await bcrypt.hash('doctor123', 10),
        role: 'doctor',
        specialization: 'Cardiology'
      },
      {
        username: 'Dr. Johnson',
        email: 'johnson@hospital.com',
        password: await bcrypt.hash('doctor123', 10),
        role: 'doctor',
        specialization: 'Neurology'
      }
    ];

    const createdDoctors = await User.insertMany(doctors);
    console.log('Created doctors:', createdDoctors.map(d => d.username));

    // Create patients
    const patients = [
      {
        username: 'John Doe',
        email: 'john@example.com',
        password: await bcrypt.hash('patient123', 10),
        role: 'patient',
        age: 30,
        gender: 'male'
      },
      {
        username: 'Jane Smith',
        email: 'jane@example.com',
        password: await bcrypt.hash('patient123', 10),
        role: 'patient',
        age: 25,
        gender: 'female'
      }
    ];

    const createdPatients = await User.insertMany(patients);
    console.log('Created patients:', createdPatients.map(p => p.username));

    // Create appointments
    const appointments = [
      {
        patientId: createdPatients[0]._id,
        doctorId: createdDoctors[0]._id,
        date: new Date().toISOString().split('T')[0], // Today
        timeSlot: '10:00',
        queueNumber: 1,
        status: 'pending'
      },
      {
        patientId: createdPatients[1]._id,
        doctorId: createdDoctors[0]._id,
        date: new Date().toISOString().split('T')[0], // Today
        timeSlot: '11:00',
        queueNumber: 2,
        status: 'pending'
      },
      {
        patientId: createdPatients[0]._id,
        doctorId: createdDoctors[1]._id,
        date: new Date().toISOString().split('T')[0], // Today
        timeSlot: '14:00',
        queueNumber: 1,
        status: 'approved'
      }
    ];

    const createdAppointments = await Appointment.insertMany(appointments);
    console.log('Created appointments:', createdAppointments.length);

    console.log('Database seeded successfully!');
    console.log('Admin login: admin@hospital.com / admin123');
    console.log('Doctor login: smith@hospital.com / doctor123');
    console.log('Patient login: john@example.com / patient123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();