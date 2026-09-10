interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
}

function Select({ label, value, onChange, options, placeholder = "Selecciona..." }: SelectProps) {
  return (
    <div className="flex flex-col">
      <label className="text-gray-700 text-sm font-bold mb-2">{label}:</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-white border border-butter-300 rounded focus:outline-none focus:ring-2 focus:ring-butter-400"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default Select;