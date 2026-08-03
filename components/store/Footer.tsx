import Link from "next/link";
import { Mail, Phone, MessageCircle, Share2, Music } from "lucide-react";

type Branding = {
  storeName: string
  storeTagline: string
  storeDescription: string
  supportEmail: string
  supportPhone: string
  socialFacebook: string
  socialInstagram: string
  socialTiktok: string
}

type FooterCategory = { id: string; name: string; slug: string }

export default function Footer({
  branding,
  categories = [],
}: {
  branding?: Partial<Branding>
  categories?: FooterCategory[]
}) {
  const storeName = branding?.storeName || "NovoBlink"
  const storeDescription =
    branding?.storeDescription ||
    "Bangladesh's premier online gadget store — smartphones, laptops, audio, and accessories."
  const supportEmail = branding?.supportEmail || "support@NovoBlink.com.bd"
  const supportPhone = branding?.supportPhone || "+880 1700 000000"
  const socialFacebook = branding?.socialFacebook
  const socialInstagram = branding?.socialInstagram
  const socialTiktok = branding?.socialTiktok
  const shopCategories = categories.slice(0, 4)

  return (
    <footer className="bg-novo-muted pt-16 pb-8 border-t border-novo-border">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">

          {/* About */}
          <div className="space-y-4">
            <h3 className="font-heading font-bold text-2xl tracking-tight">{storeName}</h3>
            <p className="text-sm text-novo-text-muted leading-relaxed max-w-xs">
              {storeDescription}
            </p>
            <div className="flex gap-4 pt-2">
              {socialFacebook && (
                <a href={socialFacebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-novo-surface flex items-center justify-center hover:bg-novo-blue hover:text-white transition-colors shadow-sm">
                  <Share2 className="w-5 h-5" />
                </a>
              )}
              {socialInstagram && (
                <a href={socialInstagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-novo-surface flex items-center justify-center hover:bg-novo-blue hover:text-white transition-colors shadow-sm">
                  <MessageCircle className="w-5 h-5" />
                </a>
              )}
              {socialTiktok && (
                <a href={socialTiktok} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-novo-surface flex items-center justify-center hover:bg-novo-blue hover:text-white transition-colors shadow-sm">
                  <Music className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Shop */}
          <div className="space-y-4">
            <h4 className="font-bold uppercase tracking-wider text-sm">Shop</h4>
            <ul className="space-y-2 text-sm text-novo-text-muted">
              <li><Link href="/shop" className="hover:text-novo-blue transition-colors">All Products</Link></li>
              {shopCategories.map((cat) => (
                <li key={cat.id}>
                  <Link href={`/shop?categoryId=${cat.id}`} className="hover:text-novo-blue transition-colors">{cat.name}</Link>
                </li>
              ))}
              <li><Link href="/shop?sort=newest" className="hover:text-novo-blue transition-colors">New Arrivals</Link></li>
              <li><Link href="/shop?sale=true" className="hover:text-novo-error transition-colors">Sale</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div className="space-y-4">
            <h4 className="font-bold uppercase tracking-wider text-sm">Help</h4>
            <ul className="space-y-2 text-sm text-novo-text-muted">
              <li><Link href="/track" className="hover:text-novo-blue transition-colors">Track Order</Link></li>
              <li><Link href="/faq" className="hover:text-novo-blue transition-colors">FAQ & Shipping</Link></li>
              <li><Link href="/returns" className="hover:text-novo-blue transition-colors">Returns & Exchanges</Link></li>
              <li><Link href="/warranty" className="hover:text-novo-blue transition-colors">Warranty Policy</Link></li>
              <li><Link href="/contact" className="hover:text-novo-blue transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Contact / Newsletter */}
          <div className="space-y-4">
            <h4 className="font-bold uppercase tracking-wider text-sm">Join The Club</h4>
            <p className="text-sm text-novo-text-muted">Subscribe for 10% off your first order and exclusive access to new drops.</p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Email address"
                className="flex-1 bg-novo-surface border border-novo-border px-4 py-2 rounded-lg text-sm focus:outline-none focus:border-novo-blue"
              />
              <button type="submit" className="bg-novo-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-novo-blue transition-colors">
                Subscribe
              </button>
            </form>
            <div className="pt-4 space-y-2 text-sm text-novo-text-muted">
              <p className="flex items-center gap-2"><Mail className="w-4 h-4" /> {supportEmail}</p>
              <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> {supportPhone}</p>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-novo-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-novo-text-muted text-center md:text-left">
            &copy; {new Date().getFullYear()} {storeName}. Made in Bangladesh 🇧🇩. All rights reserved.
          </p>
          <div className="flex gap-4 items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-novo-text-muted">Payments:</span>
            <div className="flex gap-2 text-xs font-mono font-medium text-novo-text-muted bg-novo-surface px-2 py-1 rounded">bKash</div>
            <div className="flex gap-2 text-xs font-mono font-medium text-novo-text-muted bg-novo-surface px-2 py-1 rounded">Nagad</div>
            <div className="flex gap-2 text-xs font-mono font-medium text-novo-text-muted bg-novo-surface px-2 py-1 rounded">COD</div>
          </div>
        </div>
      </div>
    </footer>
  );
}
