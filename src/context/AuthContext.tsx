import { createContext, useState, useContext, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const login = async (username: string, password: string): Promise<boolean> => {
    if (window.electronAPI) {
      const result = await window.electronAPI.loginUser(username, password);

      if (result && result.success && result.user) {
        setCurrentUser(result.user as User);
        return true;
      } else if (
        result &&
        typeof result === 'object' &&
        'id' in result &&
        'username' in result &&
        'role' in result
      ) {
        // Fallback: Electron returns a User-shaped object directly (legacy path)
        setCurrentUser(result as unknown as User);
        return true;
      }
    }
    console.warn(`Login failed for username "${username}".`);
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    console.log("User logged out.");
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        logout,
        isAuthenticated: !!currentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};