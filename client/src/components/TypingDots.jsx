/**
 * TypingDots — three animated bouncing dots.
 */
export default function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1" aria-label="User is typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="typing-dot w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 inline-block"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  )
}
