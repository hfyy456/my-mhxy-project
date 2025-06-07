import React from 'react';
import WorldMapController from './WorldMapController';

const WorldMapModal = ({ isOpen, onClose, showToast }) => {
  return (
    <WorldMapController
      isOpen={isOpen}
      onClose={onClose}
      showToast={showToast}
    />
  );
};

export default WorldMapModal;