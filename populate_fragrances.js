// Script to populate fragrances table with ALL data from RapidAPI
// Run this with: node populate_fragrances.js

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration - set these in your environment before running
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
let supabase = null;

// RapidAPI configuration - set this in your environment too
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const RAPIDAPI_HOST = 'fragrance-api.p.rapidapi.com';

function getSupabaseClient() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('SUPABASE_URL and SUPABASE_KEY (or NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY) must be set as environment variables.');
  }
  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  return supabase;
}

// Popular brands to fetch first
const POPULAR_BRANDS = [
  "Chanel", "Dior", "Tom Ford", "Gucci", "Versace", "YSL", "Giorgio Armani",
  "Jo Malone", "Byredo", "Maison Margiela", "Guerlain", "Hermès", "Prada",
  "Viktor & Rolf", "Lancôme", "Marc Jacobs", "Dolce & Gabbana", "Carolina Herrera",
  "Le Labo", "Diptyque", "Creed", "Penhaligon's", "Floris", "Acqua di Parma",
  "Bvlgari", "Cartier", "Chloe", "Kenzo", "Paco Rabanne", "Ralph Lauren",
  "Calvin Klein", "Hugo Boss", "Armani", "Versace", "Givenchy", "Lancome",
  "Estee Lauder", "Clinique", "Elizabeth Arden", "Shiseido", "SK-II"
];

// Additional search terms to get more fragrances
const SEARCH_TERMS = [
  "perfume", "eau de parfum", "eau de toilette", "cologne", "fragrance",
  "oud", "amber", "jasmine", "rose", "vanilla", "sandalwood", "patchouli",
  "citrus", "floral", "woody", "oriental", "fresh", "spicy"
];

async function fetchFromRapidAPI(query, limit = 50, offset = 0) {
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-rapidapi-host": RAPIDAPI_HOST,
      "x-rapidapi-key": RAPIDAPI_KEY,
    },
    body: JSON.stringify({
      queries: [
        {
          indexUid: "fragrances",
          q: query,
          facets: ["brand.name", "notes.name", "perfumers.name", "releasedAt"],
          limit: limit,
          offset: offset,
        },
      ],
    }),
  };

  const response = await fetch(
    "https://fragrance-api.p.rapidapi.com/multi-search",
    options
  );

  const result = await response.json();
  if (!response.ok) {
    const message = result?.message || result?.error || `HTTP ${response.status}`;
    throw new Error(`RapidAPI request failed: ${message}`);
  }

  return result?.results?.[0]?.hits || [];
}

function transformFragranceData(fragrance) {
  return {
    id: fragrance.id || `${fragrance.brand?.name}-${fragrance.name}`.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""),
    name: fragrance.name,
    brand: fragrance.brand?.name || "",
    family: fragrance.accords?.[0] || "",
    type: fragrance.type || "",
    gender: fragrance.gender || "unisex",
    price: fragrance.price || null,
    image: fragrance.image?.url || "",
    image_webp: fragrance.image?.url ? fragrance.image.url.replace(".jpg", ".webp") : "",
    notes: fragrance.notes?.map(n => n.name).filter(Boolean) || [],
    accords: fragrance.accords?.filter(Boolean) || [],
    longevity: fragrance.longevity || "",
    sillage: fragrance.sillage || "",
    description: fragrance.description || "",
    purchase_url: fragrance.purchase_url || "",
    buy_links: {
      ...(fragrance.purchase_url ? { brand: fragrance.purchase_url } : {}),
      amazon: `https://www.amazon.com/s?k=${encodeURIComponent(fragrance.name + " " + (fragrance.brand?.name || ""))}`,
      sephora: `https://www.sephora.com/search?keyword=${encodeURIComponent(fragrance.name)}`,
      ulta: `https://www.ulta.com/search?search=${encodeURIComponent(fragrance.name)}`,
      fragrancenet: `https://www.fragrancenet.com/search#/?q=${encodeURIComponent(fragrance.name)}`,
    },
  };
}

async function insertFragrance(fragranceData) {
  try {
    const supabaseClient = getSupabaseClient();
    const { data, error } = await supabaseClient
      .from('fragrances')
      .upsert(fragranceData, { onConflict: 'id' });

    if (error) {
      console.error(`Error inserting ${fragranceData.name}:`, error.message || error);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`Error inserting ${fragranceData.name}:`, error.message || error);
    return false;
  }
}

async function populateAllFragrances() {
  console.log('🚀 Starting comprehensive fragrance data population...');
  console.log('📊 This will fetch thousands of fragrances from RapidAPI and store them in Supabase\n');

  let totalInserted = 0;
  let totalDuplicates = 0;

  // Phase 1: Fetch popular brands (higher quality data)
  console.log('📦 Phase 1: Fetching popular brands...');
  for (const brand of POPULAR_BRANDS) {
    try {
      console.log(`🔍 Fetching ${brand} fragrances...`);

      const hits = await fetchFromRapidAPI(brand, 100); // Get more per brand
      console.log(`   Found ${hits.length} fragrances for ${brand}`);

      for (const fragrance of hits) {
        const fragranceData = transformFragranceData(fragrance);
        const inserted = await insertFragrance(fragranceData);

        if (inserted) {
          totalInserted++;
        } else {
          totalDuplicates++;
        }
      }

      // Progress update
      console.log(`   ✅ ${brand} complete. Total inserted: ${totalInserted}, Duplicates: ${totalDuplicates}`);

      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`❌ Error fetching ${brand}:`, error.message);
    }
  }

  // Phase 2: Fetch using search terms to get more variety
  console.log('\n📦 Phase 2: Fetching using search terms...');
  for (const term of SEARCH_TERMS) {
    try {
      console.log(`🔍 Searching for "${term}" fragrances...`);

      const hits = await fetchFromRapidAPI(term, 50);
      console.log(`   Found ${hits.length} fragrances for "${term}"`);

      for (const fragrance of hits) {
        const fragranceData = transformFragranceData(fragrance);
        const inserted = await insertFragrance(fragranceData);

        if (inserted) {
          totalInserted++;
        } else {
          totalDuplicates++;
        }
      }

      console.log(`   ✅ "${term}" complete. Total inserted: ${totalInserted}, Duplicates: ${totalDuplicates}`);

      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 300));

    } catch (error) {
      console.error(`❌ Error searching "${term}":`, error.message);
    }
  }

  // Phase 3: Try to get more by fetching without specific queries (empty search)
  console.log('\n📦 Phase 3: Fetching general fragrance catalog...');
  try {
    console.log('🔍 Fetching general fragrance catalog...');

    // Try multiple pages
    for (let offset = 0; offset < 1000; offset += 50) {
      const hits = await fetchFromRapidAPI("", 50, offset);

      if (hits.length === 0) break; // No more results

      console.log(`   Page ${offset/50 + 1}: Found ${hits.length} fragrances`);

      for (const fragrance of hits) {
        const fragranceData = transformFragranceData(fragrance);
        const inserted = await insertFragrance(fragranceData);

        if (inserted) {
          totalInserted++;
        } else {
          totalDuplicates++;
        }
      }

      console.log(`   ✅ Page ${offset/50 + 1} complete. Total inserted: ${totalInserted}, Duplicates: ${totalDuplicates}`);

      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 200));
    }

  } catch (error) {
    console.error('❌ Error fetching general catalog:', error.message);
  }

  // Final summary
  console.log('\n🎉 Population complete!');
  console.log(`📊 Total fragrances inserted: ${totalInserted}`);
  console.log(`🔄 Total duplicates skipped: ${totalDuplicates}`);
  console.log(`💾 Total fragrances in database: ${totalInserted + totalDuplicates}`);

  // Verify the data
  try {
    const supabaseClient = getSupabaseClient();
    const { data, error } = await supabaseClient
      .from('fragrances')
      .select('count', { count: 'exact', head: true });

    if (!error) {
      console.log(`✅ Database verification: ${data} fragrances stored`);
    }
  } catch (error) {
    console.error('❌ Could not verify database count:', error.message || error);
  }
}

// Export for use in other files
module.exports = { populateAllFragrances };

// Run if called directly
if (require.main === module) {
  // Check if Supabase credentials are set
  if (supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseKey === 'YOUR_SUPABASE_ANON_KEY') {
    console.error('❌ Please set SUPABASE_URL and SUPABASE_KEY in your environment before running.');
    process.exit(1);
  }
  if (RAPIDAPI_KEY === 'YOUR_RAPIDAPI_KEY') {
    console.error('❌ Please set RAPIDAPI_KEY in your environment before running.');
    process.exit(1);
  }

  populateAllFragrances()
    .then(() => {
      console.log('\n✅ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}