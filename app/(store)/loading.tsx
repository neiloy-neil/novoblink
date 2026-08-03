export default function StoreLoading() {
  return (
    <div className="w-full animate-pulse">
      {/* Hero skeleton — matches 90vh h-[90vh] min-h-[500px] */}
      <div className="relative w-full h-[90vh] min-h-[500px] bg-gray-200 dark:bg-gray-800 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skeleton-shimmer" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 mt-20">
          <div className="h-3 w-24 bg-gray-300 dark:bg-gray-600 rounded" />
          <div className="h-16 w-96 max-w-[80vw] bg-gray-300 dark:bg-gray-600 rounded-lg" />
          <div className="h-16 w-80 max-w-[70vw] bg-gray-300 dark:bg-gray-600 rounded-lg" />
          <div className="h-4 w-64 bg-gray-300 dark:bg-gray-600 rounded" />
          <div className="flex gap-4 mt-4">
            <div className="h-12 w-32 bg-gray-300 dark:bg-gray-600 rounded-full" />
            <div className="h-12 w-32 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </div>
        </div>
      </div>

      {/* Category strip skeleton */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-gray-200 dark:bg-gray-700 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skeleton-shimmer" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New Arrivals skeleton */}
      <div className="py-16 container mx-auto px-4">
        <div className="flex items-end justify-between mb-10 border-b border-gray-100 pb-4">
          <div className="h-8 w-48 bg-gray-200 rounded-lg" />
          <div className="h-4 w-16 bg-gray-200 rounded" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-10">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <div className="aspect-square rounded-xl bg-gray-200 dark:bg-gray-700 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skeleton-shimmer" />
              </div>
              <div className="h-3 w-3/4 bg-gray-200 rounded" />
              <div className="h-3 w-1/2 bg-gray-200 rounded" />
              <div className="h-4 w-1/3 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .skeleton-shimmer {
          animation: shimmer 1.6s infinite;
        }
      `}</style>
    </div>
  )
}
