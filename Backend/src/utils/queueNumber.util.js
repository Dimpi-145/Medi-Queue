const mongoose = require("mongoose");
const Appointment = require("../models/appointment.model");
const QueueCounter = require("../models/queueCounter.model");

function normalizeAppointmentDate(dateInput) {
  if (dateInput == null || dateInput === "") {
    throw new Error("Appointment date is required");
  }
  if (typeof dateInput === "string") {
    return dateInput.trim().split("T")[0];
  }
  if (dateInput instanceof Date && !Number.isNaN(dateInput.getTime())) {
    return dateInput.toISOString().split("T")[0];
  }
  throw new Error("Invalid appointment date");
}

function toObjectId(doctorId) {
  if (doctorId instanceof mongoose.Types.ObjectId) {
    return doctorId;
  }
  return new mongoose.Types.ObjectId(doctorId);
}

/**
 * Atomically allocates the next queue number for a doctor + calendar date.
 * Merges with max(queueNumber) on existing appointments so legacy rows stay consistent.
 */
async function allocateNextQueueNumber(doctorId, dateInput) {
  const date = normalizeAppointmentDate(dateInput);
  const oid = toObjectId(doctorId);

  const maxAppResult = await Appointment.aggregate([
    {
      $match: {
        doctorId: oid,
        date,
        queueNumber: { $exists: true, $ne: null },
      },
    },
    { $group: { _id: null, m: { $max: "$queueNumber" } } },
  ]);
  const maxApp = maxAppResult[0]?.m ?? 0;

  const doc = await QueueCounter.findOneAndUpdate(
    { doctorId: oid, date },
    [
      {
        $set: {
          seq: {
            $add: [
              {
                $max: [{ $ifNull: ["$seq", 0] }, { $literal: maxApp }],
              },
              1,
            ],
          },
        },
      },
    ],
    { upsert: true, new: true, updatePipeline: true },
  );

  return doc.seq;
}

/**
 * When two or more active (pending/approved) appointments share the same queueNumber
 * for a doctor+date, reassign unique numbers 1..n in stable order (queueNumber, then createdAt).
 * Persists fixes so patient & doctor APIs always agree.
 */
async function reconcileDuplicateQueueNumbers(doctorId, dateInput) {
  const date = normalizeAppointmentDate(dateInput);
  const oid = toObjectId(doctorId);

  const apps = await Appointment.find({
    doctorId: oid,
    date,
    status: { $in: ["pending", "approved"] },
  })
    .sort({ queueNumber: 1, createdAt: 1 })
    .select("_id queueNumber");

  if (apps.length <= 1) {
    return false;
  }

  const hasDuplicate =
    apps.length !== new Set(apps.map((a) => a.queueNumber)).size;

  if (!hasDuplicate) {
    return false;
  }

  const ops = apps.map((app, index) => ({
    updateOne: {
      filter: { _id: app._id },
      update: { $set: { queueNumber: index + 1 } },
    },
  }));

  await Appointment.bulkWrite(ops);

  await QueueCounter.findOneAndUpdate(
    { doctorId: oid, date },
    { $max: { seq: apps.length } },
    { upsert: true },
  );

  return true;
}

/**
 * Forces canonical queue order for active (pending + approved) appointments:
 * sort by queueNumber, createdAt, then assign 1..n. Fixes stale or duplicate tokens
 * so patient + doctor views always match.
 */
async function syncActiveQueueSequential(doctorId, dateInput) {
  const date = normalizeAppointmentDate(dateInput);
  const oid = toObjectId(doctorId);

  const sorted = await Appointment.find({
    doctorId: oid,
    date,
    status: { $in: ["pending", "approved"] },
  }).sort({ queueNumber: 1, createdAt: 1 });

  if (sorted.length === 0) {
    return false;
  }

  const ops = [];
  sorted.forEach((app, i) => {
    const correct = i + 1;
    if (app.queueNumber !== correct) {
      ops.push({
        updateOne: {
          filter: { _id: app._id },
          update: { $set: { queueNumber: correct } },
        },
      });
    }
  });

  if (ops.length === 0) {
    return false;
  }

  await Appointment.bulkWrite(ops);
  await QueueCounter.findOneAndUpdate(
    { doctorId: oid, date },
    { $max: { seq: sorted.length } },
    { upsert: true },
  );

  return true;
}

/**
 * Canonical queue position for one appointment: sync DB order, then compute rank in the
 * sorted active list (same order as doctor dashboard). Does not rely on stale queueNumber alone.
 */
async function computeLiveQueueInfoForAppointmentId(appointmentId) {
  let appointment = await Appointment.findById(appointmentId)
    .select("doctorId date queueNumber status patientId")
    .lean();

  if (!appointment) {
    return null;
  }

  const doctorId = appointment.doctorId;
  const date = normalizeAppointmentDate(appointment.date);

  await syncActiveQueueSequential(doctorId, date);

  appointment = await Appointment.findById(appointmentId)
    .select("doctorId date queueNumber status patientId")
    .lean();

  const sorted = await Appointment.find({
    doctorId,
    date,
    status: { $in: ["pending", "approved"] },
  })
    .sort({ queueNumber: 1, createdAt: 1 })
    .select("_id queueNumber status")
    .lean();

  const idx = sorted.findIndex(
    (a) => String(a._id) === String(appointment._id),
  );

  const liveQueueNumber =
    idx >= 0 ? idx + 1 : (appointment.queueNumber ?? null);

  const patientsAhead = await Appointment.countDocuments({
    doctorId,
    date,
    status: { $in: ["pending", "approved"] },
    queueNumber: { $lt: appointment.queueNumber },
  });

  return {
    appointmentId: appointment._id,
    status: appointment.status,
    queueNumber: liveQueueNumber,
    liveQueueNumber,
    patientsAhead,
  };
}

module.exports = {
  normalizeAppointmentDate,
  allocateNextQueueNumber,
  reconcileDuplicateQueueNumbers,
  syncActiveQueueSequential,
  computeLiveQueueInfoForAppointmentId,
};
