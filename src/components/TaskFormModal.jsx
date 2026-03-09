import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Form } from 'react-bootstrap';
import { toast } from 'sonner';
import ExclamationTriangleFill from 'react-bootstrap-icons/dist/icons/exclamation-triangle-fill';
import DashCircleFill from 'react-bootstrap-icons/dist/icons/dash-circle-fill';
import ArrowDownCircleFill from 'react-bootstrap-icons/dist/icons/arrow-down-circle-fill';
import api from '../services/api';

const PRIORITY_OPTIONS = [
  { value: 'HIGH',   icon: ExclamationTriangleFill, color: '#ef4444' },
  { value: 'MEDIUM', icon: DashCircleFill,           color: '#f59e0b' },
  { value: 'LOW',    icon: ArrowDownCircleFill,       color: '#6b7280' },
];

const TITLE_LIMIT = 100;
const DESCRIPTION_LIMIT = 500;

export default function TaskFormModal({ show, handleClose, onTaskCreated, onTaskUpdated, taskToEdit, onDelete, projects = [] }) {
  const { t } = useTranslation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('PLANNED');
  const [priority, setPriority] = useState('MEDIUM');
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
        setPriority(taskToEdit.priority || 'MEDIUM');
        setSelectedProjectId(taskToEdit.projectId || '');
        setSelectedTaskTypeId(taskToEdit.taskTypeId || '');
      } else {
        setTitle('');
        setDescription('');
        setStatus('PLANNED');
        setPriority('MEDIUM');
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
      toast.error(t('taskForm.titleRequired'));
      return;
    }

    const trimmedDescription = description.trim();

    try {
      const taskData = {
        title,
        description: trimmedDescription,
        status,
        priority,
        projectId: selectedProjectId ? parseInt(selectedProjectId) : null,
        taskTypeId: selectedTaskTypeId ? parseInt(selectedTaskTypeId) : null,
      };
      
      if (taskToEdit) {
        const response = await api.put(`/api/tasks/${taskToEdit.id}`, taskData);
        onTaskUpdated({ ...response.data, priority: response.data.priority ?? taskData.priority });
        toast.success(t('taskForm.updatedToast'));
      } else {
        const response = await api.post('/api/tasks', taskData);
        onTaskCreated({ ...response.data, priority: response.data.priority ?? taskData.priority });
        toast.success(t('taskForm.createdToast'));
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
                <Modal.Title>{taskToEdit ? t('taskForm.editTitle') : t('taskForm.createTitle')}</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleFormSubmit}>
              <Modal.Body>
                  <Form.Group className="mb-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <Form.Label>
                          {t('taskForm.titleLabel')}
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
                      <Form.Label>{t('taskForm.descriptionLabel')}</Form.Label>
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
                    <Form.Label>{t('taskForm.projectLabel')}</Form.Label>
                    <Form.Select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} style={darkInputStyle} className="custom-form-control">
                        <option value="">{t('taskForm.noProject')}</option>
                        {projects.map(project => (<option key={project.id} value={project.id}>{project.name}</option>))}
                    </Form.Select>
                  </Form.Group>
                  {selectedProjectId && (
                    <Form.Group className="mb-3">
                        <Form.Label>{t('taskForm.taskTypeLabel')}</Form.Label>
                        <Form.Select value={selectedTaskTypeId} onChange={(e) => setSelectedTaskTypeId(e.target.value)} style={darkInputStyle} className="custom-form-control" disabled={availableTaskTypes.length === 0}>
                        <option value="">{t('taskForm.noTaskType')}</option>
                        {availableTaskTypes.map(type => (<option key={type.id} value={type.id}>{type.name}</option>))}
                        </Form.Select>
                    </Form.Group>
                  )}
                  <Form.Group className="mb-3">
                    <Form.Label>{t('taskForm.statusLabel')}</Form.Label>
                    <Form.Select value={status} onChange={(e) => setStatus(e.target.value)} style={darkInputStyle} className="custom-form-control">
                        <option value="PLANNED">{t('taskForm.statusPlanned')}</option>
                        <option value="DOING">{t('taskForm.statusDoing')}</option>
                        <option value="DONE">{t('taskForm.statusDone')}</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>{t('taskForm.priorityLabel')}</Form.Label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {PRIORITY_OPTIONS.map(({ value, icon: Icon, color }) => {
                        const isSelected = priority === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setPriority(value)}
                            style={{
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.4rem',
                              padding: '0.45rem 0.5rem',
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              color: isSelected ? color : 'var(--text-muted)',
                              backgroundColor: isSelected ? 'var(--bg-hover)' : 'var(--bg-base)',
                              border: `1px solid ${isSelected ? color : 'var(--border-default)'}`,
                              borderRadius: 'var(--radius-md)',
                              cursor: 'pointer',
                              transition: 'all var(--transition)',
                              fontFamily: 'inherit',
                              outline: 'none',
                            }}
                          >
                            <Icon size={13} style={{ color: isSelected ? color : 'var(--text-muted)', flexShrink: 0 }} />
                            {t(`taskForm.priority${value.charAt(0) + value.slice(1).toLowerCase()}`)}
                          </button>
                        );
                      })}
                    </div>
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
                      {t('taskForm.deleteButton')}
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
                    {taskToEdit ? t('taskForm.saveEdit') : t('taskForm.saveCreate')}
                  </Button>
                </div>
              </Modal.Footer>
            </Form>
        </div>
    </Modal>
  );
}
