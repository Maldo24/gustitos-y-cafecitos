import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../components/Button";
import Input from "../components/Input";
import Badge from "../components/Badge";
import { getGroupBySlug, getGroupMembers } from "../api/groups";
import { createSession } from "../api/sessions";
import type { Group, User } from "../types";

interface DraftItem {
  key: string;
  dishName: string;
  price: string;
  quantity: number;
}

interface DraftParticipant {
  key: string;
  name: string;
  userId?: string;
  total: string;      // Monto consumido (modo simple)
  items: DraftItem[]; // Detalle por plato (modo por consumo)
}

const newId = () => crypto.randomUUID();

function newParticipant(name = "", userId?: string): DraftParticipant {
  return { key: newId(), name, userId, total: "", items: [] };
}

function newItem(): DraftItem {
  return { key: newId(), dishName: "", price: "", quantity: 1 };
}

/** Convierte el borrador a la estructura que espera la API. */
function toItemsConsumed(p: DraftParticipant, mode: "equal" | "by_consumption") {
  if (mode === "by_consumption") {
    return p.items
      .filter((item) => item.dishName.trim() !== "" || item.price !== "")
      .map((item) => ({
        dishName: item.dishName.trim() || "Consumo",
        price: parseFloat(item.price) || 0,
        quantity: item.quantity || 1,
      }));
  }

  // Modo partes iguales: si néglige el monto, se guarda como 0
  const total = parseFloat(p.total) || 0;
  return total > 0 ? [{ dishName: "Consumo", price: total, quantity: 1 }] : [];
}

function subtotalOf(p: DraftParticipant, mode: "equal" | "by_consumption"): number {
  if (mode === "by_consumption") {
    return p.items.reduce((acc, item) => acc + (parseFloat(item.price) || 0) * (item.quantity || 0), 0);
  }
  return parseFloat(p.total) || 0;
}

function calculatePreview(
  participants: DraftParticipant[],
  tipPercentage: string,
  splitMode: "equal" | "by_consumption"
) {
  let totalAmount = 0;
  const rows = participants.map((p) => {
    const subtotal = subtotalOf(p, splitMode);
    totalAmount += subtotal;
    return { key: p.key, name: p.name, subtotal, finalPay: 0 };
  });

  const tipFactor = 1 + (Number(tipPercentage) || 0) / 100;

  if (splitMode === "equal") {
    const totalWithTip = totalAmount * tipFactor;
    const share = participants.length > 0 ? totalWithTip / participants.length : 0;
    rows.forEach((r) => {
      r.finalPay = Math.round(share * 100) / 100;
    });
    totalAmount = totalWithTip;
  } else {
    rows.forEach((r) => {
      r.finalPay = Math.round(r.subtotal * tipFactor * 100) / 100;
    });
    totalAmount = totalAmount * tipFactor;
  }

  return { totalAmount: Math.round(totalAmount * 100) / 100, rows };
}

function CreateSession() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [title, setTitle] = useState("");
  const [splitMode, setSplitMode] = useState<"equal" | "by_consumption">("equal");
  const [tipPercentage, setTipPercentage] = useState("0");
  const [participants, setParticipants] = useState<DraftParticipant[]>([]);
  const [externalName, setExternalName] = useState("");
  const [externalError, setExternalError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;

    getGroupBySlug(slug)
      .then(async (data) => {
        setGroup(data);
        // Cargamos los miembros del grupo para poder agregarlos de un clic
        const membersData = await getGroupMembers(data._id);
        setMembers(membersData);
        // Por defecto, agregamos a todos los miembros del grupo
        setParticipants(membersData.map((m) => newParticipant(`${m.names} ${m.firstSurname}`.trim() || m.username, m._id)));
      })
      .catch((err: unknown) => {
        setLoadError(err instanceof Error ? err.message : "Error al cargar el grupo.");
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const isInParticipants = (memberId: string) =>
    participants.some((p) => p.userId === memberId);

  const availableMembers = members.filter((m) => !isInParticipants(m._id));

  const addMemberParticipant = (member: User) => {
    if (isInParticipants(member._id)) return;
    setParticipants((prev) => [
      ...prev,
      newParticipant(`${member.names} ${member.firstSurname}`.trim() || member.username, member._id),
    ]);
  };

  const addExternal = () => {
    const name = externalName.trim();
    if (!name) {
      setExternalError("Escribe el nombre.");
      return;
    }
    setParticipants((prev) => [...prev, newParticipant(name)]);
    setExternalName("");
    setExternalError("");
  };

  const updateParticipant = (key: string, patch: Partial<DraftParticipant>) => {
    setParticipants((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));
  };

  const removeParticipant = (key: string) => {
    setParticipants((prev) => prev.filter((p) => p.key !== key));
  };

  const addItem = (participantKey: string) => {
    setParticipants((prev) =>
      prev.map((p) => (p.key === participantKey ? { ...p, items: [...p.items, newItem()] } : p))
    );
  };

  const updateItem = (participantKey: string, itemKey: string, field: "dishName" | "price", value: string) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.key === participantKey
          ? {
              ...p,
              items: p.items.map((item) => (item.key === itemKey ? { ...item, [field]: value } : item)),
            }
          : p
      )
    );
  };

  const changeQuantity = (participantKey: string, itemKey: string, delta: number) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.key === participantKey
          ? {
              ...p,
              items: p.items.map((item) =>
                item.key === itemKey
                  ? { ...item, quantity: Math.max(1, (item.quantity || 1) + delta) }
                  : item
              ),
            }
          : p
      )
    );
  };

  const removeItem = (participantKey: string, itemKey: string) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.key === participantKey ? { ...p, items: p.items.filter((item) => item.key !== itemKey) } : p
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (saving || !group) return;

    if (title.trim() === "") {
      setError("El título de la cuenta es obligatorio.");
      return;
    }

    if (participants.length === 0) {
      setError("Agrega al menos un participante.");
      return;
    }

    if (participants.some((p) => p.name.trim() === "")) {
      setError("Todos los participantes deben tener nombre.");
      return;
    }

    if (participants.some((p) => subtotalOf(p, splitMode) < 0)) {
      setError("Los montos no pueden ser negativos.");
      return;
    }

    setSaving(true);

    try {
      const response = await createSession({
        title: title.trim(),
        splitMode,
        tipPercentage: Number(tipPercentage) || 0,
        groupId: group._id,
        participants: participants.map((p) => ({
          name: p.name.trim(),
          userId: p.userId,
          itemsConsumed: toItemsConsumed(p, splitMode),
        })),
      });

      navigate(`/cuenta/${response.session._id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al crear la cuenta.");
    } finally {
      setSaving(false);
    }
  };

  const preview = calculatePreview(participants, tipPercentage, splitMode);

  if (loading) {
    return <div className="p-6 max-w-4xl mx-auto h-full">Cargando...</div>;
  }

  if (loadError || !group) {
    return (
      <div className="p-6 max-w-4xl mx-auto h-full">
        <p className="text-red-500 text-sm">{loadError || "El grupo no fue encontrado."}</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto h-full flex flex-col overflow-y-auto">
      <h2 className="text-3xl sm:text-4xl font-bold text-butter-500 mb-2">Nueva cuenta compartida</h2>
      <p className="text-gray-600 mb-6">
        Para el grupo <span className="font-bold">{group.name}</span>. Elige cómo dividir la cuenta.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md border border-butter-200 flex flex-col gap-4">
          <Input
            type="text"
            label="Título de la cuenta"
            placeholder="Ej. Cena del viernes"
            value={title}
            onChange={(value) => setTitle(value)}
          />

          <div>
            <span className="text-gray-700 text-sm font-bold mb-2 block">Modo de división</span>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                type="button"
                onClick={() => setSplitMode("equal")}
                className={splitMode === "equal" ? "" : "bg-gray-400 hover:bg-gray-300"}
              >
                Partes iguales
              </Button>
              <Button
                type="button"
                onClick={() => setSplitMode("by_consumption")}
                className={splitMode === "by_consumption" ? "" : "bg-gray-400 hover:bg-gray-300"}
              >
                Por consumo
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {splitMode === "equal"
                ? "Todos pagan lo mismo. Puedes anotar cuánto consumió cada quien (opcional) para llevar el control."
                : "Cada quien paga según lo que consumió. Carga el detalle de platos o el monto total."}
            </p>
          </div>

          <div className="max-w-xs">
            <Input
              type="number"
              label="Propina (%)"
              placeholder="0"
              value={tipPercentage}
              onChange={(value) => setTipPercentage(value)}
            />
          </div>
        </div>

        {/* Participantes */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-butter-200 flex flex-col gap-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Participantes</h3>
            <p className="text-sm text-gray-600">
              Ya agregamos a los {members.length} {members.length === 1 ? "miembro" : "miembros"} del
              grupo.               Quita a quien no participe, o agrega a un externo por su nombre.
            </p>
          </div>

          {availableMembers.length > 0 && (
            <div className="bg-butter-100/50 rounded-xl p-4">
              <span className="text-gray-700 text-sm font-bold block mb-2">
                Miembros del grupo que faltan
              </span>
              <div className="flex flex-wrap gap-2">
                {availableMembers.map((member) => (
                  <button
                    key={member._id}
                    type="button"
                    onClick={() => addMemberParticipant(member)}
                    className="bg-white border border-butter-300 rounded-full px-3 py-1.5 text-sm font-bold text-butter-500 hover:bg-butter-100 transition-colors"
                  >
                    + {member.names} {member.firstSurname} (@{member.username})
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
            <div className="flex-1">
              <Input
                type="text"
                label="Agregar a alguien de afuera (opcional)"
                placeholder="Nombre de un invitado que no está en el grupo"
                value={externalName}
                onChange={(value) => {
                  setExternalName(value);
                  setExternalError("");
                }}
              />
            </div>
            <Button type="button" onClick={addExternal} className="sm:mb-1">
              + Agregar
            </Button>
          </div>
          {externalError && <p className="text-red-500 text-sm">{externalError}</p>}

          <div className="flex flex-col gap-3">
            {participants.length === 0 && (
              <p className="text-gray-500 text-sm">
                No hay participantes. Agrega a un miembro del grupo o a alguien por su nombre.
              </p>
            )}

            {participants.map((participant, index) => {
              const subtotal = subtotalOf(participant, splitMode);
              const fromGroup = Boolean(participant.userId);

              return (
                <div
                  key={participant.key}
                  className="border border-butter-200 rounded-xl p-4 flex flex-col gap-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-gray-500 font-bold">#{index + 1}</span>
                    <div className="flex-1 min-w-[10rem]">
                      <Input
                        type="text"
                        label="Nombre"
                        placeholder="Ej. Juan"
                        value={participant.name}
                        onChange={(value) => updateParticipant(participant.key, { name: value })}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      {fromGroup && <Badge color="green">Del grupo</Badge>}
                      <Button
                        type="button"
                        variant="danger"
                        className="self-end mb-1"
                        onClick={() => removeParticipant(participant.key)}
                      >
                        Quitar
                      </Button>
                    </div>
                  </div>

                  {splitMode === "by_consumption" ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-bold text-gray-700 text-sm">
                          Consumo de {participant.name || "este participante"}
                        </h4>
                        <Button type="button" className="px-3 py-1.5 text-sm" onClick={() => addItem(participant.key)}>
                          + Agregar plato
                        </Button>
                      </div>

                      {participant.items.length === 0 ? (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-gray-500 text-sm mb-2">
                            Sin platos. Puedes agregar el detalle o solo escribir el monto total.
                          </p>
                          <div className="max-w-[12rem]">
                            <Input
                              type="number"
                              label="O monto total consumido"
                              placeholder="Ej. 12500"
                              value={participant.total}
                              onChange={(value) => updateParticipant(participant.key, { total: value })}
                            />
                          </div>
                        </div>
                      ) : (
                        <ul className="flex flex-col gap-2">
                          {participant.items.map((item) => (
                            <li
                              key={item.key}
                              className="flex flex-col md:flex-row gap-2 items-end bg-gray-50 rounded-lg p-2"
                            >
                              <div className="flex-1 min-w-[8rem]">
                                <Input
                                  type="text"
                                  label="Plato"
                                  placeholder="Ej. Café con leche"
                                  value={item.dishName}
                                  onChange={(value) =>
                                    updateItem(participant.key, item.key, "dishName", value)
                                  }
                                />
                              </div>
                              <div className="w-full md:w-32">
                                <Input
                                  type="number"
                                  label="Precio"
                                  placeholder="3500"
                                  value={item.price}
                                  onChange={(value) => updateItem(participant.key, item.key, "price", value)}
                                />
                              </div>
                              <div className="w-full md:w-32">
                                <span className="text-gray-700 text-sm font-bold mb-2 block">
                                  Cantidad:
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    aria-label="Quitar uno"
                                    onClick={() => changeQuantity(participant.key, item.key, -1)}
                                    className="w-10 h-[42px] rounded-lg bg-butter-100 border border-butter-300 font-extrabold text-butter-500 text-lg cursor-pointer hover:bg-butter-200"
                                  >
                                    −
                                  </button>
                                  <input
                                    type="number"
                                    min={1}
                                    value={item.quantity}
                                    onChange={(e) => {
                                      const parsed = parseInt(e.target.value);
                                      if (!Number.isNaN(parsed) && parsed >= 1) {
                                        setParticipants((prev) =>
                                          prev.map((p) =>
                                            p.key === participant.key
                                              ? {
                                                  ...p,
                                                  items: p.items.map((i) =>
                                                    i.key === item.key ? { ...i, quantity: parsed } : i
                                                  ),
                                                }
                                              : p
                                          )
                                        );
                                      }
                                    }}
                                    className="w-14 h-[42px] px-2 text-center bg-white border border-butter-300 rounded focus:outline-none focus:ring-2 focus:ring-butter-400"
                                  />
                                  <button
                                    type="button"
                                    aria-label="Agregar uno"
                                    onClick={() => changeQuantity(participant.key, item.key, 1)}
                                    className="w-10 h-[42px] rounded-lg bg-butter-100 border border-butter-300 font-extrabold text-butter-500 text-lg cursor-pointer hover:bg-butter-200"
                                  >
                                    +
                                  </button>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="danger"
                                className="self-end mb-0.5"
                                onClick={() => removeItem(participant.key, item.key)}
                              >
                                Eliminar
                              </Button>
                            </li>
                          ))}
                          <li className="text-sm text-gray-700 flex justify-between px-2">
                            <span className="font-bold">Subtotal de {participant.name || "este participante"}:</span>
                            <span className="font-extrabold text-butter-500">
                              ${subtotal.toFixed(2)}
                            </span>
                          </li>
                        </ul>
                      )}
                    </div>
                  ) : (
                    <div className="max-w-[12rem]">
                      <Input
                        type="number"
                        label="Cuánto consumió (opcional)"
                        placeholder="Ej. 12500"
                        value={participant.total}
                        onChange={(value) => updateParticipant(participant.key, { total: value })}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-butter-200 flex flex-col gap-2">
          <h3 className="text-xl font-bold text-gray-800 mb-2">Resumen estimado</h3>
          {preview.rows.length === 0 ? (
            <p className="text-gray-500 text-sm">Agrega participantes para ver el resumen.</p>
          ) : (
            <ul className="flex flex-col gap-1 mb-2">
              {preview.rows.map((row) => (
                <li key={row.key} className="flex justify-between text-sm gap-2">
                  <span className="text-gray-700 break-words">
                    {row.name || "Sin nombre"}
                    {row.subtotal > 0 && (
                      <span className="text-gray-400 text-xs"> (consumió ${row.subtotal.toFixed(2)})</span>
                    )}
                  </span>
                  <span className="font-bold text-gray-800 shrink-0">${row.finalPay.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex justify-between border-t border-butter-200 pt-2">
            <span className="font-bold text-gray-800">Total con propina</span>
            <span className="font-bold text-butter-500">${preview.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <Button type="submit" disabled={saving}>
          {saving ? "Guardando..." : "Guardar cuenta"}
        </Button>
      </form>
    </div>
  );
}

export default CreateSession;
