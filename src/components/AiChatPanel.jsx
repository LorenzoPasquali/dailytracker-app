import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Spinner } from 'react-bootstrap';
import Stars from 'react-bootstrap-icons/dist/icons/stars';
import SendFill from 'react-bootstrap-icons/dist/icons/send-fill';
import KeyFill from 'react-bootstrap-icons/dist/icons/key-fill';
import GearFill from 'react-bootstrap-icons/dist/icons/gear-fill';
import TrashFill from 'react-bootstrap-icons/dist/icons/trash-fill';
import Trash from 'react-bootstrap-icons/dist/icons/trash';
import { toast } from 'sonner';
import api from '../services/api';
import ChatMarkdown from './ChatMarkdown';

const STORAGE_KEY = 'dt_ai_chat_history';

function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function AiChatPanel({ isOpen, isMobile, onTasksCreated }) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState(loadHistory);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasKey, setHasKey] = useState(null);
  const [keyInput, setKeyInput] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Cache chat history locally so it survives open/close and reloads (no DB).
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch { /* ignore quota errors */ }
  }, [messages]);

  // Fetch key status once on mount.
  useEffect(() => {
    api.get('/api/ai/key-status')
      .then(res => setHasKey(res.data.hasKey))
      .catch(() => setHasKey(false));
  }, []);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    if (isMobile || !isOpen) return;
    if (hasKey && !loading) inputRef.current?.focus();
  }, [hasKey, loading, isOpen, isMobile]);

  const handleSaveKey = async () => {
    if (!keyInput.trim()) return;
    setSavingKey(true);
    try {
      await api.put('/api/ai/key', { key: keyInput.trim() });
      setHasKey(true);
      setKeyInput('');
      setShowSettings(false);
      toast.success(t('aiChat.keySavedToast'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('aiChat.keySaveError'));
    } finally {
      setSavingKey(false);
    }
  };

  const clearHistory = () => {
    setMessages([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  };

  const handleDeleteKey = async () => {
    if (!window.confirm(t('aiChat.removeKeyConfirm'))) return;
    setSavingKey(true);
    try {
      await api.delete('/api/ai/key');
      setHasKey(false);
      clearHistory();
      setShowSettings(false);
      toast.success(t('aiChat.keyRemovedToast'));
    } catch {
      toast.error(t('aiChat.keyRemoveError'));
    } finally {
      setSavingKey(false);
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    setLoading(true);

    try {
      const res = await api.post('/api/ai/chat', {
        history: newMessages.map(m => ({ role: m.role, text: m.text })),
      });
      setMessages(prev => [...prev, { role: 'model', text: res.data.reply }]);
      if (res.data.tasksCreated && onTasksCreated) onTasksCreated();
    } catch (err) {
      const errorMsg = err.response?.data?.message || t('aiChat.chatError');
      setMessages(prev => [...prev, { role: 'model', text: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.6rem 0.75rem',
    backgroundColor: 'var(--bg-surface)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--text-primary)',
    fontSize: '0.85rem',
    outline: 'none',
  };

  const btnPrimary = {
    width: '100%',
    padding: '0.6rem',
    backgroundColor: 'var(--accent)',
    color: 'var(--bg-base)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
  };

  const iconBtnStyle = {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: 4,
    display: 'flex',
    borderRadius: 'var(--radius-sm)',
  };

  const renderKeySetup = () => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem', gap: '1rem' }}>
      <KeyFill size={36} style={{ color: 'var(--accent)', opacity: 0.6 }} />
      <h6 style={{ color: 'var(--text-primary)', textAlign: 'center', margin: 0, fontSize: '0.9rem' }}>{t('aiChat.setupTitle')}</h6>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center', margin: 0 }}>
        {t('aiChat.setupBody')} <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>{t('aiChat.setupLinkText')}</a>
      </p>
      <input
        type="password"
        value={keyInput}
        onChange={(e) => setKeyInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
        placeholder={t('aiChat.keyPlaceholder')}
        style={inputStyle}
      />
      <button
        onClick={handleSaveKey}
        disabled={savingKey || !keyInput.trim()}
        style={{ ...btnPrimary, opacity: savingKey || !keyInput.trim() ? 0.5 : 1 }}
      >
        {savingKey ? <Spinner animation="border" size="sm" /> : t('aiChat.saveKey')}
      </button>
    </div>
  );

  const renderSettings = () => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '1.5rem', gap: '1rem' }}>
      <h6 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '0.9rem' }}>{t('aiChat.settingsTitle')}</h6>
      <div>
        <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.35rem', display: 'block' }}>
          {t('aiChat.updateKeyLabel')}
        </label>
        <input
          type="password"
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
          placeholder={t('aiChat.newKeyPlaceholder')}
          style={inputStyle}
        />
      </div>
      <button
        onClick={handleSaveKey}
        disabled={savingKey || !keyInput.trim()}
        style={{ ...btnPrimary, opacity: savingKey || !keyInput.trim() ? 0.5 : 1 }}
      >
        {savingKey ? <Spinner animation="border" size="sm" /> : t('aiChat.updateKey')}
      </button>
      <button
        onClick={handleDeleteKey}
        disabled={savingKey}
        style={{
          ...btnPrimary,
          backgroundColor: 'transparent',
          color: 'var(--danger)',
          border: '1px solid var(--danger-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
        }}
      >
        <TrashFill size={13} /> {t('aiChat.removeKey')}
      </button>
      <button
        onClick={() => { setShowSettings(false); setKeyInput(''); }}
        style={{
          ...btnPrimary,
          marginTop: 'auto',
          backgroundColor: 'var(--bg-hover)',
          color: 'var(--text-secondary)',
          border: '1px solid var(--border-default)',
        }}
      >
        {t('aiChat.backToChat')}
      </button>
    </div>
  );

  const renderChat = () => (
    <>
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0.85rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}>
        {messages.length === 0 && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            textAlign: 'center',
            gap: '0.85rem',
          }}>
            <span className="ai-avatar" style={{ width: 60, height: 60 }}>
              <Stars size={28} />
            </span>
            <p style={{ margin: 0, maxWidth: 280, lineHeight: 1.5 }}>{t('aiChat.chatEmpty')}</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '88%',
              padding: '0.55rem 0.8rem',
              borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
              backgroundColor: msg.role === 'user' ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
              border: `1px solid ${msg.role === 'user' ? 'var(--accent-border)' : 'var(--border-subtle)'}`,
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
              lineHeight: 1.5,
              whiteSpace: msg.role === 'user' ? 'pre-wrap' : 'normal',
              wordBreak: 'break-word',
            }}
          >
            {msg.role === 'model' ? <ChatMarkdown>{msg.text}</ChatMarkdown> : msg.text}
          </div>
        ))}
        {loading && (
          <div style={{
            alignSelf: 'flex-start',
            padding: '0.5rem 1rem',
            borderRadius: '14px 14px 14px 4px',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
          }}>
            <Spinner animation="border" size="sm" style={{ color: 'var(--text-muted)' }} />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{
        padding: '0.7rem 0.85rem',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'flex-end',
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('aiChat.inputPlaceholder')}
          rows={1}
          style={{
            ...inputStyle,
            resize: 'none',
            maxHeight: 96,
            lineHeight: 1.4,
          }}
          onInput={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 96) + 'px';
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            width: 42,
            height: 42,
            background: loading || !input.trim()
              ? 'var(--bg-hover)'
              : 'linear-gradient(135deg, #10b981, #3b82f6)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '50%',
            cursor: loading || !input.trim() ? 'default' : 'pointer',
            opacity: loading || !input.trim() ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all var(--transition)',
          }}
        >
          <SendFill size={15} />
        </button>
      </div>
    </>
  );

  return (
    <div className="ai-panel">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.7rem 0.85rem',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'linear-gradient(180deg, rgba(59,130,246,0.06), transparent)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span className="ai-avatar" style={{ width: 34, height: 34 }}>
            <Stars size={17} />
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}>
              {t('aiChat.title')}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
              {t('aiChat.subtitle')}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {hasKey && !showSettings && messages.length > 0 && (
            <button onClick={clearHistory} title={t('aiChat.clearChat')} aria-label={t('aiChat.clearChat')} style={iconBtnStyle}>
              <Trash size={14} />
            </button>
          )}
          {hasKey && (
            <button
              onClick={() => { setShowSettings(!showSettings); setKeyInput(''); }}
              title={t('aiChat.settingsTitle')}
              aria-label={t('aiChat.settingsTitle')}
              style={{ ...iconBtnStyle, color: showSettings ? 'var(--accent)' : 'var(--text-muted)' }}
            >
              <GearFill size={14} />
            </button>
          )}
        </div>
      </div>

      {hasKey === null && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spinner animation="border" style={{ color: 'var(--text-muted)' }} />
        </div>
      )}
      {hasKey === false && !showSettings && renderKeySetup()}
      {hasKey && showSettings && renderSettings()}
      {hasKey && !showSettings && renderChat()}
    </div>
  );
}
