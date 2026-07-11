import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { register } from "../api/auth";
import Input from "../components/Input";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    names: "",
    firstSurname: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      // Llamada real al backend
      await register(formData);
      alert("¡Usuario registrado correctamente!");
      navigate("/login");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Ocurrió un error inesperado al registrarse.");
      }
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

      <div className="w-full md:w-1/2 flex flex-col items-center justify-center p-4 h-full">
          <h2 className="text-4xl font-bold mb-4 text-center">
            Crear Cuenta
          </h2>

          {error && (
            <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <Input
                label="Nombres"
                type="text"
                placeholder="Juan"
                value={formData.names}
                onChange={(value) =>
                  setFormData({ ...formData, names: value })
                }
              />
            </div>
            <div>
              <Input
                label="Primer Apellido"
                type="text"
                placeholder="Perez"
                value={formData.firstSurname}
                onChange={(value) =>
                  setFormData({ ...formData, firstSurname: value })
                }
              />
            </div>
            <div>
              <Input
                label="Usuario"
                type="text"
                placeholder="juanito123"
                value={formData.username}
                onChange={(value) =>
                  setFormData({ ...formData, username: value })
                }
              />
            </div>
            <div>
              <Input
                label="Correo Electrónico"
                type="email"
                placeholder="juanito123@gmail.com"
                value={formData.email}
                onChange={(value) => setFormData({ ...formData, email: value })}
              />
            </div>
            <div>
              <Input
                label="Contraseña"
                type="password"
                placeholder="********"
                value={formData.password}
                onChange={(value) =>
                  setFormData({ ...formData, password: value })
                }
              />
            </div>

            <div className="mt-2">
              <Button type="submit" className="w-full">
                Registrarme
              </Button>
            </div>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
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
  );
}

export default Register;
