import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // Check for saved theme or preference
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('app-theme');
        if (saved) return saved;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    useEffect(() => {
        const html = window.document.documentElement;
        const body = window.document.body;

        console.log('--- Theme Update ---');
        console.log('Target Theme:', theme);

        // Remove both
        html.classList.remove('light', 'dark');
        body.classList.remove('light', 'dark');

        // Add current
        html.classList.add(theme);
        body.classList.add(theme);

        localStorage.setItem('app-theme', theme);
        console.log('Active classes on HTML:', html.className);
        console.log('Active classes on BODY:', body.className);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within a ThemeProvider');
    return context;
};
