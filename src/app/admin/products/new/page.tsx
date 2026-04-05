'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { slugify } from '@/lib/utils';
import ImageUpload from '../../components/ImageUpload';

export default function NewProduct() {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [slugEdited, setSlugEdited] = useState(false);
    const [form, setForm] = useState({
        title: '', slug: '', description: '', long_description: '',
        price: '', compare_price: '', image_url: '', category: '',
        badge: '', stock: '0', is_active: true,
        features: ['', '', '', ''],
        gallery_images: [''],
    });

    function updateField(field: string, value: string | boolean) {
        setForm(prev => {
            const next = { ...prev, [field]: value };
            if (field === 'title' && !slugEdited) {
                next.slug = slugify(value as string);
            }
            return next;
        });
    }

    function updateFeature(i: number, val: string) {
        setForm(prev => {
            const features = [...prev.features];
            features[i] = val;
            return { ...prev, features };
        });
    }

    function updateGallery(i: number, val: string) {
        setForm(prev => {
            const gallery_images = [...prev.gallery_images];
            gallery_images[i] = val;
            return { ...prev, gallery_images };
        });
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError('');

        const body = {
            title: form.title,
            slug: form.slug || slugify(form.title),
            description: form.description,
            long_description: form.long_description,
            price: parseFloat(form.price) || 0,
            compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
            image_url: form.image_url || null,
            gallery_images: form.gallery_images.filter(g => g.trim()),
            category: form.category || 'Uncategorized',
            features: form.features.filter(f => f.trim()),
            badge: form.badge,
            stock: parseInt(form.stock) || 0,
            is_active: form.is_active,
        };

        const res = await fetch('/api/admin/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const data = await res.json();
            setError(data.error || 'Failed to create product');
            setSaving(false);
            return;
        }

        router.push('/admin/products');
    }

    return (
        <div className="max-w-3xl">
            <h1 className="text-2xl font-bold text-white mb-6">Add New Product</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Basic Info</h2>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Title *</label>
                        <input type="text" required value={form.title} onChange={e => updateField('title', e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Slug</label>
                        <input type="text" value={form.slug} onChange={e => { setSlugEdited(true); updateField('slug', e.target.value); }}
                            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
                        <p className="text-[10px] text-gray-600 mt-1">Auto-generated from title. Edit manually if needed.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Category *</label>
                            <input type="text" required value={form.category} onChange={e => updateField('category', e.target.value)} list="categories"
                                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
                            <datalist id="categories">
                                {['Laptops', 'Phones', 'Audio', 'Wearables', 'Tablets', 'Gaming', 'Displays', 'Desktops'].map(c => <option key={c} value={c} />)}
                            </datalist>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Badge</label>
                            <input type="text" value={form.badge} onChange={e => updateField('badge', e.target.value)} placeholder="New, Hot, Pro..."
                                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Short Description</label>
                        <input type="text" value={form.description} onChange={e => updateField('description', e.target.value)}
                            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Long Description</label>
                        <textarea value={form.long_description} onChange={e => updateField('long_description', e.target.value)} rows={3}
                            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500 resize-y" />
                    </div>
                </div>

                {/* Pricing & Stock */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Pricing & Stock</h2>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Price ($) *</label>
                            <input type="number" step="0.01" min="0" required value={form.price} onChange={e => updateField('price', e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Compare Price ($)</label>
                            <input type="number" step="0.01" min="0" value={form.compare_price} onChange={e => updateField('compare_price', e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Stock *</label>
                            <input type="number" min="0" required value={form.stock} onChange={e => updateField('stock', e.target.value)}
                                className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
                        </div>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input type="checkbox" checked={form.is_active} onChange={e => updateField('is_active', e.target.checked)}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500" />
                        <span className="text-sm text-gray-300">Active (visible on storefront)</span>
                    </label>
                </div>

                {/* Images */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Images</h2>
                    <div>
                        <ImageUpload
                            value={form.image_url}
                            onChange={(url) => updateField('image_url', url)}
                            label="Primary Image"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Gallery Images</label>
                        <div className="space-y-4 shadow-inner bg-gray-950/50 p-4 rounded-xl border border-gray-800">
                            {form.gallery_images.map((g, i) => (
                                <div key={i} className="flex gap-4 items-start border-b border-gray-800 pb-4 last:border-0 last:pb-0">
                                    <div className="flex-1">
                                        <ImageUpload
                                            value={g}
                                            onChange={(url) => updateGallery(i, url)}
                                            label={`Gallery Image ${i + 1}`}
                                        />
                                    </div>
                                    {form.gallery_images.length > 1 && (
                                        <button type="button" onClick={() => setForm(p => ({ ...p, gallery_images: p.gallery_images.filter((_, j) => j !== i) }))}
                                            className="px-3 py-1 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition mt-6 text-xs">
                                            Remove
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={() => setForm(p => ({ ...p, gallery_images: [...p.gallery_images, ''] }))}
                            className="text-xs text-blue-400 hover:text-blue-300 mt-3 inline-block">+ Add gallery image</button>
                    </div>
                </div>

                {/* Features */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Features</h2>
                    {form.features.map((f, i) => (
                        <input key={i} type="text" value={f} onChange={e => updateFeature(i, e.target.value)} placeholder={`Feature ${i + 1}`}
                            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500" />
                    ))}
                    <button type="button" onClick={() => setForm(p => ({ ...p, features: [...p.features, ''] }))} className="text-xs text-blue-400 hover:text-blue-300">+ Add feature</button>
                </div>

                {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg p-3">{error}</div>}

                <div className="flex gap-3">
                    <button type="submit" disabled={saving} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition disabled:opacity-50">
                        {saving ? 'Creating...' : 'Create Product'}
                    </button>
                    <button type="button" onClick={() => router.back()} className="px-6 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
