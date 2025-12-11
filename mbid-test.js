import { client, databases, functions } from './lib/appwrite.js';

const MBID_INPUT = document.getElementById('mbid');
const RUN_BTN = document.getElementById('run');
const CLEAR_BTN = document.getElementById('clear');
const LOG = document.getElementById('log');

const DB_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION = import.meta.env.VITE_APPWRITE_MBID_COLLECTION;
const FUNCTION_ID = import.meta.env.VITE_APPWRITE_FUNCTION_ID;
const ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT;
const PROJECT = import.meta.env.VITE_APPWRITE_PROJECT_ID;

function append(msg){
  const time = new Date().toLocaleTimeString();
  LOG.textContent = `[${time}] ${msg}\n` + LOG.textContent;
  console.debug('[mbid-test]', msg);
}

CLEAR_BTN.addEventListener('click', () => { LOG.textContent = 'No logs yet.'; });

RUN_BTN.addEventListener('click', async () => {
  const mbid = MBID_INPUT.value.trim();
  if (!mbid) return append('No MBID provided');
  append(`Starting test for MBID=${mbid}`);

  append(`Env values: DB_ID=${DB_ID}, COLLECTION=${COLLECTION}, FUNCTION_ID=${FUNCTION_ID}, ENDPOINT=${ENDPOINT}, PROJECT=${PROJECT}`);

  // 1) Try SDK functions.createExecution if available
  if (functions && typeof functions.createExecution === 'function' && FUNCTION_ID) {
    append('Calling Appwrite Function via SDK (functions.createExecution)');
    try {
      const exec = await functions.createExecution(FUNCTION_ID, JSON.stringify({ mbid }));
      append('SDK createExecution returned: ' + JSON.stringify(exec));
    } catch (e) {
      append('SDK createExecution failed: ' + (e && e.message ? e.message : e));
    }
  } else {
    append('SDK functions.createExecution not available or FUNCTION_ID missing; skipping SDK call');
  }

  // 2) Direct REST POST to function endpoint (fallback) so we can see raw HTTP response
  if (ENDPOINT && FUNCTION_ID && PROJECT) {
    const url = ENDPOINT.replace(/\/v1\/?$/, '') + `/v1/functions/${FUNCTION_ID}/executions`;
    append('Attempting direct REST POST to ' + url);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Appwrite-Project': PROJECT
        },
        body: JSON.stringify({ mbid })
      });
      append(`Direct POST HTTP ${res.status} ${res.statusText}`);
      const text = await res.text();
      try { append('Direct POST response JSON: ' + JSON.stringify(JSON.parse(text))); }
      catch(_) { append('Direct POST response text: ' + text); }
    } catch (err) {
      append('Direct POST failed: ' + (err && err.message ? err.message : err));
    }
  } else {
    append('Endpoint/Function/Project missing; cannot do REST POST fallback');
  }

  // 3) Poll for created document in DB (document id == mbid)
  if (!DB_ID || !COLLECTION) {
    append('DB_ID or COLLECTION missing; cannot poll for document');
    return;
  }

  append('Polling for cached document in DB (document id = MBID)');
  const start = Date.now();
  const timeout = 20000; // 20s
  while (Date.now() - start < timeout) {
    try {
      const doc = await databases.getDocument(DB_ID, COLLECTION, mbid);
      append('Found document in DB: ' + JSON.stringify(doc));
      append('Test complete — function wrote to DB');
      return;
    } catch (e) {
      append('Document not found yet (or error): ' + (e && e.message ? e.message : e));
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  append('Timed out waiting for document in DB after 20s. Check Function Executions and logs in Appwrite Console.');
});
