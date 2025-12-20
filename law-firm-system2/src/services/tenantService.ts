import { apiClient } from '../utils/api';

export interface TenantData {
    id: number;
    name: string;
    slug: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    license_number: string | null;
    logo_url: string | null;
    status: 'active' | 'suspended' | 'trial' | 'expired';
    settings: Record<string, any>;
    created_at: string;
}

export interface TenantUpdateData {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    license_number?: string;
}

export const tenantService = {
    /**
     * Get current tenant info
     */
    getTenant: async (): Promise<{ success: boolean; data: TenantData }> => {
        return apiClient.get('/tenant');
    },

    /**
     * Update tenant info (owner only)
     */
    updateTenant: async (data: TenantUpdateData): Promise<{ success: boolean; data: TenantData; message: string }> => {
        return apiClient.put('/tenant', data);
    },

    /**
     * Get tenant settings
     */
    getSettings: async (): Promise<{ success: boolean; data: Record<string, any> }> => {
        return apiClient.get('/tenant/settings');
    },

    /**
     * Update tenant settings
     */
    updateSettings: async (settings: Record<string, any>): Promise<{ success: boolean; message: string }> => {
        return apiClient.patch('/tenant/settings', settings);
    },
};
