/**
 * DateSeparator — centered date pill with lines on each side.
 * Props: label (string) — "Today", "Yesterday", or "12 March 2026"
 */
export default function DateSeparator({ label }) {
  return (
    <div className="flex items-center gap-3 my-4 px-4" aria-label={`Messages from ${label}`}>
      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm whitespace-nowrap">
        {label}
      </span>
      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
    </div>
  )
}
