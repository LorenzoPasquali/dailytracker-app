import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { toast } from 'sonner';
import api from '../services/api';

const TITLE_LIMIT = 100;
const DESCRIPTION_LIMIT = 500;

export default function TaskFormModal({ show, handleClose, onTaskCreated, onTaskUpdated, taskToEdit, onDelete, projects = [] }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('PLANNED');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedTaskTypeId, setSelectedTaskTypeId] = useState('');
  const [availableTaskTypes, setAvailableTaskTypes] = useState([]);

  const titleInputRef = useRef(null);

  useEffect(() => {
    if (show) {
      if (taskToEdit) {
        setTitle(taskToEdit.title);
        setDescription(taskToEdit.description || '');
        setStatus(taskToEdit.status);
        setSelectedProjectId(taskToEdit.projectId || '');
        setSelectedTaskTypeId(taskToEdit.taskTypeId || '');
      } else {
        setTitle('');
        setDescription('');
        setStatus('PLANNED');
        setSelectedProjectId('');
        setSelectedTaskTypeId('');
        setAvailableTaskTypes([]);
      }
    }
  }, [show, taskToEdit]);

  useEffect(() => {
    if (selectedProjectId) {
      const project = projects.find(p => p.id === parseInt(selectedProjectId));
      setAvailableTaskTypes(project ? project.taskTypes : []);
      
      const currentTypeExistsInProject = project?.taskTypes.some(tt => tt.id === parseInt(selectedTaskTypeId));
      if (!currentTypeExistsInProject) {
        setSelectedTaskTypeId('');
      }
    } else {
      setAvailableTaskTypes([]);
      setSelectedTaskTypeId('');
    }
  }, [selectedProjectId, projects, selectedTaskTypeId]);

  const onModalEntered = () => {
    // Attempt focus immediately
    if (titleInputRef.current) {
      titleInputRef.current.focus();
    }
    // Fallback for production environments/slower transitions
    setTimeout(() => {
      if (titleInputRef.current) {
        titleInputRef.current.focus();
      }
    }, 100);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('O título da tarefa é obrigatório.');
      return;
    }

    const trimmedDescription = description.trim();

    try {
      const taskData = { 
        title, 
        description: trimmedDescription, 
        status,
        projectId: selectedProjectId ? parseInt(selectedProjectId) : null,
        taskTypeId: selectedTaskTypeId ? parseInt(selectedTaskTypeId) : null,
      };
      
      if (taskToEdit) {
        const response = await api.put(`/api/tasks/${taskToEdit.id}`, taskData);
        onTaskUpdated(response.data);
        toast.success('Tarefa atualizada!');
      } else {
        const response = await api.post('/api/tasks', taskData);
        onTaskCreated(response.data);
        toast.success('Tarefa criada!');
      }
      handleClose();
    } catch (error) {
      console.error("Erro ao salvar tarefa:", error);
    }
  };

  const handleDelete = () => {
    if (taskToEdit && onDelete) {
      onDelete(taskToEdit.id);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSave();
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey && !e.shiftKey && !e.altKey) {
      e.preventDefault();
      handleSave();
    }
  };

  const darkInputStyle = {
    backgroundColor: 'var(--bg-base)',
    color: 'var(--text-primary)',
    borderColor: 'var(--border-default)',
    resize: 'none',
  };

  return (
    <Modal 
      show={show} 
      onHide={handleClose} 
      onEntered={onModalEntered}
      centered 
      size="lg"
      contentClassName="border-0 bg-transparent"
      autoFocus={false}
    >
        <div className="custom-modal-content">
            <Modal.Header closeButton closeVariant="white" style={{ borderColor: 'var(--border-subtle)' }}>
                <Modal.Title>{taskToEdit ? 'Editar Tarefa' : 'Criar Nova Tarefa'}</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleFormSubmit}>
              <Modal.Body>
                  <Form.Group className="mb-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <Form.Label>
                          Titulo
                          <span style={{ color: 'var(--danger)' }}>*</span>
                      </Form.Label>
                      <Form.Text className="text-secondary">
                        {title.length} / {TITLE_LIMIT}
                      </Form.Text>
                    </div>
                    <Form.Control 
                      ref={titleInputRef}
                      type="text" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      maxLength={TITLE_LIMIT}
                      style={{...darkInputStyle, resize: 'auto' }}
                      className="custom-form-control"
                      autoFocus
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <Form.Label>Descrição</Form.Label>
                      <Form.Text className="text-secondary">
                        {description.length} / {DESCRIPTION_LIMIT}
                      </Form.Text>
                    </div>
                    <Form.Control 
                      as="textarea" 
                      rows={6}
                      value={description} 
                      onChange={(e) => setDescription(e.target.value)}
                      onKeyDown={handleKeyDown}
                      maxLength={DESCRIPTION_LIMIT}
                      style={darkInputStyle}
                      className="custom-form-control" 
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Projeto</Form.Label>
                    <Form.Select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} style={darkInputStyle} className="custom-form-control">
                        <option value="">Nenhum projeto</option>
                        {projects.map(project => (<option key={project.id} value={project.id}>{project.name}</option>))}
                    </Form.Select>
                  </Form.Group>
                  {selectedProjectId && (
                    <Form.Group className="mb-3">
                        <Form.Label>Tipo de Tarefa</Form.Label>
                        <Form.Select value={selectedTaskTypeId} onChange={(e) => setSelectedTaskTypeId(e.target.value)} style={darkInputStyle} className="custom-form-control" disabled={availableTaskTypes.length === 0}>
                        <option value="">Nenhum tipo</option>
                        {availableTaskTypes.map(type => (<option key={type.id} value={type.id}>{type.name}</option>))}
                        </Form.Select>
                    </Form.Group>
                  )}
                  <Form.Group className="mb-3">
                    <Form.Label>Status</Form.Label>
                    <Form.Select value={status} onChange={(e) => setStatus(e.target.value)} style={darkInputStyle} className="custom-form-control">
                        <option value="PLANNED">Planejado</option>
                        <option value="DOING">Em progresso</option>
                        <option value="DONE">Feito</option>
                    </Form.Select>
                  </Form.Group>
              </Modal.Body>
              <Modal.Footer style={{ borderColor: 'var(--border-subtle)' }} className="d-flex justify-content-between">
                <div>
                  {taskToEdit && (
                    <Button
                      onClick={handleDelete}
                      style={{
                        backgroundColor: 'var(--danger-subtle)',
                        border: 'none',
                        color: 'var(--danger)',
                        fontSize: '0.85rem',
                        fontWeight: 500
                      }}
                    >
                      Excluir Tarefa
                    </Button>
                  )}
                </div>
                <div>
                  <Button
                    type="submit"
                    style={{
                      backgroundColor: 'var(--accent)',
                      border: 'none',
                      color: 'var(--bg-base)',
                      fontWeight: 600,
                      fontSize: '0.85rem'
                    }}
                  >
                    {taskToEdit ? 'Salvar Alteracoes' : 'Salvar Tarefa'}
                  </Button>
                </div>
              </Modal.Footer>
            </Form>
        </div>
    </Modal>
  );
}
