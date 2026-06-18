import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Form } from 'react-bootstrap';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Check from 'react-bootstrap-icons/dist/icons/check';
import CheckCircleFill from 'react-bootstrap-icons/dist/icons/check-circle-fill';
import Circle from 'react-bootstrap-icons/dist/icons/circle';
import PencilFill from 'react-bootstrap-icons/dist/icons/pencil-fill';
import TrashFill from 'react-bootstrap-icons/dist/icons/trash-fill';
import X from 'react-bootstrap-icons/dist/icons/x';
import GripVertical from 'react-bootstrap-icons/dist/icons/grip-vertical';
import Kanban from 'react-bootstrap-icons/dist/icons/kanban';
import { toast } from 'sonner';
import api from '../services/api';
import ColorPicker from './ColorPicker';
import CustomSelect from './CustomSelect';
import { useMediaQuery } from '../hooks/useMediaQuery';

const inputStyle = {
  backgroundColor: 'var(--bg-surface)',
  color: 'var(--text-primary)',
  borderColor: 'var(--border-default)',
  boxShadow: 'none',
  borderRadius: '8px',
  fontSize: '0.9rem',
};

function SortableStageRow({
  stage, isMobile, editingId, editingName, setEditingName,
  startEditing, cancelEditing, saveEditing, onColorChange, onToggleFinal,
  onDelete, t,
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stage.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : 'auto',
  };
  const isEditing = editingId === stage.id;

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        display: 'flex', alignItems: 'center', gap: '0.6rem',
        padding: '0.65rem 0.85rem',
        backgroundColor: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '10px',
      }}
    >
      {/* Drag handle */}
      <span
        {...attributes}
        {...listeners}
        style={{ cursor: 'grab', color: 'var(--text-muted)', display: 'flex', flexShrink: 0, touchAction: 'none' }}
        aria-label={t('stages.reorderHint')}
      >
        <GripVertical size={16} />
      </span>

      {/* Color swatch / picker */}
      <div style={{ flexShrink: 0 }}>
        <ColorPicker currentColor={stage.color} onColorSelect={(color) => onColorChange(stage, color)} />
      </div>

      {/* Name or edit input */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {isEditing ? (
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <Form.Control
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              maxLength={100}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); saveEditing(stage); }
                if (e.key === 'Escape') cancelEditing();
              }}
              autoFocus={!isMobile}
              size="sm"
              style={{ ...inputStyle, flex: 1 }}
              className="custom-form-control"
            />
            <Button size="sm" variant="outline-success" onClick={() => saveEditing(stage)} style={{ borderRadius: '6px', padding: '0.2rem 0.5rem' }}>
              <Check size={14} />
            </Button>
            <Button size="sm" variant="outline-secondary" onClick={cancelEditing} style={{ borderRadius: '6px', padding: '0.2rem 0.5rem' }}>
              <X size={14} />
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
            <span style={{
              fontSize: '0.9rem', color: 'var(--text-primary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {stage.name}
            </span>
            {stage.isFinal && (
              <span style={{
                fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.04em',
                textTransform: 'uppercase', color: 'var(--accent)',
                backgroundColor: 'var(--accent-subtle)',
                border: '1px solid var(--accent-border)',
                padding: '0.05rem 0.4rem', borderRadius: '100px', flexShrink: 0,
              }}>
                {t('stages.finalBadge')}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      {!isEditing && (
        <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0, alignItems: 'center' }}>
          {/* Toggle final */}
          <button
            onClick={() => onToggleFinal(stage)}
            title={t('stages.finalHint')}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: stage.isFinal ? 'var(--accent)' : 'var(--text-muted)',
              padding: '0.3rem', borderRadius: '6px', display: 'flex', alignItems: 'center',
              transition: 'color 0.15s, background-color 0.15s',
            }}
            aria-label={t('stages.finalLabel')}
          >
            {stage.isFinal ? <CheckCircleFill size={14} /> : <Circle size={14} />}
          </button>
          <button
            onClick={() => startEditing(stage)}
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
            onClick={() => onDelete(stage)}
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
  );
}

export default function StagesModal({ show, handleClose, onStagesChange, stages = [], workspaceId }) {
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 992px)');

  const [localStages, setLocalStages] = useState(stages);
  const [newStageName, setNewStageName] = useState('');
  const [newStageColor, setNewStageColor] = useState('#6366f1');
  const [newStageFinal, setNewStageFinal] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [stageToDelete, setStageToDelete] = useState(null);
  const [targetStageId, setTargetStageId] = useState('');

  const wsParams = workspaceId ? { workspaceId } : {};

  useEffect(() => { setLocalStages(stages); }, [stages]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleCreate = async () => {
    if (!newStageName.trim()) return;
    try {
      await api.post('/api/stages', { name: newStageName.trim(), color: newStageColor, isFinal: newStageFinal }, { params: wsParams });
      setNewStageName('');
      setNewStageColor('#6366f1');
      setNewStageFinal(false);
      toast.success(t('stages.createdToast'));
      onStagesChange?.();
    } catch {
      // interceptor handles error display
    }
  };

  const updateStage = async (stage, patch) => {
    try {
      await api.put(`/api/stages/${stage.id}`, {
        name: patch.name ?? stage.name,
        color: patch.color ?? stage.color,
        isFinal: patch.isFinal ?? stage.isFinal,
      }, { params: wsParams });
      toast.success(t('stages.updatedToast'));
      onStagesChange?.();
    } catch {
      // interceptor handles error display
    }
  };

  const startEditing = (stage) => { setEditingId(stage.id); setEditingName(stage.name); };
  const cancelEditing = () => { setEditingId(null); setEditingName(''); };
  const saveEditing = (stage) => {
    if (editingName.trim() && editingName !== stage.name) {
      updateStage(stage, { name: editingName.trim() });
    }
    cancelEditing();
  };

  const onColorChange = (stage, color) => updateStage(stage, { color });
  const onToggleFinal = (stage) => updateStage(stage, { isFinal: !stage.isFinal });

  const openDelete = (stage) => {
    if (localStages.length <= 1) {
      toast.error(t('stages.lastStageError'));
      return;
    }
    setStageToDelete(stage);
    const firstOther = localStages.find(s => s.id !== stage.id);
    setTargetStageId(firstOther ? String(firstOther.id) : '');
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!stageToDelete) return;
    try {
      await api.delete(`/api/stages/${stageToDelete.id}`, {
        params: { ...wsParams, ...(targetStageId ? { targetStageId: parseInt(targetStageId) } : {}) },
      });
      toast.success(t('stages.deletedToast'));
      onStagesChange?.();
    } catch {
      // interceptor handles error display
    } finally {
      setShowDeleteConfirm(false);
      setStageToDelete(null);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = localStages.findIndex(s => s.id === active.id);
    const newIndex = localStages.findIndex(s => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(localStages, oldIndex, newIndex);
    setLocalStages(reordered);
    const payload = reordered.map((s, i) => ({ id: s.id, position: i * 10 }));
    api.put('/api/stages/reorder', payload, { params: wsParams })
      .then(() => onStagesChange?.())
      .catch(() => { setLocalStages(stages); });
  };

  const handleCreateSubmit = (e) => { e.preventDefault(); handleCreate(); };

  return (
    <>
      <Modal show={show} onHide={handleClose} centered size="lg" contentClassName="bg-transparent border-0">
        <div className="custom-modal-content">
          <Modal.Header closeButton closeVariant="white" style={{ borderColor: 'var(--border-subtle)' }}>
            <Modal.Title style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Kanban size={18} style={{ color: 'var(--accent)' }} />
              {t('stages.modalTitle')}
            </Modal.Title>
          </Modal.Header>

          <Modal.Body style={{ padding: '1.5rem' }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '-0.5rem', marginBottom: '1.25rem' }}>
              {t('stages.subtitle')}
            </p>

            {/* ── Create Form ── */}
            <div style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1.5rem',
            }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                {t('stages.newStage')}
              </p>
              <Form onSubmit={handleCreateSubmit}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '42px', height: '42px', flexShrink: 0,
                    backgroundColor: 'var(--bg-base)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '8px',
                  }}>
                    <ColorPicker currentColor={newStageColor} onColorSelect={setNewStageColor} />
                  </div>

                  <Form.Control
                    placeholder={t('stages.namePlaceholder')}
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                    maxLength={100}
                    style={{ ...inputStyle, flex: 1, minWidth: '140px', height: '42px' }}
                    className="custom-form-control"
                  />

                  <button
                    type="button"
                    onClick={() => setNewStageFinal(f => !f)}
                    title={t('stages.finalHint')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.4rem',
                      height: '42px', padding: '0 0.85rem',
                      fontSize: '0.82rem', fontWeight: 600,
                      color: newStageFinal ? 'var(--accent)' : 'var(--text-muted)',
                      backgroundColor: newStageFinal ? 'var(--accent-subtle)' : 'var(--bg-base)',
                      border: `1px solid ${newStageFinal ? 'var(--accent-border)' : 'var(--border-default)'}`,
                      borderRadius: '8px', cursor: 'pointer', flexShrink: 0,
                      transition: 'all var(--transition)', outline: 'none', fontFamily: 'inherit',
                    }}
                  >
                    {newStageFinal ? <CheckCircleFill size={14} /> : <Circle size={14} />}
                    {t('stages.finalLabel')}
                  </button>

                  <Button
                    type="submit"
                    disabled={!newStageName.trim()}
                    style={{
                      backgroundColor: 'var(--accent)', border: 'none',
                      color: '#fff', fontWeight: 600, fontSize: '0.875rem',
                      height: '42px', padding: '0 1.25rem', borderRadius: '8px',
                      flexShrink: 0, opacity: newStageName.trim() ? 1 : 0.5,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    {t('common.create')}
                  </Button>
                </div>
              </Form>
            </div>

            {/* ── Stage List ── */}
            <p style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              {t('stages.existingStages')}
            </p>

            {localStages.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '2.5rem 1rem',
                color: 'var(--text-muted)', fontSize: '0.9rem',
                border: '1px dashed var(--border-subtle)', borderRadius: '10px',
              }}>
                {t('stages.noStages')}
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={localStages.map(s => s.id)} strategy={verticalListSortingStrategy}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {localStages.map(stage => (
                      <SortableStageRow
                        key={stage.id}
                        stage={stage}
                        isMobile={isMobile}
                        editingId={editingId}
                        editingName={editingName}
                        setEditingName={setEditingName}
                        startEditing={startEditing}
                        cancelEditing={cancelEditing}
                        saveEditing={saveEditing}
                        onColorChange={onColorChange}
                        onToggleFinal={onToggleFinal}
                        onDelete={openDelete}
                        t={t}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </Modal.Body>
        </div>
      </Modal>

      <Modal show={showDeleteConfirm} onHide={() => setShowDeleteConfirm(false)} centered contentClassName="bg-transparent border-0">
        <div className="custom-modal-content">
          <Modal.Header closeButton closeVariant="white" style={{ borderColor: 'var(--border-subtle)' }}>
            <Modal.Title style={{ fontSize: '1rem', fontWeight: 600 }}>{t('stages.deleteTitle')}</Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>{t('stages.deleteBody', { name: stageToDelete?.name })}</p>
            <Form.Label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('stages.moveTasksLabel')}</Form.Label>
            <CustomSelect value={targetStageId} onChange={(e) => setTargetStageId(e.target.value)}>
              {localStages.filter(s => s.id !== stageToDelete?.id).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </CustomSelect>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: 0 }}>
              {t('stages.moveTasksHint')}
            </p>
          </Modal.Body>
          <Modal.Footer style={{ borderColor: 'var(--border-subtle)' }}>
            <Button
              onClick={() => setShowDeleteConfirm(false)}
              style={{ backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={confirmDelete}
              style={{ backgroundColor: 'var(--danger)', border: 'none', color: '#fff', fontWeight: 600, fontSize: '0.85rem' }}
            >
              {t('common.delete')}
            </Button>
          </Modal.Footer>
        </div>
      </Modal>
    </>
  );
}
