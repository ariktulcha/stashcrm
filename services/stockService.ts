import { supabase } from './supabase';
import { StockItem } from '../types';

export const stockService = {
  // Get all stock items
  async getAll(): Promise<StockItem[]> {
    const { data, error } = await supabase
      .from('stock_items')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) {
      console.error('Error fetching stock items:', error);
      throw error;
    }
    return data || [];
  },

  // Get stock item by ID
  async getById(id: string): Promise<StockItem | null> {
    const { data, error } = await supabase
      .from('stock_items')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching stock item:', error);
      throw error;
    }
    return data;
  },

  // Create stock item
  async create(item: Omit<StockItem, 'id'>): Promise<StockItem> {
    const { data, error } = await supabase
      .from('stock_items')
      .insert(item)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating stock item:', error);
      throw error;
    }
    return data;
  },

  // Update stock item
  async update(id: string, updates: Partial<StockItem>): Promise<StockItem> {
    const { data, error } = await supabase
      .from('stock_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating stock item:', error);
      throw error;
    }
    return data;
  },

  // Delete stock item
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('stock_items')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting stock item:', error);
      throw error;
    }
  }
};


