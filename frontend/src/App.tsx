import { Navigate, Route, Routes } from "react-router";
import { RequireAuth } from "./auth/RequireAuth";
import { useAuth } from "./auth/useAuth";
import { AuthedShell } from "./layouts/AuthedShell";
import { Landing } from "./pages/Landing/Landing";
import { Login } from "./pages/Login/Login";
import { CreateRoom } from "./pages/CreateRoom/CreateRoom";
import { Dashboard } from "./pages/Dashboard/Dashboard";
import { History } from "./pages/History/History";
import { Profile } from "./pages/Profile/Profile";
import { RoomJoin } from "./pages/RoomJoin/RoomJoin";

function Root() {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : <Landing />;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Root />} />
      <Route path="/login" element={<Login />} />
      <Route path="/room/:code" element={<RoomJoin />} />
      <Route
        path="/create"
        element={
          <RequireAuth>
            <CreateRoom />
          </RequireAuth>
        }
      />

      <Route
        element={
          <RequireAuth>
            <AuthedShell />
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/history" element={<History />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}

export default App;
