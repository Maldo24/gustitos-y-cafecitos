import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../components/Button";
import Input from "../components/Input";
import { getGroupBySlug } from "../api/groups";
import { createSession } from "../api/sessions";
import type { Group } from "../types";

interface DraftItem {
  key: string;
  dishName: string;
  price: string;
  quantity: string;
}

interface DraftParticipant {
  key: string;
  name: string;
  items: DraftItem[];
}

const newId = () => crypto.randomUUID();

function newParticipant(): DraftParticipant {
  return { key: newId(), name: "", items: [] };
}

function newItem(): DraftItem {
  return { key: newId(), dishName: "", price: "", quantity: "1" };
}

function calculatePreview(
  participants: DraftParticipant[],
  tipPercentage: string,
  splitMode: "equal" | "by_consumption"
) {
  let totalAmount = 0;
  const rows = participants.map((p) => {
    let subtotal = 0;
    p.items.forEach((item) => {
      subtotal += (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0);
    });
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
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [title, setTitle] = useState("");
  const [splitMode, setSplitMode] = useState<"equal" | "by_consumption">("equal");
  const [tipPercentage, setTipPercentage] = useState("0");
  const [participants, setParticipants] = useState<DraftParticipant[]>([newParticipant()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;

    getGroupBySlug(slug)
      .then((data) => setGroup(data))
      .catch((err: unknown) => {
        setLoadError(err instanceof Error ? err.message : "Error al cargar el grupo.");
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const updateParticipantName = (key: string, name: string) => {
    setParticipants((prev) => prev.map((p) => (p.key === key ? { ...p, name } : p)));
  };

  const addItem = (participantKey: string) => {
    setParticipants((prev) =>
      prev.map((p) => (p.key === participantKey ? { ...p, items: [...p.items, newItem()] } : p))
    );
  };

  const updateItem = (participantKey: string, itemKey: string, field: keyof DraftItem, value: string) => {
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

  const removeItem = (participantKey: string, itemKey: string) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.key === participantKey ? { ...p, items: p.items.filter((item) => item.key !== itemKey) } : p
      )
    );
  };

  const removeParticipant = (key: string) => {
    setParticipants((prev) => prev.filter((p) => p.key !== key));
  };

  const addParticipant = () => {
    setParticipants((prev) => [...prev, newParticipant()]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (saving || !group) return;

    if (title.trim() === "") {
      setError("El título de la cuenta es obligatorio.");
      return;
    }

    if (participants.length === 0 || participants.some((p) => p.name.trim() === "")) {
      setError("Todos los participantes deben tener nombre.");
      return;
    }

    if (splitMode === "by_consumption") {
      const hasNoItems = participants.some((p) => p.items.length === 0);
      const hasIncompleteItem = participants.some((p) =>
        p.items.some((item) => item.dishName.trim() === "" || item.price === "")
      );
      if (hasNoItems || hasIncompleteItem) {
        setError("En modo por consumo, cada participante debe tener al menos un plato con nombre y precio.");
        return;
      }
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
          itemsConsumed: p.items.map((item) => ({
            dishName: item.dishName.trim(),
            price: parseFloat(item.price) || 0,
            quantity: parseInt(item.quantity) || 1,
          })),
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
    <div className="p-6 max-w-4xl mx-auto h-full flex flex-col overflow-y-auto">
      <h2 className="text-4xl font-bold text-butter-500 mb-2">Nueva cuenta compartida</h2>
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
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => setSplitMode("equal")}
                className={splitMode === "equal" ? "" : "bg-gray-400 hover:bg-gray-300"}
              >
                Dividir en partes iguales
              </Button>
              <Button
                type="button"
                onClick={() => setSplitMode("by_consumption")}
                className={splitMode === "by_consumption" ? "" : "bg-gray-400 hover:bg-gray-300"}
              >
                Por consumo
              </Button>
            </div>
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

        <div className="bg-white p-6 rounded-xl shadow-md border border-butter-200 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800">Participantes</h3>
            <Button type="button" onClick={addParticipant}>
              + Agregar participante
            </Button>
          </div>

          <div className="flex flex-col gap-4">
            {participants.map((participant, index) => (
              <div key={participant.key} className="border border-butter-200 rounded-xl p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 font-bold">#{index + 1}</span>
                  <div className="flex-1">
                    <Input
                      type="text"
                      label="Nombre"
                      placeholder="Ej. Juan"
                      value={participant.name}
                      onChange={(value) => updateParticipantName(participant.key, value)}
                    />
                  </div>
                  <Button
                    type="button"
                    className="bg-red-400 hover:bg-red-500"
                    onClick={() => removeParticipant(participant.key)}
                  >
                    Quitar
                  </Button>
                </div>

                {splitMode === "by_consumption" && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-gray-700 text-sm">Platos consumidos</h4>
                      <button
                        type="button"
                        onClick={() => addItem(participant.key)}
                        className="text-butter-500 font-bold text-sm hover:underline cursor-pointer"
                      >
                        + Agregar plato
                      </button>
                    </div>

                    {participant.items.length === 0 ? (
                      <p className="text-gray-500 text-sm">Sin platos todavía.</p>
                    ) : (
                      <ul className="flex flex-col gap-2">
                        {participant.items.map((item) => (
                          <li key={item.key} className="flex flex-col md:flex-row gap-2 items-end">
                            <div className="flex-1">
                              <Input
                                type="text"
                                label="Plato"
                                placeholder="Ej. Café con leche"
                                value={item.dishName}
                                onChange={(value) => updateItem(participant.key, item.key, "dishName", value)}
                              />
                            </div>
                            <div className="w-28">
                              <Input
                                type="number"
                                label="Precio"
                                placeholder="3500"
                                value={item.price}
                                onChange={(value) => updateItem(participant.key, item.key, "price", value)}
                              />
                            </div>
                            <div className="w-24">
                              <Input
                                type="number"
                                label="Cant."
                                placeholder="1"
                                value={item.quantity}
                                onChange={(value) => updateItem(participant.key, item.key, "quantity", value)}
                              />
                            </div>
                            <Button
                              type="button"
                              className="bg-red-400 hover:bg-red-500"
                              onClick={() => removeItem(participant.key, item.key)}
                            >
                              Eliminar
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md border border-butter-200 flex flex-col gap-2">
          <h3 className="text-xl font-bold text-gray-800 mb-2">Resumen estimado</h3>
          {preview.rows.length === 0 ? (
            <p className="text-gray-500 text-sm">Agrega participantes para ver el resumen.</p>
          ) : (
            <ul className="flex flex-col gap-1 mb-2">
              {preview.rows.map((row) => (
                <li key={row.key} className="flex justify-between text-sm">
                  <span className="text-gray-700">{row.name || "Sin nombre"}</span>
                  <span className="font-bold text-gray-800">${row.finalPay.toFixed(2)}</span>
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