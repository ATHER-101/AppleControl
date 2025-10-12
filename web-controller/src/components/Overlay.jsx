// Overlay.jsx
import React from 'react';

const Overlay = () => {
  return (
    <div style={{ position: 'absolute', width: '100%', height: '100%' }}>
      {/* Top frosted area */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '20%',
        backgroundColor: 'rgba(173, 216, 270, 0.5)', // Light blue shade with increased opacity
        backdropFilter: 'blur(5px)' // Increased blur amount for frosted effect
      }}></div>
      
      {/* Bottom frosted area */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: '100%',
        height: '20%',
        backgroundColor: 'rgba(173, 216, 270, 0.5)', // Light blue shade with increased opacity
        backdropFilter: 'blur(5px)' // Increased blur amount for frosted effect
      }}></div>
      
      {/* Left frosted area */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: 0,
        width: '20%',
        height: '60%',
        backgroundColor: 'rgba(173, 216, 270, 0.5)', // Light blue shade with increased opacity
        backdropFilter: 'blur(5px)' // Increased blur amount for frosted effect
      }}></div>
      
      {/* Right frosted area */}
      <div style={{
        position: 'absolute',
        top: '20%',
        right: 0,
        width: '20%',
        height: '60%',
        backgroundColor: 'rgba(173, 216, 270, 0.5)', // Light blue shade with increased opacity
        backdropFilter: 'blur(5px)' // Increased blur amount for frosted effect
      }}></div>
      
      {/* Middle transparent scanning area with size animation */}
      <div style={{
        position: 'absolute',
        top: '50%', /* Center vertically */
        left: '50%', /* Center horizontally */
        transform: 'translate(-50%, -50%)', /* Center the box */
        width: '60%', /* Adjust starting size */
        height: '60%', /* Adjust starting size */
        border: '5px solid white',
        borderRadius: '9px',
        animation: 'expandContract 2s infinite'
      }}></div>

      {/* Keyframes for the animation */}
      <style>
        {`
          @keyframes expandContract {
            0%, 100% {
              width: 61%; /* Starting size */
              height: 61%; /* Starting size */
            }
            50% {
              width: 63%; /* Expanded size */
              height: 63%; /* Expanded size */
            }
          }
        `}
      </style>
    </div>
  );
};

export default Overlay;