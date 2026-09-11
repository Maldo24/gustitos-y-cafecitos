import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import Button from "../components/Button";
import Input from "../components/Input";
import Modal from "../components/Modal";
import Select from "../components/Select";
import { useAuth } from "../context/AuthContext";
import { getGroupBySlug, getGroupMembers, addMember } from "../api/groups";
import { getCategories } from "../api/categories";
import { getSessionsByGroup } from "../api/sessions";
import {
  createRestaurant,
  getRestaurantsByGroup,
  addReview,
  toggleVote,
  type CreateRestaurantPayload,
} from "../api/restaurants";
import type { Category, Group, Restaurant, Session, User } from "../types";

function getCategoryName(category: string | Category): string {
  return typeof category === "string" ? category : category.name;
}

function getCategoryId(category: string | Category): string {
  return typeof category === "string" ? category : category._id;
}

function GroupDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);

  const [friendUsername, setFriendUsername] = useState("");
  const [adding, setAdding] = useState(false);
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

  const [categoryFilter, setCategoryFilter] = useState("");
  const [similarModal, setSimilarModal] = useState<{ message: string } | null>(null);
  const [pendingPayload, setPendingPayload] = useState<CreateRestaurantPayload | null>(null);

  const [reviewOpenId, setReviewOpenId] = useState<string | null>(null);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    if (!slug) return;

    getGroupBySlug(slug)
      .then((data) => {
        setGroup(data);
        return Promise.all([
          getGroupMembers(data._id),
          getRestaurantsByGroup(data._id),
          getCategories(),
          getSessionsByGroup(data._id),
        ]);
      })
      .then(([membersData, restaurantsData, categoriesData, sessionsData]) => {
        setMembers(membersData);
        setRestaurants(restaurantsData);
        setCategories(categoriesData);
        setSessions(sessionsData);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Error al cargar el grupo.");
      })
      .finally(() => setLoading(false));
  }, [slug]);

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
    const link = `${window.location.origin}/grupo/${group.slug}`;
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

  const filteredRestaurants = categoryFilter
    ? restaurants.filter((r) => getCategoryId(r.categoryId) === categoryFilter)
    : restaurants;

  if (loading) {
    return <div className="p-6 max-w-4xl mx-auto h-full">Cargando grupo...</div>;
  }

  if (error || !group) {
    return (
      <div className="p-6 max-w-4xl mx-auto h-full">
        <p className="text-red-500 text-sm">{error || "El grupo no fue encontrado."}</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto h-full flex flex-col overflow-y-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-4xl font-bold text-butter-500 mb-1">{group.name}</h2>
          <p className="text-gray-500 text-sm">Código: <span className="font-mono">{group.slug}</span></p>
        </div>
        <Button onClick={handleCopyLink}>
          {copied ? "¡Link copiado!" : "Copiar link de invitación"}
        </Button>
      </div>

      <div className="mt-4">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Miembros</h3>
        {members.length === 0 ? (
          <p className="text-gray-500">Todavía no hay miembros.</p>
        ) : (
          <ul className="flex flex-col gap-2 mb-6">
            {members.map((member) => (
              <li
                key={member._id}
                className="bg-white p-3 rounded-xl shadow-sm border border-butter-200 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-gray-800">
                    {member.names} {member.firtsSurname}{" "}
                    <span className="text-gray-400 font-normal">@{member.username}</span>
                  </div>
                </div>
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
          <Button type="submit" disabled={adding}>
            {adding ? "Agregando..." : "Agregar amigo"}
          </Button>
        </form>
      </div>

      <hr className="my-8 border-butter-200" />

      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <h3 className="text-3xl font-bold text-gray-800 mb-2">Cuentas compartidas</h3>
            <p className="text-gray-600">Divide la cuenta de una salida con los participantes.</p>
          </div>
          <Button onClick={() => navigate(`/grupo/${slug}/nueva-cuenta`)}>
            + Nueva cuenta
          </Button>
        </div>

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
                      <div className="text-sm text-gray-500">
                        {paid}/{session.participants.length} pagaron
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <hr className="my-8 border-butter-200" />

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
            <Input
              type="text"
              label="Tu comentario inicial (obligatorio)"
              placeholder="Ej. Recomiendo las hamburguesas"
              value={restComment}
              onChange={(value) => setRestComment(value)}
            />
            {restError && <p className="text-red-500 text-sm">{restError}</p>}
            <Button type="submit" disabled={suggesting}>
              {suggesting ? "Sugiriendo..." : "Sugerir restaurante"}
            </Button>
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
            <p className="text-gray-500">Cargando restaurantes...</p>
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
                          <span className="bg-butter-100 text-butter-700 text-xs font-bold px-2 py-1 rounded-full">
                            {getCategoryName(restaurant.categoryId)}
                          </span>
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
                      <Button onClick={() => handleVote(restaurant._id)} disabled={suggesting}>
                        {hasVoted ? "Quitar voto" : "Votar"}
                      </Button>
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
                          className="text-butter-500 font-bold text-sm hover:underline cursor-pointer"
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
    </div>
  );
}

export default GroupDetail;