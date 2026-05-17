import API from "../../../utils/axios";

// Get patient prescriptions
export const getMyPrescriptions = () => API.get("/prescriptions/my");
