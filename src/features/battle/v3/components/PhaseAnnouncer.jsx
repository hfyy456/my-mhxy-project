import React, { useState, useEffect } from 'react';

const keyframes = `
  @keyframes v3-phase-fade-in-out {
    0% {
      opacity: 0;
      transform: scale(0.8);
      filter: blur(5px);
    }
    15% {
      opacity: 1;
      transform: scale(1.1);
      filter: blur(0);
    }
    85% {
      opacity: 1;
      transform: scale(1);
      filter: blur(0);
    }
    100% {
      opacity: 0;
      transform: scale(0.8);
      filter: blur(5px);
    }
  }
`;

// Inject keyframes into the document head
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = keyframes;
document.head.appendChild(styleSheet);

const styles = {
  announcer: {
    position: 'fixed',
    top: '30%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 200,
    pointerEvents: 'none',
  },
  text: {
    fontSize: '3.5rem',
    fontWeight: 'bold',
    color: '#E0F7FA',
    textShadow: '0 0 5px rgba(224, 247, 250, 0.7), 0 0 10px rgba(128, 222, 234, 0.6), 0 0 20px rgba(0, 188, 212, 0.5), 2px 2px 10px rgba(0, 0, 0, 0.7)',
    display: 'inline-block',
    padding: '10px 30px',
    borderRadius: '10px',
    background: 'rgba(20, 30, 40, 0.6)',
    border: '1px solid rgba(135, 206, 235, 0.3)',
    backdropFilter: 'blur(4px)',
    animationName: 'v3-phase-fade-in-out',
    animationDuration: '1.8s',
    animationFillMode: 'forwards',
    animationTimingFunction: 'ease-in-out',
    opacity: 0,
    letterSpacing: '0.1em',
  },
};

export const PhaseAnnouncer = ({ text, trigger }) => {
  const [currentText, setCurrentText] = useState('');
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (text) {
      setCurrentText(text);
      setAnimationKey(prev => prev + 1);
    }
  }, [text, trigger]);

  if (!currentText) return null;

  return (
    <div style={styles.announcer}>
      <p key={animationKey} style={styles.text}>
        {currentText}
      </p>
    </div>
  );
}; 