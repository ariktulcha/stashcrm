import { ordersService } from './ordersService';

/**
 * Generates the next order number in format YY-XXXXX
 * Where YY is the last 2 digits of the current year
 * and XXXXX is a 5-digit sequential number
 * 
 * Now uses Supabase to get the next order number
 */
export async function generateOrderNumber(): Promise<string> {
  return await ordersService.generateOrderNumber();
}



