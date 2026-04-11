import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  let dbStatus = 'disconnected';
  let message = 'Supabase não está configurado. Verifique as chaves NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.';

  if (supabase) {
    try {
      // Tenta fazer uma query simples para testar a conexão e a chave
      const { error } = await supabase.from('products').select('id').limit(1);
      
      if (error) {
        dbStatus = 'error';
        message = `Erro ao conectar com Supabase: ${error.message}`;
      } else {
        dbStatus = 'connected';
        message = 'Conexão com o banco de dados (Supabase) está funcionando perfeitamente!';
      }
    } catch (err: any) {
      dbStatus = 'error';
      message = `Erro inesperado: ${err.message}`;
    }
  }

  return NextResponse.json({
    api: 'online',
    database: dbStatus,
    message: message,
    timestamp: new Date().toISOString()
  }, { 
    status: dbStatus === 'connected' ? 200 : 500,
    headers: corsHeaders 
  });
}
