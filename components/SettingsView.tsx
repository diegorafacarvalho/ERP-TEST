import React, { useState, useEffect } from 'react';
import { Key, Globe, Database, Shield, Copy, Check } from 'lucide-react';

export default function SettingsView() {
  const [copied, setCopied] = useState(false);
  const [baseUrl, setBaseUrl] = useState('https://seu-dominio.vercel.app');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Configurações do Sistema</h1>
        <p className="text-gray-500 mt-1">Gerencie integrações e chaves de acesso do seu ERP.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Database className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Banco de Dados</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              O sistema está configurado para usar o Supabase como banco de dados principal.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                <div className="flex items-center gap-2 text-sm text-green-600 font-medium bg-green-50 px-3 py-2 rounded-md">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  Conectado
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <Shield className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Segurança da API</h2>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Sua API está protegida por uma chave secreta. Nunca compartilhe essa chave publicamente.
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">API Secret Key Atual</label>
              <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
                <code className="text-sm text-gray-800 font-mono">natan-natan-natan</code>
                <button 
                  onClick={() => handleCopy('natan-natan-natan')}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Copiar chave"
                >
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Para alterar essa chave, acesse o painel de Secrets (Variáveis de Ambiente) no AI Studio.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Documentação da API Aberta</h2>
                <p className="text-sm text-gray-500">Integre seu ERP com outros sistemas enviando esta documentação para o seu desenvolvedor.</p>
              </div>
            </div>

            <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-a:text-blue-600">
              <div className="bg-slate-900 text-slate-50 rounded-lg p-4 mb-6">
                <div className="text-xs text-slate-400 mb-1">URL Base da API</div>
                <code className="text-sm font-mono text-blue-300">{baseUrl}</code>
              </div>

              <h3 className="text-base font-semibold text-gray-900 mt-6 mb-3 border-b pb-2">🔐 Autenticação</h3>
              <p className="text-gray-600">
                Todas as requisições devem enviar a chave de API no cabeçalho (Header) da requisição.
              </p>
              <ul className="list-disc pl-5 text-gray-600 mb-6">
                <li><strong>Header:</strong> <code className="bg-gray-100 px-1 rounded text-gray-800">x-api-key</code></li>
                <li><strong>Valor:</strong> <code className="bg-gray-100 px-1 rounded text-gray-800">natan-natan-natan</code></li>
              </ul>

              <h3 className="text-base font-semibold text-gray-900 mt-8 mb-3 border-b pb-2">📡 Endpoints Disponíveis</h3>

              <div className="space-y-6">
                {/* Status */}
                <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">GET</span>
                    <code className="text-sm font-mono font-semibold text-gray-800">/api/status</code>
                  </div>
                  <p className="text-gray-600 text-sm">Retorna o status da API e da conexão com o banco de dados. Útil para health checks.</p>
                </div>

                {/* Products */}
                <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">GET</span>
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">POST</span>
                    <code className="text-sm font-mono font-semibold text-gray-800">/api/products</code>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">Gerencia o cadastro de produtos. O POST cria ou atualiza (upsert) baseado no ID.</p>
                  <div className="bg-gray-800 rounded-md p-3 overflow-x-auto">
                    <pre className="text-xs text-green-400 m-0">
{`// Exemplo de Body (POST)
{
  "id": "PROD-123",
  "name": "Chapa de Aço 5mm",
  "sku": "CHA-ACO-5MM",
  "category": "Chapas",
  "price": 150.50,
  "stock": 100,
  "status": "Ativo"
}`}
                    </pre>
                  </div>
                </div>

                {/* Customers */}
                <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">GET</span>
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">POST</span>
                    <code className="text-sm font-mono font-semibold text-gray-800">/api/customers</code>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">Gerencia o cadastro de clientes. O POST cria ou atualiza (upsert) baseado no ID.</p>
                  <div className="bg-gray-800 rounded-md p-3 overflow-x-auto">
                    <pre className="text-xs text-green-400 m-0">
{`// Exemplo de Body (POST)
{
  "id": "CLI-123",
  "name": "Indústria Metalúrgica S/A",
  "cnpj": "12.345.678/0001-90",
  "email": "contato@metalurgica.com",
  "phone": "11999999999",
  "status": "Ativo"
}`}
                    </pre>
                  </div>
                </div>

                {/* Orders */}
                <div className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">GET</span>
                    <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">POST</span>
                    <code className="text-sm font-mono font-semibold text-gray-800">/api/orders</code>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">Gerencia os pedidos de venda. O POST cria ou atualiza (upsert) baseado no ID.</p>
                  <div className="bg-gray-800 rounded-md p-3 overflow-x-auto">
                    <pre className="text-xs text-green-400 m-0">
{`// Exemplo de Body (POST)
{
  "id": "PED-123",
  "customerId": "CLI-123",
  "customerName": "Indústria Metalúrgica S/A",
  "date": "2026-04-11",
  "amount": 1500.00,
  "status": "Pendente",
  "items": [
    {
      "id": "ITEM-1",
      "productId": "PROD-123",
      "productName": "Chapa de Aço 5mm",
      "quantity": 10,
      "unitPrice": 150.50,
      "totalPrice": 1505.00
    }
  ]
}`}
                    </pre>
                  </div>
                </div>
              </div>

              <h3 className="text-base font-semibold text-gray-900 mt-8 mb-3 border-b pb-2">💻 Exemplo de Requisição (JavaScript / Fetch)</h3>
              <div className="bg-gray-800 rounded-md p-4 overflow-x-auto">
                <pre className="text-sm text-blue-300 m-0">
{`fetch('${baseUrl}/api/products', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'natan-natan-natan'
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Erro:', error));`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
