import { ArrowUpDown } from 'lucide-react';

export default function SortDropdown({ value, onChange, options, className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
        <ArrowUpDown size={14} />
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-white border border-gray-300 rounded-lg pl-8 pr-8 py-2 text-sm focus:outline-none focus:border-blue-500 cursor-pointer"
      >
        <option value="">Default order</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
}
