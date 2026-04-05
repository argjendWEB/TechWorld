export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
}

export function formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(price);
}

export function stockStatus(stock: number): { label: string; color: string } {
    if (stock <= 0) return { label: 'Out of Stock', color: 'red' };
    if (stock <= 5) return { label: 'Low Stock', color: 'yellow' };
    return { label: 'In Stock', color: 'green' };
}
