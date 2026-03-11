import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button } from 'react-bootstrap';
import { useMediaQuery } from '../hooks/useMediaQuery';

export default function ConfirmationModal({ show, handleClose, handleConfirm, title, body, confirmButtonText, confirmButtonVariant }) {
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 992px)');
  
  const modalBodyStyle = {
    backgroundColor: 'var(--bg-surface)',
    color: 'var(--text-secondary)',
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

  const isDanger = !confirmButtonVariant || confirmButtonVariant === 'danger';

  return (
    <Modal show={show} onHide={handleClose} centered contentClassName="bg-transparent border-0">
      <div className="custom-modal-content">
        <Modal.Header closeButton closeVariant="white" style={{ borderColor: 'var(--border-subtle)' }}>
          <Modal.Title style={{ fontSize: '1rem', fontWeight: 600 }}>{title || t('confirmModal.defaultTitle')}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>{body || t('confirmModal.defaultBody')}</p>
        </Modal.Body>
        <Modal.Footer style={{ borderColor: 'var(--border-subtle)' }}>
          <Button
            onClick={handleClose}
            style={{
              backgroundColor: 'var(--bg-hover)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)',
              fontSize: '0.85rem'
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            autoFocus={!isMobile}
            style={{
              backgroundColor: isDanger ? 'var(--danger)' : 'var(--accent)',
              border: 'none',
              color: '#fff',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            {confirmButtonText || t('common.confirm')}
          </Button>
        </Modal.Footer>
      </div>
    </Modal>
  );
}
