import { useNavigate } from "react-router-dom";
import Button from "../components/Button";

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <h1 className="text-7xl font-bold text-butter-500 mb-2">404</h1>
      <p className="text-2xl font-bold text-gray-800 mb-2">Página no encontrada</p>
      <p className="text-gray-600 mb-6">
        El grupo, cuenta o página que buscas no existe o fue movido.
      </p>
      <div className="flex gap-3">
        <Button onClick={() => navigate("/")}>Ir al inicio</Button>
        <Button onClick={() => navigate("/dashboard")}>Mis Grupos</Button>
      </div>
    </div>
  );
}

export default NotFound;