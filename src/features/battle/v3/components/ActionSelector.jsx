import React, { memo, useState, useMemo, useCallback } from 'react';

const styles = {
  container: {
    position: 'fixed',
    left: '20px',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '240px',
    maxHeight: '85vh',
    backgroundColor: 'rgba(20, 30, 40, 0.75)',
    border: '1px solid rgba(135, 206, 235, 0.3)',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
    backdropFilter: 'blur(10px)',
    zIndex: 110,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    color: 'white',
    textAlign: 'center',
    transition: 'transform 0.3s ease-out, opacity 0.3s ease-out',
    opacity: 1,
  },
  title: {
    margin: '0 0 10px 0',
    paddingBottom: '15px',
    borderBottom: '1px solid rgba(135, 206, 235, 0.2)',
    fontSize: '18px',
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#E0E0E0',
    textShadow: '0 0 8px rgba(135, 206, 235, 0.5)',
  },
  skillButton: {
    position: 'relative',
    padding: '14px 20px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderRadius: '8px',
    cursor: 'pointer',
    backgroundColor: 'rgba(135, 206, 235, 0.1)',
    textAlign: 'left',
    fontSize: '16px',
    color: '#EAEAEA',
    transition: 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease',
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: '12px',
  },
  skillButtonHover: {
    backgroundColor: 'rgba(0, 150, 255, 0.3)',
    borderColor: 'rgba(0, 150, 255, 0.8)',
    color: '#FFFFFF',
    boxShadow: '0 0 15px rgba(0, 150, 255, 0.5)',
  },
  skillDescriptionPanel: {
    marginTop: '15px',
    padding: '15px',
    height: '90px',
    overflowY: 'auto',
    backgroundColor: 'rgba(10, 20, 30, 0.8)',
    borderTop: '1px solid rgba(135, 206, 235, 0.2)',
    borderRadius: '0 0 8px 8px',
    fontSize: '13px',
    color: '#B0C4DE',
    fontStyle: 'italic',
    textAlign: 'left',
    lineHeight: '1.5',
  },
  closeButton: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#aaa',
    transition: 'color 0.2s ease, transform 0.2s ease',
  },
  closeButtonHover: {
    color: 'white',
    transform: 'scale(1.1)',
  }
};

// --- NEW: Define static objects outside the component to prevent re-creation on render ---
const staticActions = {
  basic_attack: { id: 'basic_attack', name: '攻击', description: '对单个敌人造成普通物理伤害。' },
  capture: { id: 'capture', name: '捕捉' },
  defend: { id: 'defend', name: '防御' },
  skills: { id: 'skills', name: '技能', description: '查看并使用角色掌握的特殊技能。'},
  back: { id: 'back', name: '返回', description: '返回上一级菜单。'}
};

const useHover = () => {
  const [hovered, setHovered] = React.useState(false);
  const eventHandlers = {
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
  };
  return [hovered, eventHandlers];
};

const SkillButton = ({ skill, onClick, onHover }) => {
  const [hovered, hoverHandlers] = useHover();
  
  // The onHover callback is now wrapped in useCallback in the parent, making it stable.
  // The skill object is also stable (either a constant or from useMemo).
  // This breaks the infinite loop.
  React.useEffect(() => {
    onHover(hovered ? skill : null);
  }, [hovered, skill, onHover]);

  const style = {
    ...styles.skillButton,
    ...(hovered ? styles.skillButtonHover : {}),
  };
  return (
    <button style={style} {...hoverHandlers} onClick={onClick}>
      {/* Icon placeholder could go here */}
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

export const ActionSelector = memo(({ unit, skills: allSkills, onSkillSelect, onClose }) => {
  if (!unit) return null;

  const [view, setView] = useState('main');
  const [hoveredSkill, setHoveredSkill] = useState(null);

  const handleActionClick = (skillId) => {
    onSkillSelect(skillId);
  };
  
  // --- NEW: Memoize the dynamic list of skills ---
  const unitSkills = useMemo(() => {
    return unit.skills?.map(id => {
      const skill = allSkills[id];
      if (!skill) return null;
      return { ...skill, id };
    }).filter(Boolean) || [];
  }, [unit.skills, allSkills]);

  // --- REVISED: Create a memoized map for all descriptions for easy lookup ---
  const descriptionMap = useMemo(() => {
    const descriptions = {
      ...Object.fromEntries(Object.entries(staticActions).map(([key, value]) => [key, value.description])),
      capture: allSkills.capture.description,
      defend: allSkills.defend.description,
    };
    for (const skill of unitSkills) {
      descriptions[skill.id] = skill.description;
    }
    return descriptions;
  }, [unitSkills, allSkills]);
  
  const currentDescription = hoveredSkill ? (descriptionMap[hoveredSkill.id] || '选择一个行动。') : '选择一个行动。';

  // --- NEW: Wrap the onHover handler in useCallback for stability ---
  const handleHover = useCallback((skill) => {
    setHoveredSkill(skill);
  }, []); // Empty dependency array means this function is created only once.

  return (
    <div style={styles.container}>
      <CloseButton onClick={onClose} />
      <h4 style={styles.title}>{unit.name}的行动</h4>
      <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '5px' }}>
        {view === 'main' && (
          <>
            <SkillButton skill={staticActions.basic_attack} onClick={() => handleActionClick('basic_attack')} onHover={handleHover} />
            <SkillButton skill={staticActions.capture} onClick={() => handleActionClick('capture')} onHover={handleHover} />
            <SkillButton skill={staticActions.defend} onClick={() => handleActionClick('defend')} onHover={handleHover} />
            <SkillButton skill={staticActions.skills} onClick={() => setView('skills')} onHover={handleHover} />
          </>
        )}

        {view === 'skills' && (
          <>
            {unitSkills.map(skill => (
               <SkillButton key={skill.id} skill={skill} onClick={() => handleActionClick(skill.id)} onHover={handleHover} />
            ))}
            <hr style={{border: 'none', borderTop: '1px solid rgba(135, 206, 235, 0.2)', margin: '10px 0'}} />
            <SkillButton skill={staticActions.back} onClick={() => setView('main')} onHover={handleHover} />
          </>
        )}
      </div>
      <div style={styles.skillDescriptionPanel}>
        {currentDescription}
      </div>
    </div>
  );
}); 