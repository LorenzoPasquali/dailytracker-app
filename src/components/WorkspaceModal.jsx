import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import { toast } from 'sonner';
import api from '../services/api';
import ConfirmationModal from './ConfirmationModal';
import XLg from 'react-bootstrap-icons/dist/icons/x-lg';
import ClipboardFill from 'react-bootstrap-icons/dist/icons/clipboard-fill';
import CheckLg from 'react-bootstrap-icons/dist/icons/check-lg';
import PersonXFill from 'react-bootstrap-icons/dist/icons/person-x-fill';

const MODE_CREATE = 'create';
const MODE_MANAGE = 'manage';

export default function WorkspaceModal({
  show,
  onHide,
  mode,
  workspace,
  currentUserId,
  onWorkspaceCreated,
  onWorkspaceUpdated,
  onWorkspaceDeleted,
  onMemberRemoved,
}) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [inviteUrl, setInviteUrl] = useState('');
  const [inviteCopied, setInviteCopied] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);

  // Delete flow states
  const [showDeleteConfirm1, setShowDeleteConfirm1] = useState(false);
  const [showDeleteNameInput, setShowDeleteNameInput] = useState(false);
  const [deleteNameInput, setDeleteNameInput] = useState('');
  const [showDeleteConfirm2, setShowDeleteConfirm2] = useState(false);

  const isCreator = workspace?.role === 'CREATOR';

  useEffect(() => {
    if (show) {
      if (mode === MODE_MANAGE && workspace) {
        setName(workspace.name);
        setInviteUrl('');
        setInviteCopied(false);
        setDeleteNameInput('');
        loadMembers();
      } else {
        setName('');
      }
    }
  }, [show, mode, workspace?.id]);

  const loadMembers = async () => {
    try {
      const res = await api.get(`/api/workspaces/${workspace.id}/members`, { _silent: true });
      setMembers(res.data || []);
    } catch {
      // ignore
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/api/workspaces', { name: name.trim() });
      toast.success('Workspace criado!');
      onWorkspaceCreated?.(res.data);
      onHide();
    } catch {
      // handled by api interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleRename = async (e) => {
    e.preventDefault();
    if (!name.trim() || name.trim() === workspace?.name) return;
    setLoading(true);
    try {
      const res = await api.put(`/api/workspaces/${workspace.id}`, { name: name.trim() });
      toast.success('Workspace renomeado!');
      onWorkspaceUpdated?.(res.data);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvite = async () => {
    setInviteLoading(true);
    try {
      const res = await api.post(`/api/workspaces/${workspace.id}/invite`);
      setInviteUrl(res.data.url);
    } catch {
      // handled by interceptor
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteUrl);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  };

  const handleRemoveMember = async (targetUserId) => {
    try {
      await api.delete(`/api/workspaces/${workspace.id}/members/${targetUserId}`);
      setMembers(prev => prev.filter(m => m.userId !== targetUserId));
      if (targetUserId === currentUserId) {
        onMemberRemoved?.();
        onHide();
      }
    } catch {
      // handled by interceptor
    }
  };

  const handleDeleteStep1 = () => { setShowDeleteConfirm1(true); };
  const handleDeleteStep2 = () => { setShowDeleteConfirm1(false); setShowDeleteNameInput(true); };
  const handleDeleteStep3 = () => {
    if (deleteNameInput !== workspace?.name) return;
    setShowDeleteNameInput(false);
    setShowDeleteConfirm2(true);
  };
  const handleDeleteConfirm = async () => {
    setShowDeleteConfirm2(false);
    try {
      await api.delete(`/api/workspaces/${workspace.id}`);
      toast.success('Workspace deletado.');
      onWorkspaceDeleted?.(workspace.id);
      onHide();
    } catch {
      // handled by interceptor
    }
  };

  return (
    <>
      <Modal
        show={show && !showDeleteConfirm1 && !showDeleteNameInput && !showDeleteConfirm2}
        onHide={onHide}
        centered
        size="md"
      >
        <Modal.Header
          style={{
            backgroundColor: 'var(--bg-elevated)',
            borderBottom: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
          }}
        >
          <Modal.Title style={{ fontSize: '1rem', fontWeight: 600 }}>
            {mode === MODE_CREATE ? 'Novo workspace' : `Gerenciar: ${workspace?.name}`}
          </Modal.Title>
          <button
            onClick={onHide}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
          >
            <XLg size={16} />
          </button>
        </Modal.Header>

        <Modal.Body style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
          {mode === MODE_CREATE && (
            <Form onSubmit={handleCreate}>
              <Form.Group className="mb-3">
                <Form.Label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Nome do workspace</Form.Label>
                <Form.Control
                  autoFocus
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Time Alpha"
                  maxLength={100}
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                  }}
                />
              </Form.Group>
              <Button
                type="submit"
                disabled={!name.trim() || loading}
                style={{
                  backgroundColor: 'var(--accent)',
                  border: 'none',
                  color: 'var(--bg-base)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  width: '100%',
                }}
              >
                {loading ? <Spinner size="sm" animation="border" /> : 'Criar workspace'}
              </Button>
            </Form>
          )}

          {mode === MODE_MANAGE && (
            <div>
              {/* Rename (creator only) */}
              {isCreator && !workspace?.isPersonal && (
                <Form onSubmit={handleRename} className="mb-4">
                  <Form.Label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Nome</Form.Label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Form.Control
                      value={name}
                      onChange={e => setName(e.target.value)}
                      maxLength={100}
                      style={{
                        backgroundColor: 'var(--bg-input)',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem',
                      }}
                    />
                    <Button
                      type="submit"
                      disabled={!name.trim() || name.trim() === workspace?.name || loading}
                      variant="outline-secondary"
                      size="sm"
                    >
                      {loading ? <Spinner size="sm" animation="border" /> : 'Salvar'}
                    </Button>
                  </div>
                </Form>
              )}

              {/* Invite link (creator only) */}
              {!workspace?.isPersonal && isCreator && (
                <div className="mb-4">
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                    Link de convite
                  </div>
                  {inviteUrl ? (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        readOnly
                        value={inviteUrl}
                        style={{
                          flex: 1,
                          padding: '0.4rem 0.6rem',
                          fontSize: '0.78rem',
                          backgroundColor: 'var(--bg-input)',
                          border: '1px solid var(--border-default)',
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-secondary)',
                          outline: 'none',
                        }}
                        onClick={e => e.target.select()}
                      />
                      <button
                        onClick={handleCopyInvite}
                        style={{
                          background: 'none',
                          border: '1px solid var(--border-default)',
                          borderRadius: 'var(--radius-sm)',
                          color: inviteCopied ? 'var(--accent)' : 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '0.4rem',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title="Copiar link"
                      >
                        {inviteCopied ? <CheckLg size={14} /> : <ClipboardFill size={14} />}
                      </button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      onClick={handleGenerateInvite}
                      disabled={inviteLoading}
                    >
                      {inviteLoading ? <Spinner size="sm" animation="border" /> : 'Gerar link de convite'}
                    </Button>
                  )}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    O link expira em 24 horas.
                  </div>
                </div>
              )}

              {/* Members list */}
              {!workspace?.isPersonal && (
                <div className="mb-4">
                  <div style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                    Membros ({members.length})
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '200px', overflowY: 'auto' }}>
                    {members.map(m => (
                      <div key={m.userId} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.4rem 0.6rem',
                        backgroundColor: 'var(--bg-surface)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                      }}>
                        <div>
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{m.name || m.email}</span>
                          <span style={{
                            marginLeft: '0.5rem',
                            fontSize: '0.7rem',
                            color: 'var(--text-muted)',
                            backgroundColor: 'var(--bg-elevated)',
                            padding: '0.1rem 0.4rem',
                            borderRadius: '999px',
                            border: '1px solid var(--border-subtle)',
                          }}>
                            {m.role}
                          </span>
                        </div>
                        {/* Creator can remove members; any member can leave */}
                        {(isCreator && m.userId !== currentUserId) || (!isCreator && m.userId === currentUserId) ? (
                          <button
                            onClick={() => handleRemoveMember(m.userId)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: 'var(--danger)',
                              cursor: 'pointer',
                              padding: '0.2rem',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                            title={m.userId === currentUserId ? 'Sair do workspace' : 'Remover membro'}
                          >
                            <PersonXFill size={14} />
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Leave / Delete */}
              {!workspace?.isPersonal && (
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                  {!isCreator ? (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleRemoveMember(currentUserId)}
                    >
                      Sair do workspace
                    </Button>
                  ) : (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={handleDeleteStep1}
                    >
                      Deletar workspace
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Delete step 1 — generic confirm */}
      <ConfirmationModal
        show={showDeleteConfirm1}
        onHide={() => setShowDeleteConfirm1(false)}
        onConfirm={handleDeleteStep2}
        title="Deletar workspace"
        body={`Tem certeza que deseja deletar o workspace "${workspace?.name}"?`}
        confirmButtonText="Sim, continuar"
        confirmButtonVariant="danger"
      />

      {/* Delete step 2 — type name to confirm */}
      <Modal
        show={showDeleteNameInput}
        onHide={() => setShowDeleteNameInput(false)}
        centered
      >
        <Modal.Header style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}>
          <Modal.Title style={{ fontSize: '1rem', fontWeight: 600 }}>Confirmação de deleção</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Digite o nome do workspace para confirmar:
          </p>
          <Form.Control
            autoFocus
            value={deleteNameInput}
            onChange={e => setDeleteNameInput(e.target.value)}
            placeholder={workspace?.name}
            style={{
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
            }}
          />
        </Modal.Body>
        <Modal.Footer style={{ backgroundColor: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}>
          <Button variant="secondary" size="sm" onClick={() => setShowDeleteNameInput(false)}>Cancelar</Button>
          <Button
            variant="danger"
            size="sm"
            disabled={deleteNameInput !== workspace?.name}
            onClick={handleDeleteStep3}
          >
            Continuar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete step 3 — final warning */}
      <ConfirmationModal
        show={showDeleteConfirm2}
        onHide={() => setShowDeleteConfirm2(false)}
        onConfirm={handleDeleteConfirm}
        title="Atenção: ação irreversível"
        body="Todas as tarefas e projetos deste workspace serão permanentemente deletados. Esta ação não pode ser desfeita."
        confirmButtonText="Deletar permanentemente"
        confirmButtonVariant="danger"
      />
    </>
  );
}
