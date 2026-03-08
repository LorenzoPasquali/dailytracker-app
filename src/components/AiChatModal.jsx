import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Spinner } from 'react-bootstrap';
import ChatDotsFill from 'react-bootstrap-icons/dist/icons/chat-dots-fill';
import XLg from 'react-bootstrap-icons/dist/icons/x-lg';
import SendFill from 'react-bootstrap-icons/dist/icons/send-fill';
import KeyFill from 'react-bootstrap-icons/dist/icons/key-fill';
import GearFill from 'react-bootstrap-icons/dist/icons/gear-fill';
import TrashFill from 'react-bootstrap-icons/dist/icons/trash-fill';
import { toast } from 'sonner';
import api from '../services/api';

export default function AiChatModal({ show, onClose, isMobile }) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasKey, setHasKey] = useState(null);
  const [keyInput, setKeyInput] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const modalRef = useRef(null);

  const MODAL_WIDTH = isMobile ? window.innerWidth : 400;
  const MODAL_HEIGHT = isMobile ? window.innerHeight * 0.7 : 500;

  useEffect(() => {
    if (show) {
      setPosition({
        x: isMobile ? 0 : window.innerWidth - MODAL_WIDTH - 24,
        y: isMobile ? window.innerHeight - MODAL_HEIGHT : window.innerHeight - MODAL_HEIGHT - 24,
      });
      setShowSettings(false);
      setKeyInput('');
      api.get('/api/ai/key-status')
        .then(res => setHasKey(res.data.hasKey))
        .catch(() => setHasKey(false));
    }
  }, [show]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (hasKey && !loading) inputRef.current?.focus();
  }, [hasKey, loading, messages]);

  const handleMouseDown = useCallback((e) => {
    if (isMobile) return;
    setDragging(true);
    const rect = modalRef.current.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    e.preventDefault();
  }, [isMobile]);

  useEffect(() => {
    if (!dragging) return;
    const handleMouseMove = (e) => {
      setPosition({
        x: Math.max(0, Math.min(e.clientX - dragOffset.current.x, window.innerWidth - MODAL_WIDTH)),
        y: Math.max(0, Math.min(e.clientY - dragOffset.current.y, window.innerHeight - MODAL_HEIGHT)),
      });
    };
    const handleMouseUp = () => setDragging(false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, MODAL_WIDTH, MODAL_HEIGHT]);

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

  const handleDeleteKey = async () => {
    if (!window.confirm(t('aiChat.removeKeyConfirm'))) return;
    setSavingKey(true);
    try {
      await api.delete('/api/ai/key');
      setHasKey(false);
      setMessages([]);
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

  if (!show) return null;

  const inputStyle = {
    width: '100%',
    padding: '0.6rem 0.75rem',
    backgroundColor: 'var(--bg-base)',
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
        padding: '0.75rem',
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
            fontSize: '0.8rem',
            textAlign: 'center',
            gap: '0.5rem',
          }}>
            <ChatDotsFill size={28} style={{ opacity: 0.3 }} />
            <p style={{ margin: 0 }}>{t('aiChat.chatEmpty')}</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              padding: '0.5rem 0.75rem',
              borderRadius: msg.role === 'user' ? '10px 10px 2px 10px' : '10px 10px 10px 2px',
              backgroundColor: msg.role === 'user' ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
              border: `1px solid ${msg.role === 'user' ? 'var(--accent-border)' : 'var(--border-subtle)'}`,
              color: 'var(--text-secondary)',
              fontSize: '0.83rem',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {msg.text}
          </div>
        ))}
        {loading && (
          <div style={{
            alignSelf: 'flex-start',
            padding: '0.5rem 1rem',
            borderRadius: '10px 10px 10px 2px',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
          }}>
            <Spinner animation="border" size="sm" style={{ color: 'var(--text-muted)' }} />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{
        padding: '0.6rem 0.75rem',
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
            maxHeight: 80,
            lineHeight: 1.4,
          }}
          onInput={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px';
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            padding: '0.6rem 0.7rem',
            backgroundColor: 'var(--accent)',
            color: 'var(--bg-base)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: loading || !input.trim() ? 'default' : 'pointer',
            opacity: loading || !input.trim() ? 0.4 : 1,
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            transition: 'opacity var(--transition)',
          }}
        >
          <SendFill size={14} />
        </button>
      </div>
    </>
  );

  return (
    <div ref={modalRef} style={{
      position: 'fixed',
      left: position.x,
      top: position.y,
      width: MODAL_WIDTH,
      height: MODAL_HEIGHT,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border-default)',
      borderRadius: isMobile ? 'var(--radius-lg) var(--radius-lg) 0 0' : 'var(--radius-lg)',
      boxShadow: 'none',
      overflow: 'hidden',
    }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.6rem 0.75rem',
          borderBottom: '1px solid var(--border-subtle)',
          cursor: isMobile ? 'default' : 'grab',
          userSelect: 'none',
        }}
        onMouseDown={handleMouseDown}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ChatDotsFill size={15} style={{ color: 'var(--accent)' }} />
          <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem' }}>
            {t('aiChat.title')}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {hasKey && (
            <button
              onClick={() => { setShowSettings(!showSettings); setKeyInput(''); }}
              style={{
                background: 'none',
                border: 'none',
                color: showSettings ? 'var(--accent)' : 'var(--text-muted)',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
              }}
            >
              <GearFill size={14} />
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
            }}
          >
            <XLg size={14} />
          </button>
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
