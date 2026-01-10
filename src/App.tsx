import { Routes, Route } from "react-router-dom"
import { routes } from "./routes/config"

interface RouteConfig {
  path: string;
  element: React.ComponentType<any> | (() => React.ReactElement | null);
  children?: RouteConfig[];
}

const renderRoutes = (routeList: RouteConfig[]) => {
  return routeList.map((route, index) => (
    <Route
      key={index}
      path={route.path}
      element={<route.element />}
    >
      {route.children && renderRoutes(route.children)}
    </Route>
  ));
};

export default function App() {
  return (
    <Routes>
      {renderRoutes(routes)}
    </Routes>
  )
}
