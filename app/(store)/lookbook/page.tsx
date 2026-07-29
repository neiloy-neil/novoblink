import Link from "next/link"
import { ArrowRight } from "lucide-react"

const looks = [
  {
    title: "The Urban Edit",
    subtitle: "SS26 Collection",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop",
    href: "/shop?sort=newest",
  },
  {
    title: "Minimal Black",
    subtitle: "Essentials",
    image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=800&auto=format&fit=crop",
    href: "/shop",
  },
  {
    title: "Street Ready",
    subtitle: "Casual Line",
    image: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=800&auto=format&fit=crop",
    href: "/shop",
  },
  {
    title: "After Hours",
    subtitle: "Premium Series",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=800&auto=format&fit=crop",
    href: "/shop",
  },
  {
    title: "Clean Lines",
    subtitle: "Structured Wear",
    image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=800&auto=format&fit=crop",
    href: "/shop",
  },
  {
    title: "The Drop",
    subtitle: "Limited Edition",
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=800&auto=format&fit=crop",
    href: "/shop",
  },
]

export default function LookbookPage() {
  return (
    <div className="animate-in fade-in duration-500">
      {/* Hero */}
      <div className="relative h-[60vh] flex items-end overflow-hidden bg-novo-black">
        <img
          src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=2070&auto=format&fit=crop"
          alt="NovoBlink Lookbook"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="relative z-10 px-8 md:px-16 pb-12 text-white">
          <p className="text-novo-blue font-bold tracking-[0.2em] text-xs uppercase mb-3">Season 2026</p>
          <h1 className="text-5xl md:text-7xl font-heading font-bold leading-none mb-4">Lookbook</h1>
          <p className="text-lg text-gray-300 max-w-md">
            A visual story of style, texture, and attitude. Shop every look.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {looks.map((look, i) => (
            <Link
              key={i}
              href={look.href}
              className="group relative aspect-[3/4] overflow-hidden rounded-2xl block bg-novo-muted"
            >
              <img
                src={look.image}
                alt={look.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <p className="text-xs font-bold uppercase tracking-widest text-novo-blue mb-1">{look.subtitle}</p>
                <h3 className="text-2xl font-heading font-bold mb-3">{look.title}</h3>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest border-b border-white/50 pb-0.5 group-hover:border-novo-blue group-hover:text-novo-blue transition-colors">
                  Shop Look <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
