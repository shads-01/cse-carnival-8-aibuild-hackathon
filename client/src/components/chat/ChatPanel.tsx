import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../common/Button';
import { agentService, ChatMessage } from '../../services/agentService';
import { Send, Bot, User, Sparkles, Terminal, ArrowRight, ArrowLeft, CornerDownLeft } from 'lucide-react';

const QUICK_PROMPTS = [
  'When is my next class?',
  'What classes do I have on Wednesday?',
  'What assignments do I have due this week?',
  'Show me all high priority announcements.',
  "I'm free until 2 PM — is there anything on campus I could drop into?",
  'Which labs have a projector and can fit at least 30 people?',
  'Book Room 7A02 tomorrow from 3 PM to 5 PM.',
  'Register me for the Guest Lecture on Deep Learning.'
];

export const ChatPanel: React.FC<{ initialPrompt?: string; fullScreen?: boolean }> = ({
  initialPrompt,
  fullScreen = true
}) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      role: 'assistant',
      content:
        'Hello! I am your **CampusOS Intelligent Agent**. I have direct, real-time access to course routines, room allocations, event registrations, and campus announcements.\n\nHow can I help you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      toolsUsed: ['campus_system_ready']
    }
  ]);
  const [input, setInput] = useState(initialPrompt || '');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = async (messageText?: string) => {
    const text = (messageText || input).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await agentService.sendMessage(text, messages);
      const assistantMessage: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolsUsed: response.toolsUsed
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `Error contacting agent service: ${err.message || 'Please try again.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className={fullScreen ? '' : 'glass-elevated'}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        flex: 1,
        minHeight: 0,
        borderRadius: fullScreen ? 0 : 'var(--radius-xl)',
        overflow: 'hidden',
        border: fullScreen ? 'none' : '1px solid var(--glass-border-hover)'
      }}
    >
      {/* Chat Header */}
      <div
        style={{
          padding: '6px 14px',
          minHeight: '42px',
          borderBottom: '1px solid var(--glass-border)',
          background: 'var(--glass-bg-hover)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/app');
              }
            }}
            className="glass"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid var(--glass-border)',
              background: 'var(--glass-bg)',
              transition: 'all var(--transition-fast)'
            }}
            title="Go back"
            aria-label="Go back"
          >
            <ArrowLeft size={13} />
            <span>Back</span>
          </button>

          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: 'var(--shadow-glow)'
            }}
          >
            <Bot size={14} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>
              CampusOS Agent
            </span>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--success)',
                boxShadow: '0 0 5px var(--success)',
                display: 'inline-block'
              }}
              title="Online & Ready"
            />
            <span style={{ fontSize: '0.70rem', color: 'var(--text-dim)', marginLeft: '2px' }}>
              · Live Data
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontSize: '0.66rem',
              padding: '2px 6px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(0, 180, 216, 0.1)',
              color: 'var(--accent)',
              border: '1px solid var(--glass-border-subtle)',
              fontWeight: 600
            }}
          >
            v4.0
          </span>
        </div>
      </div>

      {/* Messages Stream */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start',
                width: '100%'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  maxWidth: '85%',
                  flexDirection: isUser ? 'row-reverse' : 'row',
                  alignItems: 'flex-start'
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: isUser ? 'var(--accent-gradient)' : 'var(--glass-bg-hover)',
                    border: `1px solid ${isUser ? 'transparent' : 'var(--glass-border)'}`,
                    color: isUser ? '#ffffff' : 'var(--accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}
                >
                  {isUser ? <User size={15} /> : <Bot size={16} />}
                </div>

                {/* Bubble */}
                <div
                  className={isUser ? '' : 'glass'}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-lg)',
                    borderBottomRightRadius: isUser ? '4px' : 'var(--radius-lg)',
                    borderBottomLeftRadius: isUser ? 'var(--radius-lg)' : '4px',
                    background: isUser ? 'var(--chat-user-bg)' : 'var(--chat-agent-bg)',
                    color: isUser ? '#ffffff' : 'var(--text-primary)',
                    boxShadow: isUser ? 'var(--shadow-glow)' : 'var(--shadow-glass)',
                    fontSize: '0.92rem',
                    lineHeight: 1.55,
                    whiteSpace: 'pre-wrap'
                  }}
                >
                  {msg.content}

                  {/* Tools Used Badge */}
                  {!isUser && msg.toolsUsed && msg.toolsUsed.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '6px',
                        marginTop: '10px',
                        paddingTop: '8px',
                        borderTop: '1px solid var(--glass-border-subtle)',
                        fontSize: '0.72rem',
                        color: 'var(--text-dim)'
                      }}
                    >
                      <Terminal size={12} style={{ color: 'var(--accent)' }} />
                      <span>Tools executed:</span>
                      {msg.toolsUsed.map((tool, i) => (
                        <span
                          key={i}
                          style={{
                            background: 'rgba(0, 180, 216, 0.1)',
                            border: '1px solid var(--accent-muted)',
                            color: 'var(--accent)',
                            padding: '1px 6px',
                            borderRadius: 'var(--radius-sm)',
                            fontFamily: 'monospace'
                          }}
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <span
                style={{
                  fontSize: '0.68rem',
                  color: 'var(--text-dim)',
                  marginTop: '4px',
                  padding: '0 40px'
                }}
              >
                {msg.timestamp}
              </span>
            </div>
          );
        })}

        {/* Loading typing indicator */}
        {isLoading && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: 'var(--glass-bg-hover)',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Bot size={16} />
            </div>
            <div
              className="glass"
              style={{
                padding: '10px 16px',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                Querying live campus database...
              </span>
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'var(--accent)', animation: 'pulseGlow 1.2s infinite' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Chips Carousel */}
      <div
        style={{
          padding: '8px 16px',
          borderTop: '1px solid var(--glass-border-subtle)',
          background: 'rgba(0, 180, 216, 0.03)',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          whiteSpace: 'nowrap'
        }}
      >
        <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', alignSelf: 'center', fontWeight: 700 }}>
          Quick Queries:
        </span>
        {QUICK_PROMPTS.map((prompt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSend(prompt)}
            disabled={isLoading}
            className="glass"
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-secondary)',
              fontSize: '0.78rem',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              flexShrink: 0
            }}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Input Bar */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--glass-border)',
          background: 'var(--glass-bg-hover)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        <input
          ref={inputRef}
          type="text"
          placeholder="Ask anything about schedules, rooms, assignments, or booking..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          className="glass-input"
          style={{ flex: 1, height: '44px' }}
        />

        <Button
          type="button"
          variant="primary"
          onClick={() => handleSend()}
          disabled={!input.trim() || isLoading}
          style={{ height: '44px', padding: '0 18px' }}
          rightIcon={<CornerDownLeft size={16} />}
        >
          Send
        </Button>
      </div>
    </div>
  );
};
