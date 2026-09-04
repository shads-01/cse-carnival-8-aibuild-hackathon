import React, { useState } from 'react';
import { LoginForm } from '../features/auth/LoginForm';
import { RegisterForm } from '../features/auth/RegisterForm';
import { Button } from '../components/common/Button';

export const Login: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);

  return (
    <div className="container" style={{ padding: '3rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {isRegistering ? <RegisterForm /> : <LoginForm />}

      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginRight: '8px' }}>
          {isRegistering ? 'Already have an account?' : "Don't have an account yet?"}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsRegistering(!isRegistering)}
          style={{ padding: '4px 8px' }}
        >
          {isRegistering ? 'Sign In' : 'Create Account'}
        </Button>
      </div>
    </div>
  );
};
