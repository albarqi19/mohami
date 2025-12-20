import { apiClient } from '../utils/api';

export interface SubscriptionData {
  tenant: {
    name: string;
    status: 'active' | 'suspended' | 'trial' | 'expired';
    trial_ends_at: string | null;
  };
  subscription: {
    id: number;
    plan: 'monthly' | 'yearly';
    price: number;
    currency: string;
    status: 'active' | 'pending' | 'cancelled' | 'expired';
    started_at: string;
    renews_at: string;
    expires_at: string | null;
  } | null;
  is_trial: boolean;
  trial_days_remaining: number | null;
  has_active_subscription: boolean;
  can_access_system: boolean;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  amount: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  due_date: string;
  paid_at: string | null;
  created_at: string;
}

export interface InvoicesResponse {
  data: Invoice[];
  current_page: number;
  last_page: number;
  total: number;
}

export const subscriptionService = {
  /**
   * Get current subscription info
   */
  getCurrentSubscription: async (): Promise<{ success: boolean; data: SubscriptionData }> => {
    return apiClient.get('/subscription/current');
  },

  /**
   * Subscribe to a plan (monthly or yearly)
   */
  subscribe: async (plan: 'monthly' | 'yearly', paymentMethod: string = 'credit_card'): Promise<any> => {
    return apiClient.post('/subscription/subscribe', { 
      plan, 
      payment_method: paymentMethod,
      payment_gateway: 'moyasar'
    });
  },

  /**
   * Cancel subscription
   */
  cancel: async (): Promise<any> => {
    return apiClient.post('/subscription/cancel');
  },

  /**
   * Get invoices list
   */
  getInvoices: async (page: number = 1): Promise<{ success: boolean; data: InvoicesResponse }> => {
    return apiClient.get(`/subscription/invoices?page=${page}`);
  },

  /**
   * Get single invoice details
   */
  getInvoice: async (invoiceId: number): Promise<{ success: boolean; data: Invoice }> => {
    return apiClient.get(`/subscription/invoices/${invoiceId}`);
  },
};
