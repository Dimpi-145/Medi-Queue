const STATUS_PRIORITY = {
  approved: 3,
  pending: 2,
  completed: 1,
  cancelled: 0,
};

const getPatientKey = (item) =>
  String(item?.patientId?._id || item?.patientId || item?._id || "");

export const dedupeQueue = (queue = []) => {
  const uniqueByPatient = new Map();

  queue.forEach((item) => {
    const key = getPatientKey(item);
    if (!key) {
      return;
    }

    const existing = uniqueByPatient.get(key);
    const currentPriority =
      STATUS_PRIORITY[String(item?.status || "").toLowerCase()] || 0;
    const existingPriority =
      STATUS_PRIORITY[String(existing?.status || "").toLowerCase()] || 0;

    if (
      !existing ||
      currentPriority > existingPriority ||
      (currentPriority === existingPriority &&
        Number(item?.queueNumber ?? Number.POSITIVE_INFINITY) <
          Number(existing?.queueNumber ?? Number.POSITIVE_INFINITY))
    ) {
      uniqueByPatient.set(key, item);
    }
  });

  return Array.from(uniqueByPatient.values()).sort((left, right) => {
    const leftQueue = Number(left?.queueNumber ?? Number.POSITIVE_INFINITY);
    const rightQueue = Number(right?.queueNumber ?? Number.POSITIVE_INFINITY);

    if (leftQueue !== rightQueue) {
      return leftQueue - rightQueue;
    }

    return new Date(left?.createdAt || 0) - new Date(right?.createdAt || 0);
  });
};
