import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';
import { User, hasPermission as checkPermission } from '../utils/authUtils';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = async () => {
        const token = localStorage.getItem('loom_token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            // We'll use the 'user' module to fetch the current user profile
            // For now, let's assume we can fetch the user by a special endpoint or just list the 'user' with a filter
            // Actually, let's add a /v1/auth/me endpoint in the backend later if needed.
            // For now, we'll decode the token or just fetch the user list with a filter on email (if we had the email).
            // Better: Let's assume the login returns the user info and we store it, OR we add a /me endpoint.

            // I'll add a quick /v1/auth/me to the backend in the next step.
            const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/v1/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            } else {
                localStorage.removeItem('loom_token');
            }
        } catch (error) {
            console.error("Failed to fetch user:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const login = async (email: string, password: string) => {
        await api.login(email, password);
        await fetchUser();
    };

    const logout = () => {
        api.logout();
        setUser(null);
    };

    const hasPermission = (permission: string) => {
        return checkPermission(user, permission);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, hasPermission }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
