-- ============================================
-- TechWorld Supabase Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  long_description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  compare_price DECIMAL(10,2),
  image_url TEXT,
  gallery_images TEXT[] DEFAULT '{}',
  category TEXT NOT NULL DEFAULT 'Uncategorized',
  features TEXT[] DEFAULT '{}',
  badge TEXT DEFAULT '',
  stock INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- ============================================
-- Row Level Security
-- ============================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Anyone can read active products
CREATE POLICY "Public can view active products"
  ON products FOR SELECT
  USING (is_active = true);

-- Authenticated users with admin role can do everything
-- (The service role key bypasses RLS, so admin panel uses that)
-- If you want auth-based policies too, uncomment and set your email:
-- CREATE POLICY "Admin full access"
--   ON products FOR ALL
--   USING (auth.jwt() ->> 'email' = 'your-admin@email.com')
--   WITH CHECK (auth.jwt() ->> 'email' = 'your-admin@email.com');

-- ============================================
-- Seed data (your existing 15 products)
-- ============================================
INSERT INTO products (title, slug, description, long_description, price, image_url, gallery_images, category, features, badge, stock, is_active) VALUES
('Apple MacBook Pro 16" (M3 Max)', 'apple-macbook-pro-16-m3-max', 'M3 Max, 36GB Unified Memory, 1TB SSD, Space Black.', 'The most advanced Mac ever built. Featuring the M3 Max chip, a stunning Liquid Retina XDR display, and up to 22 hours of battery life.', 3499.00, '/images/macbook_pro_16.png', ARRAY['/images/macbook_pro_16.png', '/images/macbook_pro_16_side.png', '/images/macbook_pro_16_detail.png'], 'Laptops', ARRAY['M3 Max 14-Core CPU', 'Liquid Retina XDR Display', '36GB Unified Memory', 'Hardware-accelerated ray tracing'], 'Best Seller', 25, true),
('Samsung Galaxy S24 Ultra', 'samsung-galaxy-s24-ultra', 'Titanium frame, Galaxy AI, 200MP camera, Snapdragon 8 Gen 3.', 'Welcome to the era of mobile AI. The S24 Ultra features a tough titanium exterior and a flat 6.8" display.', 1299.99, '/images/galaxy_s24_ultra.png', ARRAY['/images/galaxy_s24_ultra.png', '/images/galaxy_s24_ultra_back.png', '/images/galaxy_s24_ultra_side.png'], 'Phones', ARRAY['Galaxy AI Integration', 'Titanium Exterior', '200MP Main Camera', 'Built-in S Pen'], 'New', 40, true),
('Sony WH-1000XM5', 'sony-wh-1000xm5', 'Industry leading noise cancellation, 30hr battery, multipoint.', 'The WH-1000XM5 headphones rewrite the rules for distraction-free listening.', 398.00, '/images/sony_wh1000xm5.png', ARRAY['/images/sony_wh1000xm5.png', '/images/sony_wh1000xm5_side.png', '/images/sony_wh1000xm5_detail.png'], 'Audio', ARRAY['Auto NC Optimizer', 'Precise Voice Pickup', 'Multipoint Bluetooth', '30-Hour Battery'], '', 60, true),
('Apple Watch Ultra 2', 'apple-watch-ultra-2', 'Rugged titanium case, precision GPS, 3000 nits display.', 'The ultimate sports and adventure watch with aerospace-grade titanium.', 799.00, '/images/apple_watch_ultra_2.png', ARRAY['/images/apple_watch_ultra_2.png', '/images/apple_watch_ultra_2_side.png', '/images/apple_watch_ultra_2_detail.png'], 'Wearables', ARRAY['49mm Titanium Case', '3000 Nits Brightness', 'Precision Dual-Frequency GPS', 'Water Resistant 100m'], 'Popular', 30, true),
('Apple iPad Pro 13" (M4)', 'apple-ipad-pro-13-m4', 'Incredibly thin, Ultra Retina XDR display, M4 performance.', 'The all-new iPad Pro packs astonishing power into an impossibly thin form.', 1299.00, '/images/ipad_pro_m4.png', ARRAY['/images/ipad_pro_m4.png', '/images/ipad_pro_m4_side.png'], 'Tablets', ARRAY['Ultra Retina XDR (Tandem OLED)', 'Apple M4 Chip', 'Thunderbolt', 'Face ID'], '', 20, true),
('Sony PlayStation 5 Pro', 'sony-playstation-5-pro', 'Advanced ray tracing, enhanced GPU, PlayStation Spectral Super Resolution.', 'Experience spectacular gaming worlds with the PlayStation 5 Pro.', 699.99, '/images/ps5_pro.png', ARRAY['/images/ps5_pro.png'], 'Gaming', ARRAY['PlayStation Spectral Super Resolution', 'Advanced Ray Tracing', '2TB NVMe SSD', 'High-Fidelity Framerates'], 'Hot', 15, true),
('Alienware 32" 4K QD-OLED', 'alienware-32-4k-qd-oled', '32" 4K Quantum Dot OLED, 240Hz, 0.03ms response.', 'The world''s first 4K QD-OLED gaming monitor with infinite contrast.', 1199.99, '/images/alienware_monitor.png', ARRAY['/images/alienware_monitor.png'], 'Displays', ARRAY['4K QD-OLED Panel', '240Hz Refresh Rate', '0.03ms GtG Response', 'Dolby Vision HDR'], '', 10, true),
('Apple AirPods Pro 2', 'apple-airpods-pro-2', 'Pro-level Active Noise Cancellation, Adaptive Audio, USB-C.', 'AirPods Pro 2 feature up to 2x more Active Noise Cancellation plus Adaptive Audio.', 249.00, '/images/airpods_pro_2.png', ARRAY['/images/airpods_pro_2.png'], 'Audio', ARRAY['H2 Apple Silicon', 'Next-level ANC', 'Adaptive Audio', 'MagSafe Charging Case (USB-C)'], 'New', 100, true),
('Valve Steam Deck OLED', 'valve-steam-deck-oled', '7.4" HDR OLED, 512GB NVMe SSD, better battery.', 'The definitive portable PC gaming experience with a stunning HDR OLED screen.', 549.00, '/images/steam_deck.png', ARRAY['/images/steam_deck.png'], 'Gaming', ARRAY['7.4" HDR OLED Display', '512GB NVMe SSD', 'Wi-Fi 6E', 'Enhanced Battery Life'], 'Hot', 35, true),
('Nintendo Switch OLED', 'nintendo-switch-oled', '7-inch OLED screen, 64GB storage, enhanced audio.', 'Play at home on the TV or on-the-go with a vibrant 7-inch OLED screen.', 349.99, '/images/switch_oled.png', ARRAY['/images/switch_oled.png'], 'Gaming', ARRAY['7-inch OLED Screen', 'Wide Adjustable Stand', 'Wired LAN Port in Dock', '64GB Internal Storage'], '', 50, true),
('Google Pixel 8 Pro', 'google-pixel-8-pro', 'Google Tensor G3, Pro-level cameras, 7 years of updates.', 'Engineered by Google, the Pixel 8 Pro is the smartest and most powerful Pixel yet.', 999.00, '/images/phone_main.png', ARRAY['/images/phone_main.png'], 'Phones', ARRAY['Google Tensor G3', 'Pro-level Triple Camera', 'Super Actua Display', 'Thermometer Sensor'], 'New', 45, true),
('Apple Mac Studio (M2 Ultra)', 'apple-mac-studio-m2-ultra', '24-core CPU, 60-core GPU, 64GB memory, 1TB SSD.', 'Empower your studio with the astronomical performance of the M2 Ultra.', 3999.00, '/images/console_side.png', ARRAY['/images/console_side.png'], 'Desktops', ARRAY['Apple M2 Ultra Chip', '64GB Unified Memory', 'Up to 22 Streams of 8K ProRes', 'Extensive I/O Ports'], 'Pro', 8, true),
('Bose QuietComfort Ultra', 'bose-quietcomfort-ultra', 'Spatial audio, world-class ANC, 24 hr battery.', 'Step into a new dimension of audio with immersive spatial audio.', 429.00, '/images/headphones_main.png', ARRAY['/images/headphones_main.png'], 'Audio', ARRAY['Immersive Spatial Audio', 'CustomTune Tech', 'World-Class ANC', '24-Hour Battery Life'], '', 55, true),
('Samsung Odyssey OLED G9', 'samsung-odyssey-oled-g9', '49" Super Ultrawide, 240Hz, 0.03ms, OLED.', 'A massive 49-inch curved super ultrawide display with Samsung OLED technology.', 1799.99, '/images/monitor_main.png', ARRAY['/images/monitor_main.png'], 'Displays', ARRAY['49" Curved OLED', 'Dual QHD Resolution', '240Hz Refresh', '0.03ms Response Time'], 'Hot', 12, true),
('Meta Quest 3', 'meta-quest-3', 'Breakthrough mixed reality, pancake lenses, Snapdragon XR2 Gen 2.', 'Transform your home into a boundless playground with breakthrough mixed reality.', 499.00, '/images/smartwatch_main.png', ARRAY['/images/smartwatch_main.png'], 'Wearables', ARRAY['High-Fidelity Mixed Reality', 'Pancake Lenses', 'Snapdragon XR2 Gen 2', 'TrueTouch Haptics'], 'New', 30, true);
