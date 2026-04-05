import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder',
    { auth: { persistSession: false, autoRefreshToken: false } }
);

// GET - list all products (for admin) or single product by id
export async function GET(req: NextRequest) {
    const id = req.nextUrl.searchParams.get('id');

    if (id) {
        const { data, error } = await supabaseAdmin.from('products').select('*').eq('id', id).single();
        if (error) return NextResponse.json({ error: error.message }, { status: 404 });
        return NextResponse.json({ product: data });
    }

    const { data, error } = await supabaseAdmin.from('products').select('*').order('created_at', { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ products: data });
}

// POST - create product
export async function POST(req: NextRequest) {
    const body = await req.json();
    const { data, error } = await supabaseAdmin.from('products').insert([body]).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ product: data }, { status: 201 });
}

// PUT - update product
export async function PUT(req: NextRequest) {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'Missing product id' }, { status: 400 });

    const { data, error } = await supabaseAdmin.from('products').update(updates).eq('id', id).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ product: data });
}

// DELETE - delete product
export async function DELETE(req: NextRequest) {
    const body = await req.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: 'Missing product id' }, { status: 400 });

    const { error } = await supabaseAdmin.from('products').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true });
}
