import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--bg-card-border)',
        padding: '2rem 0',
        marginTop: 'auto',
        textAlign: 'center',
        color: 'var(--text-dim)',
        fontSize: '0.875rem'
      }}
    >
      <div className="container">
        <p>© {new Date().getFullYear()} CampusOS Platform. Modular Enterprise Architecture.</p>
      </div>
    </footer>
  );
};
