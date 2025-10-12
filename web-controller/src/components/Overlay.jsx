import React from "react";

const Overlay = () => {
  return (
    <div style={{ position: "absolute", width: "100%", height: "100%" }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '20%',
        backgroundColor: 'rgba(173, 216, 270, 0.5)', backdropFilter: 'blur(5px)'
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, width: '100%', height: '20%',
        backgroundColor: 'rgba(173, 216, 270, 0.5)', backdropFilter: 'blur(5px)'
      }} />
      <div style={{
        position: 'absolute', top: '20%', left: 0, width: '20%', height: '60%',
        backgroundColor: 'rgba(173, 216, 270, 0.5)', backdropFilter: 'blur(5px)'
      }} />
      <div style={{
        position: 'absolute', top: '20%', right: 0, width: '20%', height: '60%',
        backgroundColor: 'rgba(173, 216, 270, 0.5)', backdropFilter: 'blur(5px)'
      }} />
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: '60%', height: '60%', border: '5px solid white', borderRadius: '9px',
        animation: 'expandContract 2s infinite'
      }} />
      <style>
        {`
        @keyframes expandContract {
          0%, 100% { width: 61%; height: 61%; }
          50% { width: 63%; height: 63%; }
        }
      `}
      </style>
    </div>
  );
};

export default Overlay;