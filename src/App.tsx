import { Routes, Route } from "react-router-dom"
import { routes } from "./routes/config"

export default function App() {
  return (
    <Routes>
      {routes.map((route, index) => (
        <Route
          key={index}
          path={route.path}
          element={<route.element />}
        >
          {route.children && route.children.map((child, childIndex) => (
            <Route
              key={childIndex}
              path={child.path}
              element={<child.element />}
            />
          ))}
        </Route>
      ))}
    </Routes>
  )
}
