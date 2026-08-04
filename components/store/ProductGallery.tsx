"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Play, ZoomIn, X } from "lucide-react"

function getEmbedUrl(videoUrl: string): { type: "youtube" | "vimeo" | "direct"; url: string } | null {
  if (!videoUrl) return null
  const ytMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  if (ytMatch) return { type: "youtube", url: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1` }
  const vimeoMatch = videoUrl.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return { type: "vimeo", url: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1` }
  if (videoUrl.match(/\.(mp4|webm|ogg)(\?|$)/i)) return { type: "direct", url: videoUrl }
  return null
}

function sanitizeAlt(raw: string | undefined, productName: string, index: number): string {
  if (!raw || /^ChatGPT Image/i.test(raw) || /^\d{13,}/.test(raw)) {
    return index === 0 ? productName : `${productName} — image ${index + 1}`
  }
  return raw
}

export default function ProductGallery({ images, productName = "Product" }: { images: any[]; productName?: string }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [playingVideo, setPlayingVideo] = useState(false)
  const [lightbox, setLightbox] = useState(false)
  const [lbIndex, setLbIndex] = useState(0)

  const openLightbox = (idx: number) => { setLbIndex(idx); setLightbox(true) }
  const closeLightbox = useCallback(() => setLightbox(false), [])
  const lbNext = useCallback(() => setLbIndex(i => (i + 1) % images.length), [images.length])
  const lbPrev = useCallback(() => setLbIndex(i => (i - 1 + images.length) % images.length), [images.length])

  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox()
      if (e.key === "ArrowRight") lbNext()
      if (e.key === "ArrowLeft") lbPrev()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lightbox, closeLightbox, lbNext, lbPrev])

  const activeItem = images[activeIndex]
  const activeImage = activeItem?.url || "/placeholder.jpg"
  const isActiveVideo = activeItem?.isVideo && activeItem?.videoUrl
  const embed = isActiveVideo ? getEmbedUrl(activeItem.videoUrl) : null

  const nextImage = () => { setActiveIndex((i) => (i + 1) % (images.length || 1)); setPlayingVideo(false) }
  const prevImage = () => { setActiveIndex((i) => (i - 1 + (images.length || 1)) % (images.length || 1)); setPlayingVideo(false) }

  const handleThumbClick = (idx: number) => {
    setActiveIndex(idx)
    setPlayingVideo(false)
  }

  return (
    <>
    <div className="flex flex-col md:flex-row-reverse gap-4 md:gap-6 sticky top-20">

      {/* Main Viewer */}
      <div className="w-full flex-1 relative bg-novo-muted overflow-hidden group">
        <div className="aspect-[3/4] md:aspect-[4/5] w-full relative">
          {isActiveVideo && playingVideo && embed ? (
            embed.type === "direct" ? (
              <video src={embed.url} controls autoPlay className="w-full h-full object-contain bg-black" />
            ) : (
              <iframe
                src={embed.url}
                className="w-full h-full"
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            )
          ) : (
            <>
              <Image
                src={activeImage}
                alt={sanitizeAlt(activeItem?.alt, productName, activeIndex)}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 cursor-zoom-in"
                priority
                onClick={() => !isActiveVideo && openLightbox(activeIndex)}
              />
              {isActiveVideo && (
                <button
                  onClick={() => setPlayingVideo(true)}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
                >
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                    <Play className="w-7 h-7 text-novo-black ml-1" fill="currentColor" />
                  </div>
                </button>
              )}
            </>
          )}
        </div>

        {/* Mobile Arrows */}
        {images.length > 1 && (
          <>
            <button onClick={prevImage} className="md:hidden absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
              <ChevronLeft className="w-5 h-5 text-novo-black" />
            </button>
            <button onClick={nextImage} className="md:hidden absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm">
              <ChevronRight className="w-5 h-5 text-novo-black" />
            </button>
          </>
        )}

        {!isActiveVideo && (
          <button
            onClick={() => openLightbox(activeIndex)}
            className="hidden md:flex absolute bottom-4 right-4 p-3 bg-white/90 backdrop-blur-sm text-novo-black rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-novo-blue hover:text-white shadow-sm"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Thumbnails */}
      <div className="flex md:flex-col gap-3 overflow-x-auto md:w-20 lg:w-24 shrink-0 pb-2 md:pb-0 hide-scrollbar snap-x">
        {images.map((img, idx) => (
          <button
            key={img.id || idx}
            onClick={() => handleThumbClick(idx)}
            className={`relative aspect-[3/4] w-20 md:w-full overflow-hidden transition-all snap-center rounded-sm ${activeIndex === idx ? "ring-1 ring-novo-black ring-offset-2 opacity-100" : "opacity-60 hover:opacity-100"}`}
          >
            <Image src={img.url} alt={sanitizeAlt(img.alt, productName, idx)} fill sizes="96px" className="object-cover" />
            {img.isVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Play className="w-5 h-5 text-white" fill="white" />
              </div>
            )}
          </button>
        ))}
        {images.length === 0 && (
          <div className="aspect-[3/4] w-20 md:w-full bg-novo-muted rounded-sm" />
        )}
      </div>

    </div>

    {/* Lightbox */}
    {lightbox && (
      <div
        className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
        onClick={closeLightbox}
      >
        {/* Close */}
        <button
          onClick={closeLightbox}
          className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors z-10"
        >
          <X className="w-7 h-7" />
        </button>

        {/* Counter */}
        {images.length > 1 && (
          <p className="absolute top-5 left-1/2 -translate-x-1/2 text-white/50 text-sm tabular-nums">
            {lbIndex + 1} / {images.length}
          </p>
        )}

        {/* Image */}
        <div
          className="relative w-full h-full max-w-4xl max-h-[90vh] mx-auto px-16"
          onClick={e => e.stopPropagation()}
        >
          <Image
            src={images[lbIndex]?.url || "/placeholder.jpg"}
            alt="Product"
            fill
            sizes="100vw"
            className="object-contain"
            priority
          />
        </div>

        {/* Prev / Next */}
        {images.length > 1 && (
          <>
            <button
              onClick={e => { e.stopPropagation(); lbPrev() }}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={e => { e.stopPropagation(); lbNext() }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Thumbnails strip */}
        {images.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); setLbIndex(i) }}
                className={`relative w-12 h-16 rounded overflow-hidden transition-all ${i === lbIndex ? "ring-2 ring-white opacity-100" : "opacity-40 hover:opacity-70"}`}
              >
                <Image src={img.url} alt="" fill sizes="48px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    )}
    </>
  )
}
