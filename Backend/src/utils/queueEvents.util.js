const Appointment = require("../models/appointment.model");
const { normalizeAppointmentDate } = require("./queueNumber.util");

/**
 * Notify doctor room and optionally the patient so all dashboards refresh.
 */
function emitQueueUpdated(io, { doctorId, date, patientId }) {
  if (!io || !doctorId || !date) return;

  const payload = {
    doctorId: String(doctorId),
    date: String(date),
  };
  if (patientId) {
    payload.patientId = String(patientId);
  }

  io.to(String(doctorId)).emit("queueUpdated", payload);
  if (patientId) {
    io.to(String(patientId)).emit("queueUpdated", payload);
  }
}

/**
 * Notify doctor + every patient currently in that doctor's active queue for the date.
 */
async function broadcastQueueUpdated(io, { doctorId, date }) {
  if (!io || !doctorId || !date) return;

  let normalizedDate;
  try {
    normalizedDate = normalizeAppointmentDate(date);
  } catch {
    return;
  }

  const payload = {
    doctorId: String(doctorId),
    date: String(normalizedDate),
  };

  io.to(String(doctorId)).emit("queueUpdated", payload);

  const rows = await Appointment.find({
    doctorId,
    date: normalizedDate,
    status: { $in: ["pending", "approved"] },
  })
    .select("patientId")
    .lean();

  const seen = new Set();
  for (const row of rows) {
    const pid = String(row.patientId);
    if (seen.has(pid)) continue;
    seen.add(pid);
    io.to(pid).emit("queueUpdated", { ...payload, patientId: pid });
  }
}

module.exports = { emitQueueUpdated, broadcastQueueUpdated };
