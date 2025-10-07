import { useState } from "react";

export default function Keyboard({ socket }) {
  const [pressed, setPressed] = useState(new Set());

  const layout = [
    ["esc", "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9", "f10", "f11", "f12", "delete"],
    ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "backspace"],
    ["tab", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]", "\\"],
    ["caps_lock", "a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'", "enter"],
    ["shift", "z", "x", "c", "v", "b", "n", "m", ",", ".", "/", "shift"],
    ["fn", "control", "option", "command", "space", "command", "option", "left", "up", "down", "right"],
  ];

  const modifierKeys = ["shift", "control", "command", "option", "fn"];

  const shiftMap = {
    "`": "~","1": "!","2": "@","3": "#","4": "$","5": "%","6": "^","7": "&",
    "8": "*","9": "(","0": ")","-": "_","=": "+","[": "{","]": "}","\\": "|",
    ";": ":","'": '"',",": "<",".": ">","/": "?"
  };

  const macSpecialKeys = {
    f1: "brightnessDown", f2: "brightnessUp", f3: "missionControl", f4: "spotlightSearch",
    f5: "dictation", f6: "focusMode", f7: "previousTrack", f8: "playPause", f9: "nextTrack",
    f10: "mute", f11: "volumeDown", f12: "volumeUp"
  };

  const prettyLabel = (key) => {
    const map = { esc: "⎋", delete: "⌦", backspace: "⌫", caps_lock: "⇪", shift: "⇧",
                  control: "⌃", option: "⌥", command: "⌘", enter: "⏎", tab: "⇥",
                  up: "↑", down: "↓", left: "←", right: "→", space: "␣", fn: "fn" };
    return map[key] || key;
  };

  const handlePress = (key, type) => {
    if (!socket || socket.disconnected) return;
    const normalized = key.toLowerCase();

    if (type === "down") {
      if (pressed.has(normalized)) return; // prevent double fire
      setPressed(prev => new Set(prev).add(normalized));

      if (modifierKeys.includes(normalized)) {
        socket.emit("keyDown", normalized);
        return;
      }

      const activeModifiers = Array.from(pressed).filter(k => modifierKeys.includes(k));

      if (normalized.startsWith("f")) {
        if (activeModifiers.includes("fn")) socket.emit("keyTap", normalized);
        else socket.emit("specialKey", macSpecialKeys[normalized]);
      } else {
        if (activeModifiers.length) socket.emit("keyTap", normalized, activeModifiers);
        else socket.emit("keyTap", normalized);
      }
    } else if (type === "up") {
      setPressed(prev => {
        const copy = new Set(prev);
        copy.delete(normalized);
        return copy;
      });

      if (modifierKeys.includes(normalized)) socket.emit("keyUp", normalized);
    }
  };

  const renderKey = (key) => {
    const active = pressed.has(key.toLowerCase());
    const wide = key === "space" ? "w-[250px]" :
      ["shift", "command", "option", "control", "caps_lock", "tab", "enter", "backspace", "delete"].includes(key)
        ? "w-[70px]" : "w-[40px]";
    const mainLabel = prettyLabel(key);
    const upperLabel = shiftMap[key];
    const macIcon = macSpecialKeys[key] && !pressed.has("fn")
      ? macSpecialKeys[key].replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase())
      : null;

    return (
      <button
        key={key}
        onPointerDown={() => handlePress(key, "down")}
        onPointerUp={() => handlePress(key, "up")}
        className={`relative flex flex-col items-center justify-center text-sm font-medium py-2 rounded-md border border-gray-400 bg-gray-50 transition 
          ${active ? "bg-gray-300 scale-95" : "hover:bg-gray-200"} ${wide}`}
      >
        {upperLabel && <span className="absolute top-0 left-1 text-[10px] opacity-70">{upperLabel}</span>}
        <span>{mainLabel.toUpperCase()}</span>
        {macIcon && <span className="text-[9px] opacity-60 mt-1">{macIcon}</span>}
      </button>
    );
  };

  return (
    <div className="flex flex-col items-center gap-2 mt-6 w-full max-w-4xl select-none">
      {layout.map((row, rIndex) => (
        <div key={rIndex} className="flex justify-center gap-1 w-full">
          {row.map(key => renderKey(key))}
        </div>
      ))}
    </div>
  );
}