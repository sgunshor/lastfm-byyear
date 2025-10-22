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
    const username = document.getElementById('username').value;
    const limit = 10; // You can change this value as needed
    get_top_albums(username, limit)
        .then(convert_top_albums_response)
        .then(sort_by_year)
        .then(display_albums)
        .catch(err => console.error(err));
});