import AuthLogin from "../pages/auth/AuthLogin"
import AuthSignUp from "../pages/auth/AuthSignUp"
import DashboardPage from "../pages/dashboard/DashboardPage"
import DashboardOverview from "../pages/dashboard/DashboardOverview"
import SettingsView from "../pages/dashboard/SettingsView"
import ProfileView from "../pages/dashboard/ProfileView"
import ArenaView from "../pages/dashboard/ArenaView"
import ArenaLobbyView from "../pages/dashboard/ArenaLobbyView"
import GamePlayView from "../pages/dashboard/GamePlayView"
import TournamentsView from "../pages/dashboard/TournamentsView"
import ClanView from "../pages/dashboard/ClanView"
import Home from "../pages/home/HomePage"
import RankingView from "../pages/dashboard/RankingView"

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
        path: "arena", 
        element: ArenaView, 
      },
      {
        path: "arena/lobby",
        element: ArenaLobbyView,
      },
      {
        path: "tournaments", 
        element: TournamentsView,
      },
      {
        path: "clan", 
        element: ClanView,
      },
      {
        path: "ranking", 
        element: RankingView,
      }
    ]
  },
  {
    path: "/gameplay",
    element: GamePlayView,
  },
]
