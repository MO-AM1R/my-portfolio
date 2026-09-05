const { loadPortfolioData } = require('../server/portfolio-data');

module.exports = async function portfolioHandler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method !== 'GET') {
    return res.status(405).json({
      ok: false,
      error: 'Method not allowed.'
    });
  }

  try {
    const data = await loadPortfolioData();
    return res.status(200).json({ ok: true, data });
  } catch (error) {
    console.error('Portfolio data load failed:', error);
    return res.status(500).json({
      ok: false,
      error: error?.message || 'Could not load portfolio data.'
    });
  }
};
