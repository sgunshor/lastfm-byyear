api_key = 'f6a247234060014c604f9e1f8b85ff83';

function get_api_url(params) {
    let url = 'http://ws.audioscrobbler.com/2.0/?';
    for (const [key, value] of Object.entries(params)) {
        url += `${key}=${value}&`;
    }
    url = url.slice(0, -1);
    return url;
}

function get_top(username, limit, method) {
    const url = get_api_url({
        method: method,
        user: username, 
        api_key: api_key,
        format: 'json',
        limit: limit
    });
    return fetch(url).then(res => res.json());
}

function get_friends(username, limit = 100) {
    const url = get_api_url({ method: 'user.getfriends', user: username, api_key: api_key, format: 'json', limit });
    return fetch(url).then(res => res.json());
}

function get_top_artists(username, limit = 50) {
    const url = get_api_url({ method: 'user.gettopartists', user: username, api_key: api_key, format: 'json', limit });
    return fetch(url).then(res => res.json());
}

function get_info(artist, album) {
    const url = get_api_url({
        method: 'album.getinfo',
        artist: artist.replaceAll(' ', '+'),
        album: album.replaceAll(' ', '+'),
        api_key: api_key,
        format: 'json'
    });
    console.log(url);
    return fetch(url).then(res => res.json());
}

function get_top_albums(username, limit) {
    return get_top(username, limit, 'user.gettopalbums');
}

function convert_top_albums_response(response) {
    if (typeof response.error != 'undefined') {
        throw response.message;
    }
    return response.topalbums.album.map(
        album => ({
            name: `${album.artist.name} - ${album.name}`,
            playcount: parseInt(album.playcount),
            rank: parseInt(album['@attr'].rank),
            year: null,
            releasedate: album.releasedate,
            mbid : album.mbid
        })
    );
}

function sort_by_year(albums) {
    for (const album of albums) {
        const info = get_info(album.name.split(' - ')[0], album.name.split(' - ')[1]);
        console.log(info);
        console.log(`Fetching info for ${album.name}`);
        console.log(album.releasedate)
        try {
            album.year = parseInt(album.releasedate);
        } catch (error) {
            console.error(`Error fetching year for ${album.name}: ${error}`);
        }
    }
    albums.sort((a, b) => a.year - b.year);
    return albums;
}

function display_albums(albums) {
    const container = document.getElementById('albums-container');
    container.innerHTML = '';
    for (const album of albums) {
        const div = document.createElement('div');
        div.innerHTML = `${album.name} - ${album.mbid} - ${album.year} - ${album.playcount} plays`;
        container.appendChild(div);
    }
}


document.getElementById('fetch-albums').addEventListener('click', () => {
    computeSharedArtists();
});

async function computeSharedArtists() {
    const username = document.getElementById('username').value.trim();
    if (!username) return alert('Please enter a username');

    const container = document.getElementById('albums-container');
    container.innerHTML = '';

    try {
        // determine how many artists to fetch from dropdown
        const selectEl = document.getElementById('artist-count-select');
        const userLimit = selectEl ? parseInt(selectEl.value, 10) : 25;

        // 1) Fetch user's top artists
        const userTopResp = await get_top_artists(username, userLimit);
        const userArtists = (userTopResp && userTopResp.topartists && userTopResp.topartists.artist) || [];
        const userArtistNames = userArtists.map(a => a.name);

        // 2) Fetch friends list (limit to 100 to be safe)
        const friendsResp = await get_friends(username, 100);
        const friends = (friendsResp && friendsResp.friends && friendsResp.friends.user) || [];
        // map friend names
        const friendNames = friends.map(f => f.name).filter(n => n && n.toLowerCase() !== username.toLowerCase());

        // 3) For each friend, fetch top 50 artists sequentially and record which friends have which artists
        const artistCounts = {}; // name -> number of friends who have this artist in top50
        const artistFriendMap = {}; // name -> Set of friend names
        const friendSharedMap = {}; // friend -> Set of shared artists with user

    const progressEl = document.getElementById('progress');
    const progressText = document.getElementById('progress-text');
    let processed = 0;

    for (const friend of friendNames) {
            try {
        const resp = await get_top_artists(friend, userLimit);
                const artists = (resp && resp.topartists && resp.topartists.artist) || [];
                const names = new Set(artists.map(a => a.name));
                for (const name of names) {
                    artistCounts[name] = (artistCounts[name] || 0) + 1;
                    if (!artistFriendMap[name]) artistFriendMap[name] = new Set();
                    artistFriendMap[name].add(friend);
                    // initialize friendSharedMap
                    if (!friendSharedMap[friend]) friendSharedMap[friend] = new Set();
                }
                // store intersection with user's artists for friendSharedMap
                for (const name of names) {
                    if (userArtistNames.includes(name)) friendSharedMap[friend].add(name);
                }
                // small delay to avoid hammering API
                await new Promise(r => setTimeout(r, 200));
                // update progress
                processed += 1;
                if (progressEl) {
                    const pct = Math.round((processed / friendNames.length) * 100);
                    progressEl.value = pct;
                }
                if (progressText) progressText.textContent = `Fetched ${processed}/${friendNames.length} friends`;
            } catch (e) {
                console.warn('Failed to fetch friend', friend, e);
            }
        }

        // 4) Categorize user's artists into buckets
        const unique = [];
        const sharedBuckets = {}; // count -> [artists]

        for (const name of userArtistNames) {
            const count = artistCounts[name] || 0;
            if (count === 0) unique.push(name);
            else {
                if (!sharedBuckets[count]) sharedBuckets[count] = [];
                sharedBuckets[count].push(name);
            }
        }

        // 5) Render results
        const h1 = document.createElement('h2');
        h1.textContent = `User: ${username}`;
        container.appendChild(h1);

        const udiv = document.createElement('div');
        udiv.innerHTML = `<h3>Unique artists (only you)</h3>`;
        if (unique.length === 0) udiv.appendChild(Object.assign(document.createElement('p'), { textContent: 'None' }));
        else {
            const ul = document.createElement('ul');
            for (const a of unique) { const li = document.createElement('li'); li.textContent = a; ul.appendChild(li); }
            udiv.appendChild(ul);
        }
        container.appendChild(udiv);

        const keys = Object.keys(sharedBuckets).map(k => parseInt(k, 10)).sort((a,b) => a-b);
        for (const k of keys) {
            const div = document.createElement('div');
            div.innerHTML = `<h3>Shared by ${k} friend(s)</h3>`;
            const ul = document.createElement('ul');
            for (const a of sharedBuckets[k]) {
                const friendsSet = artistFriendMap[a] || new Set();
                const friendsList = Array.from(friendsSet).join(', ');
                const li = document.createElement('li');
                li.textContent = `${a} (${friendsList})`;
                ul.appendChild(li);
            }
            div.appendChild(ul);
            container.appendChild(div);
        }

        // 6) Render friends sorted by number of shared artists (most to least)
        const friendListDiv = document.createElement('div');
        friendListDiv.innerHTML = `<h3>Friends sorted by number of artists in common</h3>`;
        const friendArray = Object.keys(friendSharedMap).map(fn => ({ name: fn, shared: Array.from(friendSharedMap[fn]) }));
        friendArray.sort((a,b) => b.shared.length - a.shared.length);
        const flUl = document.createElement('ol');
        for (const f of friendArray) {
            const li = document.createElement('li');
            const n = f.shared.length;
            if (n === 0) li.textContent = `${f.name}: 0 artists (no artists in common)`;
            else li.textContent = `${f.name}: ${n} artists (${f.shared.join(', ')})`;
            flUl.appendChild(li);
        }
        friendListDiv.appendChild(flUl);
        container.appendChild(friendListDiv);

    } catch (err) {
        console.error(err);
        alert('Error computing shared artists: ' + (err.message || err));
    }
}