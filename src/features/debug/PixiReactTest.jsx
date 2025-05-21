import React, { useEffect, useState, useCallback } from 'react';
import { Application, useApplication, extend } from '@pixi/react';
import { Container as PixiContainer, Graphics as PixiGraphics, Text as PixiText } from 'pixi.js';
import * as PIXI from 'pixi.js';

// Extend PixiJS components
extend({ Container: PixiContainer, Graphics: PixiGraphics, Text: PixiText });

const TestChildInternal = ({ onStatusChange }) => {
  const app = useApplication();
  
  // internalStatus is for console logging and flow control within the child
  const [internalStatus, setInternalStatus] = useState('Initializing...'); 

  useEffect(() => {
    console.log('[PixiReactTest] TestChild useEffect triggered. App instance:', app);
    if (!app) {
      const initMsg = 'App instance not yet available from useApplication.';
      setInternalStatus(initMsg);
      if (onStatusChange) onStatusChange(initMsg);
      console.log('[PixiReactTest] TestChild: App instance is null or undefined.');
      return;
    }

    let attempts = 0;
    const maxAttempts = 100;
    let intervalId = null;

    const checkAppReadiness = () => {
      attempts++;
      // Check for the nested app instance and its renderer/stage
      const actualApp = app && app.app;
      const rendererReady = !!(actualApp && actualApp.renderer);
      const stageReady = !!(actualApp && actualApp.stage);
      
      const currentLogStatus = `Attempt ${attempts}/${maxAttempts}: Wrapper app: ${!!app}, Nested app: ${!!actualApp}, Renderer: ${actualApp ? actualApp.renderer : 'nested_app_or_renderer_null'}, Stage: ${actualApp ? actualApp.stage : 'nested_app_or_stage_null'}`;
      console.log('[PixiReactTest] TestChild Status Update:', currentLogStatus);
      setInternalStatus(currentLogStatus); 
      if (onStatusChange) onStatusChange(currentLogStatus);

      if (rendererReady && stageReady) {
        if (intervalId) clearInterval(intervalId);
        intervalId = null;
        const readyMsg = `App is READY! Nested app renderer type: ${typeof actualApp.renderer}, Nested app stage type: ${typeof actualApp.stage}. Check canvas.`;
        setInternalStatus(readyMsg);
        if (onStatusChange) onStatusChange(readyMsg);
        console.log('[PixiReactTest] TestChild: App is READY.');
        return;
      } else if (app && (app.renderer === false || app.stage === false)) {
        console.warn('[PixiReactTest] TestChild: app.renderer or app.stage is explicitly false. Logging app object:');
        console.dir(app);
      }

      if (attempts >= maxAttempts) {
        if (intervalId) clearInterval(intervalId);
        intervalId = null;
        const maxReachedMsg = `Max attempts reached. Wrapper app: ${!!app}, Nested app: ${!!actualApp}, Renderer: ${actualApp ? actualApp.renderer : 'nested_app_or_renderer_null'}, Stage: ${actualApp ? actualApp.stage : 'nested_app_or_stage_null'}`;
        setInternalStatus(maxReachedMsg);
        if (onStatusChange) onStatusChange(maxReachedMsg);
        console.log('[PixiReactTest] TestChild: Max attempts reached. Logging wrapper app object:');
        console.dir(app); 
        if (actualApp) {
          console.log('[PixiReactTest] TestChild: Logging nested app object:');
          console.dir(actualApp);
        } else {
          console.log('[PixiReactTest] TestChild: Nested app object (app.app) is not available.');
        }
      }
    };

    // Initial check
    checkAppReadiness(); 
    // if not ready and not maxed out, start interval
    if (!(app && app.app && app.app.renderer && app.app.stage) && attempts < maxAttempts) { 
      intervalId = setInterval(checkAppReadiness, 100);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      console.log('[PixiReactTest] TestChild Cleanup. Final internal status was:', internalStatus);
    };
  }, [app, onStatusChange]);

  // TestChild now renders Pixi components if app is ready, or null otherwise
  // It needs to ensure the nested app.app and its renderer/stage are ready.
  if (!app || !app.app || !app.app.renderer || !app.app.stage) {
    return null; // Don't render Pixi components if app is not fully ready
  }

  // If app is ready, render some Pixi content
  return (
    <graphics 
      draw={(g) => {
        g.clear();
        g.beginFill(0xff0000); // Red
        g.drawRect(10, 10, 50, 50);
        g.endFill();
        console.log('[PixiReactTest] TestChild: Drawing red square via <graphics> draw prop.');
      }}
    />
  );
};

const TestChild = React.memo(TestChildInternal);

const PixiReactTest = () => {
  console.log('[PixiReactTest] Rendering PixiReactTest (parent) component');
  const [childStatus, setChildStatus] = useState('Child initializing...');

  const handleStatusChange = useCallback((status) => {
    setChildStatus(status);
  }, []);

  return (
    <div style={{ border: '2px solid blue', padding: '10px', margin: '10px', backgroundColor: '#f0f0f0' }}>
      <h2>Minimal Pixi React Test (@pixi/react v8, React 19)</h2>
      <p>Status from TestChild:</p>
      <pre style={{border: '1px dashed gray', padding: '5px', minHeight: '50px'}}>{childStatus}</pre>
      <Application width={300} height={150}>
        <TestChild onStatusChange={handleStatusChange} />
      </Application>
      <p style={{marginTop: '10px', fontSize: 'small'}}>
        If "App is READY", a green canvas (300x150) should appear above with a small red square inside it.
      </p>
    </div>
  );
};

export default PixiReactTest; 