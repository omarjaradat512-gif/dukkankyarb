import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiLogin, apiMe, getToken, setToken } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null); // null = unknown / not logged in
    const [loading, setLoading] = useState(true);

    const refresh = useCallback(async () => {
        const token = getToken();
        if (!token) {
            setUser(null);
            setLoading(false);
            return;
        }
        try {
            const me = await apiMe();
            setUser(me);
        } catch {
            setToken(null);
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const login = async (email, password) => {
        const data = await apiLogin(email, password);
        setToken(data.token);
        setUser(data.user);
        return data.user;
    };

    const logout = () => {
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
