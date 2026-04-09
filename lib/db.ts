import { supabase } from './supabase';
import { Customer, Product, Order, OrderItem } from '@/app/page';

// Helper to map snake_case to camelCase for OrderItem
const mapOrderItem = (item: any): OrderItem => ({
  productId: item.product_id,
  productName: item.product_name,
  quantity: item.quantity,
  unitPrice: item.unit_price,
  totalPrice: item.total_price,
});

export const db = {
  // Customers
  async getCustomers(): Promise<Customer[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data as Customer[];
  },
  async saveCustomer(customer: Customer) {
    if (!supabase) return;
    const { error } = await supabase.from('customers').upsert([customer]);
    if (error) throw error;
  },
  async deleteCustomer(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) throw error;
  },

  // Products
  async getProducts(): Promise<Product[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data as Product[];
  },
  async saveProduct(product: Product) {
    if (!supabase) return;
    const { error } = await supabase.from('products').upsert([product]);
    if (error) throw error;
  },
  async deleteProduct(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  },

  // Orders
  async getOrders(): Promise<Order[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('orders').select('*, items:order_items(*)').order('created_at', { ascending: false });
    if (error) throw error;
    
    return data.map((order: any) => ({
      id: order.id,
      customerId: order.customer_id,
      customerName: order.customer_name,
      date: order.date,
      amount: order.amount,
      status: order.status,
      items: order.items ? order.items.map(mapOrderItem) : []
    }));
  },
  async saveOrder(order: Order) {
    if (!supabase) return;
    
    // 1. Upsert Order
    const { error: orderError } = await supabase.from('orders').upsert([{
      id: order.id,
      customer_id: order.customerId,
      customer_name: order.customerName,
      date: order.date,
      amount: order.amount,
      status: order.status
    }]);
    if (orderError) throw orderError;

    // 2. Delete existing items (for simplicity on update)
    await supabase.from('order_items').delete().eq('order_id', order.id);

    // 3. Insert new items
    if (order.items.length > 0) {
      const itemsToInsert = order.items.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.productName,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice
      }));
      const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert);
      if (itemsError) throw itemsError;
    }
  },
  async deleteOrder(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) throw error;
  }
};
