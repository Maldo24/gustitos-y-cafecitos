import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/Button";
import Input from "../components/Input";
import { createGroup, getGroupBySlug, getMyGroups } from "../api/groups";
import type { Group } from "../types";

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [newGroupName, setNewGroupName] = useState("");
  const [groupSlug, setGroupSlug] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [formError, setFormError] = useState("");

  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    getMyGroups()
      .then((data) => setGroups(data))
      .catch((err: unknown) => {
        setLoadError(err instanceof Error ? err.message : "Error al cargar tus grupos.");
      })
      .finally(() => setLoadingGroups(false));
  }, []);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (creating) return;
    setCreating(true);

    try {
      const response = await createGroup(newGroupName);
      setGroups((prev) => [response.group, ...prev]);
      navigate(`/grupo/${response.group.slug}`);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Error al crear el grupo.");
    } finally {
      setCreating(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (joining || groupSlug.trim() === "") return;
    setJoining(true);

    try {
      const group = await getGroupBySlug(groupSlug.trim());
      navigate(`/grupo/${group.slug}`);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "El grupo no existe o ocurrió un error.");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto h-full flex flex-col overflow-y-auto">
      <div className="mb-10">
        <h2 className="text-4xl font-bold text-butter-500 mb-2">Mis Grupos</h2>
        <p className="text-gray-600 text-lg">
          ¿Qué planeamos hoy, {user?.names}? Crea un grupo nuevo o únete a uno existente.
        </p>
      </div>

      {formError && <p className="text-red-500 text-sm mb-4">{formError}</p>}

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
            <Button type="submit" disabled={creating}>
              {creating ? "Creando..." : "Crear Nuevo Grupo"}
            </Button>
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
            <Button type="submit" disabled={joining}>
              {joining ? "Buscando..." : "Ir al Grupo"}
            </Button>
          </form>
        </div>
      </div>

      <div className="mt-10">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Tus grupos existentes</h3>
        {loadingGroups ? (
          <p className="text-gray-500">Cargando grupos...</p>
        ) : loadError ? (
          <p className="text-red-500 text-sm">{loadError}</p>
        ) : groups.length === 0 ? (
          <p className="text-gray-500">Todavía no tienes grupos. Crea uno para empezar.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {groups.map((group) => (
              <li key={group._id}>
                <Link
                  to={`/grupo/${group.slug}`}
                  className="block bg-white p-4 rounded-xl shadow-md border border-butter-200 hover:shadow-lg transition-shadow"
                >
                  <div className="font-bold text-gray-800 text-lg">{group.name}</div>
                  <div className="text-sm text-gray-500">
                    {Array.isArray(group.members)
                      ? `${group.members.length} ${group.members.length === 1 ? "miembro" : "miembros"}`
                      : "Grupo"}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Dashboard;