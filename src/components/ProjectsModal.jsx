import React, { useState, useEffect } from 'react';
import { Modal, Button, Table, Form, InputGroup, Spinner } from 'react-bootstrap';
import { Check, PencilFill, TrashFill, X } from 'react-bootstrap-icons';
import { toast } from 'sonner';
import api from '../services/api';
import ColorPicker from './ColorPicker';
import ConfirmationModal from './ConfirmationModal';

export default function ProjectsModal({ show, handleClose, onProjectsChange }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#ef4444');

  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingProjectName, setEditingProjectName] = useState('');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/projects');
      setProjects(response.data);
    } catch (error) {
      console.error("Erro ao buscar projetos", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show) {
      fetchProjects();
    }
  }, [show]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      const response = await api.post('/api/projects', { name: newProjectName, color: newProjectColor });
      setProjects([...projects, response.data]);
      setNewProjectName('');
      setNewProjectColor('#ef4444');
      toast.success('Projeto criado!');
      if (onProjectsChange) onProjectsChange();
    } catch (error) {
      console.error("Erro ao criar projeto", error);
    }
  };

  const handleUpdateProject = async (project, dataToUpdate) => {
    try {
      const response = await api.put(`/api/projects/${project.id}`, { ...project, ...dataToUpdate });
      setProjects(projects.map(p => (p.id === project.id ? response.data : p)));
      toast.success('Projeto atualizado!');
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
      await api.delete(`/api/projects/${projectToDelete.id}`);
      setProjects(projects.filter(p => p.id !== projectToDelete.id));
      toast.success('Projeto excluído!');
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

  const modalStyle = { backgroundColor: 'var(--bg-surface)', color: 'var(--text-secondary)' };
  const darkInputStyle = { backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)', boxShadow: 'none' };
  const customThStyle = { backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)', color: 'var(--text-muted)', padding: '10px', fontSize: '0.8rem', fontWeight: 600 };
  const customTdStyle = { backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)', padding: '10px', fontSize: '0.85rem' };

  return (
    <>
      <Modal show={show} onHide={handleClose} centered size="lg">
        <Modal.Header closeButton closeVariant="white" style={{ ...modalStyle, borderColor: 'var(--border-subtle)' }}>
          <Modal.Title>Gerenciar Projetos</Modal.Title>
        </Modal.Header>
        <Modal.Body style={modalStyle}>
          <h6 className="mb-3">Novo Projeto</h6>
          <Form onSubmit={handleCreateSubmit}>
            <InputGroup className="mb-4">
              <Form.Control
                placeholder="Nome do novo projeto"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                style={darkInputStyle}
                className="custom-form-control"
              />
              <div className="d-flex align-items-center px-2" style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: '0 5px 5px 0' }}>
                <ColorPicker currentColor={newProjectColor} onColorSelect={setNewProjectColor} />
              </div>
              <Button type="submit" style={{ backgroundColor: 'var(--accent)', border: 'none', color: 'var(--bg-base)', fontWeight: 600, fontSize: '0.85rem' }}>Criar</Button>
            </InputGroup>
          </Form>
          <hr className="text-secondary" />
          <h6 className="mb-3 mt-4">Projetos Existentes</h6>
          {loading ? (
            <div className="text-center"><Spinner animation="border" variant="light" /></div>
          ) : (
            <Table variant="dark" responsive className="border-secondary" style={{ borderRadius: '8px', overflow: 'hidden' }}>
              <thead>
                <tr>
                  <th style={customThStyle}>Nome do Projeto</th>
                  <th className="text-center" style={customThStyle}>Cor</th>
                  <th className="text-center" style={customThStyle}>Ações</th>
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
                          <Button variant="outline-success" onClick={() => saveEditing(project)}><Check /></Button>
                          <Button variant="outline-secondary" onClick={cancelEditing}><X /></Button>
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
                      <Button variant="link" size="sm" className="text-light me-2" onClick={() => startEditing(project)}><PencilFill /></Button>
                      <Button variant="link" size="sm" className="text-danger" onClick={() => openDeleteConfirm(project)}><TrashFill /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
      </Modal>

      <ConfirmationModal
        show={showDeleteConfirm}
        handleClose={() => setShowDeleteConfirm(false)}
        handleConfirm={confirmDelete}
        title="Confirmar Exclusão de Projeto"
        body={`Tem certeza que deseja excluir o projeto "${projectToDelete?.name}"? Todas as tarefas e tipos associados a ele precisarão ser reatribuídos ou serão perdidos.`}
      />
    </>
  );
}
