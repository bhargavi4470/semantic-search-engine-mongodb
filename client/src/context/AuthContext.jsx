import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for existing session
        const checkAuth = async () => {
            const token = localStorage.getItem('auth_token');
            if (token) {
                try {
                    const res = await fetch('/api/auth/me', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (res.status === 401) {
                        // Session expired
                        localStorage.removeItem('auth_token');
                        setUser(null);
                    } else {
                        const json = await res.json();
                        if (json.success) {
                            setUser(json.data.user);
                        } else {
                            localStorage.removeItem('auth_token');
                        }
                    }
                } catch (err) {
                    console.error("Auth check failed:", err);
                    // Don't clear token on network failure, only on 401
                }
            }
            setIsLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (username, password) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const json = await res.json();
        if (json.success) {
            localStorage.setItem('auth_token', json.data.token);
            setUser(json.data.user);
        }
        return json;
    };

    const signup = async (username, password) => {
        const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const json = await res.json();
        if (json.success) {
            localStorage.setItem('auth_token', json.data.token);
            setUser(json.data.user);
        }
        return json;
    };

    const logout = () => {
        localStorage.removeItem('auth_token');
        setUser(null);
    };

    const updatePassword = async (currentPassword, newPassword) => {
        const token = localStorage.getItem('auth_token');
        const res = await fetch('/api/auth/update-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });
        return await res.json();
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, signup, logout, updatePassword }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
