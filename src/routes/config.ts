import AuthLogin from "../pages/auth/AuthLogin"
import AuthSignUp from "../pages/auth/AuthSignUp"
import Home from "../pages/home/HomePage"

export const routes = [
  {
    path: "/",
    element: Home,
  },
  {
    path: "/login",
    element: AuthLogin,
  },
  {
    path: "/signup",
    element: AuthSignUp,
  },
]
