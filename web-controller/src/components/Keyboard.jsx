import { useState, useRef, useEffect } from "react";

export default function Keyboard({ socket }) {
  const [pressed, setPressed] = useState(new Set());
  const [lockedModifiers, setLockedModifiers] = useState(new Set());
  const [capsLockActive, setCapsLockActive] = useState(false);
  const holdTimers = useRef({});
  const releaseTimers = useRef({});
  const activeKeyRef = useRef(null);

  const layout = [
    ["esc", "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9", "f10", "f11", "f12", "delete"],
    ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "backspace"],
    ["tab", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]", "\\"],
    ["caps_lock", "a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'", "enter"],
    ["shift", "z", "x", "c", "v", "b", "n", "m", ",", ".", "/", "shift"],
    ["fn", "control", "option", "command", "space", "command", "option", "left", "up", "down", "right"],
  ];

  const modifierKeys = ["shift", "control", "command", "option", "fn"];

  const macSpecialKeys = {
    f1: "brightnessDown", f2: "brightnessUp", f3: "missionControl",
    f4: "spotlightSearch", f5: "dictation", f6: "focusMode",
    f7: "previousTrack", f8: "playPause", f9: "nextTrack",
    f10: "mute", f11: "volumeDown", f12: "volumeUp",
  };

  const shiftMap = {
    "`": "~", "1": "!", "2": "@", "3": "#", "4": "$", "5": "%", "6": "^", "7": "&",
    "8": "*", "9": "(", "0": ")", "-": "_", "=": "+", "[": "{", "]": "}", "\\": "|",
    ";": ":", "'": '"', ",": "<", ".": ">", "/": "?"
  };

  const prettyLabel = (key) => {
    const map = {
      esc: "⎋", delete: "⌦", backspace: "⌫", caps_lock: "⇪",
      shift: "⇧", control: "⌃", option: "⌥", command: "⌘",
      enter: "⏎", tab: "⇥", up: "↑", down: "↓", left: "←", right: "→",
      space: "␣", fn: "fn"
    };
    return map[key] || key;
  };

  // --- Key sending logic ---
  const sendKeyTap = (key, activeModifiers = []) => {
    if (!socket || socket.disconnected) return;

    // Handle Caps Lock using Shift
    let modifiers = [...activeModifiers];
    if (capsLockActive && key.match(/^[a-z]$/)) {
      modifiers.push("shift");
    }

    if (key === "caps_lock") {
      setCapsLockActive(prev => !prev);
      socket.emit("toggleCapsLock"); // toggle system caps lock
      return;
    }

    // Only treat f1-f12 as special mac keys
    if (/^f([1-9]|1[0-2])$/.test(key)) {
      if (modifiers.includes("fn")) {
        socket.emit("keyTap", key, modifiers);
      } else {
        const macAction = macSpecialKeys[key];
        if (macAction) {
          socket.emit("specialKey", macAction);
          return;
        }
      }
    } else {
      socket.emit("keyTap", key, modifiers);
    }
    console.log("🎹 keyTap:", key, "mods:", modifiers);
  };

  const toggleModifier = (key, state) => {
    const next = new Set(lockedModifiers);
    if (state) {
      next.add(key);
      socket.emit("keyDown", key);
    } else {
      next.delete(key);
      socket.emit("keyUp", key);
    }
    setLockedModifiers(next);
  };

  const handlePress = (key, type) => {
    const normalized = key.toLowerCase();
    if (!socket || socket.disconnected) return;

    if (type === "down") activeKeyRef.current = normalized;

    // --- Modifier keys ---
    if (modifierKeys.includes(normalized)) {
      const isLocked = lockedModifiers.has(normalized);

      if (type === "down") {
        if (isLocked) {
          toggleModifier(normalized, false); // unlock if tapped again
          return;
        }
        setPressed(prev => new Set(prev).add(normalized));
        holdTimers.current[normalized] = setTimeout(() => {
          toggleModifier(normalized, true); // lock if long press
        }, 500);
        socket.emit("keyDown", normalized);
      } else if (type === "up") {
        clearTimeout(holdTimers.current[normalized]);
        queueRelease(normalized);
        if (!lockedModifiers.has(normalized)) socket.emit("keyUp", normalized);
      }
      return;
    }

    // --- Normal keys ---
    if (type === "down") {
      setPressed(prev => new Set(prev).add(normalized));

      const activeModifiers = [
        ...lockedModifiers,
        ...Array.from(pressed).filter(k => modifierKeys.includes(k))
      ];

      sendKeyTap(normalized, activeModifiers);

      // Auto-release temporary modifiers
      activeModifiers.forEach(mod => socket.emit("keyUp", mod));
      setLockedModifiers(new Set());
    } else if (type === "up") {
      queueRelease(normalized);
    }
  };

  const queueRelease = (key) => {
    clearTimeout(releaseTimers.current[key]);
    releaseTimers.current[key] = setTimeout(() => {
      setPressed(prev => {
        const copy = new Set(prev);
        copy.delete(key);
        return copy;
      });
    }, 100); // visible highlight for quick taps
  };

  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (activeKeyRef.current) {
        const key = activeKeyRef.current;
        queueRelease(key);
        activeKeyRef.current = null;
      }
    };
    document.addEventListener("pointerup", handleGlobalPointerUp);
    return () => document.removeEventListener("pointerup", handleGlobalPointerUp);
  }, []);

  const renderKey = (key) => {
    const normalized = key.toLowerCase();
    const isLocked = lockedModifiers.has(normalized);
    const isPressed = pressed.has(normalized);

    // Caps Lock highlight
    const isCapsActive = key === "caps_lock" && capsLockActive;

    const wide =
      key === "space"
        ? "w-[250px]"
        : ["shift", "command", "option", "control", "caps_lock", "tab", "enter", "backspace", "delete"].includes(key)
          ? "w-[70px]"
          : "w-[40px]";

    const mainLabel = prettyLabel(key);
    const upperLabel = shiftMap[key];
    const macIcon =
      macSpecialKeys[key] && !pressed.has("fn")
        ? macSpecialKeys[key].replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())
        : null;

    const bgClass = isLocked || isCapsActive
      ? "bg-blue-500 text-white"
      : isPressed
        ? "bg-blue-300"
        : "bg-gray-50 hover:bg-gray-200";

    return (
      <button
        key={key}
        onPointerDown={() => handlePress(key, "down")}
        onPointerUp={() => handlePress(key, "up")}
        onPointerLeave={() => handlePress(key, "up")}
        className={`relative flex flex-col items-center justify-center text-sm font-medium py-2 rounded-md border border-gray-400 transition-colors duration-100 ${bgClass} ${wide}`}
      >
        {upperLabel && (
          <span className="absolute top-0 left-1 text-[10px] opacity-70">{upperLabel}</span>
        )}
        <span>{mainLabel.toUpperCase()}</span>
        {macIcon && <span className="text-[9px] opacity-60 mt-1">{macIcon}</span>}
      </button>
    );
  };

  return (
    <div className="flex flex-col items-center gap-2 mt-6 w-full max-w-4xl select-none">
      {lockedModifiers.size > 0 && (
        <div className="flex gap-2 mb-2 text-sm text-blue-600">
          {[...lockedModifiers].map(mod => (
            <span key={mod} className="px-2 py-1 bg-blue-100 rounded-md">
              {prettyLabel(mod)}
            </span>
          ))}
        </div>
      )}
      {layout.map((row, i) => (
        <div key={i} className="flex justify-center gap-1 w-full">
          {row.map(k => renderKey(k))}
        </div>
      ))}
    </div>
  );
}