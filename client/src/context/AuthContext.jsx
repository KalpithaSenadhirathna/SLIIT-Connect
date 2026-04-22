/**
 * AuthContext — compatibility shim for Notes pages.
 * The Notes feature was built as a standalone app with its own AuthContext.
 * This shim bridges it to the main app's localStorage token-based auth.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [token, setToken]   = useState(() => localStorage.getItem('token'));
    const [loading, setLoading] = useState(false);

    // Keep token state in sync with localStorage changes
    useEffect(() => {
        const handleStorage = () => setToken(localStorage.getItem('token'));
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const login = (newToken) => {
        localStorage.setItem('token', newToken);
        setToken(newToken);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ token, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}

export default AuthContext;
