import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Button from "../components/Button";
import Input from "../components/Input";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import Select from "../components/Select";
import Badge from "../components/Badge";
import Spinner from "../components/Spinner";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getGroupBySlug, getGroupMembers, addMember, joinGroup, leaveGroup, removeMember, removeRestaurantFromGroup } from "../api/groups";
import { createAppeal, getMyAppeals } from "../api/appeals";
import { getCategories, createCategory } from "../api/categories";
import { getSessionsByGroup } from "../api/sessions";
import {
  createRestaurant,
  getRestaurantsByGroup,
  addReview,
  toggleVote,
  type CreateRestaurantPayload,
} from "../api/restaurants";
import type { Appeal, Category, Group, Restaurant, Session, User } from "../types";
import { isGoogleMapsLink } from "../utils/validation";

function getCategoryName(category: string | Category): string {
  return typeof category === "string" ? category : category.name;
}

function getCategoryId(category: string | Category): string {
  return typeof category === "string" ? category : category._id;
}

function GroupDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);

  const [friendUsername, setFriendUsername] = useState("");
  const [adding, setAdding] = useState(false);
  const [joining, setJoining] = useState(false);
  const [memberError, setMemberError] = useState("");
  const [copied, setCopied] = useState(false);

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [restaurantsError, setRestaurantsError] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);

  const [restName, setRestName] = useState("");
  const [restMapsLink, setRestMapsLink] = useState("");
  const [restCategoryId, setRestCategoryId] = useState("");
  const [restComment, setRestComment] = useState("");
  const [restError, setRestError] = useState("");
  const [suggesting, setSuggesting] = useState(false);

  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryCreating, setCategoryCreating] = useState(false);
  const [categoryError, setCategoryError] = useState("");

  const [categoryFilter, setCategoryFilter] = useState("");
  const [section, setSection] = useState<"usuarios" | "restaurantes" | "cuentas">("usuarios");
  const [similarModal, setSimilarModal] = useState<{ message: string } | null>(null);
  const [pendingPayload, setPendingPayload] = useState<CreateRestaurantPayload | null>(null);

  const [reviewOpenId, setReviewOpenId] = useState<string | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState("");

  const [confirmRemoveMember, setConfirmRemoveMember] = useState<User | null>(null);
  const [confirmRemoveRestaurant, setConfirmRemoveRestaurant] = useState<Restaurant | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [adminActionLoading, setAdminActionLoading] = useState(false);

  const [appealOpen, setAppealOpen] = useState(false);
  const [appealReason, setAppealReason] = useState("");
  const [appealError, setAppealError] = useState("");
  const [appealBusy, setAppealBusy] = useState(false);
  const [myAppeals, setMyAppeals] = useState<Appeal[]>([]);

  useEffect(() => {
    if (!slug) return;

    getGroupBySlug(slug)
      .then((data) => {
        setGroup(data);
        return         Promise.all([
          getGroupMembers(data._id),
          getRestaurantsByGroup(data._id),
          getCategories(),
          getSessionsByGroup(data._id),
        ]).then(([membersData, restaurantsData, categoriesData, sessionsData]) => {
          setMembers(membersData);
          setRestaurants(restaurantsData);
          setCategories(categoriesData);
          setSessions(sessionsData);

          // Si el grupo está eliminado cargamos mis apelaciones para mostrar el estado
          if (data.status === "deleted") {
            getMyAppeals().then(setMyAppeals).catch(() => undefined);
          }
        });
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Error al cargar el grupo.");
      })
      .finally(() => setLoading(false));
  }, [slug, user]);

  const isMember = !!(user && members.some((m) => m._id === user.id));

  const handleJoinGroup = async () => {
    if (!group || joining) return;
    setJoining(true);
    setMemberError("");
    try {
      await joinGroup(group._id);
      setMembers(await getGroupMembers(group._id));
    } catch (err: unknown) {
      setMemberError(err instanceof Error ? err.message : "No se pudo unir al grupo.");
    } finally {
      setJoining(false);
    }
  };

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberError("");
    if (adding || !group || friendUsername.trim() === "") return;
    setAdding(true);

    try {
      await addMember(group._id, friendUsername.trim());
      setFriendUsername("");
      const updatedMembers = await getGroupMembers(group._id);
      setMembers(updatedMembers);
    } catch (err: unknown) {
      setMemberError(err instanceof Error ? err.message : "Error al agregar al amigo.");
    } finally {
      setAdding(false);
    }
  };

  const handleCopyLink = async () => {
    if (!group) return;
    const link = `${window.location.origin}${import.meta.env.BASE_URL}grupo/${group.slug}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setMemberError("No se pudo copiar el link.");
    }
  };

  const handleSuggestRestaurant = async (e: React.FormEvent) => {
    e.preventDefault();
    setRestError("");
    if (suggesting || !group) return;

    if (!restName.trim() || !restMapsLink.trim() || !restCategoryId || !restComment.trim()) {
      setRestError("Todos los campos son obligatorios (incluyendo tu comentario inicial).");
      return;
    }

    if (!isGoogleMapsLink(restMapsLink.trim())) {
      setRestError("El link debe ser de Google Maps (ej: https://maps.app.goo.gl/... o https://www.google.com/maps/...).");
      return;
    }

    setSuggesting(true);

    const payload: CreateRestaurantPayload = {
      groupId: group._id,
      name: restName.trim(),
      mapsLink: restMapsLink.trim(),
      categoryId: restCategoryId,
      comment: restComment.trim(),
    };

    try {
      const result = await createRestaurant(payload);

      if (result.status === "WARNING_SIMILAR") {
        setSimilarModal({ message: result.message || "Hay lugares con nombres similares." });
        setPendingPayload(payload);
        return;
      }

      setRestName("");
      setRestMapsLink("");
      setRestCategoryId("");
      setRestComment("");
      const updated = await getRestaurantsByGroup(group._id);
      setRestaurants(updated);
    } catch (err: unknown) {
      setRestError(err instanceof Error ? err.message : "Error al sugerir el restaurante.");
    } finally {
      setSuggesting(false);
    }
  };

  const handleForceCreate = async () => {
    if (!pendingPayload || !group) return;
    setSimilarModal(null);
    setRestError("");
    setSuggesting(true);

    try {
      const result = await createRestaurant({ ...pendingPayload, forceCreate: true });

      if (result.status === "WARNING_SIMILAR") {
        setRestError("No se pudo crear el restaurante.");
        return;
      }

      setRestName("");
      setRestMapsLink("");
      setRestCategoryId("");
      setRestComment("");
      const updated = await getRestaurantsByGroup(group._id);
      setRestaurants(updated);
    } catch (err: unknown) {
      setRestError(err instanceof Error ? err.message : "Error al crear el restaurante.");
    } finally {
      setSuggesting(false);
      setPendingPayload(null);
    }
  };

  const handleCreateCategory = async () => {
    setCategoryError("");
    if (categoryCreating || newCategoryName.trim() === "") return;
    setCategoryCreating(true);

    try {
      const result = await createCategory(newCategoryName.trim());
      setCategories((prev) => [...prev, result.category]);
      setRestCategoryId(result.category._id);
      setNewCategoryName("");
      setShowNewCategory(false);
    } catch (err: unknown) {
      setCategoryError(err instanceof Error ? err.message : "Error al crear la categoría.");
    } finally {
      setCategoryCreating(false);
    }
  };

  const handleVote = async (restaurantId: string) => {
    if (!group) return;
    try {
      await toggleVote(restaurantId);
      const updated = await getRestaurantsByGroup(group._id);
      setRestaurants(updated);
    } catch (err: unknown) {
      setRestaurantsError(err instanceof Error ? err.message : "Error al votar.");
    }
  };

  const handleAddReview = async (restaurantId: string) => {
    if (!restaurantId || !reviewComment.trim()) return;
    setReviewError("");
    try {
      await addReview(restaurantId, reviewComment.trim());
      setReviewComment("");
      setReviewOpenId(null);
      if (group) {
        const updated = await getRestaurantsByGroup(group._id);
        setRestaurants(updated);
      }
    } catch (err: unknown) {
      setReviewError(err instanceof Error ? err.message : "Error al agregar la reseña.");
    }
  };

  const handleKickMember = async () => {
    if (!group || !confirmRemoveMember) return;
    setAdminActionLoading(true);
    try {
      await removeMember(group._id, confirmRemoveMember._id);
      const updated = await getGroupMembers(group._id);
      setMembers(updated);
      setConfirmRemoveMember(null);
    } catch (err: unknown) {
      setMemberError(err instanceof Error ? err.message : "Error al expulsar al miembro.");
      setConfirmRemoveMember(null);
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleRemoveRestaurant = async () => {
    if (!group || !confirmRemoveRestaurant) return;
    setAdminActionLoading(true);
    try {
      await removeRestaurantFromGroup(group._id, confirmRemoveRestaurant._id);
      const updated = await getRestaurantsByGroup(group._id);
      setRestaurants(updated);
      setConfirmRemoveRestaurant(null);
    } catch (err: unknown) {
      setRestaurantsError(err instanceof Error ? err.message : "Error al eliminar la recomendación.");
      setConfirmRemoveRestaurant(null);
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!group || adminActionLoading) return;
    setAdminActionLoading(true);
    try {
      await leaveGroup(group._id);
      showToast("Saliste del grupo.");
      navigate("/dashboard");
    } catch (err: unknown) {
      setMemberError(err instanceof Error ? err.message : "No se pudo salir del grupo.");
      setConfirmLeave(false);
    } finally {
      setAdminActionLoading(false);
    }
  };

  const handleSubmitAppeal = async () => {
    setAppealError("");
    if (!group) return;

    if (appealReason.trim().length < 15) {
      setAppealError("Escribe al menos 15 caracteres explicando por qué debería restaurarse.");
      return;
    }

    setAppealBusy(true);
    try {
      await createAppeal({
        targetType: "group",
        targetId: group._id,
        reason: appealReason.trim(),
      });
      showToast("Tu apelación fue enviada.");
      setAppealOpen(false);
      setAppealReason("");
      setMyAppeals(await getMyAppeals());
    } catch (err: unknown) {
      setAppealError(err instanceof Error ? err.message : "No se pudo enviar la apelación.");
    } finally {
      setAppealBusy(false);
    }
  };

  const filteredRestaurants = categoryFilter
    ? restaurants.filter((r) => getCategoryId(r.categoryId) === categoryFilter)
    : restaurants;

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto h-full flex items-center justify-center">
        <Spinner label="Cargando grupo..." />
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="p-6 max-w-4xl mx-auto h-full">
        <p className="text-red-500 text-sm">{error || "El grupo no fue encontrado."}</p>
      </div>
    );
  }

  const isAdmin = group.adminId === user?.id;

  const SECTIONS = [
    { id: "usuarios" as const, label: "Usuarios", count: members.length },
    { id: "restaurantes" as const, label: "Restaurantes", count: restaurants.length },
    { id: "cuentas" as const, label: "Cuentas", count: sessions.length },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto h-full flex flex-col overflow-y-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl sm:text-4xl font-bold text-butter-500 mb-1">{group.name}</h2>
          <p className="text-gray-500 text-sm">Código: <span className="font-mono">{group.slug}</span></p>
        </div>
        <Button onClick={handleCopyLink}>
          {copied ? "¡Link copiado!" : "Copiar link de invitación"}
        </Button>
      </div>

      {/* Secciones del grupo */}
      <div className="flex gap-2 mb-6 border-b border-butter-200 pb-3">
        {SECTIONS.map((item) => {
          const isActive = section === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                isActive
                  ? "bg-butter-500 text-white"
                  : "bg-white text-gray-700 hover:bg-butter-100 border border-butter-200"
              }`}
            >
              {item.label}
              <span className={`ml-2 text-xs font-extrabold ${isActive ? "text-butter-100" : "text-gray-500"}`}>
                {item.count}
              </span>
            </button>
          );
        })}
      </div>

      {!isMember && (
        <div className="mb-6 bg-butter-100 border border-butter-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="font-bold text-gray-800">Todavía no eres miembro de este grupo</p>
            <p className="text-sm text-gray-600">
              Puedes revisar todo, pero necesitas unirte para sugerir, reseñar o crear cuentas.
            </p>
          </div>
          <Button onClick={handleJoinGroup} disabled={joining} className="shrink-0">
            {joining ? "Uniendo..." : "Unirme al grupo"}
          </Button>
        </div>
      )}

      {section === "usuarios" && (
      <div className="mt-4">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Miembros</h3>
        {members.length === 0 ? (
          <p className="text-gray-500">Todavía no hay miembros.</p>
        ) : (
          <ul className="flex flex-col gap-2 mb-6">
            {members.map((member) => (
              <li
                key={member._id}
                className="bg-white p-3 rounded-xl shadow-sm border border-butter-200 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="font-bold text-gray-800">
                    {member.names} {member.firstSurname}{" "}
                    <span className="text-gray-400 font-normal">@{member.username}</span>
                  </div>
                  {group.adminId === member._id && <Badge color="butter">Admin</Badge>}
                </div>
                {isAdmin && member._id !== user?.id && group.adminId !== member._id && (
                  <Button
                    variant="danger"
                    className="text-sm py-1.5 px-3"
                    onClick={() => setConfirmRemoveMember(member)}
                  >
                    Expulsar
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}

        {memberError && <p className="text-red-500 text-sm mb-4">{memberError}</p>}

        <form onSubmit={handleAddFriend} className="flex flex-col gap-4 max-w-sm">
          <Input
            type="text"
            label="Agregar amigo por usuario"
            placeholder="juanito123"
            value={friendUsername}
            onChange={(value) => setFriendUsername(value)}
          />
          <Button type="submit" disabled={adding || !isMember}>
            {adding ? "Agregando..." : "Agregar amigo"}
          </Button>
          {!isMember && (
            <p className="text-xs text-gray-500">Necesitas unirte al grupo para invitar a alguien.</p>
          )}
        </form>

        {isMember && !isAdmin && group.status !== "deleted" && (
          <div className="mt-4">
            <Button variant="danger" onClick={() => setConfirmLeave(true)}>
              Salir del grupo
            </Button>
            <p className="text-xs text-gray-500 mt-1">
              Dejas de ver el grupo y sus restaurantes. Puedes volver a unirte con el link o el código.
            </p>
          </div>
        )}
      </div>
      )}

      {section === "cuentas" && (
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h3 className="text-3xl font-bold text-gray-800 mb-2">Cuentas compartidas</h3>
            <p className="text-gray-600">Divide la cuenta de una salida con los participantes.</p>
          </div>
          <Button onClick={() => navigate(`/grupo/${slug}/nueva-cuenta`)} disabled={!isMember}>
            + Nueva cuenta
          </Button>
        </div>

        {!isMember && (
          <p className="text-sm text-gray-500 mb-4">
            Únete al grupo para poder crear cuentas compartidas.
          </p>
        )}

        {sessions.length === 0 ? (
          <p className="text-gray-500">
            Todavía no hay cuentas divididas en este grupo. ¡Crea la primera!
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {sessions.map((session) => {
              const paid = session.participants.filter((p) => p.isPaid).length;
              return (
                <li key={session._id}>
                  <Link
                    to={`/cuenta/${session._id}`}
                    className="block bg-white p-4 rounded-xl shadow-md border border-butter-200 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-gray-800">{session.title}</div>
                        <div className="text-sm text-gray-500">
                          ${session.totalAmount.toFixed(2)} · {session.splitMode === "equal" ? "Partes iguales" : "Por consumo"}
                        </div>
                      </div>
<div className="flex flex-col items-end gap-1">
  <Badge color={paid === session.participants.length ? "green" : paid > 0 ? "butter" : "gray"}>
    {paid}/{session.participants.length} {paid === 1 ? "pagó" : "pagaron"}
  </Badge>
</div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      )}

      {section === "restaurantes" && (
      <div className="mb-6">
        <h3 className="text-3xl font-bold text-gray-800 mb-2">Restaurantes sugeridos</h3>
        <p className="text-gray-600 mb-4">
          Vota por tus favoritos o sugiere uno nuevo para el grupo.
        </p>

        <div className="bg-white p-6 rounded-xl shadow-md border border-butter-200 mb-8">
          <h4 className="text-xl font-bold text-gray-800 mb-4">Sugerir un restaurante</h4>
          <form onSubmit={handleSuggestRestaurant} className="flex flex-col gap-4">
            <Input
              type="text"
              label="Nombre"
              placeholder="Ej. La Parrilla de Juan"
              value={restName}
              onChange={(value) => setRestName(value)}
            />
            <Input
              type="url"
              label="Link de Google Maps"
              placeholder="https://maps.app.goo.gl/..."
              value={restMapsLink}
              onChange={(value) => setRestMapsLink(value)}
            />
            <Select
              label="Categoría"
              value={restCategoryId}
              onChange={(value) => setRestCategoryId(value)}
              options={categories.map((c) => ({ value: c._id, label: c.name }))}
            />
            {user?.role === "admin" && !showNewCategory && (
              <button
                type="button"
                onClick={() => setShowNewCategory(true)}
                className="text-butter-500 font-bold text-sm hover:underline cursor-pointer self-start -mt-2"
              >
                + Crear categoría nueva
              </button>
            )}
            {user?.role === "admin" && showNewCategory && (
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Input
                      type="text"
                      label="Nueva categoría"
                      placeholder="Ej. Cafetería"
                      value={newCategoryName}
                      onChange={(value) => setNewCategoryName(value)}
                    />
                  </div>
                  <Button
                    onClick={handleCreateCategory}
                    disabled={categoryCreating || newCategoryName.trim() === ""}
                  >
                    {categoryCreating ? "Creando..." : "Crear"}
                  </Button>
                </div>
                {categoryError && <p className="text-red-500 text-sm">{categoryError}</p>}
              </div>
            )}
            <Input
              type="text"
              label="Tu comentario inicial (obligatorio)"
              placeholder="Ej. Recomiendo las hamburguesas"
              value={restComment}
              onChange={(value) => setRestComment(value)}
            />
            {restError && <p className="text-red-500 text-sm">{restError}</p>}
            <Button type="submit" disabled={suggesting || !isMember}>
              {suggesting ? "Sugiriendo..." : "Sugerir restaurante"}
            </Button>
      {group.status === "deleted" && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="font-bold text-red-700 mb-1">Este grupo fue eliminado por un administrador</p>
          {group.deletionReason && (
            <p className="text-sm text-gray-700 mb-2">
              <span className="font-bold">Motivo:</span> {group.deletionReason}
            </p>
          )}
          {myAppeals.some((a) => a.targetId === group._id && a.status === "pending") ? (
            <p className="text-sm text-gray-700">
              Tu apelación está en revisión. Te avisaremos por notificación cuando el administrador la resuelva.
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="danger" onClick={() => setAppealOpen(true)}>
                Apelar la eliminación
              </Button>
              {myAppeals.some((a) => a.targetId === group._id) && (
                <span className="text-sm text-gray-600">
                  Ya apelaste esta eliminación antes.
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {!isMember && group.status !== "deleted" && (
              <p className="text-xs text-gray-500">Necesitas unirte al grupo para sugerir un restaurante.</p>
            )}
          </form>
        </div>

        <div className="flex flex-col gap-3 mb-6">
          <div className="flex items-center justify-between">
            <h4 className="text-xl font-bold text-gray-800">Listado</h4>
            <div className="w-48">
              <Select
                label="Filtrar por categoría"
                value={categoryFilter}
                onChange={(value) => setCategoryFilter(value)}
                placeholder="Todas"
                options={categories.map((c) => ({ value: c._id, label: c.name }))}
              />
            </div>
          </div>

          {loading ? (
            <Spinner label="Cargando restaurantes..." />
          ) : restaurantsError ? (
            <p className="text-red-500 text-sm">{restaurantsError}</p>
          ) : filteredRestaurants.length === 0 ? (
            <p className="text-gray-500">
              {restaurants.length === 0
                ? "Todavía no hay restaurantes sugeridos. ¡Sé el primero en sugerir uno!"
                : "No hay restaurantes en esa categoría."}
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {filteredRestaurants.map((restaurant) => {
                const hasVoted = user?.id
                  ? restaurant.votes.includes(user.id)
                  : false;
                return (
                  <li
                    key={restaurant._id}
                    className="bg-white p-4 rounded-xl shadow-md border border-butter-200"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="text-xl font-bold text-gray-800">{restaurant.name}</h5>
                          <Badge color="butter">{getCategoryName(restaurant.categoryId)}</Badge>
                        </div>
                        <a
                          href={restaurant.mapsLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-butter-500 text-sm hover:underline"
                        >
                          Ver en Google Maps
                        </a>
                        <div className="mt-2 text-sm text-gray-600">
                          {(restaurant.votesCount ?? restaurant.votes.length)}{" "}
                          {restaurant.votesCount === 1 || restaurant.votes.length === 1
                            ? "voto"
                            : "votos"}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => handleVote(restaurant._id)} disabled={!isMember}>
                          {hasVoted ? "Quitar voto" : "Votar"}
                        </Button>
                        {isAdmin && (
                          <Button
                            variant="danger"
                            className="text-sm py-1.5 px-3"
                            onClick={() => setConfirmRemoveRestaurant(restaurant)}
                          >
                            Eliminar
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <h6 className="font-bold text-gray-700 text-sm mb-2">Reseñas</h6>
                      {restaurant.memberReviews.length === 0 ? (
                        <p className="text-gray-500 text-sm mb-3">Sin reseñas todavía.</p>
                      ) : (
                        <ul className="flex flex-col gap-2 mb-3">
                          {restaurant.memberReviews.map((review, i) => (
                            <li key={i} className="text-sm bg-gray-50 rounded-lg p-3">
                              <span className="font-bold text-gray-800">@{review.username}:</span>{" "}
                              <span className="text-gray-700">{review.comment}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {reviewOpenId === restaurant._id ? (
                        <div className="flex flex-col gap-2 max-w-sm">
                          <Input
                            type="text"
                            label="Tu reseña"
                            placeholder="Ej. La atención fue excelente"
                            value={reviewComment}
                            onChange={(value) => setReviewComment(value)}
                          />
                          {reviewError && <p className="text-red-500 text-sm">{reviewError}</p>}
                          <div className="flex gap-2">
                            <Button onClick={() => handleAddReview(restaurant._id)} disabled={!reviewComment.trim()}>
                              Publicar
                            </Button>
                            <Button
                              onClick={() => {
                                setReviewOpenId(null);
                                setReviewComment("");
                                setReviewError("");
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setReviewOpenId(restaurant._id)}
                          disabled={!isMember}
                          className="text-butter-500 font-bold text-sm hover:underline cursor-pointer disabled:text-gray-400 disabled:cursor-not-allowed disabled:no-underline"
                        >
                          Agregar reseña
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
      )}

      {similarModal && (
        <Modal title="Restaurante similar" onClose={() => setSimilarModal(null)}>
          <p className="text-gray-700 mb-4">{similarModal.message}</p>
          <div className="flex gap-2 justify-end">
            <Button
              onClick={() => {
                setSimilarModal(null);
                setPendingPayload(null);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleForceCreate} disabled={suggesting}>
              {suggesting ? "Creando..." : "Crear de todas formas"}
            </Button>
          </div>
        </Modal>
      )}

      {confirmLeave && (
        <ConfirmModal
          title="Salir del grupo"
          message={`¿Seguro que quieres salir de "${group.name}"? Dejarás de ver el grupo y sus restaurantes, pero puedes volver a unirte cuando quieras.`}
          confirmLabel="Salir del grupo"
          loading={adminActionLoading}
          onCancel={() => setConfirmLeave(false)}
          onConfirm={handleLeaveGroup}
        />
      )}

      {appealOpen && (
        <Modal title="Apelar la eliminación" onClose={() => setAppealOpen(false)}>
          <p className="text-sm text-gray-600 mb-3">
            Cuéntanos por qué debería restaurarse el grupo. El administrador va a leer tu justificación.
          </p>
          <div className="flex flex-col gap-3">
            <Input
              type="text"
              label="Tu justificación"
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

      {confirmRemoveMember && (
        <ConfirmModal
          title="Expulsar miembro"
          message={`¿Seguro que quieres expulsar a @${confirmRemoveMember.username} del grupo? Esta acción no se puede deshacer.`}
          confirmLabel="Expulsar"
          loading={adminActionLoading}
          onCancel={() => setConfirmRemoveMember(null)}
          onConfirm={handleKickMember}
        />
      )}

      {confirmRemoveRestaurant && (
        <ConfirmModal
          title="Eliminar recomendación"
          message={`¿Seguro que quieres eliminar la recomendación "${confirmRemoveRestaurant.name}"? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          loading={adminActionLoading}
          onCancel={() => setConfirmRemoveRestaurant(null)}
          onConfirm={handleRemoveRestaurant}
        />
      )}
    </div>
  );
}

export default GroupDetail;