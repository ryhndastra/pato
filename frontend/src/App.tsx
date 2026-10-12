import { Route, Routes } from "react-router";
import { RequireAuth } from "./auth/RequireAuth";
import { Home } from "./pages/Home/Home";
import { Login } from "./pages/Login/Login";
import { CreateRoom } from "./pages/CreateRoom/CreateRoom";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/create"
        element={
          <RequireAuth>
            <CreateRoom />
          </RequireAuth>
        }
      />
    </Routes>
  );
}

export default App;
