// import { useContext } from "react";
// import { authContext } from "../auth.context";
// import { login, register } from "../services/auth.api";


// export const useAuth = ()=> {
//     const context = useContext(authContext)

//     const {user, setUser} = context


//     const handleLogin = async(username, password)=> {
//         setLoading(true)

//         const response = await login(username, password)
//     }
// }

import { useContext } from "react";
import { authContext } from "../auth.context";

export const useAuth = () => {
  const context = useContext(authContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};