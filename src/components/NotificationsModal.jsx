import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Form, Badge, Spinner } from 'react-bootstrap';
import { toast } from 'sonner';
import BellFill from 'react-bootstrap-icons/dist/icons/bell-fill';
import PencilFill from 'react-bootstrap-icons/dist/icons/pencil-fill';
import TrashFill from 'react-bootstrap-icons/dist/icons/trash-fill';
import PlusLg from 'react-bootstrap-icons/dist/icons/plus-lg';
import XLg from 'react-bootstrap-icons/dist/icons/x-lg';
import api from '../services/api';
import CustomSelect from './CustomSelect';

const PRESET_OFFSETS = [
  { label: '10 min antes',  minutes: 10 },
  { label: '30 min antes',  minutes: 30 },
  { label: '1 hora antes',  minutes: 60 },
  { label: '1 dia antes',   minutes: 1440 },
];

const EMPTY_FORM = {
  name: '',
  projectId: '',
  scope: 'workspace',
  emails: [],
  offsets: [],
  customOffset: '',
  useCustomOffset: false,
  isActive: true,
};

export default function NotificationsModal({ show, handleClose, workspaceId, projects = [] }) {
  const { t } = useTranslation();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [emailInput, setEmailInput] = useState('');

  useEffect(() => {
    if (show && workspaceId) {
      loadRules();
    }
  }, [show, workspaceId]);

  const loadRules = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/notification-rules', { params: { workspaceId } });
      setRules(res.data);
    } catch {
      toast.error('Erro ao carregar regras de notificação');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEmailInput('');
    setEditingRuleId(null);
    setShowForm(true);
  };

  const openEdit = (rule) => {
    setForm({
      name: rule.name,
      projectId: rule.projectId ? String(rule.projectId) : '',
      scope: rule.projectId ? 'project' : 'workspace',
      emails: rule.recipients || [],
      offsets: (rule.offsets || []).filter(m => PRESET_OFFSETS.some(p => p.minutes === m)),
      customOffset: '',
      useCustomOffset: (rule.offsets || []).some(m => !PRESET_OFFSETS.some(p => p.minutes === m)),
      isActive: rule.isActive,
    });
    setEmailInput('');
    setEditingRuleId(rule.id);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingRuleId(null);
  };

  const addEmail = () => {
    const email = emailInput.trim().toLowerCase();
    if (!email || !email.includes('@')) return;
    if (form.emails.includes(email)) return;
    if (form.emails.length >= 10) {
      toast.error('Máximo de 10 destinatários por regra');
      return;
    }
    setForm(f => ({ ...f, emails: [...f.emails, email] }));
    setEmailInput('');
  };

  const removeEmail = (email) => {
    setForm(f => ({ ...f, emails: f.emails.filter(e => e !== email) }));
  };

  const toggleOffset = (minutes) => {
    setForm(f => ({
      ...f,
      offsets: f.offsets.includes(minutes)
        ? f.offsets.filter(m => m !== minutes)
        : [...f.offsets, minutes],
    }));
  };

  const buildOffsets = () => {
    const all = [...form.offsets];
    if (form.useCustomOffset && form.customOffset) {
      const m = parseInt(form.customOffset);
      if (!isNaN(m) && m >= 0 && !all.includes(m)) all.push(m);
    }
    return all;
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Informe um nome para a regra'); return; }
    if (form.emails.length === 0) { toast.error('Adicione ao menos um destinatário'); return; }
    const offsets = buildOffsets();
    if (offsets.length === 0) { toast.error('Selecione ao menos um alerta'); return; }

    const payload = {
      name: form.name.trim(),
      projectId: form.scope === 'project' && form.projectId ? parseInt(form.projectId) : null,
      emails: form.emails,
      offsets,
      isActive: form.isActive,
    };

    setSaving(true);
    try {
      if (editingRuleId) {
        await api.put(`/api/notification-rules/${editingRuleId}`, payload, { params: { workspaceId } });
        toast.success(t('notifications.ruleSaved'));
      } else {
        await api.post('/api/notification-rules', payload, { params: { workspaceId } });
        toast.success(t('notifications.ruleSaved'));
      }
      await loadRules();
      setShowForm(false);
      setEditingRuleId(null);
    } catch {
      toast.error('Erro ao salvar regra');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ruleId) => {
    if (!window.confirm(t('notifications.deleteRuleConfirm'))) return;
    try {
      await api.delete(`/api/notification-rules/${ruleId}`, { params: { workspaceId } });
      toast.success(t('notifications.ruleDeleted'));
      setRules(prev => prev.filter(r => r.id !== ruleId));
      if (editingRuleId === ruleId) cancelForm();
    } catch {
      toast.error('Erro ao excluir regra');
    }
  };

  const inputStyle = {
    backgroundColor: 'var(--bg-surface)',
    color: 'var(--text-primary)',
    borderColor: 'var(--border-default)',
  };

  return (
    <Modal show={show} onHide={handleClose} centered size="lg" contentClassName="border-0 bg-transparent">
      <div className="custom-modal-content">
        <Modal.Header closeButton closeVariant="white" style={{ borderColor: 'var(--border-subtle)' }}>
          <Modal.Title style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BellFill size={18} />
            {t('notifications.title')}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {loading ? (
            <div className="text-center py-4"><Spinner animation="border" size="sm" /></div>
          ) : !showForm ? (
            <>
              {rules.length === 0 ? (
                <div className="text-center py-5" style={{ color: 'var(--text-muted)' }}>
                  <BellFill size={36} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                  <p style={{ marginBottom: '1.5rem' }}>{t('notifications.noRules')}</p>
                  <Button onClick={openCreate} style={{ backgroundColor: 'var(--accent)', border: 'none', color: 'var(--bg-base)', fontWeight: 600 }}>
                    <PlusLg size={14} style={{ marginRight: '0.4rem' }} />
                    {t('notifications.createFirst')}
                  </Button>
                </div>
              ) : (
                <>
                  <div className="d-flex justify-content-end mb-3">
                    <Button onClick={openCreate} size="sm" style={{ backgroundColor: 'var(--accent)', border: 'none', color: 'var(--bg-base)', fontWeight: 600 }}>
                      <PlusLg size={13} style={{ marginRight: '0.35rem' }} />
                      {t('notifications.createRule')}
                    </Button>
                  </div>
                  {rules.map(rule => (
                    <div key={rule.id} style={{
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.9rem 1rem',
                      marginBottom: '0.75rem',
                      backgroundColor: 'var(--bg-surface)',
                    }}>
                      <div className="d-flex justify-content-between align-items-start">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                            <span style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>{rule.name}</span>
                            <span style={{
                              fontSize: '0.68rem',
                              padding: '0.1rem 0.5rem',
                              borderRadius: '100px',
                              backgroundColor: rule.projectId ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'var(--bg-hover)',
                              color: rule.projectId ? 'var(--accent)' : 'var(--text-muted)',
                              fontWeight: 500,
                            }}>
                              {rule.projectId ? (rule.projectName || 'Projeto') : t('notifications.scopeAll')}
                            </span>
                            <span style={{
                              fontSize: '0.68rem',
                              padding: '0.1rem 0.5rem',
                              borderRadius: '100px',
                              backgroundColor: rule.isActive ? 'color-mix(in srgb, #10b981 12%, transparent)' : 'var(--bg-hover)',
                              color: rule.isActive ? '#10b981' : 'var(--text-muted)',
                              fontWeight: 500,
                            }}>
                              {rule.isActive ? 'Ativa' : 'Inativa'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                            {(rule.recipients || []).join(', ')}
                          </div>
                          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                            {(rule.offsets || []).map(m => (
                              <span key={m} style={{
                                fontSize: '0.7rem',
                                padding: '0.1rem 0.45rem',
                                borderRadius: '100px',
                                backgroundColor: 'var(--bg-hover)',
                                color: 'var(--text-muted)',
                              }}>
                                {m < 60 ? `${m}min` : m < 1440 ? `${m / 60}h` : `${m / 1440}d`} antes
                              </span>
                            ))}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem', marginLeft: '0.75rem', flexShrink: 0 }}>
                          <Button variant="link" size="sm" onClick={() => openEdit(rule)} style={{ color: 'var(--text-muted)', padding: '0.2rem 0.4rem' }}>
                            <PencilFill size={13} />
                          </Button>
                          <Button variant="link" size="sm" onClick={() => handleDelete(rule.id)} style={{ color: 'var(--danger)', padding: '0.2rem 0.4rem' }}>
                            <TrashFill size={13} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          ) : (
            /* Rule Form */
            <div>
              <h6 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
                {editingRuleId ? 'Editar regra' : t('notifications.createRule')}
              </h6>

              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: '0.85rem' }}>{t('notifications.ruleName')}</Form.Label>
                <Form.Control
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  maxLength={120}
                  style={inputStyle}
                  className="custom-form-control"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: '0.85rem' }}>Escopo</Form.Label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['workspace', 'project'].map(s => (
                    <button key={s} type="button" onClick={() => setForm(f => ({ ...f, scope: s }))}
                      style={{
                        padding: '0.4rem 1rem', fontSize: '0.82rem', fontWeight: 600, borderRadius: 'var(--radius-md)',
                        border: `1px solid ${form.scope === s ? 'var(--accent)' : 'var(--border-default)'}`,
                        backgroundColor: form.scope === s ? 'var(--bg-hover)' : 'var(--bg-base)',
                        color: form.scope === s ? 'var(--accent)' : 'var(--text-muted)',
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}>
                      {s === 'workspace' ? t('notifications.scopeAll') : t('notifications.scopeProject')}
                    </button>
                  ))}
                </div>
              </Form.Group>

              {form.scope === 'project' && (
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontSize: '0.85rem' }}>Projeto</Form.Label>
                  <CustomSelect value={form.projectId} onChange={e => setForm(f => ({ ...f, projectId: e.target.value }))}>
                    <option value="">Selecionar projeto...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </CustomSelect>
                </Form.Group>
              )}

              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: '0.85rem' }}>{t('notifications.recipients')}</Form.Label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Form.Control
                    type="email"
                    placeholder="email@exemplo.com"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addEmail())}
                    style={inputStyle}
                    className="custom-form-control"
                  />
                  <Button onClick={addEmail} style={{ backgroundColor: 'var(--accent)', border: 'none', color: 'var(--bg-base)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {t('notifications.addEmail')}
                  </Button>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {form.emails.map(email => (
                    <span key={email} style={{
                      display: 'flex', alignItems: 'center', gap: '0.3rem',
                      fontSize: '0.78rem', padding: '0.2rem 0.6rem', borderRadius: '100px',
                      backgroundColor: 'color-mix(in srgb, var(--accent) 12%, transparent)',
                      color: 'var(--accent)',
                    }}>
                      {email}
                      <XLg size={10} style={{ cursor: 'pointer' }} onClick={() => removeEmail(email)} />
                    </span>
                  ))}
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: '0.85rem' }}>{t('notifications.offsets')}</Form.Label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {PRESET_OFFSETS.map(({ label, minutes }) => (
                    <Form.Check
                      key={minutes}
                      type="checkbox"
                      label={label}
                      checked={form.offsets.includes(minutes)}
                      onChange={() => toggleOffset(minutes)}
                      style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}
                    />
                  ))}
                  <Form.Check
                    type="checkbox"
                    label={t('notifications.offsetCustom')}
                    checked={form.useCustomOffset}
                    onChange={e => setForm(f => ({ ...f, useCustomOffset: e.target.checked }))}
                    style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}
                  />
                  {form.useCustomOffset && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '1.5rem' }}>
                      <Form.Control
                        type="number"
                        min="0"
                        value={form.customOffset}
                        onChange={e => setForm(f => ({ ...f, customOffset: e.target.value }))}
                        style={{ ...inputStyle, width: '90px' }}
                        className="custom-form-control"
                      />
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('notifications.offsetCustomUnit')}</span>
                    </div>
                  )}
                </div>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Check
                  type="switch"
                  label={t('notifications.activeToggle')}
                  checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}
                />
              </Form.Group>

              <div className="d-flex justify-content-between align-items-center">
                <div>
                  {editingRuleId && (
                    <Button variant="link" onClick={() => handleDelete(editingRuleId)}
                      style={{ color: 'var(--danger)', padding: 0, fontSize: '0.85rem' }}>
                      {t('notifications.deleteRule')}
                    </Button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button variant="secondary" onClick={cancelForm} style={{ fontSize: '0.85rem' }}>Cancelar</Button>
                  <Button onClick={handleSave} disabled={saving}
                    style={{ backgroundColor: 'var(--accent)', border: 'none', color: 'var(--bg-base)', fontWeight: 600, fontSize: '0.85rem' }}>
                    {saving ? <Spinner animation="border" size="sm" /> : t('notifications.saveRule')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
      </div>
    </Modal>
  );
}
