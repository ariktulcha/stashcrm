
import { mockOrders } from './mockData';

/**
 * Generates the next order number in format YY-XXXXX
 * Where YY is the last 2 digits of the current year
 * and XXXXX is a 5-digit sequential number
 */
export function generateOrderNumber(): string {
  const currentYear = new Date().getFullYear();
  const yearSuffix = currentYear.toString().slice(-2);
  
  // Find the highest order number for this year
  const yearOrders = mockOrders.filter(order => {
    const orderYear = order.order_number.split('-')[0];
    return orderYear === yearSuffix;
  });
  
  if (yearOrders.length === 0) {
    return `${yearSuffix}-00001`;
  }
  
  // Extract the sequence number from existing orders
  const sequenceNumbers = yearOrders.map(order => {
    const parts = order.order_number.split('-');
    if (parts.length === 2) {
      return parseInt(parts[1], 10);
    }
    return 0;
  });
  
  const maxSequence = Math.max(...sequenceNumbers);
  const nextSequence = maxSequence + 1;
  
  // Format as 5-digit number with leading zeros
  const formattedSequence = nextSequence.toString().padStart(5, '0');
  
  return `${yearSuffix}-${formattedSequence}`;
}

