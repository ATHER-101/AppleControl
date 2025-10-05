import { useEffect, useRef, useState } from "react";

export default function Trackpad({ socket }) {
  const padRef = useRef(null);
  const [flash, setFlash] = useState(false); // for the blue flash animation

  useEffect(() => {
    const pad = padRef.current;
    if (!pad || !socket) return;

    let pointerActive = false;
    let startX = 0, startY = 0;
    let lastX = 0, lastY = 0;
    let moved = false;
    let startTime = 0;
    let clickLock = false; // prevents extra move after right-click

    const getPos = (e) => ({
      x: e.clientX ?? e.touches?.[0]?.clientX,
      y: e.clientY ?? e.touches?.[0]?.clientY,
    });

    const onDown = (e) => {
      e.preventDefault();
      if (clickLock) return; // skip input briefly after right-click
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

      // treat as a click if short + not moved
      if (!moved && duration < 250) {
        const { x, y } = getPos(e);
        const rect = pad.getBoundingClientRect();

        const isRightClickZone =
          x > rect.right - rect.width * 0.3 &&
          y > rect.bottom - rect.height * 0.3;

        if (isRightClickZone) {
          socket.emit("rightClick");
          setFlash(true); // trigger visual feedback
          clickLock = true; // prevent immediate next events
          setTimeout(() => {
            clickLock = false;
          }, 200); // delay to prevent move/left click from cancelling menu
          setTimeout(() => setFlash(false), 150); // hide flash
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

    return () => {
      pad.removeEventListener("pointerdown", onDown);
      pad.removeEventListener("pointermove", onMove);
      pad.removeEventListener("pointerup", onUp);
      pad.removeEventListener("pointercancel", onUp);
      pad.removeEventListener("pointerleave", onUp);
    };
  }, [socket]);

  return (
    <div
      ref={padRef}
      className="relative w-[90%] h-[60vh] bg-gray-100 border-2 border-gray-300 rounded-2xl select-none touch-none mb-4 overflow-hidden"
    >
      {/* right-click zone */}
      <div
        className={`absolute bottom-0 right-0 w-[30%] h-[30%] rounded-br-2xl pointer-events-none transition-all duration-150 ${
          flash
            ? "bg-blue-400 bg-opacity-60"
            : "bg-blue-200 bg-opacity-30"
        }`}
      />

      {/* hint text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="opacity-40 text-sm text-gray-600 text-center">
          Tap to left click • Tap bottom-right to right click • Drag to move cursor
        </span>
      </div>
    </div>
  );
}