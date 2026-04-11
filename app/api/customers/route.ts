import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { supabase } from '@/lib/supabase';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-api-key',
};

// Helper function to check API Key
function isAuthorized(request: Request) {
  const apiKey = process.env.API_SECRET_KEY;
  if (!apiKey) return true;
  const providedKey = request.headers.get('x-api-key') || request.headers.get('authorization')?.replace('Bearer ', '');
  return providedKey === apiKey;
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Não autorizado. Chave de API inválida.' }, { status: 401, headers: corsHeaders });
  }

  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase não configurado. A API requer o banco de dados para funcionar.' },
      { status: 501, headers: corsHeaders }
    );
  }
  try {
    const customers = await db.getCustomers();
    return NextResponse.json(customers, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Não autorizado. Chave de API inválida.' }, { status: 401, headers: corsHeaders });
  }

  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase não configurado. A API requer o banco de dados para funcionar.' },
      { status: 501, headers: corsHeaders }
    );
  }
  try {
    const body = await request.json();
    
    // Basic validation
    if (!body.id || !body.name || !body.cnpj) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes (id, name, cnpj)' },
        { status: 400, headers: corsHeaders }
      );
    }

    await db.saveCustomer(body);
    return NextResponse.json({ success: true, customer: body }, { status: 201, headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
