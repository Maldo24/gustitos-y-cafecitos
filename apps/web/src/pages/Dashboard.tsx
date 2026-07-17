import { useAuth } from "../context/AuthContext";

function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="p-8">
      <h2 className="text-3xl font-bold text-butter-500 mb-6">Mis Grupos</h2>
      <p>Bienvenido a tu panel principal, {user?.names}. Aquí pronto veremos tus grupos.</p>
    </div>
  );
}

export default Dashboard;