import { RouterProvider } from "react-router-dom"
import { router } from "./features/app.route" 
import "./features/shared/global.scss"
import { AuthProvider } from "./features/auth/auth.context"


function App() {

  return ( 

    <AuthProvider>
      <RouterProvider router={router}/>
    </AuthProvider>
  )
}

export default App
