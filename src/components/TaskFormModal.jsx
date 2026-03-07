import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import api from '../services/api';

const TITLE_LIMIT = 100;
const DESCRIPTION_LIMIT = 500;

export default function TaskFormModal({ show, handleClose, onTaskCreated, onTaskUpdated, taskToEdit, onDelete }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('PLANNED');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedTaskTypeId, setSelectedTaskTypeId] = useState('');
  const [projects, setProjects] = useState([]);
  const [availableTaskTypes, setAvailableTaskTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  const titleInputRef = useRef(null);

  useEffect(() => {
    if (show) {
      if (!taskToEdit && titleInputRef.current) {
        setTimeout(() => titleInputRef.current.focus(), 100);
      }
      
      setLoading(true);
      api.get('/api/projects')
        .then(response => {
          setProjects(response.data);
          if (taskToEdit) {
            setTitle(taskToEdit.title);
            setDescription(taskToEdit.description || '');
            setStatus(taskToEdit.status);
            setSelectedProjectId(taskToEdit.projectId || '');
            setSelectedTaskTypeId(taskToEdit.taskTypeId || '');
          }
        })
        .catch(error => console.error("Erro ao buscar projetos", error))
        .finally(() => setLoading(false));
    } else {
      setTitle('');
      setDescription('');
      setStatus('PLANNED');
      setSelectedProjectId('');
      setSelectedTaskTypeId('');
      setAvailableTaskTypes([]);
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

  const handleSave = async () => {
    if (!title.trim()) {
      alert('O título da tarefa é obrigatório.');
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
      } else {
        const response = await api.post('/api/tasks', taskData);
        onTaskCreated(response.data);
      }
      handleClose();
    } catch (error) {
      console.error("Erro ao salvar tarefa:", error);
      alert('Não foi possível salvar a tarefa.');
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

  const modalStyle = {
    backgroundColor: 'rgba(13, 17, 23, 0.8)',
    backdropFilter: 'blur(5px)',
    color: '#c9d1d9',
    borderRadius: '16px',
  };

  const darkInputStyle = { 
    backgroundColor: '#21262d', 
    color: 'white', 
    borderColor: '#30363d',
    resize: 'none',
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg" dialogClassName="modal-transparent">
        <div style={modalStyle}>
            <Modal.Header closeButton closeVariant="white" className="border-secondary">
                <Modal.Title>{taskToEdit ? 'Editar Tarefa' : 'Criar Nova Tarefa'}</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleFormSubmit}>
              <Modal.Body>
                  {loading ? <div className="text-center"><Spinner /></div> : (
                  <>
                      <Form.Group className="mb-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <Form.Label>
                              Título
                              <span style={{ color: '#ef4444' }}>*</span>
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
                  </>
                  )}
              </Modal.Body>
              <Modal.Footer className="border-secondary d-flex justify-content-between">
                <div>
                  {taskToEdit && (
                    <Button variant="outline-danger" onClick={handleDelete}>Excluir Tarefa</Button>
                  )}
                </div>
                <div>
                  <Button variant="primary" type="submit">{taskToEdit ? 'Salvar Alterações' : 'Salvar Tarefa'}</Button>
                </div>
              </Modal.Footer>
            </Form>
        </div>
    </Modal>
  );
}