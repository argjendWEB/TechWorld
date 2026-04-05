import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// This endpoint uses the ANON key so RLS applies (only active products)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
);

// GET /api/products - public endpoint for storefront
export async function GET(req: NextRequest) {
    const slug = req.nextUrl.searchParams.get('slug');
    const category = req.nextUrl.searchParams.get('category');

    if (slug) {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('slug', slug)
            .single();
        if (error) return NextResponse.json({ error: error.message }, { status: 404 });
        return NextResponse.json(data);
    }

    let query = supabase.from('products').select('*').order('created_at', { ascending: false });

    if (category && category !== 'All') {
        query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Send CORS headers for storefront fetch
    return NextResponse.json(data, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
        },
    });
}
