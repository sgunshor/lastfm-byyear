// Appwrite Function: musicbrainz-mbid-cache
// Expects JSON payload on stdin: { "mbid": "..." }
// Environment variables required:
// - APPWRITE_FUNCTION_ENDPOINT
// - APPWRITE_FUNCTION_PROJECT_ID
// - APPWRITE_FUNCTION_API_KEY  (project API key with DB write permissions)
// - MB_DB_ID
// - MB_COLLECTION_ID

const Appwrite = require('node-appwrite');

function readStdin() {
  return new Promise((resolve) => {
    let s = '';
    process.stdin.on('data', chunk => s += chunk);
    process.stdin.on('end', () => resolve(s));
  });
}

async function fetchMusicBrainzDate(mbid) {
  const headers = { 'User-Agent': 'lokiimp/lastfm-byyear (https://lokiimp.me)' };
  const rgUrl = `https://musicbrainz.org/ws/2/release-group/${mbid}?fmt=json&inc=releases`;
  const rUrl = `https://musicbrainz.org/ws/2/release/${mbid}?fmt=json`;
  try {
    let res = await fetch(rgUrl, { headers });
    if (res.ok) {
      const data = await res.json();
      if (data['first-release-date']) return data['first-release-date'];
      if (Array.isArray(data.releases) && data.releases.length) {
        const dates = data.releases.map(r => r.date).filter(Boolean).sort();
        if (dates.length) return dates[0];
      }
    }
    res = await fetch(rUrl, { headers });
    if (res.ok) {
      const data = await res.json();
      if (data.date) return data.date;
    }
  } catch (err) {
    console.error('MB fetch error', err && err.message ? err.message : err);
  }
  return null;
}

(async function main(){
  try {
    const raw = await readStdin();
    const payload = raw ? JSON.parse(raw) : {};
    const mbid = payload.mbid;
    if (!mbid) {
      console.error('mbid missing in payload');
      process.exit(1);
    }

    const endpoint = process.env.APPWRITE_FUNCTION_ENDPOINT;
    const project = process.env.APPWRITE_FUNCTION_PROJECT_ID;
    const apiKey = process.env.APPWRITE_FUNCTION_API_KEY;
    const dbId = process.env.MB_DB_ID;
    const colId = process.env.MB_COLLECTION_ID;

    if (!endpoint || !project || !apiKey || !dbId || !colId) {
      console.error('Required environment variables missing. Ensure APPWRITE_FUNCTION_API_KEY, MB_DB_ID and MB_COLLECTION_ID are set.');
      process.exit(1);
    }

    const client = new Appwrite.Client()
      .setEndpoint(endpoint)
      .setProject(project)
      .setKey(apiKey);

    const databases = new Appwrite.Databases(client);

    // Try to get document by id (mbid) -- fast path
    try {
      const existing = await databases.getDocument(dbId, colId, mbid);
      console.log('Document already exists, returning cached value', existing);
      console.log(JSON.stringify({ mbid, release_date: existing.release_date, cached: true }));
      process.exit(0);
    } catch (e) {
      // not found -> continue
      console.log('No existing document for', mbid);
    }

    // Fetch from MusicBrainz server-side
    const release_date = await fetchMusicBrainzDate(mbid);
    console.log('Fetched release_date:', release_date);

    const doc = {
      mbid,
      release_date: release_date || null,
      fetched_at: new Date().toISOString()
    };

    try {
      // Create document with document id = mbid for fast lookups
      await databases.createDocument(dbId, colId, mbid, doc);
      console.log('Created document with id', mbid);
      console.log(JSON.stringify({ mbid, release_date, cached: false }));
      process.exit(0);
    } catch (e) {
      console.error('Failed to create document:', e && e.message ? e.message : e);
      process.exit(1);
    }

  } catch (err) {
    console.error('Function top-level error', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
