-- Create fragrances table
CREATE TABLE fragrances (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  family TEXT,
  type TEXT,
  gender TEXT DEFAULT 'unisex',
  price DECIMAL(10,2),
  image TEXT,
  image_webp TEXT,
  notes JSONB, -- Array of note names
  accords JSONB, -- Array of accord names
  longevity TEXT,
  sillage TEXT,
  description TEXT,
  purchase_url TEXT,
  buy_links JSONB, -- Object with store links
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_fragrances_brand ON fragrances(brand);
CREATE INDEX idx_fragrances_name ON fragrances(name);
CREATE INDEX idx_fragrances_family ON fragrances(family);
CREATE INDEX idx_fragrances_gender ON fragrances(gender);

-- Create a partial index for non-null prices
CREATE INDEX idx_fragrances_price ON fragrances(price) WHERE price IS NOT NULL;

-- Enable Row Level Security (RLS)
ALTER TABLE fragrances ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access on fragrances" ON fragrances
  FOR SELECT USING (true);

-- Create policy to allow authenticated users to insert/update
CREATE POLICY "Allow authenticated users to manage fragrances" ON fragrances
  FOR ALL USING (auth.role() = 'authenticated');

-- Optional: Create a view for easier querying
CREATE VIEW fragrances_with_metadata AS
SELECT
  id,
  name,
  brand,
  family,
  type,
  gender,
  price,
  image,
  image_webp,
  notes,
  accords,
  longevity,
  sillage,
  description,
  purchase_url,
  buy_links,
  created_at,
  updated_at,
  -- Computed fields
  CASE WHEN price IS NOT NULL THEN true ELSE false END as has_price,
  array_length(notes, 1) as notes_count,
  array_length(accords, 1) as accords_count
FROM fragrances;

-- Optional: Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_fragrances_updated_at
  BEFORE UPDATE ON fragrances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();