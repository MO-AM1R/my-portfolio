const COLLECTIONS = [
  ['experiences', 'experiences'],
  ['education', 'education'],
  ['projects', 'projects'],
  ['skills', 'skills'],
  ['certifications', 'certifications'],
  ['socials', 'social_links'],
  ['recommendations', 'recommendations'],
  ['languages', 'languages']
];

function getSupabaseConfig() {
  const url = String(
    process.env.SUPABASE_URL ||
      process.env.VITE_SUPABASE_URL ||
      ''
  )
    .trim()
    .replace(/\/+$/, '');

  const key = String(
    process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      ''
  ).trim();

  if (!url || !key) {
    throw new Error(
      'Supabase is not configured. Add SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY to your deployment environment.'
    );
  }

  return { url, key };
}

async function queryTable({ url, key }, table, query = '') {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 9000);

  try {
    const headers = {
      apikey: key,
      Accept: 'application/json'
    };

    // Legacy anon keys are JWTs. New sb_publishable_* keys should only use apikey.
    if (key.startsWith('eyJ')) {
      headers.Authorization = `Bearer ${key}`;
    }

    const response = await fetch(
      `${url}/rest/v1/${table}?select=*${query ? `&${query}` : ''}`,
      { headers, signal: controller.signal }
    );

    const body = await response.json().catch(() => null);

    if (!response.ok) {
      const message =
        body?.message ||
        body?.details ||
        body?.hint ||
        `Supabase request failed for ${table} (${response.status}).`;
      throw new Error(message);
    }

    return Array.isArray(body) ? body : [];
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`Supabase request timed out while loading ${table}.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function loadPortfolioData() {
  const config = getSupabaseConfig();

  const [profileRows, settingsRows, ...collectionRows] = await Promise.all([
    queryTable(config, 'site_profile', 'id=eq.1&limit=1'),
    queryTable(config, 'site_settings', 'id=eq.1&limit=1'),
    ...COLLECTIONS.map(([, table]) =>
      queryTable(config, table, 'order=display_order.asc')
    )
  ]);

  const data = {
    profile: profileRows[0] || null,
    settings: settingsRows[0] || null
  };

  COLLECTIONS.forEach(([key], index) => {
    data[key] = collectionRows[index] || [];
  });

  return data;
}

module.exports = {
  getSupabaseConfig,
  loadPortfolioData
};
