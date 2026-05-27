// bracketEngine.js
const LASTFM_API_KEY = 'f6a247234060014c604f9e1f8b85ff83'; // From your script

export async function generateSeededBracket(usernamesArray, songsData) {
    // 1. Fetch data for all 64 songs
    const scoredSongs = await Promise.all(songsData.map(async (song) => {
        let scrobbles = 0;
        let globalListeners = 0;

        for (const user of usernamesArray) {
            const url = `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&api_key=${LASTFM_API_KEY}&artist=${encodeURIComponent(song.artist)}&track=${encodeURIComponent(song.title)}&username=${user.trim()}&format=json`;
            const res = await fetch(url);
            const data = await res.json();

            if (data.track) {
                if (data.track.userplaycount) scrobbles += parseInt(data.track.userplaycount);
                if (data.track.listeners && globalListeners === 0) globalListeners = parseInt(data.track.listeners);
            }
        }

        return { ...song, scrobbles, globalListeners };
    }));

    // 2. Sort by scrobbles, fallback to global listeners
    scoredSongs.sort((a, b) => {
        if (a.scrobbles !== b.scrobbles) return b.scrobbles - a.scrobbles;
        return b.globalListeners - a.globalListeners;
    });

    // 3. Map into the 1v64, 32v33 bracket structure
    const matchups = [];
    for (let i = 0; i < bracketSeedingOrder.length; i += 2) {
        matchups.push({
            teamA: scoredSongs[bracketSeedingOrder[i] - 1],
            teamB: scoredSongs[bracketSeedingOrder[i + 1] - 1]
        });
    }

    return matchups; // Returns array of 32 initial round matchups
}