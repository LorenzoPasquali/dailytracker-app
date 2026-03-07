import React from 'react';
import { Popover, OverlayTrigger, Button } from 'react-bootstrap';
import { PaletteFill } from 'react-bootstrap-icons';
import { HexColorPicker } from 'react-colorful';

export default function ColorPicker({ currentColor, onColorSelect }) {
  
  const popover = (
    <Popover id="popover-color-picker">
      <Popover.Body 
        style={{ 
          padding: '0', 
          backgroundColor: '#161b22', 
          borderRadius: '8px',
          border: '1px solid #30363d'
        }}
      >
        <HexColorPicker 
          color={currentColor} 
          onChange={onColorSelect} 
          style={{ width: '100%', height: '150px', boxShadow: 'none' }}
        />
        <div style={{ padding: '10px', paddingTop: '5px' }}>
            <input
                readOnly
                value={currentColor}
                style={{
                    width: '100%',
                    backgroundColor: '#0d1117',
                    border: '1px solid #30363d',
                    borderRadius: '4px',
                    color: '#c9d1d9',
                    textAlign: 'center',
                    fontFamily: 'monospace',
                    fontSize: '0.9em'
                }}
            />
        </div>
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger trigger="click" placement="bottom" overlay={popover} rootClose>
      <Button variant="link" className="p-0 m-0" style={{ lineHeight: '1' }}>
        <div 
          style={{ 
            width: '20px', 
            height: '20px', 
            backgroundColor: currentColor, 
            borderRadius: '50%',
            border: '2px solid #30363d',
            cursor: 'pointer'
          }}
        />
      </Button>
    </OverlayTrigger>
  );
}