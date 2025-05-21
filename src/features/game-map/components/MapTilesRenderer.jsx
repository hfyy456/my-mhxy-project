import React, { useEffect, useState } from 'react';
import { useApplication, extend } from '@pixi/react';
import * as PIXI from 'pixi.js';
import { Container as PixiContainer, Sprite as PixiSprite, Graphics as PixiGraphics, Text as PixiText } from 'pixi.js';
import { CELL_TYPES, TILE_CONTENT_TYPES } from '@/config/mapConfig'; // Assuming CELL_TYPES includes EMPTY and has .color property

// Modified extend to include Text: PixiText
extend({ Container: PixiContainer, Sprite: PixiSprite, Graphics: PixiGraphics, Text: PixiText });

// Helper to convert hex string color to number, e.g., '#RRGGBB' to 0xRRGGBB
const hexColorToNumber = (hexString) => {
  if (hexString && typeof hexString === 'string' && hexString.startsWith('#')) {
    return parseInt(hexString.slice(1), 16);
  }
  console.warn(`Invalid hexString for color conversion: ${hexString}, defaulting to black.`);
  return 0x000000; // Default to black if invalid
};

// Define a color for portals, or you could use an image asset
// const PORTAL_COLOR = 0xDA70D6; // Orchid, a purplish color // No longer needed

const MapTilesRenderer = ({ mapData, cellSize, cellTypesConfig }) => {
  const app = useApplication(); // app here is the wrapper
  const [cellTextures, setCellTextures] = useState({});

  useEffect(() => {
    const actualApp = app && app.app; // Get the actual PIXI.Application instance

    if (!actualApp || cellSize <= 0) {
      // console.warn("[MapTilesRenderer Effect] Initial abort: Actual Pixi App not available or cellSize invalid.");
      return;
    }

    let attempts = 0;
    const maxAttempts = 20; 
    let intervalId = null;

    const tryGenerateTextures = () => {
      attempts++;
      if (actualApp && actualApp.renderer && actualApp.stage) {
        if (intervalId) clearInterval(intervalId);
        intervalId = null; 
        
        const newTextures = {};
        // Ensure cellTypesConfig is an object, fallback to CELL_TYPES if undefined
        const effectiveCellTypes = cellTypesConfig || CELL_TYPES;

        Object.values(effectiveCellTypes).forEach(cellTypeConfig => {
          if (cellTypeConfig && cellTypeConfig.color) { // Check if cellTypeConfig and color property exist
            const graphics = new PIXI.Graphics();
            const colorHex = hexColorToNumber(cellTypeConfig.color);
            
            graphics.rect(0, 0, cellSize, cellSize);
            graphics.fill(colorHex);
            graphics.stroke({ width: 1, color: 0x000000, alpha: 0.3 }); 
            
            newTextures[cellTypeConfig.id] = actualApp.renderer.generateTexture(graphics);
            graphics.destroy();
          } else {
            // console.warn(`Cell type config or color missing for id: ${cellTypeConfig?.id}`);
          }
        });
        
        // REMOVED PORTAL TEXTURE GENERATION HERE - will be handled by PIXI.Text in render
        
        const emptyTypeId = CELL_TYPES.EMPTY?.id;
        if (emptyTypeId && !newTextures[emptyTypeId] && CELL_TYPES.EMPTY?.color) {
            const graphics = new PIXI.Graphics();
            const emptyColor = hexColorToNumber(CELL_TYPES.EMPTY.color);
            
            graphics.rect(0, 0, cellSize, cellSize);
            graphics.fill(emptyColor);
            graphics.stroke({ width: 1, color: 0x000000, alpha: 0.3 });

            newTextures[emptyTypeId] = actualApp.renderer.generateTexture(graphics);
            graphics.destroy();
        } else if (emptyTypeId && !newTextures[emptyTypeId]){
            // Fallback for EMPTY if no color defined, create a default one (e.g. dark gray)
            const graphics = new PIXI.Graphics();
            graphics.rect(0, 0, cellSize, cellSize);
            graphics.fill(0x1a202c); // Default dark gray
            graphics.stroke({ width: 1, color: 0x000000, alpha: 0.3 });
            newTextures[emptyTypeId] = actualApp.renderer.generateTexture(graphics);
            graphics.destroy();
        }

        setCellTextures(prevTextures => {
            // Merge, ensuring new textures overwrite old ones for the same ID if regenerated
            return {...prevTextures, ...newTextures};
        });
        // console.log("[MapTilesRenderer Effect] Textures generation attempt complete. Count:", Object.keys(newTextures).length);
        return; 
      }

      if (attempts >= maxAttempts) {
        console.error("[MapTilesRenderer Effect] Max attempts reached. Actual Pixi App renderer or stage did not become available.");
        if (intervalId) clearInterval(intervalId);
        intervalId = null;
      }
    };

    tryGenerateTextures();
    
    if (!(actualApp && actualApp.renderer && actualApp.stage) && attempts < maxAttempts) {
      intervalId = setInterval(tryGenerateTextures, 100);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      // console.log("[MapTilesRenderer Effect] Cleanup. Interval ID cleared if it was set.");
      // Optionally destroy textures if they are not managed elsewhere or reused
      // Object.values(cellTextures).forEach(texture => texture.destroy(true)); 
      // setCellTextures({});
    };
  }, [app, cellSize, cellTypesConfig]); 

  if (Object.keys(cellTextures).length === 0 || !mapData || !mapData.grid) {
    // console.log("[MapTilesRenderer] Not ready to render (no textures or mapData).");
    return null; 
  }

  // Define text style for markers
  const markerTextStyle = new PIXI.TextStyle({
    fontFamily: 'Arial',
    fontSize: cellSize * 0.5, // Adjust size relative to cell size
    fill: '#ffffff', // White color for the text
    stroke: { color: '#000000', width: cellSize * 0.05 }, // Black stroke
    align: 'center',
  });

  return (
    <pixiContainer>
      {mapData.grid.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const baseTexture = cellTextures[cell.type] || cellTextures[CELL_TYPES.EMPTY?.id];
          if (!baseTexture) {
            // console.warn(`No texture for cell type ${cell.type} or EMPTY at ${rowIndex},${colIndex}`);
            return null; 
          }

          let markerText = null;
          // let markerColor = '#FFFFFF'; // Default for text, not directly used if text style has fill

          if (cell.content) {
            switch (cell.content.type) {
              case TILE_CONTENT_TYPES.NPC:
                markerText = 'N';
                break;
              case TILE_CONTENT_TYPES.MONSTER:
                markerText = 'M';
                break;
              case TILE_CONTENT_TYPES.PORTAL:
                markerText = 'T';
                break;
              default:
                break;
            }
          }

          return (
            <pixiContainer key={`${rowIndex}-${colIndex}-container`} x={colIndex * cellSize} y={rowIndex * cellSize}>
              <pixiSprite
                key={`${rowIndex}-${colIndex}-tile`}
                texture={baseTexture}
                width={cellSize}
                height={cellSize}
              />
              {markerText && (
                <text // Changed to use the <text> component registered via extend
                  key={`${rowIndex}-${colIndex}-marker`}
                  text={markerText}
                  style={markerTextStyle}
                  anchor={{ x: 0.5, y: 0.5 }} 
                  x={cellSize / 2} 
                  y={cellSize / 2} 
                />
              )}
            </pixiContainer>
          );
        })
      )}
    </pixiContainer>
  );
};

export default MapTilesRenderer;