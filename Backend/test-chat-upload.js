require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/user.model');
const Appointment = require('./src/models/appointment.model');
const ChatMessage = require('./src/models/chatMessage.model');
const bcrypt = require('bcrypt');

async function setupTestData() {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('Connected to database');

    // Get or create test users
    let patient = await User.findOne({ email: 'john@example.com' });
    let doctor = await User.findOne({ email: 'smith@hospital.com' });

    if (!patient) {
      patient = await User.create({
        username: 'John Doe',
        email: 'john@example.com',
        password: await bcrypt.hash('patient123', 10),
        role: 'patient',
        age: 30,
        gender: 'male'
      });
      console.log('Created patient:', patient.username);
    } else {
      console.log('Using existing patient:', patient.username);
    }

    if (!doctor) {
      doctor = await User.create({
        username: 'Dr. Smith',
        email: 'smith@hospital.com',
        password: await bcrypt.hash('doctor123', 10),
        role: 'doctor',
        specialization: 'Cardiology'
      });
      console.log('Created doctor:', doctor.username);
    } else {
      console.log('Using existing doctor:', doctor.username);
    }

    // Find or create a completed appointment
    let appointment = await Appointment.findOne({ 
      patientId: patient._id, 
      doctorId: doctor._id,
      status: 'completed'
    });

    if (!appointment) {
      console.log('\nCreating new completed appointment...');
      appointment = await Appointment.create({
        patientId: patient._id,
        doctorId: doctor._id,
        date: new Date().toISOString().split('T')[0],
        timeSlot: '10:00',
        queueNumber: 1,
        status: 'completed'
      });
      console.log('Created completed appointment:', appointment._id);
    } else {
      console.log('Found existing completed appointment:', appointment._id);
    }

    console.log('\n✅ Test Setup Complete!');
    console.log('========================================');
    console.log('Appointment ID:', appointment._id);
    console.log('Patient Email:', patient.email);
    console.log('Patient Password: patient123');
    console.log('Doctor Email:', doctor.email);
    console.log('Doctor Password: doctor123');
    console.log('========================================');
    console.log('\nTo test file upload:');
    console.log('1. Login as patient with email: john@example.com');
    console.log('2. Go to chat with this doctor');
    console.log('3. Select and send an image file');
    console.log('\nThe file upload should now work!');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

setupTestData();
