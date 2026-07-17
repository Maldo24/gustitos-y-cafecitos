import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";
import Input from "../components/Input";

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [newGroupName, setNewGroupName] = useState("");
  const [groupSlug, setGroupSlug] = useState("");

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Creando grupo:", newGroupName);
  };

  const handleJoinGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (groupSlug.trim() !== "") {
      navigate(`/grupo/${groupSlug}`);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto h-full flex flex-col">
      <div className="mb-10">
        <h2 className="text-4xl font-bold text-butter-500 mb-2">Mis Grupos</h2>
        <p className="text-gray-600 text-lg">
          ¿Qué planeamos hoy, {user?.names}? Crea un grupo nuevo o únete a uno existente.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        <div className="bg-white p-8 rounded-xl shadow-md border border-butter-200 flex flex-col">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Crear un Grupo</h3>
          <p className="text-gray-600 mb-6 flex-1">
            Inicia una nueva salida con tus amigos. Podrán sugerir restaurantes y dividir la cuenta fácilmente.
          </p>
          <form onSubmit={handleCreateGroup} className="flex flex-col gap-4">
            <Input 
              type="text"
              label="Nombre del grupo"
              placeholder="Ej. Salida de Viernes"
              value={newGroupName}
              onChange={(value) => setNewGroupName(value)} 
            />
            
            <Button type="submit">Crear Nuevo Grupo</Button>
          </form>
        </div>
        <div className="bg-white p-8 rounded-xl shadow-md border border-butter-200 flex flex-col">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Unirse con Código</h3>
          <p className="text-gray-600 mb-6 flex-1">
            ¿Tus amigos ya crearon el grupo? Pídeles el código secreto (slug) e ingrésalo aquí para unirte.
          </p>
          <form onSubmit={handleJoinGroup} className="flex flex-col gap-4">
            <Input
                type="text"
                label="Codigo de invitacion"
                value={groupSlug}
                placeholder="Ej. salida-viernes-lorem"
                onChange={(value) => setGroupSlug(value)}
            />
            <Button type="submit">Ir al Grupo</Button>
          </form>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;