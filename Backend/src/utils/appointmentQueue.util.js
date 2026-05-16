const Appointment = require("../models/appointment.model");
const { normalizeAppointmentDate } = require("./queueNumber.util");

const STATUS_PRIORITY = {
  approved: 3,
  pending: 2,
  completed: 1,
  cancelled: 0,
};

function getPatientKey(row) {
  return String(row?.patientId?._id || row?.patientId || row?._id || "");
}

function compareQueueRows(left, right) {
  const leftPriority =
    STATUS_PRIORITY[String(left?.status || "").toLowerCase()] || 0;
  const rightPriority =
    STATUS_PRIORITY[String(right?.status || "").toLowerCase()] || 0;

  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority;
  }

  const leftQueue = Number(left?.queueNumber ?? Number.POSITIVE_INFINITY);
  const rightQueue = Number(right?.queueNumber ?? Number.POSITIVE_INFINITY);

  if (leftQueue !== rightQueue) {
    return rightQueue - leftQueue;
  }

  const leftCreated = new Date(left?.createdAt || 0).getTime();
  const rightCreated = new Date(right?.createdAt || 0).getTime();
  return leftCreated - rightCreated;
}

function dedupeQueueEntries(rows = []) {
  const uniqueByPatient = new Map();

  for (const row of rows) {
    const patientKey = getPatientKey(row);
    if (!patientKey) {
      continue;
    }

    const existing = uniqueByPatient.get(patientKey);
    if (!existing || compareQueueRows(row, existing) > 0) {
      uniqueByPatient.set(patientKey, row);
    }
  }

  return Array.from(uniqueByPatient.values()).sort((left, right) => {
    const leftQueue = Number(left?.queueNumber ?? Number.POSITIVE_INFINITY);
    const rightQueue = Number(right?.queueNumber ?? Number.POSITIVE_INFINITY);

    if (leftQueue !== rightQueue) {
      return leftQueue - rightQueue;
    }

    return new Date(left?.createdAt || 0) - new Date(right?.createdAt || 0);
  });
}

async function findActiveAppointmentConflict({
  patientId,
  doctorId,
  date,
  excludeAppointmentId = null,
}) {
  if (!patientId || !doctorId || !date) {
    return null;
  }

  const normalizedDate = normalizeAppointmentDate(date);
  const query = {
    patientId,
    doctorId,
    date: normalizedDate,
    status: { $in: ["pending", "approved"] },
  };

  if (excludeAppointmentId) {
    query._id = { $ne: excludeAppointmentId };
  }

  return Appointment.findOne(query).sort({ createdAt: 1 });
}

module.exports = {
  dedupeQueueEntries,
  findActiveAppointmentConflict,
};
