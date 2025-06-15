import React, { memo } from 'react';

const styles = {
  container: {
    position: 'fixed',
    left: '20px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '200px',
    maxHeight: '80vh',
    overflowY: 'auto',
    backgroundColor: 'rgba(30, 40, 50, 0.9)',
    border: '1px solid rgba(135, 206, 235, 0.3)',
    borderRadius: '8px',
    padding: '15px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
    zIndex: 110,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    color: 'white',
  },
  title: {
    margin: '0 0 10px 0',
    paddingBottom: '10px',
    borderBottom: '1px solid rgba(135, 206, 235, 0.2)',
    fontSize: '16px',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  skillButton: {
    padding: '10px 15px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'rgba(135, 206, 235, 0.3)',
    borderRadius: '5px',
    cursor: 'pointer',
    backgroundColor: 'rgba(135, 206, 235, 0.1)',
    textAlign: 'left',
    fontSize: '14px',
    color: 'white',
    transition: 'background-color 0.2s ease, border-color 0.2s ease',
  },
  skillButtonHover: {
    backgroundColor: 'rgba(0, 123, 255, 0.5)',
    borderColor: 'rgba(0, 123, 255, 1)',
  },
  closeButton: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#aaa',
    transition: 'color 0.2s ease',
  },
  closeButtonHover: {
    color: 'white',
  }
};

const useHover = () => {
  const [hovered, setHovered] = React.useState(false);
  const eventHandlers = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
  };
  return [hovered, eventHandlers];
};

const SkillButton = ({ skill, onClick }) => {
  const [hovered, hoverHandlers] = useHover();
  const style = {
    ...styles.skillButton,
    ...(hovered ? styles.skillButtonHover : {}),
  };
  return (
    <button style={style} {...hoverHandlers} onClick={onClick}>
      {skill.name}
    </button>
  );
};

const CloseButton = ({ onClick }) => {
    const [hovered, hoverHandlers] = useHover();
    const style = {
      ...styles.closeButton,
      ...(hovered ? styles.closeButtonHover : {}),
    };
    return (
      <button style={style} {...hoverHandlers} onClick={onClick}>
        ×
      </button>
    );
  };

export const ActionSelector = memo(({ unit, skills, onSkillSelect, onClose }) => {
  if (!unit) return null;

  return (
    <div style={styles.container}>
      <CloseButton onClick={onClose} />
      <h4 style={styles.title}>{unit.name}的行动</h4>
      {Object.entries(skills).map(([skillId, skill]) => (
        <SkillButton
          key={skillId}
          skill={skill}
          onClick={() => onSkillSelect(skillId, skill.targetType)}
        />
      ))}
    </div>
  );
}); 