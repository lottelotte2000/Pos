import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

export type Theme = 'default' | 'midnight' | 'sunset' | 'light' | 'christmas' | 'newyear' | 'songkran' | 'dragonball';
export type FontSize = 'normal' | 'large' | 'extra';
export type Mode = 'dark' | 'light';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    fontSize: FontSize;
    setFontSize: (size: FontSize) => void;
    mode: Mode;
    setMode: (mode: Mode) => void;
    toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [theme, setThemeState] = useState<Theme>(() => {
        return (localStorage.getItem('app_theme') as Theme) || 'default';
    });

    const [fontSize, setFontSizeState] = useState<FontSize>(() => {
        return (localStorage.getItem('app_font_size') as FontSize) || 'normal';
    });

    // ✅ โหมดมืด/สว่าง (แยกจากธีมสีตกแต่ง) — ค่าเริ่มต้นเป็นโหมดสว่าง (ตามดีไซน์ใหม่)
    const [mode, setModeState] = useState<Mode>(() => {
        return (localStorage.getItem('app_mode') as Mode) || 'light';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        root.setAttribute('data-theme', theme);
        localStorage.setItem('app_theme', theme);
    }, [theme]);

    useEffect(() => {
        const root = window.document.documentElement;
        root.setAttribute('data-mode', mode);
        localStorage.setItem('app_mode', mode);
    }, [mode]);

    // ✅ ซิงค์ธีม/โหมด/ขนาดฟอนต์ข้ามหน้าต่าง (เช่น จอลูกค้า) แบบเรียลไทม์
    // storage event จะยิงในหน้าต่าง"อื่น" ที่ origin เดียวกันเมื่อ localStorage เปลี่ยน
    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === 'app_mode' && e.newValue) setModeState(e.newValue as Mode);
            else if (e.key === 'app_theme' && e.newValue) setThemeState(e.newValue as Theme);
            else if (e.key === 'app_font_size' && e.newValue) setFontSizeState(e.newValue as FontSize);
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    useEffect(() => {
        const root = window.document.documentElement;
        let sizeValue = '16px';
        if (fontSize === 'large') sizeValue = '18px';
        if (fontSize === 'extra') sizeValue = '20px';
        root.style.fontSize = sizeValue;
        localStorage.setItem('app_font_size', fontSize);
    }, [fontSize]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };

    const setFontSize = (newSize: FontSize) => {
        setFontSizeState(newSize);
    };

    const setMode = (newMode: Mode) => {
        setModeState(newMode);
    };

    const toggleMode = () => {
        setModeState(prev => (prev === 'dark' ? 'light' : 'dark'));
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, fontSize, setFontSize, mode, setMode, toggleMode }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
