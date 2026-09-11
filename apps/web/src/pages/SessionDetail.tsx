import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Button from "../components/Button";
import Badge from "../components/Badge";
import Spinner from "../components/Spinner";
import { getSessionById, togglePayment } from "../api/sessions";
import type { Session } from "../types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CL", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SessionDetail() {
  const { sessionId } = useParams<{ sessionId: string }>();

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    getSessionById(sessionId)
      .then(setSession)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Error al cargar la cuenta.");
      })
      .finally(() => setLoading(false));
  }, [sessionId]);

  const handleTogglePay = async (participantId: string) => {
    if (!sessionId) return;
    setTogglingId(participantId);
    try {
      const response = await togglePayment(sessionId, participantId);
      setSession(response.session);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al actualizar el pago.");
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto h-full flex items-center justify-center">
        <Spinner label="Cargando cuenta..." />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="p-6 max-w-4xl mx-auto h-full">
        <p className="text-red-500 text-sm">{error || "La cuenta no fue encontrada."}</p>
      </div>
    );
  }

  const totalParticipants = session.participants.length;
  const paidCount = session.participants.filter((p) => p.isPaid).length;
  const progress = totalParticipants > 0 ? (paidCount / totalParticipants) * 100 : 0;

  return (
    <div className="p-6 max-w-4xl mx-auto h-full flex flex-col overflow-y-auto">
      <h2 className="text-4xl font-bold text-butter-500 mb-1">{session.title}</h2>
      <p className="text-gray-500 text-sm mb-4">{formatDate(session.createdAt)}</p>

      <div className="bg-white p-6 rounded-xl shadow-md border border-butter-200 mb-6 flex flex-wrap gap-8">
        <div>
          <span className="text-gray-500 text-sm block">Total</span>
          <span className="text-3xl font-bold text-gray-800">${session.totalAmount.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-gray-500 text-sm block">Propina</span>
          <span className="text-xl font-bold text-gray-800">{session.tipPercentage}%</span>
        </div>
        <div>
          <span className="text-gray-500 text-sm block">División</span>
          <span className="text-xl font-bold text-gray-800 capitalize">
            {session.splitMode === "equal" ? "Partes iguales" : "Por consumo"}
          </span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md border border-butter-200 mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Progreso de pagos</h3>
        <p className="text-gray-600 mb-2">
          {paidCount} de {totalParticipants} {totalParticipants === 1 ? "pagó" : "pagaron"}
        </p>
        <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-butter-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <h3 className="text-2xl font-bold text-gray-800 mb-4">Detalle por participante</h3>
      <ul className="flex flex-col gap-3">
        {session.participants.map((participant) => (
          <li
            key={participant._id}
            className="bg-white p-4 rounded-xl shadow-md border border-butter-200 flex flex-col gap-3"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <div className="font-bold text-gray-800 text-lg">{participant.name}</div>
                {session.splitMode === "by_consumption" && participant.itemsConsumed.length > 0 && (
                  <ul className="text-sm text-gray-600 mt-1">
                    {participant.itemsConsumed.map((item, i) => (
                      <li key={i}>
                        {item.quantity}× {item.dishName} — ${(item.price * item.quantity).toFixed(2)}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-bold ${participant.isPaid ? "text-green-600" : "text-gray-800"}`}>
                  ${participant.finalPay.toFixed(2)}
                </span>
                {participant.isPaid ? (
                  <Badge color="green">Pagado</Badge>
                ) : (
                  <Badge color="red">Pendiente</Badge>
                )}
                <Button
                  onClick={() => participant._id && handleTogglePay(participant._id)}
                  disabled={togglingId === participant._id}
                >
                  {participant.isPaid ? "Marcar pendiente" : "Marcar como pagado"}
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SessionDetail;