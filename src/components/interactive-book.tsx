import { useState, useEffect, useRef, forwardRef, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import HTMLFlipBook from "react-pageflip";
import {
  BookOpen, ArrowRight, Sparkles, Monitor, Smartphone,
  FolderTree, Download, Zap, Eye, ChevronLeft, ChevronRight,
  Volume2, VolumeX, X, Maximize, Minimize, Play, Pause,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCatalogs, getCategories } from "@/lib/store";
import { usePageTurnSound } from "@/lib/page-turn-sound";

/* ═══════════════════════════════════════════════════════════
   SHARED: Colors
   ═══════════════════════════════════════════════════════════ */
const C = {
  heading: "oklch(0.35 0.08 250)",
  sub: "oklch(0.28 0.03 255)",
  body: "oklch(0.45 0.03 250)",
  muted: "oklch(0.55 0.02 250)",
  accent: "oklch(0.50 0.15 250)",
  iconBg: "oklch(0.60 0.14 250 / 0.12)",
  icon: "oklch(0.50 0.15 250 / 0.6)",
  line: "oklch(0.50 0.15 250 / 0.25)",
  bar: "oklch(0.95 0.015 245)",
  pn: "oklch(0.65 0.02 250)",
  cream: "oklch(0.985 0.005 250)",
  dark: "oklch(0.30 0.08 250)",
};

function PageNum({ n }: { n: number }) {
  return <div className="absolute bottom-3 left-0 right-0 text-center text-[9px]" style={{ color: C.pn }}>{String(n).padStart(2, "0")}</div>;
}

/* ═══════════════════════════════════════════════════════════
   FLIPBOOK PAGES (single portrait pages for react-pageflip)
   ═══════════════════════════════════════════════════════════ */
const FlipPage = forwardRef<HTMLDivElement, { children: React.ReactNode }>(({ children }, ref) => (
  <div ref={ref} className="h-full w-full overflow-hidden bg-white" style={{ boxShadow: "inset 0 0 30px rgba(0,0,0,0.03)" }}>{children}</div>
));
FlipPage.displayName = "FlipPage";

const bookPages: React.ReactNode[] = [
  /* ── 1  COVER ── */
  <div className="relative flex h-full w-full flex-col justify-between" style={{ background: "linear-gradient(155deg, oklch(0.50 0.15 250), oklch(0.32 0.10 255))" }}>
    <div className="pointer-events-none absolute inset-4 rounded-lg border border-white/10" />
    <div className="relative z-10 p-6 sm:p-8">
      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-widest" style={{ background: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.70)" }}>
        <Sparkles className="h-3 w-3" /> Digital Catalog
      </span>
    </div>
    <div className="relative z-10 p-6 sm:p-8">
      <h3 className="font-display text-3xl leading-tight sm:text-4xl md:text-5xl" style={{ color: C.cream }}>Folio</h3>
      <h3 className="font-display text-3xl leading-tight italic sm:text-4xl md:text-5xl" style={{ color: "oklch(0.985 0.012 80 / 0.80)" }}>Catalogs</h3>
      <div className="mt-3 h-0.5 w-12" style={{ background: "oklch(0.985 0.012 80 / 0.35)" }} />
      <p className="mt-3 text-xs uppercase tracking-wider" style={{ color: "oklch(0.985 0.012 80 / 0.50)" }}>Interactive Reader</p>
    </div>
    <div className="relative z-10 flex items-center gap-3 p-6 sm:p-8">
      <div className="grid h-9 w-9 place-items-center rounded-full" style={{ background: "rgba(255,255,255,0.10)" }}>
        <BookOpen className="h-4 w-4" style={{ color: "rgba(255,255,255,0.70)" }} />
      </div>
      <span className="text-xs" style={{ color: "rgba(255,255,255,0.50)" }}>Collection 2026</span>
    </div>
  </div>,

  /* ── 2  Welcome ── */
  <div className="flex h-full flex-col items-center justify-center p-8 text-center">
    <div className="rounded-full p-4" style={{ background: C.iconBg }}><BookOpen className="h-8 w-8" style={{ color: C.icon }} /></div>
    <h2 className="mt-5 font-display text-2xl sm:text-3xl" style={{ color: C.heading }}>Welcome to</h2>
    <h2 className="font-display text-2xl italic sm:text-3xl" style={{ color: C.heading }}>Folio</h2>
    <div className="mx-auto mt-2 h-0.5 w-10" style={{ background: C.line }} />
    <p className="mt-5 text-xs leading-relaxed sm:text-sm" style={{ color: C.body }}>Your premium digital reading room for PDF catalogs — designed with a quiet, paper-warm interface.</p>
    <p className="mt-6 text-[11px] italic" style={{ color: C.muted }}>"Reading should feel like holding a real book."</p>
    <PageNum n={1} />
  </div>,

  /* ── 3  Features ── */
  <div className="flex h-full flex-col justify-center p-6 sm:p-8">
    <p className="text-[10px] font-medium uppercase tracking-widest" style={{ color: C.muted }}>Chapter 01</p>
    <h4 className="mt-1.5 font-display text-xl sm:text-2xl" style={{ color: C.sub }}>Key Features</h4>
    <div className="mt-1.5 h-0.5 w-6" style={{ background: C.line }} />
    <div className="mt-6 space-y-4">
      {[
        { icon: BookOpen, label: "Realistic 3D page flip" },
        { icon: Eye, label: "Zoom up to 1.8×" },
        { icon: Monitor, label: "Fullscreen reading mode" },
        { icon: Zap, label: "Auto-play slideshow" },
        { icon: Download, label: "Download PDFs" },
      ].map(({ icon: Icon, label }, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg" style={{ background: C.iconBg }}><Icon className="h-4 w-4" style={{ color: C.icon }} /></div>
          <span className="text-xs sm:text-sm" style={{ color: C.body }}>{label}</span>
        </div>
      ))}
    </div>
    <PageNum n={2} />
  </div>,

  /* ── 4  Reading Experience ── */
  <div className="flex h-full flex-col p-6 sm:p-8">
    <p className="text-[10px] font-medium uppercase tracking-widest" style={{ color: C.muted }}>Chapter 02</p>
    <h4 className="mt-1.5 font-display text-xl sm:text-2xl" style={{ color: C.sub }}>Reading Experience</h4>
    <div className="mt-1.5 h-0.5 w-6" style={{ background: C.line }} />
    <p className="mt-5 text-[10px] font-medium uppercase tracking-widest" style={{ color: C.muted }}>Soundscape</p>
    <div className="mt-3 flex items-end justify-center gap-[3px]" style={{ height: 56 }}>
      {[30,50,70,90,100,85,65,45,55,75,95,80,60,40,50,70,85,60,40,25].map((h, i) => (
        <div key={i} className="rounded-full" style={{ width: 4, height: `${h}%`, background: `oklch(0.50 0.15 250 / ${0.2 + (h/100)*0.5})` }} />
      ))}
    </div>
    <p className="mt-4 text-center text-[11px] leading-relaxed" style={{ color: C.body }}>Subtle audio feedback for each page turn — toggle on/off anytime.</p>
    <div className="mt-auto space-y-2.5">
      {[{icon:Monitor,label:"Fullscreen mode"},{icon:Zap,label:"Auto-play slideshow"}].map(({icon:Icon,label},i)=>(
        <div key={i} className="flex items-center gap-2"><Icon className="h-3.5 w-3.5 shrink-0" style={{color:C.icon}} /><span className="text-[11px]" style={{color:C.body}}>{label}</span></div>
      ))}
    </div>
    <PageNum n={3} />
  </div>,

  /* ── 5  Organization ── */
  <div className="flex h-full flex-col p-6 sm:p-8">
    <p className="text-[10px] font-medium uppercase tracking-widest" style={{ color: C.muted }}>Chapter 03</p>
    <h4 className="mt-1.5 font-display text-xl sm:text-2xl" style={{ color: C.sub }}>Smart Organization</h4>
    <div className="mt-1.5 h-0.5 w-6" style={{ background: C.line }} />
    <div className="mt-5 space-y-2.5">
      {[
        {depth:0,icon:FolderTree,label:"Catalogs"},{depth:1,label:"Fashion"},{depth:2,label:"Spring 2026"},{depth:2,label:"Winter 2026"},
        {depth:1,label:"Electronics"},{depth:2,label:"Audio"},{depth:1,label:"Home & Living"},
      ].map(({depth,icon:Icon,label},i)=>(
        <div key={i} className="flex items-center gap-1.5" style={{paddingLeft:depth*20}}>
          {Icon?<Icon className="h-3.5 w-3.5 shrink-0" style={{color:C.icon}}/>:<div className="h-1.5 w-1.5 shrink-0 rounded-full" style={{background:"oklch(0.50 0.15 250 / 0.4)"}}/>}
          <span className="text-xs sm:text-sm" style={{color:depth===0?C.sub:C.body,fontWeight:depth===0?600:400}}>{label}</span>
        </div>
      ))}
    </div>
    <p className="mt-5 text-[11px] leading-relaxed" style={{color:C.body}}>Unlimited nested categories keep everything discoverable.</p>
    <PageNum n={4} />
  </div>,

  /* ── 6  Search ── */
  <div className="flex h-full flex-col p-6 sm:p-8">
    <p className="text-[10px] font-medium uppercase tracking-widest" style={{ color: C.muted }}>Chapter 04</p>
    <h4 className="mt-1.5 font-display text-xl sm:text-2xl" style={{ color: C.sub }}>Find Anything</h4>
    <div className="mt-1.5 h-0.5 w-6" style={{ background: C.line }} />
    <div className="mt-5">
      <div className="flex items-center gap-2 rounded-lg border px-3 py-2.5" style={{borderColor:"oklch(0.91 0.015 245)",background:"oklch(0.99 0.005 250)"}}>
        <svg className="h-4 w-4 shrink-0" style={{color:C.muted}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <span className="text-xs" style={{color:C.muted}}>Search catalogs...</span>
      </div>
      <div className="mt-3 space-y-2.5">
        {["Spring Collection 2026","Audio Equipment Catalog","Premium Furniture Guide"].map((t,i)=>(
          <div key={i} className="flex items-center gap-2 rounded-lg px-3 py-2.5" style={{background:"oklch(0.97 0.01 250)"}}>
            <BookOpen className="h-3.5 w-3.5 shrink-0" style={{color:C.icon}}/><span className="text-xs sm:text-sm" style={{color:C.body}}>{t}</span>
          </div>
        ))}
      </div>
    </div>
    <PageNum n={5} />
  </div>,

  /* ── 7  Read Anywhere ── */
  <div className="flex h-full flex-col p-6 sm:p-8">
    <p className="text-[10px] font-medium uppercase tracking-widest" style={{ color: C.muted }}>Chapter 05</p>
    <h4 className="mt-1.5 font-display text-xl sm:text-2xl" style={{ color: C.sub }}>Read Anywhere</h4>
    <div className="mt-1.5 h-0.5 w-6" style={{ background: C.line }} />
    <div className="mt-6 flex items-center justify-center gap-6">
      {[{icon:Monitor,label:"Desktop"},{icon:Smartphone,label:"Mobile"}].map(({icon:Icon,label},i)=>(
        <div key={i} className="flex flex-col items-center gap-2">
          <div className="rounded-xl p-4" style={{background:C.iconBg}}><Icon className="h-7 w-7" style={{color:C.icon}}/></div>
          <span className="text-[11px]" style={{color:C.body}}>{label}</span>
        </div>
      ))}
    </div>
    <div className="mt-7 space-y-3">
      {[{icon:Download,label:"Install to home screen"},{icon:Zap,label:"Offline-first PWA"},{icon:Sparkles,label:"Fullscreen experience"}].map(({icon:Icon,label},i)=>(
        <div key={i} className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{background:C.iconBg}}><Icon className="h-4 w-4" style={{color:C.icon}}/></div>
          <span className="text-xs sm:text-sm" style={{color:C.body}}>{label}</span>
        </div>
      ))}
    </div>
    <PageNum n={6} />
  </div>,

  /* ── 8  Back Cover ── */
  <div className="flex h-full flex-col items-center justify-center p-8 text-center" style={{background:"linear-gradient(155deg, oklch(0.96 0.015 245), oklch(0.93 0.025 250))"}}>
    <div className="rounded-full p-4" style={{background:"oklch(0.50 0.15 250 / 0.12)"}}><Sparkles className="h-8 w-8" style={{color:C.accent}}/></div>
    <h3 className="mt-4 font-display text-2xl italic sm:text-3xl" style={{color:C.heading}}>Folio</h3>
    <p className="mt-2 text-xs sm:text-sm" style={{color:C.body}}>Premium catalogs deserve a premium reader.</p>
    <div className="mx-auto mt-2 h-0.5 w-8" style={{background:C.line}}/>
    <p className="mt-6 text-[10px] font-medium uppercase tracking-widest" style={{color:C.muted}}>Browse catalogs to begin</p>
    <div className="mt-3 flex items-center gap-1.5 text-sm font-medium" style={{color:C.accent}}>Get Started <ArrowRight className="h-4 w-4"/></div>
  </div>,
];

/* ═══════════════════════════════════════════════════════════
   FULLSCREEN FLIPBOOK MODAL
   ═══════════════════════════════════════════════════════════ */
function BookModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const flipRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [autoplay, setAutoplay] = useState(false);
  const [isFS, setIsFS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [size, setSize] = useState({ w: 380, h: 540 });
  const playTurn = usePageTurnSound(soundOn);
  const total = bookPages.length;

  // Responsive sizing — single portrait page on mobile, two-page spread on desktop
  useEffect(() => {
    if (!open) return;
    function measure() {
      const vp = window.visualViewport;
      const availW = vp?.width ?? window.innerWidth;
      const availH = vp?.height ?? window.innerHeight;
      const mobile = availW < 640;
      setIsMobile(mobile);

      if (mobile) {
        const chrome = 108;
        const w = Math.min(availW - 48, 360);
        const h = Math.min(Math.floor(w * 1.42), availH - chrome);
        setSize({ w: Math.floor(w), h: Math.max(280, h) });
      } else {
        const w = Math.min((availW - 140) / 2, 380);
        const h = Math.min(w * 1.42, availH - 120);
        setSize({ w: Math.floor(w), h: Math.floor(h) });
      }
    }
    measure();
    window.addEventListener("resize", measure);
    window.visualViewport?.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
    };
  }, [open]);

  // Autoplay
  useEffect(() => {
    if (!autoplay || !open) return;
    const t = setInterval(() => flipRef.current?.pageFlip()?.flipNext(), 3500);
    return () => clearInterval(t);
  }, [autoplay, open]);

  // Keyboard
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") flipRef.current?.pageFlip()?.flipNext();
      if (e.key === "ArrowLeft") flipRef.current?.pageFlip()?.flipPrev();
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Fullscreen
  useEffect(() => {
    const h = () => setIsFS(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  function toggleFS() {
    if (!containerRef.current) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else containerRef.current.requestFullscreen?.();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ height: "100dvh", background: "oklch(0.18 0.015 60 / 0.92)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div ref={containerRef} className="relative flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-2 py-3 sm:px-4 sm:py-6 min-h-0">
        {/* Top bar */}
        <div className="mb-2 flex w-full shrink-0 items-center justify-between gap-2 sm:mb-4">
          <span className="text-xs tabular-nums" style={{ color: "oklch(0.80 0.015 245)" }}>
            {page + 1} / {total}
          </span>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="rounded-full text-white/60 hover:text-white" onClick={() => setAutoplay(v => !v)}>
              {autoplay ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button size="icon" variant="ghost" className="rounded-full text-white/60 hover:text-white" onClick={() => setSoundOn(v => !v)}>
              {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button size="icon" variant="ghost" className="rounded-full text-white/60 hover:text-white" onClick={toggleFS}>
              {isFS ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
            <Button size="icon" variant="ghost" className="rounded-full text-white/60 hover:text-white" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Flipbook — portrait single page on mobile, spread on desktop */}
        <div className={`flipbook-shadow flipbook-book relative max-w-full ${isMobile ? "flipbook-book--portrait" : ""}`}>
          {/* Center spine — desktop spread only */}
          {!isMobile && (
          <div
            className="pointer-events-none absolute z-30"
            style={{
              left: "50%",
              top: 0,
              bottom: 0,
              width: 18,
              transform: "translateX(-50%)",
              background: "linear-gradient(90deg, oklch(0 0 0 / 0.12) 0%, oklch(0 0 0 / 0.04) 25%, oklch(0 0 0 / 0.0) 40%, oklch(0 0 0 / 0.0) 60%, oklch(0 0 0 / 0.04) 75%, oklch(0 0 0 / 0.12) 100%)",
              boxShadow: "0 0 12px oklch(0 0 0 / 0.08)",
            }}
          >
            {/* Thin binding line */}
            <div
              className="absolute left-1/2 top-1 bottom-1 -translate-x-1/2 rounded-full"
              style={{
                width: 2,
                background: "oklch(0.40 0.04 55 / 0.25)",
              }}
            />
          </div>
          )}
          <HTMLFlipBook
            key={`${size.w}x${size.h}-${isMobile ? "portrait" : "spread"}`}
            ref={flipRef}
            width={size.w}
            height={size.h}
            size="fixed"
            minWidth={180}
            maxWidth={500}
            minHeight={260}
            maxHeight={700}
            showCover
            mobileScrollSupport
            flippingTime={600}
            usePortrait={isMobile}
            startZIndex={0}
            autoSize={false}
            maxShadowOpacity={0.5}
            drawShadow
            useMouseEvents
            swipeDistance={isMobile ? 50 : 30}
            showPageCorners
            disableFlipByClick={false}
            clickEventForward
            className=""
            style={{}}
            startPage={0}
            onFlip={(e: any) => { setPage(e.data); playTurn(); }}
            onChangeOrientation={() => {}}
            onChangeState={() => {}}
            onInit={() => {}}
            onUpdate={() => {}}
          >
            {bookPages.map((content, i) => (
              <FlipPage key={i}>{content}</FlipPage>
            ))}
          </HTMLFlipBook>
        </div>

        {/* Navigation arrows */}
        <button
          onClick={() => flipRef.current?.pageFlip()?.flipPrev()}
          className="absolute left-0 top-1/2 z-40 -translate-y-1/2 rounded-full p-2 transition-colors hover:bg-white/10 sm:left-4 sm:p-4"
          style={{ color: "oklch(0.90 0.01 80 / 0.6)" }}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-5 w-5 sm:h-8 sm:w-8" />
        </button>
        <button
          onClick={() => flipRef.current?.pageFlip()?.flipNext()}
          className="absolute right-0 top-1/2 z-40 -translate-y-1/2 rounded-full p-2 transition-colors hover:bg-white/10 sm:right-4 sm:p-4"
          style={{ color: "oklch(0.90 0.01 80 / 0.6)" }}
          aria-label="Next page"
        >
          <ChevronRight className="h-5 w-5 sm:h-8 sm:w-8" />
        </button>

        {/* Page dots */}
        <div className="mt-3 flex shrink-0 items-center justify-center gap-1.5 sm:mt-5">
          {Array.from({ length: total }, (_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === page ? 16 : 6,
                background: i === page ? "oklch(0.60 0.14 250)" : "oklch(0.40 0.02 250)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   HOMEPAGE: Portrait Book Cover + Modal trigger
   ═══════════════════════════════════════════════════════════ */
export function InteractiveBook() {
  const [modalOpen, setModalOpen] = useState(false);
  const [stats, setStats] = useState({ catalogs: 0, categories: 0 });

  useEffect(() => {
    setStats({ catalogs: getCatalogs().length, categories: getCategories().length });
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [modalOpen]);

  return (
    <>
      {/* ─── Portrait Book Cover on Homepage ─── */}
      <div className="relative mx-auto mt-10 flex flex-col items-center sm:mt-14">
        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ width: 500, height: 600, background: "radial-gradient(ellipse, oklch(0.60 0.14 250 / 0.15), transparent 70%)" }}
        />

        {/* Book cover — portrait, tall */}
        <button
          onClick={() => setModalOpen(true)}
          className="group relative cursor-pointer select-none focus:outline-none"
          style={{ perspective: "1200px" }}
        >
          <div
            className="relative transition-transform duration-500"
            style={{
              width: "min(72vw, 280px)",
              aspectRatio: "3/4.2",
              transformStyle: "preserve-3d",
              transform: "rotateY(-5deg)",
            }}
          >
            {/* Book shadow on surface */}
            <div
              className="pointer-events-none absolute -bottom-4 left-[8%] right-[8%]"
              style={{
                height: 24,
                background: "radial-gradient(ellipse, oklch(0.30 0.08 250 / 0.25), transparent 70%)",
                filter: "blur(8px)",
              }}
            />

            {/* Spine (left edge) */}
            <div
              className="absolute left-0 top-0 h-full rounded-l-md"
              style={{
                width: 18,
                background: "linear-gradient(90deg, oklch(0.34 0.08 250), oklch(0.44 0.10 250))",
                boxShadow: "inset -2px 0 6px oklch(0 0 0 / 0.35)",
                zIndex: 5,
              }}
            >
              <div className="flex h-full flex-col items-center justify-center gap-1.5">
                <div className="h-px w-2 bg-white/20" />
                <div className="h-6 w-px bg-white/15" />
                <div className="h-px w-2 bg-white/20" />
              </div>
            </div>

            {/* Page edges (right edge) */}
            <div
              className="absolute right-0 top-[4px] bottom-[4px] rounded-r-sm"
              style={{
                width: 8,
                background: "repeating-linear-gradient(180deg, oklch(0.96 0.01 250) 0px, oklch(0.91 0.015 245) 1px, oklch(0.96 0.01 250) 2px)",
                borderRight: "1px solid oklch(0.86 0.015 245)",
                zIndex: 1,
              }}
            />

            {/* Main cover face */}
            <div
              className="absolute inset-0 overflow-hidden rounded-r-lg"
              style={{
                marginLeft: 18,
                marginRight: 8,
                background: "linear-gradient(155deg, oklch(0.50 0.15 250), oklch(0.32 0.10 255))",
                boxShadow: "4px 8px 30px oklch(0.30 0.08 250 / 0.3), 1px 2px 8px oklch(0.30 0.08 250 / 0.15)",
                transition: "transform 0.5s cubic-bezier(0.23,1,0.32,1), box-shadow 0.5s",
              }}
            >
              {/* Decorative border */}
              <div className="pointer-events-none absolute inset-4 rounded-lg border border-white/10" />

              {/* Cover content */}
              <div className="relative flex h-full flex-col justify-between p-5 sm:p-7">
                {/* Top badge */}
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-medium uppercase tracking-widest" style={{ background: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.70)" }}>
                    <Sparkles className="h-2.5 w-2.5" /> Digital Catalog
                  </span>
                </div>

                {/* Title block */}
                <div>
                  <h3 className="font-display text-2xl leading-tight sm:text-3xl" style={{ color: C.cream }}>Folio</h3>
                  <h3 className="font-display text-2xl leading-tight italic sm:text-3xl" style={{ color: "oklch(0.985 0.012 80 / 0.80)" }}>Catalogs</h3>
                  <div className="mt-2 h-0.5 w-8" style={{ background: "oklch(0.985 0.012 80 / 0.35)" }} />
                  <p className="mt-2 text-[10px] uppercase tracking-wider" style={{ color: "oklch(0.985 0.012 80 / 0.50)" }}>Interactive Reader</p>
                </div>

                {/* Bottom info */}
                <div className="flex items-center gap-2.5">
                  <div className="grid h-8 w-8 place-items-center rounded-full" style={{ background: "rgba(255,255,255,0.10)" }}>
                    <BookOpen className="h-3.5 w-3.5" style={{ color: "rgba(255,255,255,0.70)" }} />
                  </div>
                  <div>
                    <span className="block text-[10px]" style={{ color: "rgba(255,255,255,0.60)" }}>
                      {stats.catalogs > 0 ? `${stats.catalogs} catalogs` : "Collection 2026"}
                    </span>
                    <span className="block text-[9px]" style={{ color: "rgba(255,255,255,0.35)" }}>Click to open</span>
                  </div>
                </div>
              </div>

              {/* Hover shimmer */}
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background: "linear-gradient(135deg, transparent 30%, oklch(1 0 0 / 0.06) 50%, transparent 70%)",
                }}
              />
            </div>
          </div>
        </button>

        {/* Page indicator preview */}
        <div className="mt-6 flex items-center gap-1">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="h-1 rounded-full" style={{ width: i === 0 ? 14 : 5, background: i === 0 ? C.accent : "oklch(0.82 0.015 245)" }} />
          ))}
        </div>

        {/* CTA */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="rounded-full px-7 shadow-soft">
            <Link to="/browse">
              Browse catalogs <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="rounded-full border-border/80 bg-card/60 px-7">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>

        {stats.catalogs > 0 && (
          <p className="mt-5 text-center text-xs uppercase tracking-widest text-muted-foreground">
            {stats.catalogs} catalogs · {stats.categories} categories
          </p>
        )}
      </div>

      {/* ─── Fullscreen Flipbook Modal ─── */}
      <BookModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
