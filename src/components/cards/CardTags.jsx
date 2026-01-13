import { X } from 'lucide-react';

export default function CardTags({ tags, editable = false, onRemoveTag, getTagColor }) {
  return (
    <div className="flex flex-wrap gap-1">
      {(tags || []).map((tag) => {
        const color = getTagColor(tag);
        return (
          <span
            key={tag}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color.bg} ${color.text} border ${color.border}`}
          >
            {tag}
            {editable && (
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onRemoveTag?.(tag);
                }}
                className="hover:opacity-70"
              >
                <X size={12} />
              </button>
            )}
          </span>
        );
      })}
    </div>
  );
}
