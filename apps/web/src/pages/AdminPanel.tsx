import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Badge from "../components/Badge";
import Button from "../components/Button";
import Card from "../components/Card";
import Input from "../components/Input";
import Modal from "../components/Modal";
import Spinner from "../components/Spinner";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  getAdminGroups,
  getAdminStats,
  getAdminUsers,
  setUserRole,
  type AdminStats,
  type AdminUser,
} from "../api/admin";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../api/categories";
import type { Category, Group } from "../types";

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="text-center">
      <div className="text-4xl font-bold text-butter-500">{value}</div>
      <div className="text-sm text-gray-600 mt-1">{label}</div>
    </Card>
  );
}

function AdminPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [categoryBusy, setCategoryBusy] = useState(false);

  useEffect(() => {
    if (user?.role !== "admin") {
      navigate("/dashboard");
      return;
    }

    Promise.all([
      getAdminStats(),
      getCategories(),
      getAdminUsers(),
      getAdminGroups(),
    ])
      .then(([s, c, u, g]) => {
        setStats(s);
        setCategories(c);
        setUsers(u);
        setGroups(g);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Error al cargar el panel de administración.");
      })
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const handleCreateCategory = async () => {
    if (categoryBusy || newCategoryName.trim() === "") return;
    setCategoryBusy(true);
    try {
      const result = await createCategory(newCategoryName.trim());
      setCategories((prev) => [...prev, result.category]);
      setNewCategoryName("");
      showToast(`Categoría "${result.category.name}" creada`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error al crear la categoría.");
    } finally {
      setCategoryBusy(false);
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory || categoryBusy || editName.trim() === "") return;
    setCategoryBusy(true);
    try {
      const result = await updateCategory(editingCategory._id, editName.trim());
      setCategories((prev) =>
        prev.map((c) => (c._id === result.category._id ? result.category : c))
      );
      setEditingCategory(null);
      showToast("Categoría actualizada");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error al actualizar la categoría.");
    } finally {
      setCategoryBusy(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory || categoryBusy) return;
    setCategoryBusy(true);
    try {
      await deleteCategory(deletingCategory._id);
      setCategories((prev) => prev.filter((c) => c._id !== deletingCategory._id));
      setDeletingCategory(null);
      showToast("Categoría eliminada");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error al eliminar la categoría.");
    } finally {
      setCategoryBusy(false);
    }
  };

  const handleToggleRole = async (target: AdminUser) => {
    const newRole = target.role === "admin" ? "user" : "admin";
    try {
      await setUserRole(target._id, newRole);
      setUsers((prev) =>
        prev.map((u) => (u._id === target._id ? { ...u, role: newRole } : u))
      );
      showToast(`${target.username} ahora es ${newRole === "admin" ? "admin" : "usuario"}`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error al cambiar el rol.");
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto h-full flex items-center justify-center">
        <Spinner label="Cargando panel de administración..." />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto h-full flex flex-col overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-4xl font-bold text-butter-500 mb-2">Panel de Administración</h2>
        <p className="text-gray-600 text-lg">
          Controla categorías, usuarios y revisa la actividad de la plataforma.
        </p>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <h3 className="text-2xl font-bold text-gray-800 mb-3">Estadísticas</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatCard label="Usuarios" value={stats?.users ?? 0} />
        <StatCard label="Grupos" value={stats?.groups ?? 0} />
        <StatCard label="Restaurantes" value={stats?.restaurants ?? 0} />
        <StatCard label="Cuentas" value={stats?.sessions ?? 0} />
        <StatCard label="Pagos realizados" value={stats?.paidParticipants ?? 0} />
      </div>

      <h3 className="text-2xl font-bold text-gray-800 mb-3">Categorías</h3>
      <Card className="mb-8">
        <div className="flex gap-2 items-end mb-4">
          <div className="flex-1">
            <Input
              type="text"
              label="Nueva categoría"
              placeholder="Ej. Marisquería"
              value={newCategoryName}
              onChange={(value) => setNewCategoryName(value)}
            />
          </div>
          <Button onClick={handleCreateCategory} disabled={categoryBusy || newCategoryName.trim() === ""}>
            Crear
          </Button>
        </div>

        <ul className="flex flex-col gap-2">
          {categories.length === 0 && <p className="text-gray-500 text-sm">No hay categorías.</p>}
          {categories.map((category) => (
            <li key={category._id} className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
              <div>
                <span className="font-semibold text-gray-800">{category.name}</span>
                <span className="text-xs text-gray-400 ml-2">/{category.slug}</span>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setEditingCategory(category);
                    setEditName(category.name);
                  }}
                  className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-400"
                >
                  Editar
                </Button>
                <Button
                  onClick={() => setDeletingCategory(category)}
                  className="px-3 py-1 text-sm bg-red-500 hover:bg-red-400"
                >
                  Eliminar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <h3 className="text-2xl font-bold text-gray-800 mb-3">Usuarios</h3>
      <Card className="mb-8">
        <ul className="flex flex-col gap-2">
          {users.length === 0 && <p className="text-gray-500 text-sm">No hay usuarios.</p>}
          {users.map((usr) => (
            <li key={usr._id} className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
              <div>
                <div className="font-semibold text-gray-800">
                  {usr.names} {usr.firtsSurname}
                </div>
                <div className="text-sm text-gray-500">
                  @{usr.username} · {usr.email}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge color={usr.role === "admin" ? "green" : "gray"}>
                  {usr.role === "admin" ? "Admin" : "Usuario"}
                </Badge>
                <Button
                  onClick={() => handleToggleRole(usr)}
                  disabled={user?.id === usr._id}
                  className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-500"
                >
                  {usr.role === "admin" ? "Quitar admin" : "Hacer admin"}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <h3 className="text-2xl font-bold text-gray-800 mb-3">Grupos</h3>
      <Card>
        <ul className="flex flex-col gap-2">
          {groups.length === 0 && <p className="text-gray-500 text-sm">No hay grupos.</p>}
          {groups.map((grp) => (
            <li key={grp._id} className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2 last:border-b-0">
              <div>
                <div className="font-semibold text-gray-800">{grp.name}</div>
                <div className="text-sm text-gray-500">
                  /{grp.slug} · {Array.isArray(grp.members) ? grp.members.length : 0} miembros ·{" "}
                  {Array.isArray(grp.savedRestaurants) ? grp.savedRestaurants.length : 0} restaurantes
                </div>
              </div>
              <Link
                to={`/grupo/${grp.slug}`}
                className="text-butter-500 text-sm font-bold hover:underline"
              >
                Ver grupo →
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      {editingCategory && (
        <Modal title="Editar categoría" onClose={() => setEditingCategory(null)}>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Input
                type="text"
                label="Nombre"
                placeholder="Nombre de la categoría"
                value={editName}
                onChange={(value) => setEditName(value)}
              />
            </div>
            <Button onClick={handleEditCategory} disabled={categoryBusy || editName.trim() === ""}>
              Guardar
            </Button>
          </div>
        </Modal>
      )}

      {deletingCategory && (
        <Modal title="Eliminar categoría" onClose={() => setDeletingCategory(null)}>
          <p className="text-gray-600 mb-4">
            ¿Seguro que deseas eliminar la categoría{" "}
            <strong>{deletingCategory.name}</strong>? Los restaurantes que la usan quedarán sin categoría.
          </p>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setDeletingCategory(null)} className="bg-gray-500 hover:bg-gray-400">
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteCategory}
              disabled={categoryBusy}
              className="bg-red-500 hover:bg-red-400"
            >
              Eliminar
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default AdminPanel;