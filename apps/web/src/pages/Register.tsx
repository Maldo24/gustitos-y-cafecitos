import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { register } from "../api/auth";
import Input from "../components/Input";
import { useToast } from "../context/ToastContext";

interface FieldErrors {
  username?: string;
  names?: string;
  firstSurname?: string;
  email?: string;
  password?: string;
  general?: string;
}

function Register() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    username: "",
    names: "",
    firstSurname: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  const clearFieldError = (field: keyof FieldErrors) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (loading) return;

    const cleanedData = {
      username: formData.username.trim(),
      names: formData.names.trim(),
      firstSurname: formData.firstSurname.trim(),
      email: formData.email.trim(),
      password: formData.password,
    };

    const fieldErrors: FieldErrors = {};

    const usernameRegex = /^[a-zA-Z0-9]{3,20}$/;
    if (!usernameRegex.test(cleanedData.username)) {
      fieldErrors.username = "El nombre de usuario debe tener entre 3 y 20 caracteres y solo puede contener letras y numeros.";
    }

    const nameRegex = /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ ]+$/;
    if (!cleanedData.names) {
      fieldErrors.names = "Ingresa tus nombres.";
    } else if (!nameRegex.test(cleanedData.names)) {
      fieldErrors.names = "Los nombres no pueden contener numeros ni caracteres especiales.";
    }

    if (!cleanedData.firstSurname) {
      fieldErrors.firstSurname = "Ingresa tu primer apellido.";
    } else if (!nameRegex.test(cleanedData.firstSurname)) {
      fieldErrors.firstSurname = "El apellido no puede contener numeros ni caracteres especiales.";
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!cleanedData.email) {
      fieldErrors.email = "Ingresa tu correo electronico.";
    } else if (!emailRegex.test(cleanedData.email)) {
      fieldErrors.email = "Ingresa un correo valido. Ej: nombre@dominio.com";
    }

    if (cleanedData.password.includes(" ")) {
      fieldErrors.password = "La contraseña no puede contener espacios.";
    } else if (cleanedData.password.length < 6) {
      fieldErrors.password = "La contraseña debe tener al menos 6 caracteres.";
    }

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      await register(cleanedData);
      showToast("¡Usuario registrado correctamente!");
      navigate("/login");
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Ocurrió un error inesperado al registrarse.";
      const lowered = message.toLowerCase();
      if (lowered.includes("usuario")) {
        setErrors((prev) => ({ ...prev, username: message }));
      } else if (lowered.includes("correo")) {
        setErrors((prev) => ({ ...prev, email: message }));
      } else if (lowered.includes("contraseña") || lowered.includes("contrasena")) {
        setErrors((prev) => ({ ...prev, password: message }));
      } else {
        setErrors((prev) => ({ ...prev, general: message }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-butter-100 font-sans w-full">
      <div className="hidden md:block md:w-1/2 h-full">
        <img
          src="https://i.pinimg.com/1200x/4e/bd/31/4ebd31a7f9758e70ac2f2f39613152ed.jpg"
          alt="Café"
          className="w-full h-full object-cover shadow-md"
        />
      </div>

      <div className="w-full md:w-1/2 flex flex-col items-center p-4 sm:p-6 h-full overflow-y-auto bg-gradient-to-br from-butter-100 to-butter-200">
        <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 w-full max-w-md my-auto">
          <div className="flex flex-col items-center mb-6">
            <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-butter-500 text-butter-100 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3-1V6h-2a1 1 0 100 2M14 9l-3-1V6h2a1 1 0 110 2M7 10a2 2 0 100 4h1.5M10 10l2-1 2 1v2.5c0 1.4-1.6 2.5-3.9 2.5S7 13.9 7 12.5V10zM16 9a2 2 0 118 0v2c0 4-2.6 6-7 6" />
              </svg>
            </span>
            <h2 className="text-3xl font-bold mt-4 text-center">Crea tu cuenta</h2>
            <p className="text-sm text-gray-500 mt-1 text-center">Únete a tu cafecito con tus amistades</p>
          </div>

          {errors.general && (
            <p className="text-red-500 text-sm mb-4 text-center bg-red-50 rounded-lg px-3 py-2">{errors.general}</p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full">
            <div>
              <Input
                label="Nombres"
                type="text"
                placeholder="Juan"
                value={formData.names}
                error={errors.names}
                onChange={(value) => {
                  setFormData({ ...formData, names: value });
                  clearFieldError("names");
                }}
              />
            </div>
            <div>
              <Input
                label="Primer Apellido"
                type="text"
                placeholder="Perez"
                value={formData.firstSurname}
                error={errors.firstSurname}
                onChange={(value) => {
                  setFormData({ ...formData, firstSurname: value });
                  clearFieldError("firstSurname");
                }}
              />
            </div>
            <div>
              <Input
                label="Usuario"
                type="text"
                placeholder="juanito123"
                value={formData.username}
                error={errors.username}
                onChange={(value) => {
                  setFormData({ ...formData, username: value });
                  clearFieldError("username");
                }}
              />
            </div>
            <div>
              <Input
                label="Correo Electrónico"
                type="email"
                placeholder="juanito123@gmail.com"
                value={formData.email}
                error={errors.email}
                onChange={(value) => {
                  setFormData({ ...formData, email: value });
                  clearFieldError("email");
                }}
              />
            </div>
            <div>
              <Input
                label="Contraseña"
                type="password"
                placeholder="********"
                value={formData.password}
                error={errors.password}
                onChange={(value) => {
                  setFormData({ ...formData, password: value });
                  clearFieldError("password");
                }}
              />
            </div>

            <div className="mt-2">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Registrando..." : "Registrarme"}
              </Button>
            </div>
          </form>

          <p className="mt-5 text-center text-sm text-gray-600">
            ¿Ya tienes cuenta?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-butter-500 font-bold hover:underline cursor-pointer"
            >
              Inicia sesión
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;