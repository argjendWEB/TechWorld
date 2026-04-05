'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { formatPrice, stockStatus } from '@/lib/utils';
import Link from 'next/link';
import type { Product } from '@/lib/types';

export default function AdminProducts() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [sortBy, setSortBy] = useState('created_at');
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        // Use the API route which uses the service role key
        const res = await fetch('/api/admin/products');
        const data = await res.json();
        setProducts(data.products || []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);

    const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

    const filtered = products
        .filter(p => categoryFilter === 'All' || p.category === categoryFilter)
        .filter(p => p.title.toLowerCase().includes(search.toLowerCase()) || p.slug.includes(search.toLowerCase()))
        .sort((a, b) => {
            if (sortBy === 'price') return b.price - a.price;
            if (sortBy === 'stock') return a.stock - b.stock;
            if (sortBy === 'title') return a.title.localeCompare(b.title);
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

    async function handleDelete() {
        if (!deleteId) return;
        setDeleting(true);
        await fetch('/api/admin/products', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: deleteId }),
        });
        setDeleteId(null);
        setDeleting(false);
        fetchProducts();
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold text-white">Products</h1>
                <Link href="/admin/products/new" className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition">
                    + Add Product
                </Link>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <input
                    type="text"
                    placeholder="Search products..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
                />
                <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500">
                    <option value="created_at">Newest</option>
                    <option value="title">Name</option>
                    <option value="price">Price</option>
                    <option value="stock">Stock</option>
                </select>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" /></div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                    <p className="text-4xl mb-3">📦</p>
                    <p className="font-medium">No products found</p>
                    <Link href="/admin/products/new" className="text-blue-400 text-sm hover:underline mt-2 inline-block">Add your first product →</Link>
                </div>
            ) : (
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-800">
                                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Product</th>
                                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</th>
                                    <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="text-right p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {filtered.map(p => {
                                    const stock = stockStatus(p.stock);
                                    return (
                                        <tr key={p.id} className="hover:bg-gray-800/50 transition">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    {p.image_url ? (
                                                        <img src={p.image_url} alt={p.title} className="w-10 h-10 rounded-lg object-cover bg-gray-800" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-gray-600">📷</div>
                                                    )}
                                                    <div>
                                                        <div className="font-medium text-white">{p.title}</div>
                                                        <div className="text-xs text-gray-500">{p.slug}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-gray-400">{p.category}</td>
                                            <td className="p-4 text-white font-medium">{formatPrice(p.price)}</td>
                                            <td className="p-4 text-gray-400">{p.stock}</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`inline-block w-2 h-2 rounded-full ${stock.color === 'green' ? 'bg-green-400' : stock.color === 'yellow' ? 'bg-yellow-400' : 'bg-red-400'}`} />
                                                    <span className="text-xs text-gray-400">{stock.label}</span>
                                                    {!p.is_active && <span className="text-[10px] bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">Draft</span>}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/admin/products/${p.id}/edit`} className="px-3 py-1.5 text-xs font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition">
                                                        Edit
                                                    </Link>
                                                    <button onClick={() => setDeleteId(p.id)} className="px-3 py-1.5 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition">
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 border-t border-gray-800 text-xs text-gray-500">
                        Showing {filtered.length} of {products.length} products
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteId && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-sm w-full">
                        <div className="text-center">
                            <div className="text-4xl mb-3">🗑️</div>
                            <h3 className="text-lg font-bold text-white mb-2">Delete Product?</h3>
                            <p className="text-sm text-gray-400 mb-6">This action cannot be undone. The product will be permanently removed.</p>
                            <div className="flex gap-3">
                                <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2.5 bg-gray-800 text-gray-300 rounded-lg font-medium text-sm hover:bg-gray-700 transition">
                                    Cancel
                                </button>
                                <button onClick={handleDelete} disabled={deleting} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium text-sm hover:bg-red-500 transition disabled:opacity-50">
                                    {deleting ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
