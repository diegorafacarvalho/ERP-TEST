'use client';

import React, { useState } from 'react';
import { Plus, Search, Filter, MoreVertical, X, Trash2, AlertCircle, Eye } from 'lucide-react';
import { Order, OrderStatus, Customer, Product, OrderItem } from '@/app/page';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';

interface OrdersViewProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  customers: Customer[];
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

const statusColors: Record<OrderStatus, string> = {
  'Pendente': 'bg-amber-100 text-amber-800 border-amber-200',
  'Em Produção': 'bg-blue-100 text-blue-800 border-blue-200',
  'Faturado': 'bg-purple-100 text-purple-800 border-purple-200',
  'Enviado': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Entregue': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Cancelado': 'bg-red-100 text-red-800 border-red-200',
};

export default function OrdersView({ orders, setOrders, customers, products, setProducts }: OrdersViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // New Order Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Temp state for adding an item
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleAddItem = () => {
    setError(null);
    if (!selectedProductId || !itemQuantity) return;
    
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const qty = parseInt(itemQuantity, 10);
    if (qty <= 0) return;

    if (qty > product.stock) {
      setError(`Estoque insuficiente para ${product.name}. Estoque atual: ${product.stock}`);
      return;
    }

    const newItem: OrderItem = {
      productId: product.id,
      productName: product.name,
      quantity: qty,
      unitPrice: product.price,
      totalPrice: product.price * qty
    };

    setOrderItems([...orderItems, newItem]);
    setSelectedProductId('');
    setItemQuantity('1');
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...orderItems];
    newItems.splice(index, 1);
    setOrderItems(newItems);
  };

  const totalOrderAmount = orderItems.reduce((acc, item) => acc + item.totalPrice, 0);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    let updatedProducts = [...products];

    if (order.status !== 'Cancelado' && newStatus === 'Cancelado') {
      // Return stock
      updatedProducts = products.map(p => {
        const item = order.items.find(i => i.productId === p.id);
        if (item) {
          return { ...p, stock: p.stock + item.quantity };
        }
        return p;
      });
    } else if (order.status === 'Cancelado' && newStatus !== 'Cancelado') {
      // Deduct stock
      updatedProducts = products.map(p => {
        const item = order.items.find(i => i.productId === p.id);
        if (item) {
          return { ...p, stock: p.stock - item.quantity };
        }
        return p;
      });
    }

    const updatedOrder = { ...order, status: newStatus };

    if (supabase) {
      try {
        await db.saveOrder(updatedOrder);
        // Also update products in DB if stock changed
        if (order.status === 'Cancelado' || newStatus === 'Cancelado') {
          for (const p of updatedProducts) {
            const original = products.find(op => op.id === p.id);
            if (original && original.stock !== p.stock) {
              await db.saveProduct(p);
            }
          }
        }
      } catch (error) {
        console.warn('Erro no Supabase ao atualizar pedido. Atualizando apenas localmente.');
      }
    }

    if (order.status === 'Cancelado' || newStatus === 'Cancelado') {
      setProducts(updatedProducts);
    }
    setOrders(orders.map(o => o.id === orderId ? updatedOrder : o));
  };

  const handleDeleteOrder = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    let updatedProducts = [...products];

    if (order && order.status !== 'Cancelado') {
      // Return stock
      updatedProducts = products.map(p => {
        const item = order.items.find(i => i.productId === p.id);
        if (item) {
          return { ...p, stock: p.stock + item.quantity };
        }
        return p;
      });
    }

    if (supabase) {
      try {
        await db.deleteOrder(orderId);
        if (order && order.status !== 'Cancelado') {
          for (const p of updatedProducts) {
            const original = products.find(op => op.id === p.id);
            if (original && original.stock !== p.stock) {
              await db.saveProduct(p);
            }
          }
        }
      } catch (error) {
        console.warn('Erro no Supabase ao excluir pedido. Atualizando apenas localmente.');
      }
    }

    if (order && order.status !== 'Cancelado') {
      setProducts(updatedProducts);
    }
    setOrders(orders.filter(o => o.id !== orderId));
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!selectedCustomerId || orderItems.length === 0) {
      setError('Selecione um cliente e adicione pelo menos um item.');
      return;
    }

    const customer = customers.find(c => c.id === selectedCustomerId);
    if (!customer) return;

    // eslint-disable-next-line react-hooks/purity
    const timestampSuffix = Date.now().toString().slice(-4);
    const newOrder: Order = {
      id: `ORD-${new Date().getFullYear()}-${String(orders.length + 1).padStart(3, '0')}-${timestampSuffix}`,
      customerId: customer.id,
      customerName: customer.name,
      date: new Date().toISOString().split('T')[0],
      amount: totalOrderAmount,
      status: 'Pendente',
      items: orderItems
    };

    // Deduct stock
    const updatedProducts = products.map(p => {
      const orderedItem = orderItems.find(item => item.productId === p.id);
      if (orderedItem) {
        return { ...p, stock: p.stock - orderedItem.quantity };
      }
      return p;
    });

    if (supabase) {
      try {
        await db.saveOrder(newOrder);
        for (const p of updatedProducts) {
          const original = products.find(op => op.id === p.id);
          if (original && original.stock !== p.stock) {
            await db.saveProduct(p);
          }
        }
      } catch (error) {
        console.warn('Erro no Supabase ao criar pedido. Atualizando apenas localmente.');
      }
    }

    setProducts(updatedProducts);
    setOrders([newOrder, ...orders]);
    setIsModalOpen(false);
    
    // Reset form
    setSelectedCustomerId('');
    setOrderItems([]);
  };

  const filteredOrders = orders.filter(order => 
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    order.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Pedidos</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie os pedidos recebidos e acompanhe a produção.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Pedido
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Buscar por ID ou Cliente..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
            />
          </div>
          <button className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-4 h-4" />
            Filtros
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                <th className="px-6 py-4">ID do Pedido</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Data</th>
                <th className="px-6 py-4">Itens</th>
                <th className="px-6 py-4">Valor Total</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                  const totalQty = order.items.reduce((acc, item) => acc + item.quantity, 0);
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm font-medium text-gray-900">{order.id}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(order.date)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{totalQty} un.</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{formatCurrency(order.amount)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border outline-none cursor-pointer appearance-none ${statusColors[order.status]}`}
                        >
                          {Object.keys(statusColors).map(status => (
                            <option key={status} value={status} className="bg-white text-gray-900">{status}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => setViewingOrder(order)}
                          className="text-blue-400 hover:text-blue-600 transition-colors p-1 rounded-md hover:bg-blue-50 mr-2"
                          title="Ver Detalhes"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteOrder(order.id)}
                          className="text-red-400 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50"
                          title="Excluir Pedido"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Nenhum pedido encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination (Mock) */}
        <div className="p-4 border-t border-gray-200 flex items-center justify-between bg-gray-50/50 text-sm text-gray-500">
          <span>Mostrando 1 a {filteredOrders.length} de {filteredOrders.length} resultados</span>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-gray-300 rounded-md bg-white disabled:opacity-50" disabled>Anterior</button>
            <button className="px-3 py-1 border border-gray-300 rounded-md bg-white disabled:opacity-50" disabled>Próxima</button>
          </div>
        </div>
      </div>

      {/* New Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Novo Pedido</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}
              <div className="space-y-6">
                <div>
                  <label htmlFor="customer" className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
                  <select
                    id="customer"
                    required
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="">Selecione um cliente...</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.cnpj})</option>
                    ))}
                  </select>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/50">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Adicionar Item</h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <select
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                      >
                        <option value="">Selecione um produto...</option>
                        {products.filter(p => p.stock > 0).map(p => (
                          <option key={p.id} value={p.id}>{p.name} - {formatCurrency(p.price)} (Estoque: {p.stock})</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-32">
                      <input 
                        type="number" 
                        min="1"
                        value={itemQuantity}
                        onChange={(e) => setItemQuantity(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="Qtd"
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={handleAddItem}
                      className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors whitespace-nowrap"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>

                {orderItems.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Itens do Pedido</h3>
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
                          <tr>
                            <th className="px-4 py-2 font-medium">Produto</th>
                            <th className="px-4 py-2 font-medium">Qtd</th>
                            <th className="px-4 py-2 font-medium">Valor Unit.</th>
                            <th className="px-4 py-2 font-medium">Subtotal</th>
                            <th className="px-4 py-2 font-medium"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {orderItems.map((item, index) => (
                            <tr key={index} className="bg-white">
                              <td className="px-4 py-3 text-gray-900">{item.productName}</td>
                              <td className="px-4 py-3 text-gray-500">{item.quantity}</td>
                              <td className="px-4 py-3 text-gray-500">{formatCurrency(item.unitPrice)}</td>
                              <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(item.totalPrice)}</td>
                              <td className="px-4 py-3 text-right">
                                <button 
                                  onClick={() => handleRemoveItem(index)}
                                  className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50 border-t border-gray-200">
                          <tr>
                            <td colSpan={3} className="px-4 py-3 text-right font-medium text-gray-700">Total do Pedido:</td>
                            <td colSpan={2} className="px-4 py-3 font-bold text-gray-900 text-lg">{formatCurrency(totalOrderAmount)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCreateOrder}
                disabled={!selectedCustomerId || orderItems.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Finalizar Pedido
              </button>
            </div>
          </div>
        </div>
      )}
      {/* View Order Modal */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Detalhes do Pedido {viewingOrder.id}</h2>
              <button 
                onClick={() => setViewingOrder(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Cliente</p>
                  <p className="font-medium text-gray-900">{viewingOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Data do Pedido</p>
                  <p className="font-medium text-gray-900">{formatDate(viewingOrder.date)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[viewingOrder.status]}`}>
                    {viewingOrder.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Valor Total</p>
                  <p className="font-bold text-gray-900 text-lg">{formatCurrency(viewingOrder.amount)}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Itens do Pedido</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
                      <tr>
                        <th className="px-4 py-2 font-medium">Produto</th>
                        <th className="px-4 py-2 font-medium">Qtd</th>
                        <th className="px-4 py-2 font-medium">Valor Unit.</th>
                        <th className="px-4 py-2 font-medium">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {viewingOrder.items.map((item, index) => (
                        <tr key={index} className="bg-white">
                          <td className="px-4 py-3 text-gray-900">{item.productName}</td>
                          <td className="px-4 py-3 text-gray-500">{item.quantity}</td>
                          <td className="px-4 py-3 text-gray-500">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(item.totalPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-gray-200 bg-gray-50 flex items-center justify-end">
              <button 
                onClick={() => setViewingOrder(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
