import { Loader2 } from "lucide-react"

export default function StoreLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-novo-bg text-novo-black">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-novo-blue" />
        <p className="text-xs uppercase tracking-widest text-novo-text-muted font-bold animate-pulse">Loading...</p>
      </div>
    </div>
  )
}
