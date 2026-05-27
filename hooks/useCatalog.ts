import { useState, useCallback, useEffect } from 'react';

interface CatalogState {
    id: string;
    catalogEnabled: boolean;
    businessLogo: string | null;
}

export function useCatalog() {
    const [catalog, setCatalog] = useState<CatalogState | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchCatalog = useCallback(async () => {
        try {
            const { default: axiosInstance } = await import('../lib/axios');
            const res = await axiosInstance.get('/catalog');
            if (res.data?.id) {
                setCatalog({
                    id: res.data.id,
                    catalogEnabled: res.data.catalogEnabled ?? false,
                    businessLogo: res.data.businessLogo || null,
                });
            } else {
                setCatalog(null);
            }
        } catch {
            setCatalog(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCatalog();
    }, [fetchCatalog]);

    const isActivated = !!catalog?.id;
    const isVisible = catalog?.catalogEnabled ?? false;
    const needsVisibility = isActivated && !isVisible;

    return { catalog, loading, refetch: fetchCatalog, isActivated, isVisible, needsVisibility };
}
