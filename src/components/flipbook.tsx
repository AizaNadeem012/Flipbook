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
  const [isMobile, setIsMobile] = useState(false);
  const [size, setSize] = useState({ w: 380, h: 540 });
  const containerRef = useRef<HTMLDivElement>(null);
  const flipRef = useRef<any>(null);
  const playTurn = usePageTurnSound(soundOn);

  // Responsive sizing — single portrait page on mobile, two-page spread on desktop
  useEffect(() => {
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
        const w = Math.min((availW - 140) / 2, 420);
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
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{ height: "100dvh", background: "oklch(0.18 0.015 60 / 0.92)", backdropFilter: "blur(8px)" }}
    >
      <div className="relative flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-2 py-3 sm:px-4 sm:py-6 min-h-0">
        {/* Top bar */}
        <div className="mb-2 flex w-full shrink-0 items-center justify-between gap-2 sm:mb-4">
          <span className="text-xs tabular-nums" style={{ color: "oklch(0.80 0.02 75)" }}>
            {currentPage + 1} / {numPages || "—"}
          </span>
          <div className="flex max-w-[70vw] items-center gap-0.5 overflow-x-auto sm:max-w-none sm:gap-1">
            {/* Zoom controls — desktop only */}
            <Button size="icon" variant="ghost" className="hidden rounded-full text-white/60 hover:text-white sm:inline-flex" onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))} aria-label="Zoom out">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="hidden rounded-full text-white/60 hover:text-white sm:inline-flex" onClick={() => setZoom((z) => Math.min(1.8, z + 0.15))} aria-label="Zoom in">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <div className="mx-1 hidden h-4 w-px bg-white/20 sm:block" />
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
        <div className="mb-2 shrink-0 text-center sm:mb-3">
          <h2 className="font-display text-sm font-medium line-clamp-1 px-2" style={{ color: "oklch(0.85 0.02 75)" }}>{title}</h2>
        </div>

        {/* Book with spine */}
        <div
          className={`flipbook-shadow flipbook-book relative max-w-full transition-transform duration-300 ${isMobile ? "flipbook-book--portrait" : ""}`}
          style={{ transform: isMobile ? undefined : `scale(${zoom})`, transformOrigin: "center center" }}
        >
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
            <div
              className="absolute left-1/2 top-1 bottom-1 -translate-x-1/2 rounded-full"
              style={{ width: 2, background: "oklch(0.40 0.04 55 / 0.25)" }}
            />
          </div>
          )}

          <Document
            file={pdfUrl}
            onLoadSuccess={({ numPages: n }) => {
              setNumPages(n);
              onPageCount?.(n);
            }}
            loading={
              <div className="flex items-center justify-center rounded-lg bg-card" style={{ width: isMobile ? size.w : size.w * 2, height: size.h }}>
                <div className="flex flex-col items-center gap-3">
                  <BookOpen className="h-8 w-8 text-primary/40 animate-pulse" />
                  <span className="text-sm text-muted-foreground">Loading catalog…</span>
                </div>
              </div>
            }
            error={
              <div className="flex items-center justify-center rounded-lg bg-card text-sm text-destructive" style={{ width: isMobile ? size.w : size.w * 2, height: size.h }}>
                Failed to load PDF
              </div>
            }
          >
            {numPages > 0 && (
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
        {numPages > 0 && (
          <div className="mt-3 flex shrink-0 items-center justify-center gap-1.5 sm:mt-5">
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
