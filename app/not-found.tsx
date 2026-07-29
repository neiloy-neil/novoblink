import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-novo-bg p-4 text-center">
      <h1 className="text-9xl font-heading font-black text-novo-blue/20 select-none">404</h1>
      
      <div className="space-y-4 -mt-10 relative z-10 bg-novo-bg p-6 rounded-lg max-w-md w-full">
        <h2 className="text-3xl font-heading font-bold text-novo-black">Page Not Found</h2>
        <p className="text-novo-text-muted text-sm">
          We couldn't find the page you were looking for. It might have been removed, renamed, or didn't exist in the first place.
        </p>
        
        <div className="pt-6">
          <Link href="/">
            <Button className="w-full bg-novo-black hover:bg-novo-blue text-white font-bold uppercase tracking-widest text-xs h-12 transition-colors">
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
