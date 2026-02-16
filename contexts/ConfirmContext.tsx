import React, { createContext, useContext, useState, useCallback } from 'react';
import { ConfirmModal } from '../components/ui/ConfirmModal';

interface ConfirmOptions {
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'info' | 'warning';
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => void;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
    const [visible, setVisible] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions | null>(null);

    const confirm = useCallback((newOptions: ConfirmOptions) => {
        setOptions(newOptions);
        setVisible(true);
    }, []);

    const handleConfirm = useCallback(() => {
        if (options?.onConfirm) {
            options.onConfirm();
        }
        setVisible(false);
    }, [options]);

    const handleCancel = useCallback(() => {
        setVisible(false);
    }, []);

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            {options && (
                <ConfirmModal
                    visible={visible}
                    title={options.title}
                    message={options.message}
                    confirmText={options.confirmText}
                    cancelText={options.cancelText}
                    type={options.type}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />
            )}
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (!context) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context;
}
