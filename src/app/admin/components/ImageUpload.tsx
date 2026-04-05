'use client';
import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';

export default function ImageUpload({
    value,
    onChange,
    label = "Upload Image"
}: {
    value: string;
    onChange: (url: string) => void;
    label?: string;
}) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        try {
            setUploading(true);
            const file = e.target.files?.[0];
            if (!file) return;

            // Generate unique filename to avoid overriding
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Upload directly to Supabase Storage bucket 'product-images'
            const { error: uploadError } = await supabase.storage
                .from('product-images')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;

            // Retrieve the public URL for the uploaded item
            const { data } = supabase.storage
                .from('product-images')
                .getPublicUrl(filePath);

            onChange(data.publicUrl);
        } catch (error: any) {
            alert('Error uploading image: ' + error.message);
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }

    return (
        <div className="space-y-3">
            <label className="block text-xs text-gray-500">{label}</label>
            <div className="flex items-center gap-4">
                {value && (
                    <div className="relative group">
                        <img src={value} alt="Preview" className="w-24 h-24 object-cover rounded-lg bg-gray-800 border border-gray-700" />
                        <button
                            type="button"
                            onClick={() => onChange('')}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition shadow-lg hover:bg-red-400"
                        >
                            ✕
                        </button>
                    </div>
                )}
                <div className="flex-1">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white hover:bg-gray-700 transition flex items-center w-max gap-2 disabled:opacity-50"
                    >
                        {uploading ? (
                            <>
                                <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Uploading...
                            </>
                        ) : (
                            <>
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                                Choose Local File
                            </>
                        )}
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleUpload}
                    />
                    <p className="text-[10px] text-gray-500 mt-2">Recommended: high quality image, max 2MB</p>
                </div>
            </div>
            {/* Allow manual URL fallback just in case */}
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Or paste an external web image URL instead..."
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-xs placeholder-gray-600 focus:outline-none focus:border-blue-500"
            />
        </div>
    );
}
