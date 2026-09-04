import React from 'react';
import { ChatPanel } from '../../components/chat/ChatPanel';

export const StudentChatPage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', width: '100%', minHeight: 0 }}>
      <ChatPanel fullScreen />
    </div>
  );
};
