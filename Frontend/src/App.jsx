import { RouterProvider } from "react-router-dom";
import { router } from "./features/app.route";
import { AuthProvider } from "./features/auth/auth.context";

// Global styles (design system)
import "./features/shared/global.scss";

function App() {
  return (
    <AuthProvider>
      <div className="app-root">
        <RouterProvider router={router} />
      </div>
    </AuthProvider>
  );
}

export default App;