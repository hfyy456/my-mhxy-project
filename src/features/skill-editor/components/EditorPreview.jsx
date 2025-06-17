/*
 * @Author: Sirius 540363975@qq.com
 * @Date: 2025-06-15 05:44:04
 * @LastEditors: Sirius 540363975@qq.com
 * @LastEditTime: 2025-06-17 09:05:37
 */
import React, { useEffect, useState } from 'react';
import { BattleProviderV3 } from '../../battle/v3/providers/BattleProviderV3';
import { useBattleV3 } from '../../battle/v3/hooks/useBattleV3';

const mockUnits = {
    'player-1': { id: 'player-1', name: '玩家预览', isPlayerUnit: true, derivedAttributes: { maxHp: 100, currentHp: 100, physicalAttack: 30 } },
    'enemy-1': { id: 'enemy-1', name: '木桩', isPlayerUnit: false, derivedAttributes: { maxHp: 999, currentHp: 999, physicalDefense: 10 } },
};

const styles = { /* ... all relevant styles from BattleV3TestScreen ... */ };
const UnitDisplay = ({ unit, animationState }) => { /* ... exact copy of UnitDisplay ... */ };

const PreviewScene = ({ skillToPreview, onEnded }) => {
    const [state, send] = useBattleV3();
    const [animationState, setAnimationState] = useState({ /* ... */ });

    useEffect(() => {
        if (skillToPreview) {
            send({ 
                type: 'INITIALIZE_BATTLE_FOR_PREVIEW', 
                payload: {
                    playerUnits: { 'player-1': mockUnits['player-1'] },
                    enemyUnits: { 'enemy-1': mockUnits['enemy-1'] },
                    skillToPreview: skillToPreview
                }
            });
        }
    }, [skillToPreview, send]);

    const script = state.context.currentActionExecution?.animationScript;
    useEffect(() => {
        if (script && script.length > 0) {
            const timeouts = [];
            setAnimationState({ unitAnimations: {}, floatingTexts: {}, vfx: {} });
            // ... (exact animation playing logic from BattleV3TestScreen)
            const totalDuration = Math.max(...script.map(s => s.delay)) + 1000;
            const endTimeout = setTimeout(() => {
              send({ type: 'ANIMATION_COMPLETE' });
              setAnimationState({ unitAnimations: {}, floatingTexts: {}, vfx: {} });
              if(onEnded) onEnded(); // Notify parent that preview ended
            }, totalDuration);
            timeouts.push(endTimeout);
            return () => timeouts.forEach(clearTimeout);
        }
    }, [script, send, onEnded]);
    
    return (
        <div style={styles.battlefield}>
            <div style={styles.teamContainer}>
                <h3>我方</h3>
                <UnitDisplay unit={state.context.allUnits?.['player-1'] || mockUnits['player-1']} animationState={animationState} />
            </div>
            <div style={styles.teamContainer}>
                <h3>敌方</h3>
                <UnitDisplay unit={state.context.allUnits?.['enemy-1'] || mockUnits['enemy-1']} animationState={animationState} />
            </div>
        </div>
    );
};

export const EditorPreview = ({ skillToPreview, onEnded }) => {
    if (!skillToPreview) {
        return <div style={{ border: '1px dashed #ccc', padding: '20px', textAlign: 'center' }}>点击"播放预览"来查看动画效果</div>;
    }
    
    return (
        <BattleProviderV3>
            <PreviewScene skillToPreview={skillToPreview} onEnded={onEnded} />
        </BattleProviderV3>
    );
}; 