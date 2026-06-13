/// <reference types="vite/client" />
import { AppData, User } from './types';

declare global {
    interface IElectronAPI {
        getAppVersion: () => Promise<string>;
        readData: () => Promise<AppData | null>;
        writeData: (data: AppData) => Promise<{ success: boolean; error?: string }>;
        getSetupStatus: () => Promise<{ isSetupComplete: boolean }>;
        completeSetup: (setupData: unknown) => Promise<{ success: boolean; error?: string }>;
        loginUser: (username: string, password: string) => Promise<{ success: boolean; user?: User; message?: string }>;
        createUser: (userData: Omit<User, 'id' | 'createdAt'>) => Promise<{ success: boolean; user?: User; message?: string }>;
        updateUser: (id: string, data: Partial<Omit<User, 'id' | 'createdAt'>> & { password?: string }) => Promise<{ success: boolean; user?: User; message?: string }>;
        selectBackupPath: () => Promise<string | null>;
        getBackupPath: () => Promise<string | null>;
        createManualBackup: () => Promise<{ success: boolean; path?: string; message: string }>;
        restoreBackup: () => Promise<{ success: boolean; message: string }>;
        onUpdateMessage: (callback: (event: any, text: string) => void) => void;
        onUpdateProgress: (callback: (event: any, progressObj: { percent: number }) => void) => void;
        onUpdateReady: (callback: () => void) => void;
        onUpdateAvailable: (callback: (event: any, info: any) => void) => void;
        checkForUpdates: () => Promise<{ success: boolean; message: string }>;
        installUpdate: () => void;
        restartApp: () => void;
        reloadApp: () => void;
        openCustomerDisplay: () => void;
        closeCustomerDisplay: () => void;
        sendCustomerDisplayAction: (action: { type: string; payload?: unknown }) => void;
        onCustomerDisplayAction: (callback: (action: { type: string; payload?: unknown }) => void) => void;
    }

    interface Window {
        electronAPI?: IElectronAPI;
    }
}

declare module 'file-saver';
