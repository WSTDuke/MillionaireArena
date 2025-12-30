import AuthLogin from "../pages/auth/AuthLogin"
import AuthSignUp from "../pages/auth/AuthSignUp"
import DashboardPage from "../pages/dashboard/DashboardPage"
import DashboardOverview from "../pages/dashboard/DashboardOverview"
import SettingsView from "../pages/dashboard/SettingsView"
import ProfileView from "../pages/dashboard/ProfileView"
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
    children: [
      {
        path: "",
        element: DashboardOverview,
      },
      {
        path: "profile",
        element: ProfileView,
      },
      {
        path: "settings",
        element: SettingsView,
      },
      {
        path: "arena", // Placeholder for Arena
        element: DashboardOverview, 
      },
      {
        path: "tournaments", // Placeholder for Tournaments
        element: DashboardOverview,
      },
      {
        path: "clan", // Placeholder for Clan
        element: DashboardOverview,
      }
    ]
  },
]
