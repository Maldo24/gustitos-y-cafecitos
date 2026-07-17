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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      const response = await login(username, password);
      
      loginContext(response.user, response.accessToken);
      
      alert(`¡Bienvenido ${response.user.names}!`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocurrió un error inesperado.");
      }
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-butter-100 font-sans w-full">

      <div className="hidden md:block md:w-1/2 h-full">
        <img src="https://i.pinimg.com/1200x/13/81/b1/1381b10cf9fca9191b47841203bc7cc4.jpg" alt="Café aesthetic" className="w-full h-full object-cover shadow-md" />
      </div>
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-8 h-full">
          <h2 className="text-4xl font-bold mb-6 text-center">Bienvenido de vuelta</h2>
          
          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

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

            <div className="mt-4">
              <Button type="submit" className="w-full">Entrar</Button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            ¿No tienes cuenta? <button onClick={() => navigate('/register')} className="text-butter-500 font-bold hover:underline cursor-pointer">Regístrate</button>
          </p>
      </div>
    </div>
  );
}

export default Login;