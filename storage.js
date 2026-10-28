// Durable storage for the whole database, kept as one JSON document.
//
// - Upstash Redis (KV_REST_API_URL + KV_REST_API_TOKEN, added automatically when you connect
//   Upstash under Vercel → Storage): every serverless instance shares the same data, and it
//   survives restarts and redeploys. This is what the live site needs.
// - Otherwise a local file (data/db.json). Fine on your own computer, but on Vercel the file
//   lives in a temp folder that is wiped whenever the server goes to sleep.
//
// Writes are compare-and-set on a version number, so two bookings saved at the same moment
// can't overwrite each other: the second write is rejected and server.js re-runs it on fresh data.

const fs = require('fs');
const path = require('path');

// Returns { version, raw } where raw is the JSON text (null when nothing has been saved yet).
// version is the token write() needs, so a write only succeeds if nobody saved in between.
function redisStore(url, token, prefix) {
  const KEYS = [`${prefix}:db`, `${prefix}:ver`];
  // Only send the document back when it changed since the copy this instance already has.
  const READ = `local v = redis.call('GET', KEYS[2]) or '0'
if v == ARGV[1] then return {v} end
return {v, redis.call('GET', KEYS[1]) or ''}`;
  const WRITE = `if (redis.call('GET', KEYS[2]) or '0') ~= ARGV[1] then return 0 end
redis.call('SET', KEYS[1], ARGV[2])
return redis.call('INCR', KEYS[2])`;
  let cache = null;

  async function call(...command) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(command),
      signal: AbortSignal.timeout(8000),
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok || out.error) throw new Error(`Upstash request failed: ${out.error || res.status}`);
    return out.result;
  }

  return {
    name: 'Upstash Redis',
    durable: true,
    async read() {
      const [version, raw] = await call('EVAL', READ, '2', ...KEYS, cache ? cache.version : '');
      if (raw !== undefined) cache = { version, raw: raw || null };
      return cache;
    },
    async write(raw, version) {
      const next = await call('EVAL', WRITE, '2', ...KEYS, version, raw);
      if (!next) return false;
      cache = { version: String(next), raw };
      return true;
    },
  };
}

function fileStore(file, durable) {
  let cache = null;
  return {
    name: durable ? 'local file' : 'temporary file',
    durable,
    async read() {
      if (!cache) cache = { version: '0', raw: fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null };
      return cache;
    },
    async write(raw, version) {
      if (cache && version !== cache.version) return false;
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file + '.tmp', raw);
      fs.renameSync(file + '.tmp', file);
      cache = { version: String(Number(version) + 1), raw };
      return true;
    },
  };
}

function createStorage({ dataFile, temporary }) {
  const env = process.env;
  const url = env.KV_REST_API_URL || env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN || env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) return redisStore(url.replace(/\/+$/, ''), token, env.DB_KEY_PREFIX || 'nearbook');
  return fileStore(dataFile, !temporary);
}

module.exports = { createStorage };
