// Convert 24-hour format (HH:mm) to 12-hour format with AM/PM
export const formatTimeWithAMPM = (time24) => {
  if (!time24) return "";

  const [hours, minutes] = time24.split(":");
  let hour = parseInt(hours, 10);
  const period = hour >= 12 ? "PM" : "AM";

  if (hour > 12) {
    hour = hour - 12;
  } else if (hour === 0) {
    hour = 12;
  }

  return `${String(hour).padStart(2, "0")}:${minutes} ${period}`;
};

// Convert 24-hour time to determine if it's AM or PM
export const getAMPM = (time24) => {
  if (!time24) return "";
  const hours = parseInt(time24.split(":")[0], 10);
  return hours >= 12 ? "PM" : "AM";
};
