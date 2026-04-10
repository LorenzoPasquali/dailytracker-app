import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Form } from 'react-bootstrap';
import Check from 'react-bootstrap-icons/dist/icons/check';
import PencilFill from 'react-bootstrap-icons/dist/icons/pencil-fill';
import TrashFill from 'react-bootstrap-icons/dist/icons/trash-fill';
import X from 'react-bootstrap-icons/dist/icons/x';
import FolderFill from 'react-bootstrap-icons/dist/icons/folder-fill';
import { toast } from 'sonner';
import api from '../services/api';
import ColorPicker from './ColorPicker';
import ConfirmationModal from './ConfirmationModal';
import { useMediaQuery } from '../hooks/useMediaQuery';

const inputStyle = {
  backgroundColor: 'var(--bg-surface)',
  color: 'var(--text-primary)',
  borderColor: 'var(--border-default)',
  boxShadow: 'none',
  borderRadius: '8px',
  fontSize: '0.9rem',
};

export default function ProjectsModal({ show, handleClose, onProjectsChange, projects = [], workspaceId }) {
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 992px)');

  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#ef4444');

  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingProjectName, setEditingProjectName] = useState('');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  const wsParams = workspaceId ? { workspaceId } : {};

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      await api.post('/api/projects', { name: newProjectName, color: newProjectColor }, { params: wsParams });
      setNewProjectName('');
      setNewProjectColor('#ef4444');
      toast.success(t('projects.createdToast'));
      if (onProjectsChange) onProjectsChange();
    } catch (error) {
      console.error('Erro ao criar projeto', error);
    }
  };

  const handleUpdateProject = async (project, dataToUpdate) => {
    try {
      await api.put(`/api/projects/${project.id}`, { ...project, ...dataToUpdate }, { params: wsParams });
      toast.success(t('projects.updatedToast'));
      if (onProjectsChange) onProjectsChange();
    } catch (error) {
      console.error('Erro ao atualizar projeto', error);
    }
  };

  const startEditing = (project) => {
    setEditingProjectId(project.id);
    setEditingProjectName(project.name);
  };

  const cancelEditing = () => {
    setEditingProjectId(null);
    setEditingProjectName('');
  };

  const saveEditing = (project) => {
    if (editingProjectName.trim() && editingProjectName !== project.name) {
      handleUpdateProject(project, { name: editingProjectName.trim() });
    }
    cancelEditing();
  };

  const openDeleteConfirm = (project) => {
    setProjectToDelete(project);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    try {
      await api.delete(`/api/projects/${projectToDelete.id}`, { params: wsParams });
      toast.success(t('projects.deletedToast'));
      if (onProjectsChange) onProjectsChange();
    } catch {
      // interceptor handles error display
    } finally {
      setShowDeleteConfirm(false);
      setProjectToDelete(null);
    }
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    handleCreateProject();
  };

  const handleEditKeyDown = (e, project) => {
    if (e.key === 'Enter') { e.preventDefault(); saveEditing(project); }
    if (e.key === 'Escape') cancelEditing();
  };

  return (
    <>
      <Modal show={show} onHide={handleClose} centered size="lg" contentClassName="bg-transparent border-0">
        <div className="custom-modal-content">
          <Modal.Header closeButton closeVariant="white" style={{ borderColor: 'var(--border-subtle)' }}>
            <Modal.Title style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FolderFill size={16} style={{ color: 'var(--accent)' }} />
              {t('projects.modalTitle')}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body style={{ padding: '1.5rem' }}>

            {/* ── Create Form ── */}
            <div style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1.5rem',
            }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                {t('projects.newProject')}
              </p>
              <Form onSubmit={handleCreateSubmit}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  {/* Color picker */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '42px', height: '42px', flexShrink: 0,
                    backgroundColor: 'var(--bg-base)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '8px',
                  }}>
                    <ColorPicker currentColor={newProjectColor} onColorSelect={setNewProjectColor} />
                  </div>

                  {/* Name input */}
                  <Form.Control
                    placeholder={t('projects.namePlaceholder')}
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    style={{ ...inputStyle, flex: 1, height: '42px' }}
                    className="custom-form-control"
                  />

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={!newProjectName.trim()}
                    style={{
                      backgroundColor: 'var(--accent)', border: 'none',
                      color: '#fff', fontWeight: 600, fontSize: '0.875rem',
                      height: '42px', padding: '0 1.25rem', borderRadius: '8px',
                      flexShrink: 0, opacity: newProjectName.trim() ? 1 : 0.5,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    {t('common.create')}
                  </Button>
                </div>
              </Form>
            </div>

            {/* ── Project List ── */}
            <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              {t('projects.existingProjects')}
            </p>

            {projects.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '2.5rem 1rem',
                color: 'var(--text-muted)', fontSize: '0.9rem',
                border: '1px dashed var(--border-subtle)', borderRadius: '10px',
              }}>
                {t('projects.noProjects', 'Nenhum projeto ainda. Crie o primeiro acima.')}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {projects.map(project => (
                  <div
                    key={project.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.65rem 0.85rem',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '10px',
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-default)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                  >
                    {/* Color swatch / picker */}
                    <div style={{ flexShrink: 0 }}>
                      <ColorPicker
                        currentColor={project.color}
                        onColorSelect={(color) => handleUpdateProject(project, { color })}
                      />
                    </div>

                    {/* Name or edit input */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {editingProjectId === project.id ? (
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <Form.Control
                            value={editingProjectName}
                            onChange={(e) => setEditingProjectName(e.target.value)}
                            onKeyDown={(e) => handleEditKeyDown(e, project)}
                            autoFocus={!isMobile}
                            size="sm"
                            style={{ ...inputStyle, flex: 1 }}
                            className="custom-form-control"
                          />
                          <Button
                            size="sm" variant="outline-success"
                            onClick={() => saveEditing(project)}
                            style={{ borderRadius: '6px', padding: '0.2rem 0.5rem' }}
                          >
                            <Check size={14} />
                          </Button>
                          <Button
                            size="sm" variant="outline-secondary"
                            onClick={cancelEditing}
                            style={{ borderRadius: '6px', padding: '0.2rem 0.5rem' }}
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      ) : (
                        <span style={{
                          fontSize: '0.9rem', color: 'var(--text-primary)',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          display: 'block',
                        }}>
                          {project.name}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    {editingProjectId !== project.id && (
                      <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                        <button
                          onClick={() => startEditing(project)}
                          style={{
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            color: 'var(--text-muted)', padding: '0.3rem',
                            borderRadius: '6px', display: 'flex', alignItems: 'center',
                            transition: 'color 0.15s, background-color 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                          aria-label={t('common.actions')}
                        >
                          <PencilFill size={13} />
                        </button>
                        <button
                          onClick={() => openDeleteConfirm(project)}
                          style={{
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            color: 'var(--text-muted)', padding: '0.3rem',
                            borderRadius: '6px', display: 'flex', alignItems: 'center',
                            transition: 'color 0.15s, background-color 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'; }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                          aria-label={t('common.delete')}
                        >
                          <TrashFill size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Modal.Body>
        </div>
      </Modal>

      <ConfirmationModal
        show={showDeleteConfirm}
        handleClose={() => setShowDeleteConfirm(false)}
        handleConfirm={confirmDelete}
        title={t('projects.deleteTitle')}
        body={t('projects.deleteBody', { name: projectToDelete?.name })}
      />
    </>
  );
}
