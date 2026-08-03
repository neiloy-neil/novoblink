import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Tech Showcase",
  description: "Explore our curated selection of top gadgets — smartphones, laptops, audio gear, and smart home tech.",
}

const showcases = [
  {
    title: "Smartphones",
    subtitle: "Latest Flagships",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop",
    href: "/shop?categoryId=smartphones",
  },
  {
    title: "Laptops & PCs",
    subtitle: "Work & Play",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=800&auto=format&fit=crop",
    href: "/shop?categoryId=laptops",
  },
  {
    title: "Audio Gear",
    subtitle: "Earbuds & Headphones",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop",
    href: "/shop?categoryId=audio",
  },
  {
    title: "Smart Watches",
    subtitle: "Wear Your Tech",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop",
    href: "/shop?categoryId=wearables",
  },
  {
    title: "Gaming",
    subtitle: "Controllers & Gear",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop",
    href: "/shop?categoryId=gaming",
  },
  {
    title: "Accessories",
    subtitle: "Cables, Chargers & More",
    image: "https://images.unsplash.com/photo-1585792180666-f7347c490ee2?q=80&w=800&auto=format&fit=crop",
    href: "/shop?categoryId=accessories",
  },
]

export default function ShowcasePage() {
  return (
    <div className="animate-in fade-in duration-500">
      {/* Hero */}
      <div className="relative h-[60vh] flex items-end overflow-hidden bg-novo-black">
        <img
          src="https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop"
          alt="NovoBlink Tech Showcase"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="relative z-10 px-8 md:px-16 pb-12 text-white">
          <p className="text-novo-blue font-bold tracking-[0.2em] text-xs uppercase mb-3">NovoBlink</p>
          <h1 className="text-5xl md:text-7xl font-heading font-bold leading-none mb-4">Tech Showcase</h1>
          <p className="text-lg text-gray-300 max-w-md">
            Explore our curated selection of the best gadgets and tech. Shop by category.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {showcases.map((item, i) => (
            <Link
              key={i}
              href={item.href}
              className="group relative aspect-[3/4] overflow-hidden rounded-2xl block bg-novo-muted"
            >
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <p className="text-xs font-bold uppercase tracking-widest text-novo-blue mb-1">{item.subtitle}</p>
                <h3 className="text-2xl font-heading font-bold mb-3">{item.title}</h3>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest border-b border-white/50 pb-0.5 group-hover:border-novo-blue group-hover:text-novo-blue transition-colors">
                  Shop Now <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
