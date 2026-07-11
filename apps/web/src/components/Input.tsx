function Input({ label, type, value, placeholder, onChange }: 
    { label: string; type: string; value: string; placeholder:string, onChange: (value: string) => void }) {
  return (
    <div className="flex flex-col">
      <label className="text-gray-700 text-sm font-bold mb-2">{label}:</label>
      <input 
                type={type}
                required
                className="w-full px-3 py-2 bg-white border border-butter-300 rounded focus:outline-none focus:ring-2 focus:ring-butter-400"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
              />
    </div>
  );
}

export default Input;