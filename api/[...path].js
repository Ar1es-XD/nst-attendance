export default async function handler(req, res) {
  // CORS Preflight headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Parse path and query parameters
  const { path } = req.query;
  const pathStr = Array.isArray(path) ? path.join('/') : (path || '');
  
  // Reconstruct query parameters
  const urlObj = new URL(req.url, 'http://localhost');
  urlObj.searchParams.delete('path');
  const qs = urlObj.searchParams.toString();
  const targetUrl = `https://my.newtonschool.co/api/${pathStr}${qs ? '?' + qs : ''}`;

  const headers = {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
  };

  if (req.headers.authorization) {
    headers['Authorization'] = req.headers.authorization;
  }

  try {
    const upstreamRes = await fetch(targetUrl, {
      method: req.method,
      headers: headers
    });

    const data = await upstreamRes.text();
    res.status(upstreamRes.status);
    res.setHeader('Content-Type', upstreamRes.headers.get('Content-Type') || 'application/json');
    res.send(data);
  } catch (err) {
    res.status(500).json({ error: `Vercel proxy failed to reach LMS: ${err.message}` });
  }
}
