import axios from 'axios'


const api= axios.create({
    baseURL: "/api/auth",
    withCredentials: true,
})

export async function login(identifier, password) {
    const response = await api.post('/login',{
        username: identifier,
        password
    })

    return response.data
}

export async function register(data){
    const response = await api.post('/register', data)

    return response.data
}
export const getPatientDashboard = async () => {
  const response = await api.get("/patient-dashboard");
  return response.data;
};

export const updateProfile = async (data) => {
  const response = await api.put("/profile", data);
  return response.data;
}
