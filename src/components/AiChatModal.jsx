import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Spinner } from 'react-bootstrap';
import { ChatDotsFill, XLg, SendFill, KeyFill, GearFill, TrashFill } from 'react-bootstrap-icons';
import api from '../services/api';

export default function AiChatModal({ show, onClose, isMobile }) {
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

  const MODAL_WIDTH = isMobile ? window.innerWidth : 420;
  const MODAL_HEIGHT = isMobile ? window.innerHeight * 0.7 : 520;

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
    if (hasKey && !loading) {
      inputRef.current?.focus();
    }
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
    } catch (err) {
      alert(err.response?.data?.message || 'Erro ao salvar a chave.');
    } finally {
      setSavingKey(false);
    }
  };

  const handleDeleteKey = async () => {
    if (!window.confirm('Tem certeza que deseja remover sua API Key? Isso encerrará a sessão de chat.')) return;
    setSavingKey(true);
    try {
      await api.delete('/api/ai/key');
      setHasKey(false);
      setMessages([]);
      setShowSettings(false);
    } catch {
      alert('Erro ao remover a chave.');
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
      const errorMsg = err.response?.data?.message || 'Erro ao comunicar com a IA.';
      setMessages(prev => [...prev, { role: 'model', text: `⚠️ ${errorMsg}` }]);
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

  const modalStyle = {
    position: 'fixed',
    left: position.x,
    top: position.y,
    width: MODAL_WIDTH,
    height: MODAL_HEIGHT,
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'rgba(13, 17, 23, 0.95)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid #30363d',
    borderRadius: isMobile ? '12px 12px 0 0' : 12,
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    overflow: 'hidden',
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    borderBottom: '1px solid #30363d',
    cursor: isMobile ? 'default' : 'grab',
    userSelect: 'none',
    background: 'linear-gradient(180deg, rgba(22, 27, 34, 0.8) 0%, rgba(13, 17, 23, 0) 100%)',
  };

  const renderKeySetup = () => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
      <KeyFill size={40} style={{ color: '#3b82f6', opacity: 0.7 }} />
      <h6 style={{ color: '#c9d1d9', textAlign: 'center', margin: 0 }}>Configure sua API Key do Gemini</h6>
      <p style={{ color: '#8b949e', fontSize: '0.85rem', textAlign: 'center', margin: 0 }}>
        Acesse o <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>Google AI Studio</a> para obter sua chave.
      </p>
      <input
        type="password"
        value={keyInput}
        onChange={(e) => setKeyInput(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
        placeholder="Cole sua API Key aqui"
        style={{
          width: '100%',
          padding: '10px 12px',
          backgroundColor: '#21262d',
          border: '1px solid #30363d',
          borderRadius: 8,
          color: '#c9d1d9',
          fontSize: '0.9rem',
          outline: 'none',
        }}
      />
      <button
        onClick={handleSaveKey}
        disabled={savingKey || !keyInput.trim()}
        style={{
          width: '100%',
          padding: '10px',
          backgroundColor: '#3b82f6',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontSize: '0.9rem',
          fontWeight: 500,
          cursor: savingKey ? 'wait' : 'pointer',
          opacity: savingKey || !keyInput.trim() ? 0.6 : 1,
        }}
      >
        {savingKey ? <Spinner animation="border" size="sm" /> : 'Salvar e Começar'}
      </button>
    </div>
  );

  const renderSettings = () => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 24, gap: 16 }}>
      <h6 style={{ color: '#c9d1d9', margin: 0 }}>Configurações da IA</h6>

      <div>
        <label style={{ color: '#8b949e', fontSize: '0.85rem', marginBottom: 6, display: 'block' }}>
          Atualizar API Key do Gemini
        </label>
        <input
          type="password"
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
          placeholder="Nova API Key"
          style={{
            width: '100%',
            padding: '10px 12px',
            backgroundColor: '#21262d',
            border: '1px solid #30363d',
            borderRadius: 8,
            color: '#c9d1d9',
            fontSize: '0.9rem',
            outline: 'none',
          }}
        />
      </div>

      <button
        onClick={handleSaveKey}
        disabled={savingKey || !keyInput.trim()}
        style={{
          width: '100%',
          padding: '10px',
          backgroundColor: '#3b82f6',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontSize: '0.9rem',
          cursor: 'pointer',
          opacity: savingKey || !keyInput.trim() ? 0.6 : 1,
        }}
      >
        {savingKey ? <Spinner animation="border" size="sm" /> : 'Atualizar Chave'}
      </button>

      <button
        onClick={handleDeleteKey}
        disabled={savingKey}
        style={{
          width: '100%',
          padding: '10px',
          backgroundColor: 'transparent',
          color: '#f85149',
          border: '1px solid #f8514933',
          borderRadius: 8,
          fontSize: '0.9rem',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <TrashFill size={14} /> Remover Chave
      </button>

      <button
        onClick={() => { setShowSettings(false); setKeyInput(''); }}
        style={{
          marginTop: 'auto',
          padding: '10px',
          backgroundColor: '#21262d',
          color: '#c9d1d9',
          border: '1px solid #30363d',
          borderRadius: 8,
          fontSize: '0.9rem',
          cursor: 'pointer',
        }}
      >
        Voltar ao Chat
      </button>
    </div>
  );

  const renderChat = () => (
    <>
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}>
        {messages.length === 0 && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#8b949e',
            fontSize: '0.85rem',
            textAlign: 'center',
            gap: 8,
          }}>
            <ChatDotsFill size={32} style={{ opacity: 0.4 }} />
            <p style={{ margin: 0 }}>Pergunte sobre suas tarefas, projetos ou produtividade.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              padding: '8px 12px',
              borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              backgroundColor: msg.role === 'user' ? 'rgba(59, 130, 246, 0.2)' : '#161b22',
              border: msg.role === 'user' ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid #30363d',
              color: '#c9d1d9',
              fontSize: '0.88rem',
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
            padding: '8px 16px',
            borderRadius: '12px 12px 12px 2px',
            backgroundColor: '#161b22',
            border: '1px solid #30363d',
          }}>
            <Spinner animation="border" size="sm" variant="secondary" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={{
        padding: '10px 14px',
        borderTop: '1px solid #30363d',
        display: 'flex',
        gap: 8,
        alignItems: 'flex-end',
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua pergunta..."
          rows={1}
          style={{
            flex: 1,
            padding: '10px 12px',
            backgroundColor: '#21262d',
            border: '1px solid #30363d',
            borderRadius: 8,
            color: '#c9d1d9',
            fontSize: '0.9rem',
            outline: 'none',
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
            padding: '10px 12px',
            backgroundColor: '#3b82f6',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: loading || !input.trim() ? 'default' : 'pointer',
            opacity: loading || !input.trim() ? 0.5 : 1,
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          <SendFill size={16} />
        </button>
      </div>
    </>
  );

  return (
    <div ref={modalRef} style={modalStyle}>
      <div style={headerStyle} onMouseDown={handleMouseDown}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ChatDotsFill size={18} style={{ color: '#3b82f6' }} />
          <span style={{ color: '#c9d1d9', fontWeight: 600, fontSize: '0.95rem' }}>
            Assistente IA
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {hasKey && (
            <button
              onClick={() => { setShowSettings(!showSettings); setKeyInput(''); }}
              style={{
                background: 'none',
                border: 'none',
                color: showSettings ? '#3b82f6' : '#8b949e',
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
              }}
              title="Configurações"
            >
              <GearFill size={16} />
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#8b949e',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
            }}
          >
            <XLg size={16} />
          </button>
        </div>
      </div>

      {hasKey === null && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spinner animation="border" variant="secondary" />
        </div>
      )}
      {hasKey === false && !showSettings && renderKeySetup()}
      {hasKey && showSettings && renderSettings()}
      {hasKey && !showSettings && renderChat()}
    </div>
  );
}
