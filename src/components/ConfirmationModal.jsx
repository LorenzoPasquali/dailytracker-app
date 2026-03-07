import React, { useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';

export default function ConfirmationModal({ show, handleClose, handleConfirm, title, body, confirmButtonText, confirmButtonVariant }) {
  const modalBodyStyle = {
    backgroundColor: '#0d1117',
    color: '#c9d1d9'
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (show && event.key === 'Enter') {
        event.preventDefault();
        handleConfirm();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [show, handleConfirm]);

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton closeVariant="white" className="border-secondary" style={modalBodyStyle}>
        <Modal.Title>{title || 'Confirmar Ação'}</Modal.Title>
      </Modal.Header>
      <Modal.Body style={modalBodyStyle}>
        <p>{body || 'Você tem certeza que deseja continuar?'}</p>
      </Modal.Body>
      <Modal.Footer className="border-secondary" style={modalBodyStyle}>
        <Button variant="secondary" onClick={handleClose}>
          Cancelar
        </Button>
        <Button variant={confirmButtonVariant || 'danger'} onClick={handleConfirm} autoFocus>
          {confirmButtonText || 'Confirmar'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}