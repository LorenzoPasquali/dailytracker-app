import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Table, Form, InputGroup } from 'react-bootstrap';
import Check from 'react-bootstrap-icons/dist/icons/check';
import PencilFill from 'react-bootstrap-icons/dist/icons/pencil-fill';
import TrashFill from 'react-bootstrap-icons/dist/icons/trash-fill';
import X from 'react-bootstrap-icons/dist/icons/x';
import { toast } from 'sonner';
import api from '../services/api';
import ColorPicker from './ColorPicker';
import ConfirmationModal from './ConfirmationModal';

export default function ProjectsModal({ show, handleClose, onProjectsChange, projects = [], workspaceId }) {
  const { t } = useTranslation();
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#ef4444');

  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingProjectName, setEditingProjectName] = useState('');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      const response = await api.post('/api/projects', { name: newProjectName, color: newProjectColor }, { params: workspaceId ? { workspaceId } : {} });
      setNewProjectName('');
      setNewProjectColor('#ef4444');
      toast.success(t('projects.createdToast'));
      if (onProjectsChange) onProjectsChange();
    } catch (error) {
      console.error("Erro ao criar projeto", error);
    }
  };

  const handleUpdateProject = async (project, dataToUpdate) => {
    try {
      await api.put(`/api/projects/${project.id}`, { ...project, ...dataToUpdate }, { params: workspaceId ? { workspaceId } : {} });
      toast.success(t('projects.updatedToast'));
      if (onProjectsChange) onProjectsChange();
    } catch (error) {
      console.error("Erro ao atualizar projeto", error);
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
    handleUpdateProject(project, { name: editingProjectName });
    cancelEditing();
  };

  const openDeleteConfirm = (project) => {
    setProjectToDelete(project);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    try {
      await api.delete(`/api/projects/${projectToDelete.id}`, { params: workspaceId ? { workspaceId } : {} });
      toast.success(t('projects.deletedToast'));
      if (onProjectsChange) onProjectsChange();
    } catch (error) {
      // O interceptor já trata o erro visualmente
    } finally {
      setShowDeleteConfirm(false);
      setProjectToDelete(null);
    }
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    handleCreateProject();
  }

  const handleEditKeyDown = (e, project) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEditing(project);
    }
    if (e.key === 'Escape') {
      cancelEditing();
    }
  }

  const darkInputStyle = { backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)', boxShadow: 'none' };
  const customThStyle = { backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)', color: 'var(--text-muted)', padding: '10px', fontSize: '0.8rem', fontWeight: 600 };
  const customTdStyle = { backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)', padding: '10px', fontSize: '0.85rem' };

  return (
    <>
      <Modal show={show} onHide={handleClose} centered size="lg" contentClassName="bg-transparent border-0">
        <div className="custom-modal-content">
          <Modal.Header closeButton closeVariant="white" style={{ borderColor: 'var(--border-subtle)' }}>
            <Modal.Title>{t('projects.modalTitle')}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
          <h6 className="mb-3">{t('projects.newProject')}</h6>
          <Form onSubmit={handleCreateSubmit}>
            <InputGroup className="mb-4">
              <Form.Control
                placeholder={t('projects.namePlaceholder')}
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                style={darkInputStyle}
                className="custom-form-control"
              />
              <div className="d-flex align-items-center px-2" style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: '0 5px 5px 0' }}>
                <ColorPicker currentColor={newProjectColor} onColorSelect={setNewProjectColor} />
              </div>
              <Button type="submit" style={{ backgroundColor: 'var(--accent)', border: 'none', color: 'var(--bg-base)', fontWeight: 600, fontSize: '0.85rem' }}>{t('common.create')}</Button>
            </InputGroup>
          </Form>
          <hr className="text-secondary" />
          <h6 className="mb-3 mt-4">{t('projects.existingProjects')}</h6>
          <Table variant="dark" responsive className="border-secondary" style={{ borderRadius: '8px', overflow: 'hidden' }}>
            <thead>
                <tr>
                  <th style={customThStyle}>{t('projects.nameHeader')}</th>
                  <th className="text-center" style={customThStyle}>{t('projects.colorHeader')}</th>
                  <th className="text-center" style={customThStyle}>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {projects.map(project => (
                  <tr key={project.id} style={{ borderTop: '1px solid #30363d' }}>
                    <td className="align-middle" style={customTdStyle}>
                      {editingProjectId === project.id ? (
                        <InputGroup size="sm">
                          <Form.Control
                            value={editingProjectName}
                            onChange={(e) => setEditingProjectName(e.target.value)}
                            onKeyDown={(e) => handleEditKeyDown(e, project)}
                            autoFocus
                            style={darkInputStyle}
                            className="custom-form-control"
                          />
                          <Button variant="outline-success" onClick={() => saveEditing(project)} aria-label={t('common.save')}><Check /></Button>
                          <Button variant="outline-secondary" onClick={cancelEditing} aria-label={t('common.cancel')}><X /></Button>
                        </InputGroup>
                      ) : (
                        <div className="d-flex align-items-center">
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: project.color, marginRight: '8px' }}></div>
                          {project.name}
                        </div>
                      )}
                    </td>
                    <td className="text-center align-middle" style={customTdStyle}>
                      <ColorPicker
                        currentColor={project.color}
                        onColorSelect={(color) => handleUpdateProject(project, { color })}
                      />
                    </td>
                    <td className="text-center align-middle" style={customTdStyle}>
                      <Button variant="link" size="sm" className="text-light me-2" onClick={() => startEditing(project)} aria-label={t('common.actions')}><PencilFill /></Button>
                      <Button variant="link" size="sm" className="text-danger" onClick={() => openDeleteConfirm(project)} aria-label={t('common.delete')}><TrashFill /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
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
