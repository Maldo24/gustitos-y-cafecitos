import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";
import { login } from "../api/auth";
import Input from "../components/Input";

function Login() {
  const navigate = useNavigate();
  const { loginContext } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (loading) return;
    setLoading(true);
    
    try {
      const cleanUsername = username.trim();
      const response = await login(cleanUsername, password);
      
      loginContext(response.user, response.accessToken);
      
      navigate("/dashboard");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocurrió un error inesperado.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-butter-100 font-sans w-full">

      <div className="hidden md:block md:w-1/2 h-full">
        <img src="https://i.pinimg.com/1200x/13/81/b1/1381b10cf9fca9191b47841203bc7cc4.jpg" alt="Café aesthetic" className="w-full h-full object-cover shadow-md" />
      </div>
      <div className="w-full md:w-1/2 flex flex-col items-center p-4 sm:p-6 h-full overflow-y-auto bg-gradient-to-br from-butter-100 to-butter-200">
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 w-full max-w-md my-auto">
          <div className="flex flex-col items-center mb-6">
            <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-butter-500 text-butter-100 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3-1V6h-2a1 1 0 100 2M14 9l-3-1V6h2a1 1 0 110 2M7 10a2 2 0 100 4h1.5M10 10l2-1 2 1v2.5c0 1.4-1.6 2.5-3.9 2.5S7 13.9 7 12.5V10zM16 9a2 2 0 118 0v2c0 4-2.6 6-7 6" />
              </svg>
            </span>
            <h2 className="text-3xl font-bold mt-4 text-center">Bienvenido de vuelta</h2>
            <p className="text-sm text-gray-500 mt-1 text-center">Ingresa para ver tus grupos</p>
          </div>

          {error && <p className="text-red-500 text-sm mb-4 text-center bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <Input
                label="Usuario"
                type="text"
                placeholder="juanito123"
                value={username}
                onChange={setUsername}
              />
            </div>

            <div>
                <Input
                  label="Contraseña"
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={setPassword}
                />
            </div>

            <div className="mt-2">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            ¿No tienes cuenta? <button onClick={() => navigate('/register')} className="text-butter-500 font-bold hover:underline cursor-pointer">Regístrate</button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;