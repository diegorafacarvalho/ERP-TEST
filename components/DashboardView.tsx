'use client';

import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, Package, Clock, AlertCircle, DollarSign, Layers } from 'lucide-react';
import { Order, Product } from '@/app/page';

interface DashboardViewProps {
  orders: Order[];
  products: Product[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#8b5cf6', '#ef4444'];

export default function DashboardView({ orders, products }: DashboardViewProps) {
  // Calculate KPIs
  const totalRevenue = orders.reduce((acc, order) => acc + (order.status !== 'Cancelado' ? order.amount : 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'Pendente').length;
  
  // Calculate Stock Value
  const totalStockValue = products.reduce((acc, product) => acc + (product.price * product.stock), 0);
  const lowStockProducts = products.filter(p => p.stock < 100).length;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Prepare chart data - Revenue by Date
  const revenueByDate = orders.reduce((acc: any[], order) => {
    if (order.status === 'Cancelado') return acc;
    const existingDate = acc.find(item => item.date === order.date);
    if (existingDate) {
      existingDate.revenue += order.amount;
    } else {
      acc.push({ date: order.date, revenue: order.amount });
    }
    return acc;
  }, []).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Prepare chart data - Orders by Status
  const statusCount = orders.reduce((acc: Record<string, number>, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});
  
  const statusData = Object.keys(statusCount).map(key => ({
    name: key,
    value: statusCount[key]
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard Industrial</h1>
        <p className="text-sm text-gray-500 mt-1">Visão geral do recebimento e produção de pedidos.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Faturamento Total</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span className="font-medium">+12.5%</span>
            <span className="text-gray-400 ml-1">vs. mês anterior</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Valor em Estoque</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totalStockValue)}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-gray-500">
            <span className="text-gray-400">{products.length} produtos cadastrados</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Aguardando Produção</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{pendingOrders}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-amber-600">
            <AlertCircle className="w-4 h-4 mr-1" />
            <span className="font-medium">Atenção</span>
            <span className="text-gray-400 ml-1">Fila crescente</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Alertas de Estoque</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{lowStockProducts}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-red-600">
            <AlertCircle className="w-4 h-4 mr-1" />
            <span className="font-medium">Produtos com estoque baixo</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm lg:col-span-2">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Faturamento por Dia</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByDate} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#6b7280' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickFormatter={(value) => `R$ ${value / 1000}k`}
                />
                <Tooltip 
                  cursor={{ fill: '#f3f4f6' }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Faturamento']}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm lg:col-span-1 flex flex-col">
          <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center justify-between">
            <span>Alertas de Estoque</span>
            <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">{lowStockProducts}</span>
          </h3>
          <div className="flex-1 overflow-y-auto pr-2">
            {products.filter(p => p.stock < 100).length > 0 ? (
              <div className="space-y-3">
                {products.filter(p => p.stock < 100).map(product => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-red-50/50 border border-red-100 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">{product.stock} un.</p>
                      <p className="text-xs text-red-400">Baixo</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 py-8">
                <Package className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm">Estoque regularizado</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
