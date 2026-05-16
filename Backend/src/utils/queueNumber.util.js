const mongoose = require("mongoose");
const Appointment = require("../models/appointment.model");
const QueueCounter = require("../models/queueCounter.model");

const WEEKDAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function normalizeAppointmentDate(dateInput) {
  if (dateInput == null || dateInput === "") {
    throw new Error("Appointment date is required");
  }
  if (typeof dateInput === "string") {
    return dateInput.trim().split("T")[0];
  }
  if (dateInput instanceof Date && !Number.isNaN(dateInput.getTime())) {
    const year = dateInput.getFullYear();
    const month = String(dateInput.getMonth() + 1).padStart(2, "0");
    const day = String(dateInput.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  throw new Error("Invalid appointment date");
}

function getWeekdayName(dateInput) {
  const normalized = normalizeAppointmentDate(dateInput);
  const date = new Date(`${normalized}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid appointment date");
  }

  return WEEKDAY_NAMES[date.getDay()];
}

function getDoctorWorkingDateOptions(schedule, daysAhead = 30, startDate = new Date()) {
  const workingDays = new Set(
    (schedule?.weekly || [])
      .map((entry) => entry?.day)
      .filter(Boolean),
  );

  const normalizedStart = normalizeAppointmentDate(startDate);
  const start = new Date(`${normalizedStart}T00:00:00`);

  if (Number.isNaN(start.getTime())) {
    throw new Error("Invalid appointment date");
  }

  if (workingDays.size === 0) {
    return [
      {
        value: normalizedStart,
        label: normalizedStart,
        weekday: WEEKDAY_NAMES[start.getDay()],
        isToday: true,
      },
    ];
  }

  const options = [];
  const seen = new Set();

  for (let offset = 0; offset < daysAhead; offset += 1) {
    const candidate = new Date(start);
    candidate.setDate(start.getDate() + offset);

    const value = normalizeAppointmentDate(candidate);
    if (seen.has(value)) {
      continue;
    }

    const weekday = WEEKDAY_NAMES[candidate.getDay()];
    if (!workingDays.has(weekday)) {
      continue;
    }

    seen.add(value);
    options.push({
      value,
      label: `${weekday}, ${candidate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })}`,
      weekday,
      isToday: offset === 0,
    });
  }

  return options;
}

function getDoctorQueueStatus(schedule, dateInput, now = new Date()) {
  const selectedDate = normalizeAppointmentDate(dateInput);
  const today = normalizeAppointmentDate(now);
  const weekday = getWeekdayName(selectedDate);
  const workingDays = new Set(
    (schedule?.weekly || [])
      .map((entry) => entry?.day)
      .filter(Boolean),
  );

  const isToday = selectedDate === today;
  const hasWeeklySchedule = workingDays.size > 0;
  const dayMatches = !hasWeeklySchedule || workingDays.has(weekday);
  const isScheduleActive = schedule?.isActiveToday !== false;

  let reason = null;

  if (!isScheduleActive) {
    reason = "Doctor is marked inactive today";
  } else if (!dayMatches) {
    reason = "Doctor is not scheduled to work today";
  }

  return {
    isActive: isScheduleActive && dayMatches,
    isToday,
    selectedDate,
    today,
    weekday,
    reason,
  };
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

async function getAverageConsultationMinutes(doctorId) {
  const oid = toObjectId(doctorId);

  const completedAppointments = await Appointment.find({
    doctorId: oid,
    status: "completed",
  })
    .select(
      "approvedAt completedAt createdAt updatedAt consultationStartedAt consultationEndedAt consultationDurationMinutes",
    )
    .lean();

  const durations = completedAppointments
    .map((appointment) => {
      const storedDuration = Number(appointment.consultationDurationMinutes);
      if (Number.isFinite(storedDuration) && storedDuration > 0) {
        return Math.max(1, Math.round(storedDuration));
      }

      const startedAt = new Date(
        appointment.consultationStartedAt ||
          appointment.approvedAt ||
          appointment.createdAt,
      );
      const finishedAt = new Date(
        appointment.consultationEndedAt ||
          appointment.completedAt ||
          appointment.updatedAt ||
          appointment.createdAt,
      );

      if (
        Number.isNaN(startedAt.getTime()) ||
        Number.isNaN(finishedAt.getTime()) ||
        finishedAt <= startedAt
      ) {
        return null;
      }

      const minutes = (finishedAt.getTime() - startedAt.getTime()) / 60000;
      return Math.max(1, Math.round(minutes));
    })
    .filter((value) => Number.isFinite(value) && value > 0);

  if (durations.length === 0) {
    return null;
  }

  const totalMinutes = durations.reduce((sum, value) => sum + value, 0);
  return Math.max(1, Math.round(totalMinutes / durations.length));
}

async function getEstimatedWaitTimeForPatientsAhead(doctorId, patientsAhead) {
  const averageConsultationMinutes = await getAverageConsultationMinutes(doctorId);
  const fallbackAverage = 10;
  const activeAverage = averageConsultationMinutes || fallbackAverage;

  return {
    averageConsultationMinutes: activeAverage,
    estimatedWaitMinutes: Math.max(0, Number(patientsAhead || 0) * activeAverage),
  };
}

module.exports = {
  normalizeAppointmentDate,
  getDoctorQueueStatus,
  getDoctorWorkingDateOptions,
  allocateNextQueueNumber,
  reconcileDuplicateQueueNumbers,
  syncActiveQueueSequential,
  computeLiveQueueInfoForAppointmentId,
  getAverageConsultationMinutes,
  getEstimatedWaitTimeForPatientsAhead,
};
