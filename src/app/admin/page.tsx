'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { Product } from '@/lib/types';

export default function AdminDashboard() {
    const [stats, setStats] = useState({ total: 0, active: 0, lowStock: 0, categories: 0 });

    useEffect(() => {
        supabase.from('products').select('*').then(({ data }) => {
            if (!data) return;
            setStats({
                total: data.length,
                active: data.filter((p: Product) => p.is_active).length,
                lowStock: data.filter((p: Product) => p.stock <= 5 && p.stock > 0).length,
                categories: new Set(data.map((p: Product) => p.category)).size,
            });
        });
    }, []);

    const cards = [
        { label: 'Total Products', value: stats.total, icon: '📦', color: 'blue' },
        { label: 'Active', value: stats.active, icon: '✅', color: 'green' },
        { label: 'Low Stock', value: stats.lowStock, icon: '⚠️', color: 'yellow' },
        { label: 'Categories', value: stats.categories, icon: '🏷️', color: 'purple' },
    ];

    return (
        <div>
            <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((c) => (
                    <div key={c.label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-2xl">{c.icon}</span>
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{c.label}</span>
                        </div>
                        <div className="text-3xl font-bold text-white">{c.value}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
