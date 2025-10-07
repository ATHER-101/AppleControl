import { useEffect, useRef, useState } from "react";

export default function Trackpad({ socket }) {
  const padRef = useRef(null);
  const scrollRef = useRef(null);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const pad = padRef.current;
    const scroll = scrollRef.current;
    if (!pad || !scroll || !socket) return;

    // ===== Cursor Control =====
    let pointerActive = false;
    let startX = 0, startY = 0, lastX = 0, lastY = 0;
    let moved = false;
    let startTime = 0;
    let clickLock = false; // Prevents left click after right click

    const getPos = (e) => ({
      x: e.clientX ?? e.touches?.[0]?.clientX,
      y: e.clientY ?? e.touches?.[0]?.clientY,
    });

    const onDown = (e) => {
      e.preventDefault();
      if (clickLock) return;
      const { x, y } = getPos(e);
      pointerActive = true;
      moved = false;
      startTime = Date.now();
      startX = lastX = x;
      startY = lastY = y;
      pad.setPointerCapture?.(e.pointerId);
    };

    const onMove = (e) => {
      e.preventDefault();
      if (!pointerActive || !socket || socket.disconnected || clickLock) return;
      const { x, y } = getPos(e);
      const dx = x - lastX;
      const dy = y - lastY;
      if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
        socket.emit("move", { dx: dx * 1.5, dy: dy * 1.5 });
        moved = true;
      }
      lastX = x;
      lastY = y;
    };

    const onUp = (e) => {
      e.preventDefault();
      if (clickLock) return;
      pointerActive = false;
      const duration = Date.now() - startTime;

      // Treat as click if short + not moved
      if (!moved && duration < 250) {
        const { x, y } = getPos(e);
        const rect = pad.getBoundingClientRect();
        const isRightClickZone =
          x > rect.right - rect.width * 0.3 &&
          y > rect.bottom - rect.height * 0.3;

        if (isRightClickZone) {
          socket.emit("rightClick");
          setFlash(true);
          clickLock = true;
          setTimeout(() => (clickLock = false), 200);
          setTimeout(() => setFlash(false), 150);
        } else {
          socket.emit("click");
        }
      }
    };

    pad.addEventListener("pointerdown", onDown);
    pad.addEventListener("pointermove", onMove);
    pad.addEventListener("pointerup", onUp);
    pad.addEventListener("pointercancel", onUp);
    pad.addEventListener("pointerleave", onUp);

    // ===== Scroll Strip =====
    let scrolling = false;
    let scrollLastY = 0; // ✅ renamed from lastY

    const onScrollDown = (e) => {
      e.preventDefault();
      scrolling = true;
      scrollLastY = e.clientY ?? e.touches?.[0]?.clientY;
    };

    const onScrollMove = (e) => {
      if (!scrolling || !socket || socket.disconnected) return;
      e.preventDefault();
      const y = e.clientY ?? e.touches?.[0]?.clientY;
      const dy = y - scrollLastY;
      if (Math.abs(dy) > 0) socket.emit("scroll", { dy: dy * -1 });
      scrollLastY = y;
    };

    const onScrollUp = (e) => {
      e.preventDefault();
      scrolling = false;
    };

    scroll.addEventListener("pointerdown", onScrollDown);
    scroll.addEventListener("pointermove", onScrollMove);
    scroll.addEventListener("pointerup", onScrollUp);
    scroll.addEventListener("pointercancel", onScrollUp);
    scroll.addEventListener("pointerleave", onScrollUp);

    return () => {
      pad.removeEventListener("pointerdown", onDown);
      pad.removeEventListener("pointermove", onMove);
      pad.removeEventListener("pointerup", onUp);
      pad.removeEventListener("pointercancel", onUp);
      pad.removeEventListener("pointerleave", onUp);

      scroll.removeEventListener("pointerdown", onScrollDown);
      scroll.removeEventListener("pointermove", onScrollMove);
      scroll.removeEventListener("pointerup", onScrollUp);
      scroll.removeEventListener("pointercancel", onScrollUp);
      scroll.removeEventListener("pointerleave", onScrollUp);
    };
  }, [socket]);

  return (
    <div className="flex justify-center items-center w-full mt-4">
      {/* Main Trackpad */}
      <div
        ref={padRef}
        className="relative w-[75%] h-[60vh] bg-gray-100 border-2 border-gray-300 rounded-l-2xl select-none touch-none overflow-hidden"
      >
        {/* Right-click zone highlight */}
        <div
          className={`absolute bottom-0 right-0 w-[30%] h-[30%] rounded-br-2xl pointer-events-none transition-all duration-150 ${
            flash ? "bg-blue-400 bg-opacity-60" : "bg-blue-200 bg-opacity-30"
          }`}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="opacity-40 text-sm text-gray-600 text-center px-4">
            Move finger to move cursor • Tap to left click • Bottom-right to right click
          </span>
        </div>
      </div>

      {/* Scroll Strip */}
      <div
        ref={scrollRef}
        className="w-[15%] h-[60vh] bg-gray-200 border-t-2 border-b-2 border-r-2 border-gray-300 rounded-r-2xl select-none touch-none flex items-center justify-center"
      >
        <span className="text-xs text-gray-500 opacity-60 -rotate-90">
          Scroll
        </span>
      </div>
    </div>
  );
}