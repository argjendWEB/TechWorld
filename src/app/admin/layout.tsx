'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import type { User } from '@supabase/supabase-js';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (!data.user && pathname !== '/admin/login') {
                router.push('/admin/login');
            } else {
                setUser(data.user);
            }
            setLoading(false);
        });

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session?.user && pathname !== '/admin/login') {
                router.push('/admin/login');
            }
            setUser(session?.user ?? null);
        });

        return () => listener.subscription.unsubscribe();
    }, [router, pathname]);

    if (pathname === '/admin/login') return <>{children}</>;
    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-950"><div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" /></div>;
    if (!user) return null;

    async function handleLogout() {
        await supabase.auth.signOut();
        router.push('/admin/login');
    }

    const navItems = [
        { href: '/admin', label: 'Dashboard', icon: '📊' },
        { href: '/admin/products', label: 'Products', icon: '📦' },
        { href: '/admin/products/new', label: 'Add Product', icon: '➕' },
    ];

    return (
        <div className="min-h-screen bg-gray-950 flex">
            {/* Mobile overlay */}
            {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

            {/* Sidebar */}
            <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-gray-800 flex flex-col transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-5 border-b border-gray-800">
                    <Link href="/admin" className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">TW</div>
                        <div>
                            <div className="font-bold text-white text-sm">TechWorld</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider">Admin Panel</div>
                        </div>
                    </Link>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${pathname === item.href
                                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                                }`}
                        >
                            <span>{item.icon}</span>
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white">
                            {user.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-xs text-white truncate">{user.email}</div>
                            <div className="text-[10px] text-gray-500">Administrator</div>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition">
                        Logout
                    </button>
                </div>

                <div className="p-4 border-t border-gray-800">
                    <a href="/" target="_blank" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500 hover:text-white transition">
                        🌐 View Storefront
                    </a>
                </div>
            </aside>

            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top bar */}
                <header className="h-14 border-b border-gray-800 bg-gray-900/50 backdrop-blur flex items-center px-4 lg:px-6 gap-4 shrink-0">
                    <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400 hover:text-white">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                    <div className="text-sm text-gray-400">
                        {pathname === '/admin' && 'Dashboard'}
                        {pathname === '/admin/products' && 'All Products'}
                        {pathname === '/admin/products/new' && 'Add Product'}
                        {pathname.includes('/edit') && 'Edit Product'}
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 overflow-auto p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
