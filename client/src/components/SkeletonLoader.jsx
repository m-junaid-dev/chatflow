/**
 * SkeletonLoader — shimmer skeletons for conversations and messages.
 */

export function ConversationSkeleton() {
  return (
    <div className="space-y-1 p-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
          <div className="skeleton w-12 h-12 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-32 rounded" />
            <div className="skeleton h-3 w-48 rounded" />
          </div>
          <div className="skeleton h-3 w-10 rounded" />
        </div>
      ))}
    </div>
  )
}

export function MessageSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Received */}
      <div className="flex items-end gap-2">
        <div className="skeleton w-8 h-8 rounded-full" />
        <div className="skeleton h-12 w-48 rounded-2xl rounded-bl-sm" />
      </div>
      {/* Sent */}
      <div className="flex items-end gap-2 flex-row-reverse">
        <div className="skeleton h-10 w-40 rounded-2xl rounded-br-sm" />
      </div>
      {/* Received */}
      <div className="flex items-end gap-2">
        <div className="skeleton w-8 h-8 rounded-full" />
        <div className="skeleton h-20 w-56 rounded-2xl rounded-bl-sm" />
      </div>
      {/* Sent */}
      <div className="flex items-end gap-2 flex-row-reverse">
        <div className="skeleton h-14 w-44 rounded-2xl rounded-br-sm" />
      </div>
    </div>
  )
}
