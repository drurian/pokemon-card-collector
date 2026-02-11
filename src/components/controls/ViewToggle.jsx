import { Grid, List } from 'lucide-react';

export default function ViewToggle({ view, onChange }) {
  return (
    <div className="flex rounded-lg border border-gray-300 overflow-hidden">
      <button
        onClick={() => onChange('grid')}
        className={`p-2 flex items-center justify-center transition-colors ${
          view === 'grid'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-600 hover:bg-gray-50'
        }`}
        aria-label="Grid view"
        aria-pressed={view === 'grid'}
        title="Grid view"
      >
        <Grid size={18} />
      </button>
      <button
        onClick={() => onChange('list')}
        className={`p-2 flex items-center justify-center transition-colors border-l border-gray-300 ${
          view === 'list'
            ? 'bg-blue-600 text-white'
            : 'bg-white text-gray-600 hover:bg-gray-50'
        }`}
        aria-label="List view"
        aria-pressed={view === 'list'}
        title="List view"
      >
        <List size={18} />
      </button>
    </div>
  );
}
