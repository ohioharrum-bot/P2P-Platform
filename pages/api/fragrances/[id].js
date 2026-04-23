const FRAGELLA_KEY = "18e69acc53mshcd67e2c0a3c3a2dp1ded58jsn79bb5683121c";
const BASE_URL = "https://api.fragella.com/api/v1";

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Missing fragrance id" });
  }

  try {
    const detailResponse = await fetch(`${BASE_URL}/fragrances/${encodeURIComponent(id)}`, {
      headers: {
        "x-api-key": FRAGELLA_KEY,
      },
    });

    if (detailResponse.ok) {
      const data = await detailResponse.json();
      return res.status(200).json(data);
    }

    const searchResponse = await fetch(
      `${BASE_URL}/fragrances?search=${encodeURIComponent(id)}&limit=1`,
      {
        headers: {
          "x-api-key": FRAGELLA_KEY,
        },
      }
    );

    if (!searchResponse.ok) {
      const text = await searchResponse.text();
      return res.status(searchResponse.status).json({ error: text });
    }

    const searchData = await searchResponse.json();
    const results = Array.isArray(searchData)
      ? searchData
      : Array.isArray(searchData.data)
      ? searchData.data
      : Array.isArray(searchData.fragrances)
      ? searchData.fragrances
      : [];

    if (results.length === 0) {
      return res.status(404).json({ error: "Fragrance not found" });
    }

    return res.status(200).json(results[0]);
  } catch (error) {
    console.error("Error fetching fragrance detail:", error);
    return res.status(500).json({ error: error.message });
  }
}
