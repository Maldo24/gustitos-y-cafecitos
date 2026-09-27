import Button from './Button';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

function ConfirmModal({
  title,
  message,
  confirmLabel = "Confirmar",
  loading = false,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={loading ? undefined : onCancel}
    >
      <div
        className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm mb-6">{message}</p>
        <div className="flex gap-2 justify-end">
          <Button onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={loading}>
            {loading ? "Procesando..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;