export type Product = {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    long_description: string | null;
    price: number;
    compare_price: number | null;
    image_url: string | null;
    gallery_images: string[];
    category: string;
    features: string[];
    badge: string;
    stock: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
};

export type ProductInsert = Omit<Product, 'id' | 'created_at' | 'updated_at'>;
export type ProductUpdate = Partial<ProductInsert>;
