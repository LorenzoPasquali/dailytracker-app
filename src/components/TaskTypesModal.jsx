import React, { useState, useEffect } from 'react';
import { Modal, Button, Table, Form, InputGroup } from 'react-bootstrap';
import Check from 'react-bootstrap-icons/dist/icons/check';
import PencilFill from 'react-bootstrap-icons/dist/icons/pencil-fill';
import TrashFill from 'react-bootstrap-icons/dist/icons/trash-fill';
import X from 'react-bootstrap-icons/dist/icons/x';
import { toast } from 'sonner';
import api from '../services/api';
import ConfirmationModal from './ConfirmationModal';

export default function TaskTypesModal({ show, handleClose, onTaskTypesChange, projects = [] }) {
  const [taskTypes, setTaskTypes] = useState([]);

  const [newTypeName, setNewTypeName] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');

  const [editingTypeId, setEditingTypeId] = useState(null);
  const [editingTypeName, setEditingTypeName] = useState('');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState(null);

  useEffect(() => {
    if (show && projects.length > 0) {
      const allTypes = projects.flatMap(p => 
        p.taskTypes.map(tt => ({ ...tt, projectName: p.name, projectId: p.id }))
      );
      setTaskTypes(allTypes);
    }
  }, [show, projects]);

  const handleCreateTaskType = async () => {
    if (!newTypeName.trim() || !selectedProjectId) {
      toast.error('Por favor, preencha o nome e selecione um projeto.');
      return;
    }
    try {
      await api.post('/api/task-types', { 
        name: newTypeName, 
        projectId: parseInt(selectedProjectId) 
      });
      setNewTypeName('');
      setSelectedProjectId('');
      toast.success('Tipo de tarefa criado!');
      if (onTaskTypesChange) onTaskTypesChange();
    } catch (error) {
      console.error("Erro ao criar tipo de tarefa", error);
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
      toast.success('Tipo de tarefa atualizado!');
      if (onTaskTypesChange) onTaskTypesChange();
    } catch (error) {
      console.error("Erro ao atualizar tipo de tarefa", error);
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
      toast.success('Tipo de tarefa excluído!');
      if (onTaskTypesChange) onTaskTypesChange();
    } catch (error) {
      console.error("Erro ao deletar tipo de tarefa", error);
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

  const darkInputStyle = { backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-default)' };
  const customThStyle = { backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 };
  const customTdStyle = { backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-subtle)', color: 'var(--text-secondary)', fontSize: '0.85rem' };

  return (
    <>
      <Modal show={show} onHide={handleClose} centered size="lg" contentClassName="bg-transparent border-0">
        <div className="custom-modal-content">
          <Modal.Header closeButton closeVariant="white" style={{ borderColor: 'var(--border-subtle)' }}>
            <Modal.Title>Gerenciar Tipos de Tarefa</Modal.Title>
          </Modal.Header>
          <Modal.Body>
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
              <Button type="submit" style={{ backgroundColor: 'var(--accent)', border: 'none', color: 'var(--bg-base)', fontWeight: 600, fontSize: '0.85rem' }}>Criar</Button>
            </InputGroup>
          </Form>

          <hr className="text-secondary" />

          <h6 className="mb-3 mt-4">Tipos Existentes</h6>
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
                          <Button variant="outline-success" onClick={() => saveEditing(type)} aria-label="Salvar alteração"><Check /></Button>
                          <Button variant="outline-secondary" onClick={cancelEditing} aria-label="Cancelar edição"><X /></Button>
                        </InputGroup>
                      ) : (
                        type.name
                      )}
                    </td>
                    <td className="align-middle" style={customTdStyle}>{type.projectName}</td>
                    <td className="text-center align-middle" style={customTdStyle}>
                      <Button variant="link" size="sm" className="text-light me-2" onClick={() => startEditing(type)} aria-label="Editar tipo de tarefa"><PencilFill /></Button>
                      <Button variant="link" size="sm" className="text-danger" onClick={() => openDeleteConfirm(type)} aria-label="Excluir tipo de tarefa"><TrashFill /></Button>
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
        title="Confirmar Exclusão"
        body={`Tem certeza que deseja excluir o tipo "${typeToDelete?.name}"? As tarefas que usam este tipo não serão excluídas, mas perderão a associação.`}
      />
    </>
  );
}
