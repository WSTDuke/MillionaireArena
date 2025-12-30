import AuthLogin from "../pages/auth/AuthLogin"
import AuthSignUp from "../pages/auth/AuthSignUp"
import DashboardPage from "../pages/dashboard/DashboardPage"
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
  {
    path: "/dashboard",
    element: DashboardPage,
  },
]
