export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-novo-bg text-novo-black">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <h1 className="text-4xl font-heading font-black tracking-tighter uppercase">NovoBlink</h1>
        <div className="w-8 h-8 border-4 border-novo-border border-t-novo-blue rounded-full animate-spin"></div>
      </div>
    </div>
  )
}
