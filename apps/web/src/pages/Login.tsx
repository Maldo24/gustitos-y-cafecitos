import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Button from "../components/Button";
import { login } from "../api/auth";
import { createAppeal } from "../api/appeals";
import Input from "../components/Input";
import Modal from "../components/Modal";

function Login() {
  const navigate = useNavigate();
  const { loginContext } = useAuth();
  const { showToast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Apelación por cuenta bloqueada
  const [appealOpen, setAppealOpen] = useState(false);
  const [appealEmail, setAppealEmail] = useState("");
  const [appealReason, setAppealReason] = useState("");
  const [appealError, setAppealError] = useState("");
  const [appealBusy, setAppealBusy] = useState(false);

  const isBlockedError = error.startsWith("Tu cuenta fue bloqueada");

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

  const handleSubmitAppeal = async () => {
    setAppealError("");

    if (appealReason.trim().length < 15) {
      setAppealError("Escribe al menos 15 caracteres explicando tu situación.");
      return;
    }

    if (!appealEmail.trim()) {
      setAppealError("Escribe el correo con el que te registraste.");
      return;
    }

    setAppealBusy(true);
    try {
      // El usuario bloqueado se identifica con usuario + correo registrado
      await createAppeal({
        targetType: "user",
        targetId: "",
        reason: appealReason.trim(),
        username: username.trim(),
        email: appealEmail.trim(),
      });
      showToast("Tu apelación fue enviada. Te responderemos por notificación.");
      setAppealOpen(false);
      setAppealReason("");
      setError("");
    } catch (err: unknown) {
      setAppealError(err instanceof Error ? err.message : "No se pudo enviar la apelación.");
    } finally {
      setAppealBusy(false);
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
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="Gustitos y Cafecitos"
              className="w-14 h-14 rounded-2xl object-cover shadow-sm"
            />
            <h2 className="text-3xl font-bold mt-4 text-center">Bienvenido de vuelta</h2>
            <p className="text-sm text-gray-500 mt-1 text-center">Ingresa para ver tus grupos</p>
          </div>

          {error && (
            <div className="text-red-500 text-sm mb-4 text-center bg-red-50 rounded-lg px-3 py-2">
              <p>{error}</p>
              {isBlockedError && (
                <button
                  type="button"
                  onClick={() => {
                    setAppealError("");
                    setAppealOpen(true);
                  }}
                  className="mt-2 underline font-bold cursor-pointer"
                >
                  Apelar el bloqueo
                </button>
              )}
            </div>
          )}

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
          <p className="mt-2 text-center text-sm text-gray-600">
            ¿Olvidaste tu contraseña?{" "}
            <Link to="/recuperar-contrasena" className="text-butter-500 font-bold hover:underline">
              Recuperarla
            </Link>
          </p>
        </div>

        {appealOpen && (
          <Modal title="Apelar el bloqueo" onClose={() => setAppealOpen(false)}>
          <p className="text-sm text-gray-600 mb-3">
            Un administrador revisará tu caso. Confirma tu correo registrado para que podamos
            identificarte.
          </p>
          <div className="flex flex-col gap-3">
            <Input
              label="Correo registrado"
              type="email"
              placeholder="tu@correo.com"
              value={appealEmail}
              onChange={(value) => {
                setAppealEmail(value);
                setAppealError("");
              }}
            />
            <Input
              label="Por qué debería desbloquearse"
              type="text"
              placeholder="Mínimo 15 caracteres..."
              value={appealReason}
              onChange={(value) => {
                setAppealReason(value);
                setAppealError("");
              }}
            />
            {appealError && <p className="text-red-500 text-sm">{appealError}</p>}
            <div className="flex gap-2 justify-end">
              <Button onClick={() => setAppealOpen(false)} disabled={appealBusy}>
                Cancelar
              </Button>
              <Button onClick={handleSubmitAppeal} disabled={appealBusy}>
                {appealBusy ? "Enviando..." : "Enviar apelación"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
      </div>
    </div>
  );
}

export default Login;