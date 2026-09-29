import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Input from "../components/Input";
import Modal from "../components/Modal";
import { useToast } from "../context/ToastContext";
import {
  createPasswordRequest,
  getPasswordRequestStatus,
  confirmPasswordChange,
  type PasswordRequestStatus,
} from "../api/passwordRequests";

const POLL_MS = 5000;

function ForgotPassword() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<PasswordRequestStatus | null>(null);
  const [error, setError] = useState("");

  const [token, setToken] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<{ new?: string; repeat?: string }>({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const cleanUsername = username.trim();
  const cleanEmail = email.trim();

  const checkStatus = async (silent = false) => {
    if (checking || !cleanUsername || !cleanEmail) return;
    if (!silent) setChecking(true);
    try {
      const result = await getPasswordRequestStatus(cleanUsername, cleanEmail);
      setStatus(result.status);
      if (result.status === "approved" && result.token) {
        setToken(result.token);
        setModalOpen(true);
      }
      if (result.status === "none") {
        setError("No encontramos solicitudes con esos datos. Revisa el usuario y el correo.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo consultar el estado.");
    } finally {
      if (!silent) setChecking(false);
    }
  };

  // Mientras la solicitud está pendiente, consultamos cada POLL_MS
  useEffect(() => {
    if (status !== "pending" || !cleanUsername || !cleanEmail) return;

    const timer = setInterval(() => {
      void checkStatus(true);
    }, POLL_MS);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, cleanUsername, cleanEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!cleanUsername || !cleanEmail) {
      setError("Completa tu usuario y el correo con el que te registraste.");
      return;
    }

    if (sending) return;
    setSending(true);

    try {
      const result = await createPasswordRequest(cleanUsername, cleanEmail);
      setStatus("pending");
      showToast(result.message);
      void checkStatus(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "No se pudo enviar la solicitud.");
    } finally {
      setSending(false);
    }
  };

  const handleSavePassword = async () => {
    setPasswordErrors({});
    if (!token) return;

    if (newPassword.includes(" ")) {
      setPasswordErrors({ new: "La contraseña no puede contener espacios." });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordErrors({ new: "La contraseña debe tener al menos 6 caracteres." });
      return;
    }

    if (newPassword !== repeatPassword) {
      setPasswordErrors({ repeat: "Las contraseñas no coinciden." });
      return;
    }

    setSaving(true);
    try {
      await confirmPasswordChange(token, newPassword);
      setModalOpen(false);
      setDone(true);
      setStatus("completed");
      showToast("¡Contraseña actualizada!");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "No se pudo actualizar la contraseña.";
      setPasswordErrors({ new: message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 h-full overflow-y-auto bg-gradient-to-br from-butter-100 to-butter-200">
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 w-full max-w-md my-auto">
        <div className="flex flex-col items-center mb-6">
          <img
            src={`${import.meta.env.BASE_URL}logo.png`}
            alt="Gustitos y Cafecitos"
            className="w-14 h-14 rounded-2xl object-cover shadow-sm"
          />
          <h2 className="text-3xl font-bold mt-4 text-center">Recuperar contraseña</h2>
          <p className="text-sm text-gray-500 mt-1 text-center">
            Un administrador debe aprobar tu solicitud antes de cambiarla.
          </p>
        </div>

        {!done ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Usuario"
              type="text"
              placeholder="juanito123"
              value={username}
              onChange={(value) => {
                setUsername(value);
                setStatus(null);
                setError("");
              }}
            />
            <Input
              label="Correo con el que te registraste"
              type="email"
              placeholder="juanito123@gmail.com"
              value={email}
              onChange={(value) => {
                setEmail(value);
                setStatus(null);
                setError("");
              }}
            />

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <Button type="submit" disabled={sending}>
              {sending ? "Enviando..." : "Solicitar cambio"}
            </Button>
          </form>
        ) : (
          <div className="text-center">
            <p className="text-green-600 font-bold mb-4">
              Tu contraseña fue actualizada correctamente.
            </p>
            <Button onClick={() => navigate("/login")} className="w-full">
              Ir a iniciar sesión
            </Button>
          </div>
        )}

        {status === "pending" && !done && (
          <div className="mt-4 bg-butter-100 border border-butter-300 rounded-lg p-3 text-sm text-gray-700">
            <p className="font-bold mb-1">Solicitud en revisión</p>
            <p>
              El administrador tiene que aprobarla. Esta pantalla se actualiza sola cada 5
              segundos.
            </p>
            <button
              type="button"
              onClick={() => void checkStatus()}
              disabled={checking}
              className="mt-2 text-butter-500 font-bold hover:underline cursor-pointer disabled:text-gray-400"
            >
              {checking ? "Consultando..." : "Consultar ahora"}
            </button>
          </div>
        )}

        {status === "rejected" && !done && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            <p className="font-bold mb-1">Solicitud rechazada</p>
            <p>El administrador no aprobó el cambio. Revisa tus datos e inténtalo de nuevo.</p>
          </div>
        )}

        {status === "completed" && !done && (
          <div className="mt-4 bg-butter-100 border border-butter-300 rounded-lg p-3 text-sm text-gray-700">
            <p className="font-bold">Ya habías cambiado tu contraseña</p>
            <p>Intenta iniciar sesión con tu nueva contraseña.</p>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-gray-600">
          ¿Recordaste tu contraseña?{" "}
          <Link to="/login" className="text-butter-500 font-bold hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>

      {modalOpen && (
        <Modal title="Define tu nueva contraseña" onClose={() => setModalOpen(false)}>
          <p className="text-sm text-gray-600 mb-4">
            Tu solicitud fue aprobada. Este paso solo lo puedes hacer tú, el administrador nunca ve tu
            contraseña.
          </p>
          <div className="flex flex-col gap-3">
            <Input
              label="Nueva contraseña"
              type="password"
              placeholder="Mínimo 6 caracteres, sin espacios"
              value={newPassword}
              error={passwordErrors.new}
              onChange={(value) => {
                setNewPassword(value);
                setPasswordErrors((prev) => ({ ...prev, new: undefined }));
              }}
            />
            <Input
              label="Repite la contraseña"
              type="password"
              placeholder="********"
              value={repeatPassword}
              error={passwordErrors.repeat}
              onChange={(value) => {
                setRepeatPassword(value);
                setPasswordErrors((prev) => ({ ...prev, repeat: undefined }));
              }}
            />
            <div className="flex gap-2 justify-end">
              <Button onClick={() => setModalOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handleSavePassword} disabled={saving}>
                {saving ? "Guardando..." : "Guardar contraseña"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default ForgotPassword;
