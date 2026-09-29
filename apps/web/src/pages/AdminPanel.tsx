import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Badge from "../components/Badge";
import Button from "../components/Button";
import Card from "../components/Card";
import ConfirmModal from "../components/ConfirmModal";
import Input from "../components/Input";
import Modal from "../components/Modal";
import Spinner from "../components/Spinner";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../api/categories";
import {
  deleteGroup,
  getAdminAppeals,
  getAdminGroups,
  getAdminPasswordRequests,
  getAdminStats,
  getAdminUsers,
  resolveAppeal,
  restoreGroup,
  reviewPasswordRequest,
  setUserBlocked,
  type AdminPasswordRequest,
  type AdminStats,
  type AdminUser,
} from "../api/admin";
import type { Appeal, Category, Group } from "../types";

type Tab = "resumen" | "usuarios" | "grupos" | "appeals" | "passwords" | "categorias";

const TABS: { id: Tab; label: string }[] = [
  { id: "resumen", label: "Resumen" },
  { id: "usuarios", label: "Usuarios" },
  { id: "grupos", label: "Grupos" },
  { id: "appeals", label: "Apelaciones" },
  { id: "passwords", label: "Contraseñas" },
  { id: "categorias", label: "Categorías" },
];

const MIN_REASON = 15;

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

  const [tab, setTab] = useState<Tab>("resumen");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);
  const [passwordRequests, setPasswordRequests] = useState<AdminPasswordRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [categoryBusy, setCategoryBusy] = useState(false);

  // Acciones sensibles: siempre pasan por un modal con justificación
  const [deletingGroup, setDeletingGroup] = useState<Group | null>(null);
  const [groupReason, setGroupReason] = useState("");
  const [groupReasonError, setGroupReasonError] = useState("");

  const [blockingUser, setBlockingUser] = useState<AdminUser | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [blockReasonError, setBlockReasonError] = useState("");

  const [reviewingRequest, setReviewingRequest] = useState<{
    request: AdminPasswordRequest;
    action: "approve" | "reject";
  } | null>(null);
  const [reviewBusy, setReviewBusy] = useState(false);

  const [resolvingAppeal, setResolvingAppeal] = useState<{
    appeal: Appeal;
    action: "approve" | "reject";
  } | null>(null);
  const [appealNote, setAppealNote] = useState("");
  const [actionBusy, setActionBusy] = useState(false);

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
      getAdminAppeals(),
      getAdminPasswordRequests(),
    ])
      .then(([s, c, u, g, a, p]) => {
        setStats(s);
        setCategories(c);
        setUsers(u);
        setGroups(g);
        setAppeals(a);
        setPasswordRequests(p);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Error al cargar el panel de administración.");
      })
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const pendingAppeals = appeals.filter((a) => a.status === "pending");
  const pendingRequests = passwordRequests.filter((r) => r.status === "pending");

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

  const handleDeleteGroup = async () => {
    if (!deletingGroup) return;

    if (groupReason.trim().length < MIN_REASON) {
      setGroupReasonError(`La justificación debe tener al menos ${MIN_REASON} caracteres.`);
      return;
    }

    setActionBusy(true);
    try {
      const result = await deleteGroup(deletingGroup._id, groupReason.trim());
      setGroups((prev) =>
        prev.map((g) =>
          g._id === deletingGroup._id
            ? {
                ...g,
                status: "deleted",
                deletionReason: groupReason.trim(),
                deletedAt: new Date().toISOString(),
              }
            : g
        )
      );
      setDeletingGroup(null);
      setGroupReason("");
      setGroupReasonError("");
      showToast(result.message);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error al eliminar el grupo.");
    } finally {
      setActionBusy(false);
    }
  };

  const handleRestoreGroup = async (group: Group) => {
    try {
      const result = await restoreGroup(group._id);
      setGroups((prev) =>
        prev.map((g) => (g._id === group._id ? { ...g, status: "active", deletionReason: null } : g))
      );
      showToast(result.message);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error al restaurar el grupo.");
    }
  };

  const handleBlockUser = async () => {
    if (!blockingUser) return;

    if (blockReason.trim().length < MIN_REASON) {
      setBlockReasonError(`La justificación debe tener al menos ${MIN_REASON} caracteres.`);
      return;
    }

    setActionBusy(true);
    try {
      const result = await setUserBlocked(blockingUser._id, true, blockReason.trim());
      setUsers((prev) =>
        prev.map((u) =>
          u._id === blockingUser._id
            ? { ...u, blocked: true, blockReason: blockReason.trim() }
            : u
        )
      );
      setBlockingUser(null);
      setBlockReason("");
      setBlockReasonError("");
      showToast(result.message);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error al bloquear al usuario.");
    } finally {
      setActionBusy(false);
    }
  };

  const handleUnblockUser = async (target: AdminUser) => {
    try {
      const result = await setUserBlocked(target._id, false);
      setUsers((prev) =>
        prev.map((u) => (u._id === target._id ? { ...u, blocked: false, blockReason: null } : u))
      );
      showToast(result.message);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error al desbloquear al usuario.");
    }
  };

  const handleReviewRequest = async () => {
    if (!reviewingRequest || reviewBusy) return;
    setReviewBusy(true);
    try {
      const { request, action } = reviewingRequest;
      const result = await reviewPasswordRequest(request._id, action);
      setPasswordRequests((prev) =>
        prev.map((r) =>
          r._id === request._id
            ? { ...r, status: action === "approve" ? "approved" : "rejected" }
            : r
        )
      );
      setReviewingRequest(null);
      showToast(result.message);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error al revisar la solicitud.");
    } finally {
      setReviewBusy(false);
    }
  };

  const handleResolveAppeal = async () => {
    if (!resolvingAppeal) return;
    setActionBusy(true);
    try {
      const { appeal, action } = resolvingAppeal;
      const result = await resolveAppeal(
        appeal._id,
        action,
        appealNote.trim() || undefined
      );
      setAppeals((prev) =>
        prev.map((a) => (a._id === appeal._id ? { ...a, status: action === "approve" ? "approved" : "rejected" } : a))
      );

      // Si se restauró un grupo, actualizamos la lista local
      if (action === "approve" && appeal.targetType === "group") {
        setGroups((prev) =>
          prev.map((g) =>
            g._id === appeal.targetId
              ? { ...g, status: "active", deletionReason: null, deletedAt: null }
              : g
          )
        );
      }

      setResolvingAppeal(null);
      setAppealNote("");
      showToast(result.message);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Error al resolver la apelación.");
    } finally {
      setActionBusy(false);
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
      <div className="mb-6">
        <h2 className="text-4xl font-bold text-butter-500 mb-2">Panel de Administración</h2>
        <p className="text-gray-600">
          Controla categorías, usuarios, grupos y revisa solicitudes y apelaciones.
        </p>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      {/* Pestañas */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-butter-200 pb-3">
        {TABS.map((item) => {
          const badge =
            item.id === "appeals" && pendingAppeals.length > 0
              ? pendingAppeals.length
              : item.id === "passwords" && pendingRequests.length > 0
                ? pendingRequests.length
                : null;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 ${
                tab === item.id
                  ? "bg-butter-500 text-white"
                  : "bg-white text-gray-700 hover:bg-butter-100 border border-butter-200"
              }`}
            >
              {item.label}
              {badge !== null && (
                <span className="bg-red-500 text-white text-[11px] font-extrabold rounded-full px-1.5 min-w-[18px] text-center">
                  {badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab === "resumen" && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Usuarios" value={stats?.users ?? 0} />
          <StatCard label="Grupos" value={stats?.groups ?? 0} />
          <StatCard label="Restaurantes" value={stats?.restaurants ?? 0} />
          <StatCard label="Cuentas" value={stats?.sessions ?? 0} />
          <StatCard label="Pagos realizados" value={stats?.paidParticipants ?? 0} />
        </div>
      )}

      {tab === "usuarios" && (
        <Card>
          <ul className="flex flex-col gap-3">
            {users.length === 0 && <p className="text-gray-500 text-sm">No hay usuarios.</p>}
            {users.map((usr) => (
              <li
                key={usr._id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3 last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-gray-800">
                    {usr.names} {usr.firstSurname}
                  </div>
                  <div className="text-sm text-gray-500 break-all">
                    @{usr.username} · {usr.email}
                  </div>
                  {usr.blocked && usr.blockReason && (
                    <div className="text-xs text-red-600 mt-1">
                      Bloqueado: {usr.blockReason}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge color={usr.blocked ? "red" : usr.role === "admin" ? "green" : "gray"}>
                    {usr.blocked ? "Bloqueado" : usr.role === "admin" ? "Admin" : "Usuario"}
                  </Badge>
                  <Button
                    onClick={() => handleToggleRole(usr)}
                    disabled={user?.id === usr._id}
                    className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-500"
                  >
                    {usr.role === "admin" ? "Quitar admin" : "Hacer admin"}
                  </Button>
                  {usr.blocked ? (
                    <Button
                      variant="light"
                      className="px-3 py-1 text-sm"
                      onClick={() => void handleUnblockUser(usr)}
                    >
                      Desbloquear
                    </Button>
                  ) : (
                    <Button
                      variant="danger"
                      className="px-3 py-1 text-sm"
                      disabled={user?.id === usr._id || usr.role === "admin"}
                      onClick={() => {
                        setBlockReason("");
                        setBlockReasonError("");
                        setBlockingUser(usr);
                      }}
                    >
                      Bloquear
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {tab === "grupos" && (
        <Card>
          <ul className="flex flex-col gap-3">
            {groups.length === 0 && <p className="text-gray-500 text-sm">No hay grupos.</p>}
            {groups.map((grp) => (
              <li
                key={grp._id}
                className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-3 last:border-b-0"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-gray-800 break-words">
                    {grp.name}
                    {grp.status === "deleted" && (
                      <Badge color="red">Eliminado</Badge>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 font-mono break-all">/{grp.slug}</div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge color="butter">
                      Integrantes:{" "}
                      {grp.membersCount ?? (Array.isArray(grp.members) ? grp.members.length : 0)}
                    </Badge>
                    <Badge color="butter">
                      Restaurantes:{" "}
                      {grp.restaurantsCount ??
                        (Array.isArray(grp.savedRestaurants) ? grp.savedRestaurants.length : 0)}
                    </Badge>
                  </div>
                  {grp.status === "deleted" && grp.deletionReason && (
                    <p className="text-xs text-red-600 mt-2 break-words">
                      Motivo: {grp.deletionReason}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Link
                    to={`/grupo/${grp.slug}`}
                    className="text-butter-500 text-sm font-bold hover:underline"
                  >
                    Ver grupo →
                  </Link>
                  {grp.status === "deleted" ? (
                    <Button className="px-3 py-1 text-sm" onClick={() => void handleRestoreGroup(grp)}>
                      Restaurar
                    </Button>
                  ) : (
                    <Button
                      variant="danger"
                      className="px-3 py-1 text-sm"
                      onClick={() => {
                        setGroupReason("");
                        setGroupReasonError("");
                        setDeletingGroup(grp);
                      }}
                    >
                      Eliminar
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {tab === "appeals" && (
        <Card>
          {appeals.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay apelaciones registradas.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {appeals.map((appeal) => {
                const isGroup = appeal.targetType === "group";
                return (
                  <li
                    key={appeal._id}
                    className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-3 last:border-b-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-gray-800 break-words">
                        {isGroup ? "Grupo" : "Cuenta bloqueada"}: {appeal.targetLabel}
                      </div>
                      <p className="text-sm text-gray-600 mt-1 break-words">{appeal.reason}</p>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(appeal.createdAt).toLocaleString("es")}
                      </div>
                      {appeal.resolutionNote && (
                        <p className="text-xs text-gray-500 mt-1 break-words">
                          Respuesta: {appeal.resolutionNote}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <Badge
                        color={
                          appeal.status === "pending"
                            ? "butter"
                            : appeal.status === "approved"
                              ? "green"
                              : "red"
                        }
                      >
                        {appeal.status === "pending"
                          ? "Pendiente"
                          : appeal.status === "approved"
                            ? "Aprobada"
                            : "Rechazada"}
                      </Badge>
                      {appeal.status === "pending" && (
                        <>
                          <Button
                            className="px-3 py-1 text-sm"
                            onClick={() => {
                              setAppealNote("");
                              setResolvingAppeal({ appeal, action: "approve" });
                            }}
                          >
                            {isGroup ? "Restaurar" : "Desbloquear"}
                          </Button>
                          <Button
                            variant="danger"
                            className="px-3 py-1 text-sm"
                            onClick={() => {
                              setAppealNote("");
                              setResolvingAppeal({ appeal, action: "reject" });
                            }}
                          >
                            Rechazar
                          </Button>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      )}

      {tab === "passwords" && (
        <Card>
          {passwordRequests.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay solicitudes registradas.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {passwordRequests.map((req) => (
                <li
                  key={req._id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3 last:border-b-0"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-gray-800">@{req.username}</div>
                    <div className="text-sm text-gray-500 break-all">{req.email}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(req.createdAt).toLocaleString("es")}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      color={
                        req.status === "pending"
                          ? "butter"
                          : req.status === "approved"
                            ? "green"
                            : req.status === "rejected"
                              ? "red"
                              : "gray"
                      }
                    >
                      {req.status === "pending"
                        ? "Pendiente"
                        : req.status === "approved"
                          ? "Aprobada"
                          : req.status === "rejected"
                            ? "Rechazada"
                            : "Completada"}
                    </Badge>
                    {req.status === "pending" && (
                      <>
                        <Button
                          className="px-3 py-1 text-sm"
                          onClick={() => setReviewingRequest({ request: req, action: "approve" })}
                        >
                          Aprobar
                        </Button>
                        <Button
                          variant="danger"
                          className="px-3 py-1 text-sm"
                          onClick={() => setReviewingRequest({ request: req, action: "reject" })}
                        >
                          Rechazar
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {tab === "categorias" && (
        <Card>
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
            <Button
              onClick={handleCreateCategory}
              disabled={categoryBusy || newCategoryName.trim() === ""}
            >
              Crear
            </Button>
          </div>

          <ul className="flex flex-col gap-2">
            {categories.length === 0 && <p className="text-gray-500 text-sm">No hay categorías.</p>}
            {categories.map((category) => (
              <li
                key={category._id}
                className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2"
              >
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
                    variant="danger"
                    className="px-3 py-1 text-sm"
                    onClick={() => setDeletingCategory(category)}
                  >
                    Eliminar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Eliminar grupo: justificación obligatoria */}
      {deletingGroup && (
        <Modal title="Eliminar grupo" onClose={() => setDeletingGroup(null)}>
          <p className="text-gray-600 mb-4">
            Vas a eliminar <strong>{deletingGroup.name}</strong>. El grupo dejará de estar visible, sus
            miembros reciben un aviso y <strong>pueden apelar</strong> la decisión. No se borra de forma
            definitiva, así que puedes restaurarlo después.
          </p>
          <div className="flex flex-col gap-3">
            <Input
              type="text"
              label="Justificación (obligatoria)"
              placeholder="Explica por qué se elimina este grupo..."
              value={groupReason}
              onChange={(value) => {
                setGroupReason(value);
                setGroupReasonError("");
              }}
            />
            <p className="text-xs text-gray-500">
              Mínimo {MIN_REASON} caracteres. Esta justificación queda registrada.
            </p>
            {groupReasonError && <p className="text-red-500 text-sm">{groupReasonError}</p>}
            <div className="flex gap-2 justify-end">
              <Button onClick={() => setDeletingGroup(null)} disabled={actionBusy}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={handleDeleteGroup} disabled={actionBusy}>
                {actionBusy ? "Eliminando..." : "Eliminar grupo"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Bloquear usuario: justificación obligatoria */}
      {blockingUser && (
        <Modal title="Bloquear usuario" onClose={() => setBlockingUser(null)}>
          <p className="text-gray-600 mb-4">
            Vas a bloquear la cuenta de <strong>@{blockingUser.username}</strong>. No podrá iniciar
            sesión, pero <strong>la cuenta no se elimina</strong>: puede apelar y la desbloqueas cuando
            quieras.
          </p>
          <div className="flex flex-col gap-3">
            <Input
              type="text"
              label="Justificación (obligatoria)"
              placeholder="Explica por qué se bloquea esta cuenta..."
              value={blockReason}
              onChange={(value) => {
                setBlockReason(value);
                setBlockReasonError("");
              }}
            />
            <p className="text-xs text-gray-500">
              Mínimo {MIN_REASON} caracteres. El usuario verá este motivo al intentar entrar.
            </p>
            {blockReasonError && <p className="text-red-500 text-sm">{blockReasonError}</p>}
            <div className="flex gap-2 justify-end">
              <Button onClick={() => setBlockingUser(null)} disabled={actionBusy}>
                Cancelar
              </Button>
              <Button variant="danger" onClick={handleBlockUser} disabled={actionBusy}>
                {actionBusy ? "Bloqueando..." : "Bloquear cuenta"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {reviewingRequest && (
        <ConfirmModal
          title={reviewingRequest.action === "approve" ? "Aprobar solicitud" : "Rechazar solicitud"}
          message={
            reviewingRequest.action === "approve"
              ? `Se le entrega a @${reviewingRequest.request.username} un código válido por 30 minutos para que defina su nueva contraseña. ¿Continuar?`
              : `@${reviewingRequest.request.username} no podrá cambiar su contraseña con esta solicitud. ¿Rechazar?`
          }
          confirmLabel={reviewingRequest.action === "approve" ? "Aprobar" : "Rechazar"}
          loading={reviewBusy}
          onCancel={() => setReviewingRequest(null)}
          onConfirm={handleReviewRequest}
        />
      )}

      {/* Resolver apelación */}
      {resolvingAppeal && (
        <Modal
          title={resolvingAppeal.action === "approve" ? "Aprobar apelación" : "Rechazar apelación"}
          onClose={() => setResolvingAppeal(null)}
        >
          <p className="text-gray-600 mb-4">
            {resolvingAppeal.appeal.targetType === "group" ? "Grupo" : "Cuenta"}:{" "}
            <strong>{resolvingAppeal.appeal.targetLabel}</strong>
          </p>
          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 mb-4 break-words">
            “{resolvingAppeal.appeal.reason}”
          </p>
          <p className="text-sm text-gray-600 mb-3">
            {resolvingAppeal.action === "approve"
              ? resolvingAppeal.appeal.targetType === "group"
                ? "El grupo volverá a estar activo y sus miembros recibirán un aviso."
                : "La cuenta se desbloqueará y podrá volver a entrar."
              : "El recurso se queda como está. Explica el motivo (opcional pero recomendable)."}
          </p>
          <div className="flex flex-col gap-3">
            <Input
              type="text"
              label="Respuesta para el usuario (opcional)"
              placeholder="Cuéntale qué decidiste y por qué..."
              value={appealNote}
              onChange={setAppealNote}
            />
            <div className="flex gap-2 justify-end">
              <Button onClick={() => setResolvingAppeal(null)} disabled={actionBusy}>
                Cancelar
              </Button>
              <Button
                variant={resolvingAppeal.action === "approve" ? "primary" : "danger"}
                onClick={handleResolveAppeal}
                disabled={actionBusy}
              >
                {actionBusy
                  ? "Procesando..."
                  : resolvingAppeal.action === "approve"
                    ? "Aprobar"
                    : "Rechazar"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

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
            <strong>{deletingCategory.name}</strong>? Los restaurantes que la usan quedarán sin
            categoría.
          </p>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setDeletingCategory(null)} className="bg-gray-500 hover:bg-gray-400">
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteCategory}
              variant="danger"
              disabled={categoryBusy}
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
