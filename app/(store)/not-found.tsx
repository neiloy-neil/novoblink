import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

export default function StoreNotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center bg-novo-bg p-4 text-center">
      <div className="w-20 h-20 bg-novo-muted rounded-full flex items-center justify-center mb-6 text-novo-border">
        <Search className="w-10 h-10" />
      </div>
      <h2 className="text-3xl font-heading font-bold text-novo-black mb-4">We couldn't find that</h2>
      <p className="text-novo-text-muted text-sm max-w-md mb-8">
        The product or page you're looking for doesn't exist or has been removed. Check out our latest arrivals instead!
      </p>
      
      <Link href="/shop">
        <Button className="bg-novo-black hover:bg-novo-blue text-white font-bold uppercase tracking-widest text-xs h-12 px-8 transition-colors">
          Browse Shop
        </Button>
      </Link>
    </div>
  )
}
