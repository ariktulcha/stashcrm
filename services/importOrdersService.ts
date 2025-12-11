import { supabase } from './supabase';
import { ImportOrder } from '../types';

export const importOrdersService = {
  async getAll(): Promise<ImportOrder[]> {
    const { data, error } = await supabase
      .from('import_orders')
      .select('*')
      .order('estimated_arrival', { ascending: true });
    
    if (error) {
      console.error('Error fetching import orders:', error);
      throw error;
    }
    return data || [];
  },

  async getById(id: string): Promise<ImportOrder | null> {
    const { data, error } = await supabase
      .from('import_orders')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching import order:', error);
      throw error;
    }
    return data;
  },

  async create(order: Omit<ImportOrder, 'id'>): Promise<ImportOrder> {
    const { data, error } = await supabase
      .from('import_orders')
      .insert(order)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating import order:', error);
      throw error;
    }
    return data;
  },

  async update(id: string, updates: Partial<ImportOrder>): Promise<ImportOrder> {
    const { data, error } = await supabase
      .from('import_orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating import order:', error);
      throw error;
    }
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('import_orders')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting import order:', error);
      throw error;
    }
  }
};
