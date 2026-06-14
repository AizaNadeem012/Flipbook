import { useEffect, useRef, useState, forwardRef, useCallback } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import HTMLFlipBook from "react-pageflip";
import { Button } from "@/components/ui/button";
import { usePageTurnSound } from "@/lib/page-turn-sound";
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Play,
  Pause,
  Download,
  ZoomIn,
  ZoomOut,
  Volume2,
  VolumeX,
  X,
  BookOpen,
} from "lucide-react";

// Worker setup (CDN, version-pinned)
if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

interface FlipbookProps {
  pdfUrl: string;
  title: string;
  onClose?: () => void;
  onPageCount?: (n: number) => void;
}

const PageView = forwardRef<HTMLDivElement, { pageNumber: number; width: number }>(
  ({ pageNumber, width }, ref) => (
    <div ref={ref} className="h-full w-full overflow-hidden bg-white" style={{ boxShadow: "inset 0 0 30px rgba(0,0,0,0.03)" }}>
      <Page
        pageNumber={pageNumber}
        width={width}
        renderAnnotationLayer={false}
        renderTextLayer={false}
        loading={
          <div className="flex h-full w-full items-center justify-center bg-secondary/40">
            <span className="text-xs text-muted-foreground">Loading…</span>
          </div>
        }
      />
    </div>
  ),
);
PageView.displayName = "PageView";

export function Flipbook({ pdfUrl, title, onClose, onPageCount }: FlipbookProps) {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [autoplay, setAutoplay] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [size, setSize] = useState({ w: 380, h: 540 });
  const containerRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<any>(null);
  const playTurn = usePageTurnSound(soundOn);

  // Responsive sizing for two-page spread
  useEffect(() => {
    function measure() {
      const availW = window.innerWidth;
      const availH = window.innerHeight - 120;
      const mobile = availW < 640;
      if (mobile) {
        const w = Math.min(availW - 64, 340);
        const h = Math.min(w * 1.42, availH);
        setSize({ w: Math.floor(w), h: Math.floor(h) });
      } else {
        // Two pages side-by-side
        const w = Math.min((availW - 140) / 2, 420);
        const h = Math.min(w * 1.42, availH);
        setSize({ w: Math.floor(w), h: Math.floor(h) });
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Autoplay
  useEffect(() => {
    if (!autoplay) return;
    const t = setInterval(() => {
      if (flipRef.current?.pageFlip) flipRef.current.pageFlip().flipNext();
    }, 3500);
    return () => clearInterval(t);
  }, [autoplay]);

  // Keyboard
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") flipRef.current?.pageFlip()?.flipNext();
      if (e.key === "ArrowLeft") flipRef.current?.pageFlip()?.flipPrev();
      if (e.key === "Escape") {
        if (document.fullscreenElement) document.exitFullscreen();
        else onClose?.();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Fullscreen state sync
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  function toggleFullscreen() {
    if (!containerRef.current) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else containerRef.current.requestFullscreen?.();
  }

  function download() {
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = `${title}.pdf`;
    a.click();
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "oklch(0.18 0.015 60 / 0.92)", backdropFilter: "blur(8px)" }}
    >
      <div className="relative flex w-full max-w-5xl flex-col items-center px-4 py-6">
        {/* Top bar */}
        <div className="mb-4 flex w-full items-center justify-between">
          <span className="text-xs tabular-nums" style={{ color: "oklch(0.80 0.02 75)" }}>
            {currentPage + 1} / {numPages || "—"}
          </span>
          <div className="flex items-center gap-1">
            {/* Zoom controls */}
            <Button size="icon" variant="ghost" className="rounded-full text-white/60 hover:text-white" onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))} aria-label="Zoom out">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="rounded-full text-white/60 hover:text-white" onClick={() => setZoom((z) => Math.min(1.8, z + 0.15))} aria-label="Zoom in">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <div className="mx-1 h-4 w-px bg-white/20" />
            <Button size="icon" variant="ghost" className="rounded-full text-white/60 hover:text-white" onClick={() => setAutoplay(v => !v)}>
              {autoplay ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button size="icon" variant="ghost" className="rounded-full text-white/60 hover:text-white" onClick={() => setSoundOn(v => !v)}>
              {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
            <Button size="icon" variant="ghost" className="rounded-full text-white/60 hover:text-white" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
            <Button size="icon" variant="ghost" className="rounded-full text-white/60 hover:text-white" onClick={download} aria-label="Download PDF">
              <Download className="h-4 w-4" />
            </Button>
            {onClose && (
              <Button size="icon" variant="ghost" className="rounded-full text-white/60 hover:text-white" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Title */}
        <div className="mb-3 text-center">
          <h2 className="font-display text-sm font-medium" style={{ color: "oklch(0.85 0.02 75)" }}>{title}</h2>
        </div>

        {/* Book with spine */}
        <div
          className="flipbook-shadow flipbook-book relative transition-transform duration-300"
          style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
        >
          {/* Center spine / binding between left & right pages */}
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
            <div
              className="absolute left-1/2 top-1 bottom-1 -translate-x-1/2 rounded-full"
              style={{ width: 2, background: "oklch(0.40 0.04 55 / 0.25)" }}
            />
          </div>

          <Document
            file={pdfUrl}
            onLoadSuccess={({ numPages: n }) => {
              setNumPages(n);
              onPageCount?.(n);
            }}
            loading={
              <div className="flex items-center justify-center rounded-lg bg-card" style={{ width: size.w * 2, height: size.h }}>
                <div className="flex flex-col items-center gap-3">
                  <BookOpen className="h-8 w-8 text-primary/40 animate-pulse" />
                  <span className="text-sm text-muted-foreground">Loading catalog…</span>
                </div>
              </div>
            }
            error={
              <div className="flex items-center justify-center rounded-lg bg-card text-sm text-destructive" style={{ width: size.w * 2, height: size.h }}>
                Failed to load PDF
              </div>
            }
          >
            {numPages > 0 && (
              <HTMLFlipBook
                ref={flipRef}
                width={size.w}
                height={size.h}
                size="fixed"
                minWidth={200}
                maxWidth={500}
                minHeight={280}
                maxHeight={700}
                showCover
                mobileScrollSupport
                flippingTime={600}
                usePortrait={false}
                startZIndex={0}
                autoSize={false}
                maxShadowOpacity={0.5}
                drawShadow
                useMouseEvents
                swipeDistance={30}
                showPageCorners
                disableFlipByClick={false}
                clickEventForward
                className=""
                style={{}}
                startPage={0}
                onFlip={(e: any) => {
                  setCurrentPage(e.data);
                  playTurn();
                }}
                onChangeOrientation={() => {}}
                onChangeState={() => {}}
                onInit={() => {}}
                onUpdate={() => {}}
              >
                {Array.from({ length: numPages }, (_, i) => (
                  <PageView key={i} pageNumber={i + 1} width={size.w} />
                ))}
              </HTMLFlipBook>
            )}
          </Document>
        </div>

        {/* Navigation arrows */}
        <button
          onClick={() => flipRef.current?.pageFlip()?.flipPrev()}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-3 transition-colors hover:bg-white/10 sm:left-4 sm:p-4"
          style={{ color: "oklch(0.90 0.01 80 / 0.6)" }}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
        </button>
        <button
          onClick={() => flipRef.current?.pageFlip()?.flipNext()}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-3 transition-colors hover:bg-white/10 sm:right-4 sm:p-4"
          style={{ color: "oklch(0.90 0.01 80 / 0.6)" }}
          aria-label="Next page"
        >
          <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
        </button>

        {/* Page dots */}
        {numPages > 0 && (
          <div className="mt-5 flex items-center justify-center gap-1.5">
            {Array.from({ length: Math.min(numPages, 20) }, (_, i) => {
              const pageIdx = i * 2; // each dot represents a spread (2 pages)
              return (
                <div
                  key={i}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: currentPage >= pageIdx && currentPage < pageIdx + 2 ? 16 : 6,
                    background: currentPage >= pageIdx && currentPage < pageIdx + 2 ? "oklch(0.78 0.055 65)" : "oklch(0.40 0.02 60)",
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
