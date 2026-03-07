import React, { useState, useEffect } from 'react';
import { Modal, Button, Table, Form, InputGroup, Spinner, Alert } from 'react-bootstrap';
import { Check, PencilFill, TrashFill, X } from 'react-bootstrap-icons';
import api from '../services/api';
import ConfirmationModal from './ConfirmationModal';

export default function TaskTypesModal({ show, handleClose }) {
  const [taskTypes, setTaskTypes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newTypeName, setNewTypeName] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');

  const [editingTypeId, setEditingTypeId] = useState(null);
  const [editingTypeName, setEditingTypeName] = useState('');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const projectsResponse = await api.get('/api/projects');
      setProjects(projectsResponse.data);
      
      const allTypes = projectsResponse.data.flatMap(p => 
        p.taskTypes.map(tt => ({ ...tt, projectName: p.name, projectId: p.id }))
      );
      setTaskTypes(allTypes);
    } catch (err) {
      console.error("Erro ao buscar dados", err);
      setError('Não foi possível carregar os dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show) {
      fetchData();
    }
  }, [show]);

  const handleCreateTaskType = async () => {
    if (!newTypeName.trim() || !selectedProjectId) {
      setError('Por favor, preencha o nome e selecione um projeto.');
      return;
    }
    setError('');
    try {
      await api.post('/api/task-types', { 
        name: newTypeName, 
        projectId: parseInt(selectedProjectId) 
      });
      fetchData();
      setNewTypeName('');
      setSelectedProjectId('');
    } catch (error) {
      console.error("Erro ao criar tipo de tarefa", error);
      setError(error.response?.data?.message || 'Não foi possível criar o tipo de tarefa.');
    }
  };

  const startEditing = (type) => {
    setEditingTypeId(type.id);
    setEditingTypeName(type.name);
  };

  const cancelEditing = () => {
    setEditingTypeId(null);
    setEditingTypeName('');
  };

  const saveEditing = async (type) => {
    if (!editingTypeName.trim()) return;
    try {
      await api.put(`/api/task-types/${type.id}`, { name: editingTypeName, projectId: type.projectId });
      fetchData();
    } catch (error) {
      console.error("Erro ao atualizar tipo de tarefa", error);
      setError(error.response?.data?.message || 'Não foi possível atualizar o tipo de tarefa.');
    } finally {
      cancelEditing();
    }
  };

  const openDeleteConfirm = (type) => {
    setTypeToDelete(type);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!typeToDelete) return;
    try {
      await api.delete(`/api/task-types/${typeToDelete.id}`);
      fetchData();
    } catch (error) {
      console.error("Erro ao deletar tipo de tarefa", error);
      setError(error.response?.data?.message || 'Não foi possível deletar o tipo de tarefa.');
    } finally {
      setShowDeleteConfirm(false);
      setTypeToDelete(null);
    }
  };
  
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    handleCreateTaskType();
  };
  
  const handleEditKeyDown = (e, type) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEditing(type);
    }
    if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  const modalStyle = { backgroundColor: '#0d1117', color: '#c9d1d9' };
  const darkInputStyle = { backgroundColor: '#21262d', color: 'white', borderColor: '#30363d' };
  const customThStyle = { backgroundColor: '#161b22', borderColor: '#30363d', color: '#8b949e' };
  const customTdStyle = { backgroundColor: '#0d1117', borderColor: '#30363d', color: '#c9d1d9' };

  return (
    <>
      <Modal show={show} onHide={handleClose} centered size="lg">
        <Modal.Header closeButton closeVariant="white" className="border-secondary" style={modalStyle}>
          <Modal.Title>Gerenciar Tipos de Tarefa</Modal.Title>
        </Modal.Header>
        <Modal.Body style={modalStyle}>
          {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
          
          <h6 className="mb-3">Novo Tipo de Tarefa</h6>
          <Form onSubmit={handleCreateSubmit}>
            <InputGroup className="mb-4">
              <Form.Control
                placeholder="Nome do novo tipo (ex: Bug, Reunião)"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                style={darkInputStyle}
                className="custom-form-control"
              />
              <Form.Select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                style={darkInputStyle}
                className="custom-form-control"
              >
                <option value="">Selecione um Projeto</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </Form.Select>
              <Button variant="primary" type="submit">Criar</Button>
            </InputGroup>
          </Form>

          <hr className="text-secondary" />

          <h6 className="mb-3 mt-4">Tipos Existentes</h6>
          {loading ? (
            <div className="text-center"><Spinner animation="border" variant="light" /></div>
          ) : (
            <Table variant="dark" responsive className="border-secondary" style={{ borderRadius: '8px', overflow: 'hidden' }}>
              <thead>
                <tr>
                  <th style={customThStyle}>Nome do Tipo</th>
                  <th style={customThStyle}>Projeto Associado</th>
                  <th className="text-center" style={customThStyle}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {taskTypes.map(type => (
                  <tr key={type.id} style={{ borderTop: '1px solid #30363d' }}>
                    <td className="align-middle" style={customTdStyle}>
                      {editingTypeId === type.id ? (
                        <InputGroup size="sm">
                          <Form.Control
                            value={editingTypeName}
                            onChange={(e) => setEditingTypeName(e.target.value)}
                            onKeyDown={(e) => handleEditKeyDown(e, type)}
                            autoFocus
                            style={darkInputStyle}
                            className="custom-form-control"
                          />
                          <Button variant="outline-success" onClick={() => saveEditing(type)}><Check /></Button>
                          <Button variant="outline-secondary" onClick={cancelEditing}><X /></Button>
                        </InputGroup>
                      ) : (
                        type.name
                      )}
                    </td>
                    <td className="align-middle" style={customTdStyle}>{type.projectName}</td>
                    <td className="text-center align-middle" style={customTdStyle}>
                      <Button variant="link" size="sm" className="text-light me-2" onClick={() => startEditing(type)}><PencilFill /></Button>
                      <Button variant="link" size="sm" className="text-danger" onClick={() => openDeleteConfirm(type)}><TrashFill /></Button>
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
        title="Confirmar Exclusão"
        body={`Tem certeza que deseja excluir o tipo "${typeToDelete?.name}"? As tarefas que usam este tipo não serão excluídas, mas perderão a associação.`}
      />
    </>
  );
}