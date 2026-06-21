import server from '../dist/server/server.js';
import { Readable } from 'node:stream';

export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const headers = new Headers();

  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(key, item);
      }
    } else {
      headers.set(key, value);
    }
  }

  const request = new Request(url.toString(), {
    method: req.method,
    headers,
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : req,
  });

  const response = await server.fetch(request);

  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'set-cookie') {
      const existing = res.getHeader('set-cookie');
      if (!existing) {
        res.setHeader('set-cookie', value);
      } else if (Array.isArray(existing)) {
        res.setHeader('set-cookie', [...existing, value]);
      } else {
        res.setHeader('set-cookie', [existing, value]);
      }
      return;
    }
    res.setHeader(key, value);
  });

  if (response.body) {
    const stream = Readable.fromWeb(response.body);
    stream.pipe(res);
  } else {
    res.end();
  }
}
