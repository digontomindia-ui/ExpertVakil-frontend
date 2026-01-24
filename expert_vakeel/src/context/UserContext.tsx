import React, { createContext, useContext } from 'react';
import useAuth from '../hooks/useAuth';

const UserContext = createContext<ReturnType<typeof useAuth> | null>(null);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();

  return (
    <UserContext.Provider value={auth}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
