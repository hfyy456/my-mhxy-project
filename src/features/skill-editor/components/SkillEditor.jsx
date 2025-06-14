import React, { useState, useEffect } from 'react';
import { skills as initialSkills } from '../../battle/v3/logic/skillConfig';
import { EditorPreview } from './EditorPreview';
import { TimelineEditor } from './TimelineEditor';

const styles = {
  editorContainer: { padding: '20px', fontFamily: 'Arial, sans-serif' },
  header: { marginBottom: '20px' },
  select: { padding: '8px', fontSize: '16px', marginBottom: '20px' },
  scriptContainer: { border: '1px solid #ccc', padding: '15px', borderRadius: '5px' },
  stepRow: { display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' },
  input: { padding: '8px', border: '1px solid #ddd', borderRadius: '4px' },
  textarea: { width: '100%', minHeight: '300px', marginTop: '20px', whiteSpace: 'pre', fontFamily: 'monospace' },
  mainContainer: { display: 'flex', gap: '20px' },
  editorPanel: { flex: 1 },
  previewPanel: { flex: 1, border: '1px solid #ccc', padding: '10px', borderRadius: '5px' },
};

export const SkillEditor = () => {
  const [skills, setSkills] = useState(() => JSON.parse(JSON.stringify(initialSkills)));
  const [selectedSkillId, setSelectedSkillId] = useState(Object.keys(initialSkills)[0]);
  const [generatedConfig, setGeneratedConfig] = useState('');
  const [skillToPreview, setSkillToPreview] = useState(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const selectedSkill = skills[selectedSkillId];
  
  useEffect(() => {
    setGeneratedConfig('');
  }, [selectedSkillId]);

  const handleSkillChange = (e) => {
    setSelectedSkillId(e.target.value);
  };

  const handleStepChange = (index, field, value) => {
    const newSkills = JSON.parse(JSON.stringify(skills));
    const skillToUpdate = newSkills[selectedSkillId];
    const stepToUpdate = skillToUpdate.animationScriptTemplate[index];
    
    const numericFields = ['delay'];
    stepToUpdate[field] = numericFields.includes(field) ? Number(value) : value;

    setSkills(newSkills);
  };
  
  const handleGenerateConfig = () => {
    const output = {
      [selectedSkillId]: skills[selectedSkillId]
    };
    setGeneratedConfig(JSON.stringify(output, null, 2));
  };

  const handlePreview = () => {
    setSkillToPreview({
      [selectedSkillId]: skills[selectedSkillId]
    });
    setIsPreviewing(true);
  };

  const handlePreviewEnded = () => {
    setIsPreviewing(false);
  };

  const handleAddStep = (index) => {
    const newSkills = JSON.parse(JSON.stringify(skills));
    const skillToUpdate = newSkills[selectedSkillId];
    const newStep = { type: 'ENTITY_ANIMATION', target: 'source', delay: 0, animationName: 'new_animation' };
    skillToUpdate.animationScriptTemplate.splice(index + 1, 0, newStep);
    setSkills(newSkills);
  };

  const handleRemoveStep = (index) => {
    const newSkills = JSON.parse(JSON.stringify(skills));
    const skillToUpdate = newSkills[selectedSkillId];
    if (skillToUpdate.animationScriptTemplate.length <= 1) {
      alert("至少需要保留一个动画步骤！");
      return;
    }
    skillToUpdate.animationScriptTemplate.splice(index, 1);
    setSkills(newSkills);
  };

  const handleScriptChange = (newScript) => {
    const newSkills = JSON.parse(JSON.stringify(skills));
    newSkills[selectedSkillId].animationScriptTemplate = newScript;
    setSkills(newSkills);
  };

  if (!selectedSkill) {
    return <div>Loading skills...</div>;
  }

  return (
    <div style={styles.editorContainer}>
      <h1>技能动画导演编辑器</h1>
      <div style={styles.mainContainer}>
        <div style={styles.editorPanel}>
          <div style={styles.header}>
            <select value={selectedSkillId} onChange={handleSkillChange} style={styles.select}>
              {Object.keys(skills).map(skillId => (
                <option key={skillId} value={skillId}>{skills[skillId].name} ({skillId})</option>
              ))}
            </select>
          </div>

          <div style={styles.scriptContainer}>
            <h2>动画剧本模板</h2>
            <TimelineEditor
              script={selectedSkill.animationScriptTemplate}
              onScriptChange={handleScriptChange}
            />
          </div>
          
          <button onClick={handlePreview} disabled={isPreviewing} style={{marginTop: '20px', padding: '10px 20px'}}>
            {isPreviewing ? '预览播放中...' : '播放预览'}
          </button>
          <button onClick={handleGenerateConfig} style={{marginTop: '20px', padding: '10px 20px'}}>
            生成配置
          </button>

          {generatedConfig && (
            <textarea style={styles.textarea} readOnly value={generatedConfig} />
          )}
        </div>
        <div style={styles.previewPanel}>
          <h2>实时预览</h2>
          <EditorPreview skillToPreview={skillToPreview} onEnded={handlePreviewEnded} />
        </div>
      </div>
    </div>
  );
}; 