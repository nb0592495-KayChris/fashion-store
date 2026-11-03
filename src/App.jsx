
import { useEffect, useState } from 'react'
import gsap from 'gsap'
import { ArrowDownRight, ArrowUpRight, Menu, ShoppingBag } from 'lucide-react'
import FashionCarousel from './components/FashionCarousel'
import storeConfig from './data/storeConfig'
import { supabase } from './lib/supabase'

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => {
    const animation = gsap.fromTo(
      '.hero-reveal',
      { y: 35, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, stagger: 0.15, ease: 'power3.out' }
    )

    return () => animation.kill()
  }, [])

  
  return (
    <main className="min-h-screen overflow-hidden bg-[#0a0a0a] text-white">
      <header className="relative z-20 flex items-center justify-between border-b border-white/10 px-6 py-5 md:px-12">
        <a href="#" className="text-sm font-semibold tracking-[0.3em]">
          {storeConfig.brandName}
<span className="text-neutral-500">/{storeConfig.brandNumber}</span>
        </a>

        <nav className="hidden items-center gap-9 text-[10px] uppercase tracking-[0.2em] text-neutral-400 md:flex">
          <a href="#collection" className="transition hover:text-white">Collection</a>
          <a href="#story" className="transition hover:text-white">Our Story</a>
          <a href="#contact" className="transition hover:text-white">Contact</a>
        </nav>

        <div className="flex items-center gap-4">
          <a href="#collection" className="hidden items-center gap-2 text-[10px] uppercase tracking-widest md:flex">
            <ShoppingBag size={15} /> Explore
          </a>
          <button
  className="md:hidden"
  aria-label={menuOpen ? 'Close menu' : 'Open menu'}
  aria-expanded={menuOpen}
  onClick={() => setMenuOpen(!menuOpen)}
>
  {menuOpen ? 'CLOSE' : <Menu size={21} />}
</button>
        </div>
      </header>
      
      <button
  onClick={async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('id')
      .limit(1)

    if (error) {
      console.error('Supabase test:', error.message)
      alert('Connection responded, but query failed: ' + error.message)
    } else {
      console.log('Supabase connected:', data)
      alert('Supabase connection successful!')
    }
  }}
>
  Test Supabase
</button>

      {menuOpen && (
  <nav className="relative z-20 border-b border-white/10 bg-[#0a0a0a] px-6 py-8 md:hidden">
    {[
      ['Collection', '#collection'],
      ['Our Story', '#story'],
      ['Contact', '#contact'],
    ].map(([label, href]) => (
      <a
        key={label}
        href={href}
        onClick={() => setMenuOpen(false)}
        className="block border-b border-white/10 py-4 text-sm uppercase tracking-[0.2em] text-neutral-300 transition hover:text-white"
      >
        {label}
      </a>
    ))}
  </nav>
)}

      <section className="relative flex min-h-[620px] flex-col justify-center overflow-hidden px-6 py-24 md:min-h-[720px] md:px-12">

  {/* Hero background video */}
  <video
    className="absolute inset-0 h-full w-full object-cover"
    src="/videos/hero.mp4"
    autoPlay
    muted
    loop
    playsInline
    preload="metadata"
    aria-hidden="true"
  />

  {/* Dark overlay for text readability */}
  <div className="absolute inset-0 bg-black/60" />

  {/* Subtle cinematic glow */}
  <div className="pointer-events-none absolute right-[-100px] top-20 h-80 w-80 rounded-full bg-neutral-700/10 blur-[120px]" />
       
        <div className="hero-reveal mb-8 flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] text-neutral-400">
          <span className="h-px w-8 bg-neutral-500" />
          {storeConfig.announcement}
        </div>

        <h1 className="hero-reveal max-w-5xl text-5xl font-light leading-[0.95] tracking-[-0.06em] sm:text-7xl md:text-8xl lg:text-[110px]">
          WEAR YOUR
          <br />
          <span className="font-serif italic text-neutral-400">own story.</span>
        </h1>

        <div className="hero-reveal mt-9 flex max-w-3xl flex-col justify-between gap-7 sm:flex-row sm:items-end">
          <p className="max-w-sm text-sm leading-7 text-neutral-400">
            Thoughtful silhouettes. Confident expression. Discover a new perspective on contemporary fashion.
          </p>

          <a
            href="#collection"
            className="group flex w-fit items-center gap-5 border-b border-white/30 pb-3 text-[10px] uppercase tracking-[0.2em] transition hover:border-white"
          >
            Discover the collection
            <ArrowDownRight size={17} className="transition-transform group-hover:translate-x-1 group-hover:translate-y-1" />
          </a>
        </div>

        <div className="absolute bottom-8 left-6 right-6 flex justify-between text-[9px] uppercase tracking-[0.2em] text-neutral-600 md:left-12 md:right-12">
          <span>Designed for individuality</span>
          <span>Scroll to explore ↓</span>
        </div>
      </section>

      <section id="collection" className="scroll-mt-8 border-t border-white/10 pt-12">
        <div className="flex items-end justify-between gap-4 px-6 md:px-12">
          <div>
            <p className="mb-3 text-[10px] uppercase tracking-[0.3em] text-neutral-500">
              001 / The collection
            </p>
            <h2 className="text-3xl font-light tracking-tight md:text-5xl">
              Pieces in motion.
            </h2>
          </div>

          <span className="hidden text-[10px] uppercase tracking-widest text-neutral-500 sm:block">
            Explore the edit ↗
          </span>
        </div>

        <FashionCarousel />

        <div className="flex justify-between border-b border-white/10 px-6 py-5 text-[9px] uppercase tracking-[0.2em] text-neutral-500 md:px-12">
          <span>Selected works / 2026</span>
          <span>Designed to move — continuously</span>
        </div>
      </section>

      <section id="story" className="grid gap-10 px-6 py-24 md:grid-cols-2 md:px-12 md:py-32">
        <p className="text-[10px] uppercase tracking-[0.3em] text-neutral-500">
          A different point of view
        </p>

        <div>
          <h2 className="max-w-xl text-3xl font-light leading-tight tracking-tight md:text-5xl">
            Style is personal.
            <span className="text-neutral-500"> Make every detail count.</span>
          </h2>
          <p className="mt-6 max-w-md text-sm leading-7 text-neutral-400">
            We believe great fashion goes beyond trends. It's about finding pieces that feel like you and making them your own.
          </p>
          <a href="#collection" className="mt-8 inline-flex items-center gap-3 text-[10px] uppercase tracking-[0.2em] hover:text-neutral-400">
            Explore our selection <ArrowUpRight size={15} />
          </a>
        </div>
      </section>

      <footer id="contact" className="border-t border-white/10 px-6 py-8 md:px-12">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <a href="#" className="text-xs font-semibold tracking-[0.3em]">
            ATELIER/01
          </a>
          <p className="text-[10px] text-neutral-500">
            A fashion concept template · 2026
          </p>
          <a href={`mailto:${storeConfig.contactEmail}`} className="text-[10px] uppercase tracking-widest text-neutral-400 hover:text-white">
            Get in touch ↗
          </a>
        </div>
      </footer>
    </main>
  )
}
