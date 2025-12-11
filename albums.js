import { client, databases, functions } from './lib/appwrite.js';

// Constants: update these via .env
const APPWRITE_DB_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const APPWRITE_COLLECTION = import.meta.env.VITE_APPWRITE_MBID_COLLECTION;
const APPWRITE_FUNCTION_ID = import.meta.env.VITE_APPWRITE_FUNCTION_ID;

if (!APPWRITE_DB_ID || !APPWRITE_COLLECTION) {
  console.warn('Warning: APPWRITE_DB_ID or APPWRITE_COLLECTION not set in env. Some features will fail.');
}

// Debug startup info (will appear in devtools console)
try {
  console.debug('albums.js env:', {
    APPWRITE_DB_ID,
    APPWRITE_COLLECTION,
    APPWRITE_FUNCTION_ID,
    endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT,
    project: import.meta.env.VITE_APPWRITE_PROJECT_ID
  });
  console.debug('Appwrite functions object available?', !!functions, functions);
} catch (e) {
  console.debug('Cannot access import.meta.env from this context', e);
}

// Helper: fast lookup using documentId === mbid
async function getCachedMbid(mbid) {
  try {
    // Try to getDocument using mbid as document id (recommended setup)
    const doc = await databases.getDocument(APPWRITE_DB_ID, APPWRITE_COLLECTION, mbid);
    return doc;
  } catch (e) {
    // Not found or other error -> log for visibility and return null
    console.debug('getCachedMbid: no cached doc or error for', mbid, e && e.message ? e.message : e);
    return null;
  }
}

// Trigger the Appwrite Function which will create the cached document (server-side write)
async function triggerMbidFunctionAndWait(mbid, timeoutMs = 8000) {
  if (!APPWRITE_FUNCTION_ID) {
    console.warn('No APPWRITE_FUNCTION_ID configured; cannot populate cache server-side.');
    return null;
  }

  try {
    if (!functions || typeof functions.createExecution !== 'function') {
      console.warn('Appwrite Functions SDK not available on client; cannot execute function. functions=', functions);
      return null;
    }

    // Create execution (fire-and-forget). Log the full response and network guidance.
    try {
      const exec = await functions.createExecution(APPWRITE_FUNCTION_ID, JSON.stringify({ mbid }));
      console.debug('triggerMbidFunctionAndWait: execution started', exec);
    } catch (execErr) {
      console.warn('functions.createExecution threw', execErr && execErr.message ? execErr.message : execErr);
      console.warn('If no network request to /v1/functions/.../executions appears in DevTools, check that your Appwrite endpoint and project ID are correct and that Vite was restarted after .env changes.');
    }

    // Poll for the document to appear. Poll interval 700ms.
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const doc = await getCachedMbid(mbid);
      if (doc) return doc;
      await new Promise(r => setTimeout(r, 700));
    }
    // if still not found, return null
    console.warn('triggerMbidFunctionAndWait: timed out waiting for cached document for', mbid);
    return null;
  } catch (e) {
    console.warn('triggerMbidFunctionAndWait error', e && e.message ? e.message : e);
    return null;
  }
}

// MusicBrainz lookup by MBID (release-group or release)
async function fetchMusicBrainzReleaseDate(mbid) {
  // prefer release-group lookup, but release endpoints vary; try release-group then release
  const rgUrl = `https://musicbrainz.org/ws/2/release-group/${mbid}?fmt=json&inc=releases`;
  const rUrl = `https://musicbrainz.org/ws/2/release/${mbid}?fmt=json`;
  try {
    let res = await fetch(rgUrl, { headers: { 'User-Agent': 'lokiimp/lastfm-byyear ( https://lokiimp.me )' } });
    if (res.ok) {
      const data = await res.json();
      // if releases included, take earliest
      if (data.releases && data.releases.length) {
        const dates = data.releases.map(r => r.date).filter(Boolean).sort();
        if (dates.length) return dates[0];
      }
      // release-group primary type sometimes has 'first-release-date'
      if (data['first-release-date']) return data['first-release-date'];
    }
    // fallback to /release
    res = await fetch(rUrl, { headers: { 'User-Agent': 'lokiimp/lastfm-byyear ( https://lokiimp.me )' } });
    if (res.ok) {
      const data = await res.json();
      if (data.date) return data.date;
    }
  } catch (e) {
    console.warn('MusicBrainz fetch error', e);
  }
  return null;
}

// Throttle helper: run function for each item with delay between calls
async function mapWithDelay(items, fn, delayMs = 1000) {
  const results = [];
  for (const item of items) {
    results.push(await fn(item));
    await new Promise(r => setTimeout(r, delayMs));
  }
  return results;
}

// UI wiring
const fetchBtn = document.getElementById('fetch');
const usernameEl = document.getElementById('lf-username');
const limitEl = document.getElementById('limit');
const progressEl = document.getElementById('progress');
const statusEl = document.getElementById('status');
const tbody = document.getElementById('albums-body');

function setStatus(t) { statusEl.textContent = t; }

fetchBtn.addEventListener('click', async () => {
  const username = usernameEl.value.trim();
  if (!username) return alert('Enter a Last.fm username');
  const limit = parseInt(limitEl.value, 10) || 250;
  tbody.innerHTML = '';
  setStatus('Fetching top albums from Last.fm...');

  try {
    const resp = await get_top_albums(username, limit);
    const albums = convert_top_albums_response(resp);
    // render rows with placeholder dates
    albums.forEach((a, idx) => {
      const tr = document.createElement('tr');
      tr.id = `album-${idx}`;
      tr.innerHTML = `<td>${idx+1}</td><td>${a.name}</td><td>${a.mbid || '(none)'}</td><td class="date">${a.releasedate || '—'}</td><td>${a.playcount}</td>`;
      tbody.appendChild(tr);
    });

    // gather unique MBIDs to look up
    const lookupList = albums
      .map((a, i) => ({ mbid: a.mbid, idx: i }))
      .filter(x => x.mbid && x.mbid.trim());

    setStatus(`Checking cache for ${lookupList.length} MBIDs`);

    let processed = 0;
    for (const item of lookupList) {
      const { mbid, idx } = item;
      // fast local cache read (doc id == mbid)
      const cached = await getCachedMbid(mbid);
      if (cached && cached.release_date) {
        const el = document.querySelector(`#album-${idx} .date`);
        if (el) el.textContent = cached.release_date;
      } else {
        setStatus(`Requesting server-side cache for ${mbid} (${processed+1}/${lookupList.length})`);
        const doc = await triggerMbidFunctionAndWait(mbid, 10000);
        const el = document.querySelector(`#album-${idx} .date`);
        if (doc && doc.release_date) {
          if (el) el.textContent = doc.release_date;
        } else {
          // If server didn't populate quickly, fall back to direct MusicBrainz (last-resort) but still wait 1s to be polite
          setStatus(`Falling back to direct MusicBrainz for ${mbid}`);
          const date = await fetchMusicBrainzReleaseDate(mbid);
          if (el) el.textContent = date || 'unknown';
          await new Promise(r => setTimeout(r, 1000));
        }
      }
      processed += 1;
      progressEl.value = Math.round((processed / lookupList.length) * 100);
    }

    setStatus('Done');
  } catch (e) {
    console.error(e);
    setStatus('Error: ' + (e.message || String(e)));
  }
});
