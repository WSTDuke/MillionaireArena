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
        />
      ))}
    </Routes>
  )
}
