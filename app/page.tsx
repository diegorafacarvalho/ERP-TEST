'use client';

import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  Package, 
  Settings, 
  Bell, 
  Search, 
  Plus,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import DashboardView from '@/components/DashboardView';
import OrdersView from '@/components/OrdersView';
import CustomersView from '@/components/CustomersView';
import ProductsView from '@/components/ProductsView';
import LoginView from '@/components/LoginView';

import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';

export type OrderStatus = 'Pendente' | 'Em Produção' | 'Faturado' | 'Enviado' | 'Entregue' | 'Cancelado';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  amount: number;
  status: OrderStatus;
  items: OrderItem[];
}

export interface Customer {
  id: string;
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  status: 'Ativo' | 'Inativo';
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  status: 'Ativo' | 'Inativo';
}

const initialOrders: Order[] = [
  { 
    id: 'ORD-2026-001', 
    customerId: 'CLI-001',
    customerName: 'Indústria Metalúrgica ABC', 
    date: '2026-04-09', 
    amount: 5400.00, 
    status: 'Pendente', 
    items: [{ productId: 'PROD-001', productName: 'Viga de Aço I 6m', quantity: 12, unitPrice: 450.00, totalPrice: 5400.00 }] 
  },
  { 
    id: 'ORD-2026-002', 
    customerId: 'CLI-002',
    customerName: 'Construtora Horizonte', 
    date: '2026-04-08', 
    amount: 12.50, 
    status: 'Em Produção', 
    items: [{ productId: 'PROD-002', productName: 'Parafuso Sextavado M12', quantity: 5, unitPrice: 2.50, totalPrice: 12.50 }] 
  },
];

const initialCustomers: Customer[] = [
  { id: 'CLI-001', name: 'Indústria Metalúrgica ABC', cnpj: '12.345.678/0001-90', email: 'contato@abcmetal.com.br', phone: '(11) 98765-4321', status: 'Ativo' },
  { id: 'CLI-002', name: 'Construtora Horizonte', cnpj: '98.765.432/0001-10', email: 'compras@horizonte.com.br', phone: '(11) 91234-5678', status: 'Ativo' },
  { id: 'CLI-003', name: 'Usinagem de Precisão Ltda', cnpj: '45.678.901/0001-23', email: 'vendas@usinagemprecisao.com', phone: '(41) 99999-8888', status: 'Ativo' },
];

const initialProducts: Product[] = [
  { id: 'PROD-001', name: 'Viga de Aço I 6m', sku: 'VIG-ACO-I-6M', category: 'Estruturas', price: 450.00, stock: 120, status: 'Ativo' },
  { id: 'PROD-002', name: 'Parafuso Sextavado M12', sku: 'PAR-SEX-M12', category: 'Fixação', price: 2.50, stock: 5000, status: 'Ativo' },
  { id: 'PROD-003', name: 'Chapa de Aço Carbono 2mm', sku: 'CHA-ACO-CAR-2MM', category: 'Chapas', price: 180.00, stock: 45, status: 'Ativo' },
];

export default function ERPApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [products, setProducts] = useState<Product[]>(initialProducts);

  React.useEffect(() => {
    setIsClient(true);
    
    // Check auth status
    const authStatus = localStorage.getItem('erp_auth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
    
    const loadData = async () => {
      const loadFromLocal = () => {
        const savedOrders = localStorage.getItem('erp_orders');
        const savedCustomers = localStorage.getItem('erp_customers');
        const savedProducts = localStorage.getItem('erp_products');

        if (savedOrders) setOrders(JSON.parse(savedOrders));
        if (savedCustomers) setCustomers(JSON.parse(savedCustomers));
        if (savedProducts) setProducts(JSON.parse(savedProducts));
      };

      if (supabase) {
        try {
          const [dbOrders, dbCustomers, dbProducts] = await Promise.all([
            db.getOrders(),
            db.getCustomers(),
            db.getProducts()
          ]);
          if (dbOrders.length > 0) setOrders(dbOrders);
          if (dbCustomers.length > 0) setCustomers(dbCustomers);
          if (dbProducts.length > 0) setProducts(dbProducts);
        } catch (error) {
          console.warn('Supabase indisponível ou não configurado. Usando armazenamento local.');
          loadFromLocal();
        }
      } else {
        loadFromLocal();
      }
    };

    loadData();
  }, []);

  React.useEffect(() => {
    if (isClient) {
      if (!supabase) {
        localStorage.setItem('erp_orders', JSON.stringify(orders));
        localStorage.setItem('erp_customers', JSON.stringify(customers));
        localStorage.setItem('erp_products', JSON.stringify(products));
      }
    }
  }, [orders, customers, products, isClient]);

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'pedidos', name: 'Pedidos', icon: ShoppingCart },
    { id: 'clientes', name: 'Clientes', icon: Users },
    { id: 'produtos', name: 'Produtos', icon: Package },
  ];

  const handleLogin = () => {
    setIsAuthenticated(true);
    localStorage.setItem('erp_auth', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('erp_auth');
  };

  if (!isClient) return null;

  if (!isAuthenticated) {
    return <LoginView onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="flex-shrink-0 bg-slate-900 text-white flex flex-col border-r border-slate-800 z-20"
          >
            <div className="h-16 flex items-center px-6 border-b border-slate-800">
              <div className="flex items-center gap-2 text-blue-400">
                <Package className="w-6 h-6" />
                <span className="text-lg font-semibold tracking-tight text-white">ERP Industrial</span>
              </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium ${
                      isActive 
                        ? 'bg-blue-600 text-white' 
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </button>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-800 space-y-1">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white">
                <Settings className="w-5 h-5" />
                Configurações
              </button>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                <X className="w-5 h-5" />
                Sair
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 z-10">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-md text-gray-500 hover:bg-gray-100 transition-colors"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
            <div className="hidden sm:flex items-center bg-gray-100 rounded-md px-3 py-1.5 w-64 focus-within:ring-2 focus-within:ring-blue-500 transition-shadow">
              <Search className="w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar pedidos, clientes..." 
                className="bg-transparent border-none outline-none text-sm ml-2 w-full text-gray-700 placeholder-gray-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-sm">
              AD
            </div>
          </div>
        </header>

        {/* Main Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeTab === 'dashboard' && <DashboardView orders={orders} products={products} />}
              {activeTab === 'pedidos' && <OrdersView orders={orders} setOrders={setOrders} customers={customers} products={products} setProducts={setProducts} />}
              {activeTab === 'clientes' && <CustomersView customers={customers} setCustomers={setCustomers} />}
              {activeTab === 'produtos' && <ProductsView products={products} setProducts={setProducts} />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
