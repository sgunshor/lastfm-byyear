const API_KEY = 'f6a247234060014c604f9e1f8b85ff83';

function get_api_url(params) {
  let url = 'http://ws.audioscrobbler.com/2.0/?';
  for (const [k, v] of Object.entries(params)) url += `${encodeURIComponent(k)}=${encodeURIComponent(v)}&`;
  return url.slice(0, -1);
}

async function get_friends(username, limit = 200) {
  const url = get_api_url({ method: 'user.getfriends', user: username, api_key: API_KEY, format: 'json', limit });
  const r = await fetch(url);
  return r.json();
}

async function artistGetInfo(artist, username) {
  const url = get_api_url({ method: 'artist.getinfo', artist, username, api_key: API_KEY, format: 'json', autocorrect: 1 });
  const r = await fetch(url);
  return r.json();
}

function lastfmArtistUrl(artist) {
  return `https://www.last.fm/music/${artist.replaceAll(' ', '+')}/+listeners/you-know`;
}

function rymArtistUrl(artist) {
  return `https://rateyourmusic.com/artist/${artist.replaceAll(' ', '-')}`;
}

document.getElementById('lookup').addEventListener('click', async () => {
  const artist = document.getElementById('artist-input').value.trim();
  const username = document.getElementById('username-top').value.trim() || 'lokiimp';
  const results = document.getElementById('results');
  const progress = document.getElementById('progress');
  const progressText = document.getElementById('progress-text');
  results.innerHTML = '';
  if (!artist) return alert('please enter an artist name');

  try {
    // fetch friends
    progress.value = 0; progressText.textContent = 'fetching friends...';
    const fr = await get_friends(username, 500);
    const friends = (fr && fr.friends && fr.friends.user) || [];
  const friendNames = friends.map(f => f.name).filter(n => n && n.toLowerCase() !== username.toLowerCase());
  // include the user's own username in the list so we fetch their playcount as well
  const userAlreadyIncluded = friendNames.some(n => n.toLowerCase() === username.toLowerCase());
  if (!userAlreadyIncluded) friendNames.unshift(username);
    

    if (friendNames.length === 0) {
      progressText.textContent = 'no friends found';
    }

    // show header with artist links
    const header = document.createElement('div');
    header.innerHTML = `<h2 style="text-transform:lowercase">${artist}</h2>
      <div><a href="${lastfmArtistUrl(artist)}" target="_blank" rel="noopener">last.fm</a> · <a href="${rymArtistUrl(artist)}" target="_blank" rel="noopener">rateyourmusic</a></div>`;
    results.appendChild(header);

  const ol = document.createElement('ol');
  ol.className = 'friend-list';
  results.appendChild(ol);

  const scored = []; // will hold {friend, playcount}

    let processed = 0;
    for (const friend of friendNames) {
      try {
        const info = await artistGetInfo(artist, friend);
        let playcount = null;
        if (info && info.artist && info.artist.stats && info.artist.stats.userplaycount) {
          playcount = parseInt(info.artist.stats.userplaycount, 10) || 0;
        }
        if (playcount && playcount > 0) {
          // insert into scored array and keep it sorted
          scored.push({ friend, playcount });
          scored.sort((a,b) => b.playcount - a.playcount);

          // re-render list
          ol.innerHTML = '';
          for (const s of scored) {
            const li = document.createElement('li');
            const userLib = `https://www.last.fm/user/${encodeURIComponent(s.friend)}/library/music/${artist.replaceAll(' ', '+')}`;
            li.innerHTML = `${s.friend}: <strong>${s.playcount}</strong> plays — <a href="${userLib}" target="_blank" rel="noopener">streams</a>`;
            ol.appendChild(li);
          }
        }
      } catch (e) {
        console.warn('artist info failed for', friend, e);
      }
      processed += 1;
      progress.value = Math.round((processed / friendNames.length) * 100);
      progressText.textContent = `checked ${processed}/${friendNames.length} friends`;
      await new Promise(r => setTimeout(r, 250));
    }

    if (scored.length === 0) {
      const p = document.createElement('p'); p.textContent = 'no friends with scrobbles for this artist'; results.appendChild(p);
    }

  } catch (err) {
    console.error(err);
    alert('error: ' + (err.message || err));
  }
});
