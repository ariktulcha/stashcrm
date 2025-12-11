import { supabase } from './supabase';
import { Order, OrderItem } from '../types';

export const ordersService = {
  // Get all orders
  async getAll(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
    
    // Transform the data to match Order interface
    return (data || []).map(order => ({
      ...order,
      items: (order.order_items || []) as OrderItem[]
    }));
  },

  // Get order by ID
  async getById(id: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
    if (!data) return null;
    
    return {
      ...data,
      items: (data.order_items || []) as OrderItem[]
    };
  },

  // Create order
  async create(order: Omit<Order, 'id' | 'created_at' | 'items'>, items: Omit<OrderItem, 'id'>[]): Promise<Order> {
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        ...order,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (orderError) {
      console.error('Error creating order:', orderError);
      throw orderError;
    }
    
    // Insert order items
    if (items.length > 0) {
      const orderItems = items.map(item => ({
        ...item,
        order_id: orderData.id
      }));
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);
      
      if (itemsError) {
        console.error('Error creating order items:', itemsError);
        throw itemsError;
      }
    }
    
    // Fetch the complete order with items
    return this.getById(orderData.id) as Promise<Order>;
  },

  // Update order
  async update(id: string, updates: Partial<Order>, items?: Omit<OrderItem, 'id'>[]): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating order:', error);
      throw error;
    }
    
    // Update items if provided
    if (items !== undefined) {
      // Delete existing items
      await supabase.from('order_items').delete().eq('order_id', id);
      
      // Insert new items
      if (items.length > 0) {
        const orderItems = items.map(item => ({
          ...item,
          order_id: id
        }));
        
        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);
        
        if (itemsError) {
          console.error('Error updating order items:', itemsError);
          throw itemsError;
        }
      }
    }
    
    // Fetch updated order with items
    return this.getById(id) as Promise<Order>;
  },

  // Delete order
  async delete(id: string): Promise<void> {
    // Delete order items first (CASCADE should handle this, but being explicit)
    await supabase.from('order_items').delete().eq('order_id', id);
    
    // Delete order
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting order:', error);
      throw error;
    }
  },

  // Generate next order number
  async generateOrderNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const yearSuffix = currentYear.toString().slice(-2);
    
    const { data, error } = await supabase
      .from('orders')
      .select('order_number')
      .like('order_number', `${yearSuffix}-%`)
      .order('order_number', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('Error generating order number:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      return `${yearSuffix}-00001`;
    }
    
    const lastOrderNumber = data[0].order_number;
    const parts = lastOrderNumber.split('-');
    if (parts.length === 2) {
      const nextSequence = parseInt(parts[1], 10) + 1;
      const formattedSequence = nextSequence.toString().padStart(5, '0');
      return `${yearSuffix}-${formattedSequence}`;
    }
    
    return `${yearSuffix}-00001`;
  }
};
