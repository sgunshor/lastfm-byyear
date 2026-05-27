import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

const url = 'https://en.wikipedia.org/wiki/Grammy_Award_for_Song_of_the_Year';

async function scrapeData() {
    try {
        // 1. Polite User-Agent bypasses the 403 Forbidden error
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'LastfmBracketProject/1.0 (contact@lokiimp.me)' 
            }
        });
        
        const $ = cheerio.load(data);
        const entries = [];
        let currentYear = null;

        // 2. Loop through every row in the specific wikitable
        $('table.wikitable tbody tr').each((i, row) => {
            const style = $(row).attr('style') || '';
            const isWinner = style.includes('#FAEB86') || style.includes('#faeb86');

            let cells = $(row).find('td, th');
            if (cells.length === 0) return;

            // Extract year if it's the first cell
            const cell0Text = $(cells[0]).text().replace(/\[.*?\]/g, '').trim();
            if (/^\d{4}$/.test(cell0Text.substring(0, 4))) {
                currentYear = parseInt(cell0Text.substring(0, 4));
                
                // If this is a row that only contains the year (e.g. newer Wikipedia formatting)
                if (cells.length === 1 || (cells.length === 2 && !cell0Text)) return;
                
                // Otherwise (older formatting), the first cell was the year, the rest is the song data
                cells = cells.slice(1);
            }

            // Now cells[0] should be Song, cells[1] Songwriters, cells[2] Artists
            if (currentYear && cells.length >= 3) {
                let songText = $(cells[0]).text().replace(/\[.*?\]/g, '').replace(/"/g, '').trim();
                songText = songText.split('\n')[0]; // strip extra lines/notes
                
                let artistText = $(cells[2]).text().replace(/\[.*?\]/g, '').trim();
                artistText = artistText.split('\n')[0];

                if (songText && artistText && songText !== 'Song') {
                    entries.push({
                        id: entries.length + 1,
                        year: currentYear,
                        title: songText,
                        artist: artistText,
                        isWinner: isWinner,
                        scrobbles: 0,
                        globalListeners: 0,
                        spotifyId: "",
                        youtubeId: ""
                    });
                }
            }
        });

        // 4. Sort chronologically
        const allEntries = entries.sort((a, b) => b.year - a.year);
        
        console.log(`Successfully scraped ${allEntries.length} songs (winners and nominees)!`);

        const fileContent = `export const grammyWinners = ${JSON.stringify(allEntries, null, 4)};`;
        fs.writeFileSync('grammyData.js', fileContent);
        
    } catch (error) {
        console.error('Error scraping:', error.message);
    }
}

scrapeData();