interface SpinnerProps {
  label?: string;
}

function Spinner({ label }: SpinnerProps) {
  return (
    <div className="flex flex-col items-center gap-2 p-4">
      <div className="w-8 h-8 border-4 border-butter-200 border-t-butter-500 rounded-full animate-spin" />
      {label && <span className="text-gray-500 text-sm">{label}</span>}
    </div>
  );
}

export default Spinner;