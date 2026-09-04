import React from 'react';
import { ChatPanel } from '../../components/chat/ChatPanel';

export const AdminChatPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <ChatPanel />
    </div>
  );
};
