const FRAGELLA_KEY = `18e6a531cc3601a30464ce80825887be2b5d16c79690553b4d0520ee7952b6f2`;
const BASE = "https://api.fragella.com/api/v1";

export default async function handler(req, res) {
  const { search, brand, limit = 20, page = 1 } = req.query;

  let url = "";

  if (brand) {
    // GET /brands/{brandName}
    url = `${BASE}/brands/${encodeURIComponent(brand)}?limit=${limit}`;
  } else if (search) {
    // GET /fragrances?search=...
    url = `${BASE}/fragrances?search=${encodeURIComponent(search)}&limit=${limit}`;
  } else {
    return res.status(400).json({ error: "Provide search or brand param" });
  }

  try {
    const response = await fetch(url, {
      headers: {
        "x-api-key": FRAGELLA_KEY,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}