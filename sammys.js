let tiktokScriptInjected = false;
let twitterScriptInjected = false;

const loadedSections = {
  'best-shortform-video': false,
  'tweets': false,
  'longform-video': false
};

const categories = [
  {
    id: 'album-of-the-year',
    title: 'Album of the Year',
    subtitle: 'The best albums that came out',
    winner: 'Music — Playboi Carti',
    winnerBlurb: 'I’m pretty sure that I said at the end of 2024 that if Carti dropped this year it would be my most streamed album and my favorite of the year. Promises made promises kept. The album is genuinely phenomenal, a rage evolution in the exact direction it needed to go. The only low points on the album for me are features I don’t particularly care for, but there isn’t a track I dislike.',
    nominees: [
      { name: 'The Most Dear and the Future — ear', blurb: 'Glitch pop out of NY, fun and accessible. The way that they move sounds around is so interesting to me, really cool stuff from these guys.', image: 'images/album of the year 2025/the most dear and the future ear.webp', link: 'https://open.spotify.com/album/51h6ahBtJWl7emcB5yDSuU' },
      { name: 'VS the machine — Tommy Fleece', blurb: 'Electropop from Detroit, exciting and cool vocals. Loved listening to this one while driving, still sounds good in my cars destroyed speakers.', image: 'images/album of the year 2025/vs the machine tommy fleece.webp', link: 'https://open.spotify.com/album/2D8tc8bAf4FulFmsrYg9UM' },
      { name: 'Forever Howlong — Black Country, New Road', blurb: 'Art rock/chamber folk from Cambridge, incredible soundscapes and layering. I listened to BC,NR’s full discography every day at work over the summer, and ending on this was such a nice transition into the last part of my day.', image: 'images/album of the year 2025/forever howlong black country new road.webp', link: 'https://open.spotify.com/album/5FjaEW3Hi8vD2aoJNWln4t' },
      { name: 'Music — Playboi Carti', blurb: 'Rage from Atlanta, high energy and fresh. Impossible for me to listen to this without feeling better.', image: 'images/album of the year 2025/music playboi carti.webp', isWinner: true, link: 'https://open.spotify.com/album/0fSfkmx0tdPqFYkJuNX74a' },
      { name: 'This Better Be Something Great — Westside Cowboy', blurb: 'Indie rock from Manchester, catchy hooks and interesting instrumentation. Quick listen, but really replayable for me. Super cool band.', image: 'images/album of the year 2025/this better be something great westside cowboy.webp', link: 'https://open.spotify.com/album/4d94aErdLLwLZwbrTyStDT' },
      { name: 'Punch — Boxing Day', blurb: 'Indie rock from Madison, tight performances and fun choruses. I like the genres they play with on here a lot, all the guitar tones are super cool and the post-4th wave horn is such a fun inclusion.', image: 'images/album of the year 2025/punch boxing day.webp', link: 'https://open.spotify.com/album/2LQQJ3xsTbJNyQtGxELyty' },
      { name: 'Racing Mount Pleasant — Racing Mount Pleasant', blurb: 'Chamber pop from Michigan, lush sounds and layering. The way the vocals play with the instruments is so fun, and the recurring themes are nice too.', image: 'images/album of the year 2025/racing mount pleasant racing mount pleasant.webp', link: 'https://open.spotify.com/album/037axs2AfEPUD5LtjfFYSv' },
      { name: 'I Love My Computer — Ninajirachi', blurb: 'Electro house from NSW, incredible production and songwriting. Kept coming back to this once I Got it, really replayable album and the songwriting is so good.', image: 'images/album of the year 2025/i love my computer ninajirachi.webp', link: 'https://open.spotify.com/album/77CZUF57sYqgtznUe3OikQ' },
      { name: 'star — 2hollis', blurb: 'Hyperpop out of Chicago, fun beats and bouncy tracks. Cool to see hyperpop/ug artists branch out a little bit from the same recycled songs, I will always appreciate experimenting.', image: 'images/album of the year 2025/star 2hollis.webp', link: 'https://open.spotify.com/album/1HjSoAhxhq4RtappX15Xt7' },
      { name: 'Getting Killed — Geese', blurb: 'Art rock from Brooklyn, songwriting and lyricism highlighting incredible chemistry. Each track on this has something for me, I’m so impressed with this band and Cameron as a songwriter.', image: 'images/album of the year 2025/getting killed geese.webp', link: 'https://open.spotify.com/album/0eeXb23yMW6EaIgm63xxPC' }
    ]
  },
  {
    id: 'record-of-the-year',
    title: 'Record of the Year',
    subtitle: 'The best songs that came out',
    winner: 'Goodbye (Don’t tell me) — Black Country, New Road',
    winnerBlurb: 'Black Country, New Road was the most important band to me this year, and Georgia Ellery the most important current member. The final track on their 2025 album got to me right when I needed it, and is my favorite song that released this year. The layering of instruments is always impressive but Georgia’s vocals over top of them make this their best work post lineup change.',
    nominees: [
      { name: 'LONG/TIME — Supercritical', blurb: 'RIP to Madison scene legend Supercritical. This song is my favorite off their debut and only album, awesome guitar tone and riffs.', image: 'images/record of the year 2025/supercritical.png', link: 'https://open.spotify.com/track/3KhO0A6EdmYXBTergPNDND?si=34b4dc2685f145a7' },
      { name: 'Man I Need — Olivia Dean', blurb: 'Exciting new voice in pop music from London. I got addicted to saying things have a "sexy little groove" this year and this song is probably why.', image: 'images/record of the year 2025/olivia dean.png', link: 'https://open.spotify.com/track/1qbmS6ep2hbBRaEZFpn7BX?si=751052af106f4047' },
      { name: 'Goodbye (Don’t tell me) — Black Country, New Road', blurb: 'Beautiful track from the Cambridge band, the syncopation around Georgia’s voice gets me every time.', image: 'images/record of the year 2025/black country new road.webp', isWinner: true, link: 'https://open.spotify.com/track/1HLdk3NtbqeTMFcVWbv2G0?si=3404cafbf682453a' },
      { name: 'Impact — Nettspend x Xaviersobased', blurb: 'Two of the most exciting voices in mainstream underground hiphop, from Richmond and Manhattan. iykyk.', image: 'images/record of the year 2025/xaviersobased nettspend.jpg', link: 'https://open.spotify.com/track/2xTk9wtJ6mWf7YV6ppmdCK?si=38b1ecff6b2749b7' },
      { name: 'Monday — Quadeca', blurb: 'Catchiest song off the LA singer/songwriters new project, the strings are phenomenal and his voice sounds so good.', image: 'images/record of the year 2025/quadeca.jpg', link: 'https://open.spotify.com/track/3a9Qmzy2dqZsa8QAggkioN?si=9ddc8c62c21d4d82' },
      { name: 'The Subway — Chappell Roan', blurb: 'Heartbreaking track from one of the best voices in pop right now, hailing from Willard Missouri. I love incredibly personal storytelling and the dynamics in this song are fantastic.', image: 'images/record of the year 2025/chappell roan.jpg', link: 'https://open.spotify.com/track/2SsY5k7UWFqgye3PUMG3Oq?si=848e46c5e5fb4709' },
      { name: 'Braces — Fakemink', blurb: 'The production on this track sets it apart from the rest of the London rappers music, and he fits into his pocket so well. Can’t handle change they roaring.', image: 'images/record of the year 2025/fakemink-braces-Cover-Art.jpg', link: 'https://open.spotify.com/track/7sXm84Dk5WlETkdzIfdQCT?si=0fe824fec27b4945' },
      { name: 'Dancing With Your Eyes Closed — Jane Remover', blurb: 'Best song of the year by the Newark hyperpop artist, which is saying something. The way her voice interacts with the beat is special.', image: 'images/record of the year 2025/jane remover.webp', link: 'https://open.spotify.com/track/1QkeomwCeKgXOEWoMHzrXr?si=19031d6045624084' },
      { name: 'Nokia — Drake X PARTYNEXTDOOR', blurb: 'Toronto rappers released an ultimately forgettable project on Valentines, but this song is so infectious that it stuck with me all year.', image: 'images/record of the year 2025/drake.jpeg', link: 'https://open.spotify.com/track/2u9S9JJ6hTZS3Vf22HOZKg?si=52e6b8a60ea7436a' },
      { name: 'Here I Am — The Hellp', blurb: 'The new album from the LA electropop duo has a lot of catchy songs, but the flow in this one makes it my favorite. From LA to LA.', image: 'images/record of the year 2025/the hellp.jpg', link: 'https://open.spotify.com/track/41G5oiNumgRbt8fNZfncnN?si=dcbd9e6fd8c04af4' }
    ]
  },
  {
    id: 'artist-of-the-year',
    title: 'Artist of the Year',
    subtitle: 'The artists who had the best output',
    winner: 'Cameron Winter',
    winnerBlurb: 'Cameron Winter unanimous white boy of the year 2025. Despite my initial refusal to believe the hype I was won over by this silver spoon baby’s incredible ability to write a song. Both solo and with Geese his music played a big part in my year. Really exciting stuff and I’m very excited to see what his future holds.',
    nominees: [
      { name: 'Olivia Dean', blurb: 'The most exciting mainstream pop artist right now. The bossa nova influence is so cool.', image: 'images/artist of the year 2025/olivia dean.webp',cropTop: true, link: 'https://open.spotify.com/artist/00x1fYSGhdqScXBRpSj3DW' },
      { name: 'xaviersobased', blurb: 'Probably the most creative mainstream underground artist right now, NYC always has exciting rappers.', image: 'images/artist of the year 2025/xaviersobased.jpg',cropTop: true, link: 'https://open.spotify.com/artist/2oM7LMPFu882oC6jSwEqjd' },
      { name: 'Georgia Ellery', blurb: 'Her work on the BC,NR album is fantastic and I can’t wait to see what’s next.', image: 'images/artist of the year 2025/georgia ellery.jpg',cropTop: true, link: 'https://open.spotify.com/playlist/6ehxHnUpclMgNAT6io7Hjk' },
      { name: 'Cameron Winter', blurb: 'Electric live performer, can’t wait for what comes next.', image: 'images/artist of the year 2025/cameron winter.webp', isWinner: true, link: 'https://open.spotify.com/artist/0WCo84qtCKfbyIf1lqQWB4' },
      { name: 'Playboi Carti', blurb: 'AOTY and great features this year as well, I love the direction he’s heading.', image: 'images/artist of the year 2025/playboi carti.jpg', link: 'https://open.spotify.com/artist/699OTQXzgjhIYAHMy9RyPD' },
      { name: 'fakemink', blurb: 'His run of singles this year is so good, consistently putting out solid work.', image: 'images/artist of the year 2025/fakemink.webp', link: 'https://open.spotify.com/artist/0qc4BFxcwRFZfevTck4fOi' },
      { name: 'ok', blurb: 'One of the most unique producers I’ve heard, always cool to see what he’s working on.', image: 'images/artist of the year 2025/ok.jpg', link: 'https://open.spotify.com/playlist/2mxOnLMUHHg7yOuvTvdYVA' },
      { name: 'Jane Remover', blurb: 'Great album, singles, and really cool stuff from side project Venturing this year. Incredible output.', image: 'images/artist of the year 2025/jane remover.webp', link: 'https://open.spotify.com/artist/2rLGlNI6htigNxx172qxLu' },
      { name: '2hollis', blurb: 'Great album this year and singles that tided me over. Drop again pls.', image: 'images/artist of the year 2025/2hollis.webp', cropTop: true, link: 'https://open.spotify.com/artist/72NhFAGG5Pt91VbheJeEPG' },
      { name: 'underscores', blurb: 'Awesome direction on the singles and features this year, pushing boundaries in really cool ways.', image: 'images/artist of the year 2025/underscores.jpg', link: 'https://open.spotify.com/artist/7HfUJxeVTgrvhk0eWHFzV7' }
    ]
  },
  {
    id: 'best-concert',
    title: 'Concert',
    subtitle: 'The best concerts that I attended',
    winner: 'Playboi Carti',
    winnerBlurb: 'This was basically the equivalent of a religious experience for me. I love Carti and seeing him live was sort of life changing. I cried at two shows this year, this one and the Riotnine reunion that I had to leave off the list because I missed like 70% of the show. Absolutely incredible experience.',
    nominees: [
      { name: 'Madison Manor final show', blurb: 'Ton of local Madison bands. I love Boxing Day. Lineup: Prairie Smoke, Sheep, Cause and Control, Yolk, Commonwealth, Aergo, New Wrongs, Hush Now Sweet Halo, Cone, Eat Turf, Boxing Day, Hard Liquor, Floor Trick.', image: 'images/concert of the year 2025/manor final show.png' },
      { name: 'Arms Length', blurb: 'Emo show in Chicago with gf. Lineup: Hot mulligan, Arms Length, Anxious, Drug Church.', image: 'images/concert of the year 2025/arms length.png' },
      { name: 'Black Country, New Road', blurb: 'Got a free ticket last minute (tysm), drove down to Chicago and had a wonderful time. Lineup: Black Country, New Road, Friko, Nora Brown & Stephanie Coleman.', image: 'images/concert of the year 2025/bcnr.png' },
      { name: 'Burn Bright MKE', blurb: 'Awesome DIY Emo festival. Lineup: Harrison Gordon, Sincere Engineer, Your Arms Are My Cocoon, Michael Cera Palin, Slow Joy, Frail Body, Combat, EMWAY, Red Sun, Summerbruise, Palette Knife, Muted Color, Garden Home, Moosecreek Park. ', image: 'images/concert of the year 2025/burn bright.PNG' },
      { name: 'Japanese Breakfast', blurb: 'Summerfest show, got given really good front row tickets. Lineup: Collections of Colonies of Bees, Iann Dior, Good Neighbours, Japanese Breakfast, Yung gravy.', image: 'images/concert of the year 2025/japanese breakfast .png' },
      { name: 'MJ Lenderman', blurb: 'Summerfest show, got VIP for free. Lineup: Friko, Hey, Nothing, 311, MJ Lenderman.', image: 'images/concert of the year 2025/mj lenderman.png' },
      { name: 'PUP', blurb: 'High energy show, played with double band setup with Jeff Rosenstock. Lineup: Ekko Astral, Jeff Rosenstock, Pup.', image: 'images/concert of the year 2025/PUP.png' },
      { name: 'Playboi Carti', blurb: 'Last minute decision to drive down to see him, but he puts on an incredible show. Lineup: Destroy Lonely, Ken Carson, Playboi Carti.',isWinner: true, image: 'images/concert of the year 2025/carti.jpg' },
      { name: 'Sports', blurb: 'Sports early on in the reunion, really fun show. Lineup: Tiny Voices, Leisure Hour, Arcadia Grey, The Casper Fight Scene, sports.', image: 'images/concert of the year 2025/sports.png' },
      { name: 'Tiny Voices Album Release show', blurb: 'DIY Emo show, everyone had a lot of energy and TV played so many songs. Lineup: EMWAY, Palette Knife, Garden Home, Tiny Voices.', image: 'images/concert of the year 2025/tiny voices album release.png' }
    ]
  },
  {
    id: 'best-picture',
    title: 'Best Picture',
    subtitle: 'The best movies I watched',
    winner: 'Materialists - Dir. Celine Song',
    winnerBlurb: 'I don’t think I’m going to be able to explain why I love this movie so much. It hit me right at the same time and it felt like Celine Song was staring into my soul to make it. My favorite movies aren’t the ones that make the most sense or follow the rules the best they’re the ones that make me feel the most. This movie made me feel the most. I love you Dakota Johnson I love you Celine Song I love you Michelle Zauner I love everyone who worked on this movie.',
    nominees: [
      { name: 'Twinless - Dir. James Sweeney', blurb: 'Sweet movie about how relationships built on lies will never last. Looks gorgeous and feels very connected to a location which I love.', image: 'images/best picture 2025/twinless.jpg', link: 'https://letterboxd.com/lokiimp/film/twinless/' },
      { name: 'Sinners - Dir. Ryan Coogler', blurb: 'Incredibly impressive movie, looks awesome and everyone in it is great, super well written and directed.', image: 'images/best picture 2025/sinners.jpg', link: 'https://letterboxd.com/lokiimp/film/sinners-2025/reviews/' },
      { name: 'Materialists - Dir. Celine Song', blurb: 'Heartfelt and sweet, I love love.', image: 'images/best picture 2025/materialists.jpg', isWinner: true, link: 'https://letterboxd.com/lokiimp/film/materialists/' },
      { name: 'The History of Sound - Dir. Oliver Hermanus', blurb: 'The saddest a movie has ever made me, heartbreaking story. Phenomenally well done by everyone involved.', image: 'images/best picture 2025/the history of sound.jpg', link: 'https://letterboxd.com/lokiimp/film/the-history-of-sound/' },
      { name: 'Eternity - Dir. David Freyne', blurb: 'Cute and fun, really enjoyable movie to watch with a nice message stated very clearly. Super funny too.', image: 'images/best picture 2025/eternity.jpg', link: 'https://letterboxd.com/lokiimp/film/eternity-2025-1/reviews/' },
      { name: 'Splitsville - Dir. Michael Angelo Covino', blurb: 'Hilarious movie, everyone does a really good job and the setup and payoff for bits is incredible.', image: 'images/best picture 2025/splitsville.jpg', link: 'https://letterboxd.com/lokiimp/film/splitsville/' },
      { name: 'Superman - Dir. James Gunn', blurb: 'Best superhero movie in recent memory, does everything that a superhero movie should do and looks more interesting than all of them. Awesome message from a blockbuster.', image: 'images/best picture 2025/superman.jpg', link: 'https://letterboxd.com/lokiimp/film/superman-2025/reviews/' },
      { name: 'The Baltimorons - Dir. Jay Duplass', blurb: 'I love when a movie is connected to a city, and this takes that to the extreme. Very funny and a cute but emotional story as well.', image: 'images/best picture 2025/the baltimorons.jpg', link: 'https://letterboxd.com/lokiimp/film/the-baltimorons/' },
      { name: 'Blue Moon - Dir. Richard Linklater', blurb: 'Incredible decision to make a movie like this, almost a mumblecore talkie in 2025, and it hits so hard. I love theatre and love.', image: 'images/best picture 2025/blue moon.jpg', link: 'https://letterboxd.com/lokiimp/film/blue-moon-2025/' },
      { name: 'Oh, Hi! - Dir. Sophie Brooks', blurb: 'I think this is the funniest movie of the year, every single scene is so fun to watch. Cute story as well and it’s cool to see art about young people’s experiences.', image: 'images/best picture 2025/oh hi.jpg', link: 'https://letterboxd.com/lokiimp/film/oh-hi/reviews/' }
    ]
  },
  {
    id: 'best-actor',
    title: 'Actor of the Year',
    subtitle: 'Favorite lead performances',
    winner: 'Michael B. Jordan — Sinners',
    winnerBlurb: 'This movie wouldn’t work nearly as well without the performance that Michael B. Jordan gives. The emotional backbone of a movie that needs to handle complex emotions. Every part of this movie works but he still elevates it to such a high level.',
    nominees: [
      { name: 'Dakota Johnson — Materialists', blurb: 'I love Dakota Johnson’s voice and style, every time she’s on screen I feel like I could crawl into the screen.', image: 'images/best actor 2025/dakota johnson materialists.webp'},
      { name: 'Michael B. Jordan — Sinners', blurb: 'Always impressive when an actor plays multiple roles in a movie, but the intricacies he put into this role are breathtaking.', isWinner: true, image: 'images/best actor 2025/michael b jordan sinners.jpg' },
      { name: 'Robert Pattinson — Mickey 17', blurb: 'Another double performance, the way he chooses to act the different Mickeys is the highlight of this movie.', image: 'images/best actor 2025/robert pattinson mickey 17.jpg' },
      { name: "Dylan O'Brien — Twinless", blurb: 'Double roles are almost cheating but this is another great example. He makes this movie that has a crazy premise feel grounded and possible.', image: 'images/best actor 2025/dylan obrien twinless.png' },
      { name: 'Austin Butler — Caught Stealing', blurb: 'The anchor performance for this far reaching movie, grounds it in human experience really well.', image: 'images/best actor 2025/austin butler caught stealing.webp' },
      { name: 'Emma Stone — Bugonia', blurb: 'The range demanded by this role was huge but she nails it. She’s obviously very comfortable with director Yorgos Lanthimos, and their chemistry is awesome.', image: 'images/best actor 2025/emma stone bugonia.webp' },
      { name: 'Zoey Deutch — The Threesome', blurb: 'The role sort of demands a nebulous emotional performance and she kills it. Also an incredible ability for humor.', image: 'images/best actor 2025/zoey deutch the threesome.webp' },
      { name: 'Olivia Colman — The Roses', blurb: 'One of the funniest single performances I’ve seen, everyone kills it in this movie (Andy Samberg and Kate McKinnon do great as well) but she stands out.', image: 'images/best actor 2025/olivia colman the roses.png' },
      { name: 'Julia Garner — Weapons', blurb: 'You experience this movie through a ton of characters, but nobody does a better job grounding the existential fear than Garner.', image: 'images/best actor 2025/julia garner weapons.webp' },
      { name: 'Ethan Hawke — Blue Moon', blurb: 'The central talker in a movie full of talking, he holds the emotions of the movie so well and makes everything feel so human.', image: 'images/best actor 2025/ethan hawke blue moon.jpg' }
    ]
  },
  {
    id: 'tweets',
    title: 'Tweets',
    subtitle: 'Favorite posts',
    winner: '@falseroxy',
    winnerBlurb: 'My favorite. The phrasing is soo good and I would think about it like once an hour and start laughing for a week. Still gets me. Literally what is that thing and why is it called the gump.',
    nominees: [
      {
        name: '@BillsOnReal',
        tweetText: 'Hot take: I hate the Sunday night football song since that means the weekend is over and we got school the next day',
        blurb: 'So true. Like an actual child thought it up. Awesome.',
        link: 'https://twitter.com/BillsOnReal/status/1969918628028874882',
        embedHtml: '<blockquote class="twitter-tweet" data-theme="dark"><p lang="en" dir="ltr">Hot take: I hate the Sunday night football song since that means the weekend is over and we got school the next day</p>&mdash; BillsOnReal (@BillsOnReal) <a href="https://twitter.com/BillsOnReal/status/1969918628028874882?ref_src=twsrc%5Etfw">September 22, 2025</a></blockquote>'
      },
      {
        name: '@budlytes',
        tweetText: 'charli: yeah the pressure from the media and the constant comparisons really make me feel some type a way and this song is how I wanna express all the emotions that come with that  taylor: is this me shade?? bitch u do CRACK',
        blurb: 'Immediately post Taylor album, couldn’t stop quoting it for a problematic length of time.',
        link: 'https://twitter.com/budlytes/status/1973919364324729014',
        embedHtml: '<blockquote class="twitter-tweet" data-conversation="none" data-theme="dark"><p lang="en" dir="ltr">charli: yeah the pressure from the media and the constant comparisons really make me feel some type a way and this song is how I wanna express all the emotions that come with that<br><br>taylor: is this me shade?? bitch u do CRACK</p>&mdash; Mercury (@budlytes) <a href="https://twitter.com/budlytes/status/1973919364324729014?ref_src=twsrc%5Etfw">October 3, 2025</a></blockquote>'
      },
      {
        name: '@daviddeweil',
        tweetText: 'I get why people eventually get into bird watching. A beautiful little humming bird would never run up the middle 3 straight times and then punt',
        blurb: 'Think about it every time my team runs the ball up the middle three times and punts.',
        link: 'https://twitter.com/daviddeweil/status/1979623580003389753',
        embedHtml: '<blockquote class="twitter-tweet" data-theme="dark"><p lang="en" dir="ltr">I get why people eventually get into bird watching. A beautiful little humming bird would never run up the middle 3 straight times and then punt</p>&mdash; David DeWeil (@daviddeweil) <a href="https://twitter.com/daviddeweil/status/1979623580003389753?ref_src=twsrc%5Etfw">October 18, 2025</a></blockquote>'
      },
      {
        name: '@SaskioLoL',
        tweetText: 'i duo queue with my ex every couple months  we don\'t talk about it. it just happens.  2am. both online. she sends the invite. or i do. neither of us acknowledges who sent it first.  the discord call is 90% silence. no "how have you been." no "seeing anyone?" just pings and...',
        blurb: 'Genuinely unbelievable story and the way it’s told is hilarious. League guys are awesome.',
        link: 'https://twitter.com/SaskioLoL/status/1997697615992103001',
        embedHtml: '<blockquote class="twitter-tweet" data-theme="dark"><p lang="en" dir="ltr">i duo queue with my ex every couple months<br><br>we don\'t talk about it. it just happens.<br><br>2am. both online. she sends the invite. or i do. neither of us acknowledges who sent it first.<br><br>the discord call is 90% silence. no "how have you been." no "seeing anyone?" just pings and... <a href="https://t.co/v6GbQ0Vx1V">pic.twitter.com/v6GbQ0Vx1V</a></p>&mdash; Tony Chau (@SaskioLoL) <a href="https://twitter.com/SaskioLoL/status/1997697615992103001?ref_src=twsrc%5Etfw">December 7, 2025</a></blockquote>'
      },
      {
        name: '@sexyfuncute',
        tweetText: 'do u wanna touch knees later while we\'re sitting down and pretend to ignore the fact that we\'re touching knees',
        blurb: 'Real.',
        link: 'https://twitter.com/sexyfuncute/status/1939389861225447517',
        embedHtml: '<blockquote class="twitter-tweet" data-theme="dark"><p lang="en" dir="ltr">do u wanna touch knees later while we\'re sitting down and pretend to ignore the fact that we\'re touching knees</p>&mdash; predictable girl (@sexyfuncute) <a href="https://twitter.com/sexyfuncute/status/1939389861225447517?ref_src=twsrc%5Etfw">June 29, 2025</a></blockquote>'
      },
      {
        name: '@soyaranoor',
        tweetText: 'customers will say shit like "uhh it\'s asking me to remove my card?"',
        blurb: 'Customers will literally say stuff like this all the time. Nothing but love.',
        link: 'https://twitter.com/soyaranoor/status/1972316914618900952',
        embedHtml: '<blockquote class="twitter-tweet" data-theme="dark"><p lang="en" dir="ltr">customers will say shit like "uhh it\'s asking me to remove my card?"</p>&mdash; ً (@soyaranoor) <a href="https://twitter.com/soyaranoor/status/1972316914618900952?ref_src=twsrc%5Etfw">September 28, 2025</a></blockquote>'
      },
      {
        name: '@falseroxy',
        tweetText: 'brutal when you\'re trying to give a presentation as a woman and all the men on your team are desperately fucking their gump',
        blurb: 'Funnier if you see the full thread, but the phrasing of this individual one gets me so much.',
        link: 'https://twitter.com/falseroxy/status/1968861807436579083',
        isWinner:true,
        embedHtml: '<blockquote class="twitter-tweet" data-conversation="none" data-theme="dark"><p lang="en" dir="ltr">brutal when you\'re trying to give a presentation as a woman and all the men on your team are desperately fucking their gump</p>&mdash; roxy demento (@falseroxy) <a href="https://twitter.com/falseroxy/status/1968861807436579083?ref_src=twsrc%5Etfw">September 19, 2025</a></blockquote>'
      },
      {
        name: '@Clarabell045788',
        tweetText: 'My husband and I have a secret to making our marriage last. Twice a week we go to a nice restaurant, drink a little wine, eat nice food, and enjoy a good conversation. He goes on Tuesdays and I go Friday.',
        blurb: 'Classic joke.',
        link: 'https://twitter.com/Clarabell045788/status/1942852797910659208',
        embedHtml: '<blockquote class="twitter-tweet" data-theme="dark"><p lang="en" dir="ltr">My husband and I have a secret to making our marriage last. Twice a week we go to a nice restaurant, drink a little wine, eat nice food, and enjoy a good conversation. He goes on Tuesdays and I go Friday.</p>&mdash; Clare (@Clarabell045788) <a href="https://twitter.com/Clarabell045788/status/1942852797910659208?ref_src=twsrc%5Etfw">July 9, 2025</a></blockquote>'
      },
      {
        name: '@xoxogopissgirly',
        tweetText: 'it was dying and he was just going to flush it but i thought that was too inhumane so i wrapped it up and took it outside and then smashed it with a rock so it was quick and painless... very traumatic',
        blurb: 'Really a beautiful moment when I saw this tweeted. Couldn’t stop laughing for like 45 minutes. Awesome.',
        link: 'https://twitter.com/xoxogopissgirly/status/1948965060056895931',
        embedHtml: '<blockquote class="twitter-tweet" data-conversation="none" data-theme="dark"><p lang="en" dir="ltr">it was dying and he was just going to flush it but i thought that was too inhumane so i wrapped it up and took it outside and then smashed it with a rock so it was quick and painless… very traumatic</p>&mdash; rae (@xoxogopissgirly) <a href="https://twitter.com/xoxogopissgirly/status/1948965060056895931?ref_src=twsrc%5Etfw">July 26, 2025</a></blockquote>'
      }
    ]
  },
  {
    id: 'best-shortform-video',
    title: 'Best Shortform Video',
    subtitle: 'Best shortform video content (be patient with the loaded videos pls)',
    winner: 'Ho Hey — user7587090897246',
    winnerBlurb: 'This video means a lot to me. Probably more than any tiktok should. I’ve cried to this mutliple times, it changed my perspective on the song and lowkey on my life. I’m not even joking it’s my favorite short video I’ve ever seen I love it so much. I need to go back to NYC forever.',
    nominees: [
      { name: 'Apple Gucci - Northerlion', blurb: 'Probably his funniest clip this year, I don’t know why it makes me laugh so hard.', link: 'https://youtube.com/shorts/93FOHsMcG_s?si=tMvoLpHkxcF5982a', embed: 'https://www.youtube.com/embed/93FOHsMcG_s' },
      { name: 'Ho Hey - user7587090897246', blurb: 'Wow', link: 'https://www.tiktok.com/@user7587090897246/video/7566799232334646542', embedHtml: '<blockquote class="tiktok-embed" cite="https://www.tiktok.com/@user7587090897246/video/7566799232334646542" data-video-id="7566799232334646542" style="max-width: 605px;min-width: 325px;"><section><a target="_blank" title="@user7587090897246" href="https://www.tiktok.com/@user7587090897246?refer=embed">@user7587090897246</a><p></p><a target="_blank" title="♬ original sound - 🫀" href="https://www.tiktok.com/music/original-sound-7166459943720356654?refer=embed">♬ original sound - 🫀</a></section></blockquote>', isWinner: true },
      { name: 'At the Crib - pabloquade', blurb: 'Incredible one liner. So good.', link: 'https://www.tiktok.com/@pabloquade/video/7537096126613196045', embedHtml: '<blockquote class="tiktok-embed" cite="https://www.tiktok.com/@pabloquade/video/7537096126613196045" data-video-id="7537096126613196045" style="max-width: 605px;min-width: 325px;"><section><a target="_blank" title="@pabloquade" href="https://www.tiktok.com/@pabloquade?refer=embed">@pabloquade</a> <a title="cntower" target="_blank" href="https://www.tiktok.com/tag/cntower?refer=embed">#cntower</a> <a target="_blank" title="♬ original sound - Pablo Quade" href="https://www.tiktok.com/music/original-sound-7537096200806304525?refer=embed">♬ original sound - Pablo Quade</a></section></blockquote>' },
      { name: 'Nett CMBYN - user3009756387337', blurb: 'This video makes me cry. I love this song and movie so much.', link: 'https://www.tiktok.com/@user3009756387337/video/7552620317571616022', embedHtml: '<blockquote class="tiktok-embed" cite="https://www.tiktok.com/@user3009756387337/video/7552620317571616022" data-video-id="7552620317571616022" style="max-width: 605px;min-width: 325px;"><section><a target="_blank" title="@user3009756387337" href="https://www.tiktok.com/@user3009756387337?refer=embed">@user3009756387337</a> <a title="callmebyyourname" target="_blank" href="https://www.tiktok.com/tag/callmebyyourname?refer=embed">#callmebyyourname</a> <a title="nettspend" target="_blank" href="https://www.tiktok.com/tag/nettspend?refer=embed">#nettspend</a> <a title="fyp" target="_blank" href="https://www.tiktok.com/tag/fyp?refer=embed">#fyp</a> <a title="cmbyn" target="_blank" href="https://www.tiktok.com/tag/cmbyn?refer=embed">#cmbyn</a> <a title="timotheechalamet" target="_blank" href="https://www.tiktok.com/tag/timotheechalamet?refer=embed">#timotheechalamet</a> <a target="_blank" title="♬ original sound - flim" href="https://www.tiktok.com/music/original-sound-7552620317573204758?refer=embed">♬ original sound - flim</a></section></blockquote>' },
      { name: 'College - obscure.pod', blurb: 'The slop category of little kids doing stupid fake podcasts is so good. Their comedic timing in this is genuinely so impressive.', link: 'https://www.tiktok.com/@obscure.pod/video/7555123437233032479', embedHtml: '<blockquote class="tiktok-embed" cite="https://www.tiktok.com/@obscure.pod/video/7555123437233032479" data-video-id="7555123437233032479" style="max-width: 605px;min-width: 325px;"><section><a target="_blank" title="@obscure.pod" href="https://www.tiktok.com/@obscure.pod?refer=embed">@obscure.pod</a> Ep. 1 <a title="fyp" target="_blank" href="https://www.tiktok.com/tag/fyp?refer=embed">#fyp</a> <a title="podcast" target="_blank" href="https://www.tiktok.com/tag/podcast?refer=embed">#podcast</a> <a title="funny" target="_blank" href="https://www.tiktok.com/tag/funny?refer=embed">#funny</a> <a title="repost" target="_blank" href="https://www.tiktok.com/tag/repost?refer=embed">#repost</a> <a target="_blank" title="♬ original sound - Obscure Pod" href="https://www.tiktok.com/music/original-sound-7555123372250762015?refer=embed">♬ original sound - Obscure Pod</a></section></blockquote>' },
      { name: 'Fried Chicken Freestyle - cutearabboynocap', blurb: 'I GOT FRIED CHICKEN I GOT FRIED CHICKEN. Sort of catchier than the actual song.', link: 'https://www.tiktok.com/@cutearabboynocap/video/7506339561459518726', embedHtml: '<blockquote class="tiktok-embed" cite="https://www.tiktok.com/@cutearabboynocap/video/7506339561459518726" data-video-id="7506339561459518726" style="max-width: 605px;min-width: 325px;"><section><a target="_blank" title="@cutearabboynocap" href="https://www.tiktok.com/@cutearabboynocap?refer=embed">@cutearabboynocap</a><p>Fried chicken </p><a target="_blank" title="♬ original sound - merhi" href="https://www.tiktok.com/music/original-sound-7506339562500672262?refer=embed">♬ original sound - merhi</a></section></blockquote>' },
      { name: 'Rizzler Names Brainrot - chris_stocks_', blurb: 'He’s sort of very endearing. idk.', link: 'https://www.instagram.com/reel/DNa1AYJu3-v/?igsh=MTM2NHA3ZDljejZpcw==', embed: 'https://www.instagram.com/reel/DNa1AYJu3-v/embed' },
      { name: 'Birthday Sex State Street - fsacappella', blurb: 'Madison mentioned. Awesome that it popped off and the original is always best.', link: 'https://www.instagram.com/reel/DPjeIDSjS48/?igsh=Mzh6eDVwenJmZHFm', embed: 'https://www.instagram.com/reel/DPjeIDSjS48/embed' },
      { name: 'Leaving Baby on Doorstep - SkyeHitchcock', blurb: 'Cute baby :). Cute video :).', link: 'https://youtube.com/shorts/szei1YQYooA?si=hFVzC5dciZckFlKG', embed: 'https://www.youtube.com/embed/szei1YQYooA' }
    ]
  },
  {
    id: 'longform-video',
    title: 'Longform Video',
    subtitle: 'Best longform videos',
    winner: 'Bits Bracket 4 (with Ro Ramdin) — Hivemind',
    winnerBlurb: 'I love Hivemind so much and this video was a gift. Ro Ramdin is so funny as well, I was obsessed with her tiktoks forever ago, and I think their dynamic is so funny. It works for me on every level and I’ve watched all four hours multiple times.',
    nominees: [
      { name: 'Bits Bracket 4 (with Ro Ramdin) — Hivemind', blurb: 'Craziest video my favorite channel has ever done, the length of two feature films and packed full of bits.', link: 'https://www.youtube.com/watch?v=2kl5V3RJjN0',isWinner:true, embed: 'https://www.youtube.com/embed/2kl5V3RJjN0?si=MDo1gyTnmS1H4_yh', image: 'https://i.ytimg.com/vi/2kl5V3RJjN0/hqdefault.jpg' },
      { name: 'Dakota Johnson — Good Hang with Amy Poehler', blurb: 'I love the way Dakota Johnson talks and Amy Poehler is so funny as an interviewer.', link: 'https://www.youtube.com/watch?v=kOQysUwN26M', embed: 'https://www.youtube.com/embed/kOQysUwN26M', image: 'https://i.ytimg.com/vi/kOQysUwN26M/hqdefault.jpg' },
      { name: 'LISTERS: A Glimpse Into Extreme Birdwatching — owen reiser', blurb: 'Incredible video, feels like a full documentary in how they set it up. Very impressive.', link: 'https://www.youtube.com/watch?v=zl-wAqplQAo', embed: 'https://www.youtube.com/embed/zl-wAqplQAo', image: 'https://i.ytimg.com/vi/zl-wAqplQAo/hqdefault.jpg' },
      //{ name: 'Inside a dark web kill list — Carl Miller TED talk', blurb: '', link: 'https://www.youtube.com/watch?v=htNMTxj_qE8', embed: 'https://www.youtube.com/embed/htNMTxj_qE8', image: 'https://i.ytimg.com/vi/htNMTxj_qE8/hqdefault.jpg' },
      { name: 'I went to every Great Wolf Lodge — Athena P', blurb: 'I like these kinds of videos and I have good memories at the Great Wolf Lodge.', link: 'https://www.youtube.com/watch?v=U2sefF_08OM', embed: 'https://www.youtube.com/embed/U2sefF_08OM', image: 'https://i.ytimg.com/vi/U2sefF_08OM/hqdefault.jpg' },
      { name: "Hip Hop's most misunderstood Icon — F.D Signifier", blurb: 'One of the most important creators to me this year, and this video is so interesting.', link: 'https://www.youtube.com/watch?v=CWXaqxqt_dA', embed: 'https://www.youtube.com/embed/CWXaqxqt_dA', image: 'https://i.ytimg.com/vi/CWXaqxqt_dA/hqdefault.jpg' },
      { name: 'We Played Hide and Seek Across NYC — Jet Lag: The Game', blurb: 'Fun self contained version of the full game, I love New York City.', link: 'https://www.youtube.com/watch?v=Zftv6Kh2zi4', embed: 'https://www.youtube.com/embed/Zftv6Kh2zi4', image: 'https://i.ytimg.com/vi/Zftv6Kh2zi4/hqdefault.jpg' },
      { name: 'Does Defense REALLY Win Championships? — Nerd Sesh', blurb: 'Really good essay about sports statistics, love this channel and these guys a lot.', link: 'https://www.youtube.com/watch?v=nvmoSO2ILOo', embed: 'https://www.youtube.com/embed/nvmoSO2ILOo', image: 'https://i.ytimg.com/vi/nvmoSO2ILOo/hqdefault.jpg' },
      { name: 'Melee: The Quest for Sub 3:00 — Summoning Salt', blurb: 'Summoning salt has to make an appearance, and this video is awesome. I love the theme in Melee when you do the target break minigame.', link: 'https://www.youtube.com/watch?v=qsT08n_96p4', embed: 'https://www.youtube.com/embed/qsT08n_96p4', image: 'https://i.ytimg.com/vi/qsT08n_96p4/hqdefault.jpg' },
      { name: 'Taylor Swift on Reclaiming Her Masters, Wrapping The Eras Tour, and The Life of a Showgirl — New Heights', blurb: 'Taylor never does interviews like this so it’s sort of magical when she does. I like their dynamic a lot and I think Jason Kelce is so funny.', link: 'https://www.youtube.com/watch?v=M2lX9XESvDE', embed: 'https://www.youtube.com/embed/M2lX9XESvDE', image: 'https://i.ytimg.com/vi/M2lX9XESvDE/hqdefault.jpg' }
    ]
  },
  {
    id: 'best-athlete',
    title: 'Best Athlete',
    subtitle: 'Favorite athletes',
    winner: 'Caleb Williams',
    winnerBlurb: 'How could it be anyone else. I love my beautiful baby boy and I love the way he plays and I love his development and I love his nails and his sense of fashion and his performative nature. That’s my guy. Caleb Williams one million years.',
    nominees: [
      { name: 'Joe Burrow', blurb: 'QB - Cincinnati Bengals. I think he’s so good and I also love his personality. And his face he’s so cute. My boy.', image: 'images/athlete of the year 2025/joe burrow.jpg', link: 'https://www.statmuse.com/nfl/player/joe-burrow-28175' },
      { name: 'Caleb Williams', blurb: 'QB - Chicago Bears. My beautiful baby boy, my favorite athlete for years, the only thing that could make me root for the Bears even a little.',isWinner:true, image: 'images/athlete of the year 2025/caleb williams.jpg', link: 'https://www.statmuse.com/nfl/player/caleb-williams-31070' },
      { name: 'Jared McCain', blurb: 'SG - Philadelphia 76ers. I love tiktok dances. Almost made me consider rooting for Duke and almost makes me root for a Philly sports team. Still not quite.', image: 'images/athlete of the year 2025/jared mccain.webp', link: 'https://www.statmuse.com/nba/player/jared-mccain-30394' },
      { name: 'Christian Watson', blurb: 'WR - Green Bay Packers. Phenomenal player for my favorite professional sports team. The way he catches balls makes me feel like im watching an artist.', image: 'images/athlete of the year 2025/christian watson.webp', link: 'https://www.statmuse.com/nfl/player/christian-watson-29612' },
      { name: 'Micah Parsons', blurb: 'DE - Green Bay Packers. Probably the best player on my team. Gives us so much sauce on defense and incredibly fun to watch. Get well soon big bro.', image: 'images/athlete of the year 2025/micah parsons.webp', link: 'https://www.statmuse.com/nfl/player/micah-parsons-29293' },
      { name: 'Tyrese Haliburton', blurb: 'PG - Indiana Pacers. Almost beat the worst team in basketball history in game seven of the finals, absolutely electric player. So exciting to watch.', image: 'images/athlete of the year 2025/tyrese haliburton.webp', link: 'https://www.statmuse.com/nba/player/tyrese-haliburton-10199' },
      { name: 'Jonathan Taylor', blurb: 'RB - Indianapolis Colts. Wisconsin graduate, carrying an Indiana sports team which is meaningful to me.', image: 'images/athlete of the year 2025/jonathan taylor.webp', link: 'https://www.statmuse.com/nfl/player/jonathan-taylor-28226' },
      { name: 'Johnny Furphy', blurb: 'SG - Indiana Pacers. This is my boy. Love seeing him get in, love when he does anything at all. Got attatched to him when I saw them play in person.', image: 'images/athlete of the year 2025/johnny furphy.jpg', link: 'https://www.statmuse.com/nba/player/johnny-furphy-30444' }
    ]
  },
  {
    id: 'best-foods',
    title: 'Best Foods',
    subtitle: 'Favorites foods I ate a lot',
    winner: 'Meat stick',
    winnerBlurb: 'I think if you somehow had the ability to undo the meat sticks I ate this year I would instantly die from lack of nutrients. I will try to be healthier in the new year maybe. Probably not.',
    nominees: [
      { name: 'Cashew', blurb: 'Snacked on these constantly at work. Might be my favorite nut I really did a 180 on them this year I used to hate them.', image: 'images/food of the year 2025/cashews.webp' },
      { name: 'Ramen', blurb: 'Ate a ton of this too. Very easy and yummy.', image: 'images/food of the year 2025/ramen.webp' },
      { name: 'Taco bell cheesy gordita crunch', blurb: 'Best fast food invention of all time. The box it comes in is such a good deal.', image: 'images/food of the year 2025/cheesy gordita crunch.jpg' },
      { name: 'Microwave popcorn', blurb: 'Ate a ton of microwave popcorn, I love having a slightly warm snack.', image: 'images/food of the year 2025/popcorn.webp' },
      { name: 'Lays chips', blurb: 'Awesome crunch and I like the flavor too. Did you know it’s potatoes?', image: 'images/food of the year 2025/lays chips.jpg' },
      { name: 'Meat stick', blurb: 'Sadly my main source of protein this year. Love eating these things. Yum yum yum.', isWinner:true, image: 'images/food of the year 2025/meat stick.jpg' },
      { name: 'Air fried chicken thighs', blurb: 'Most involved thing on the list and all it is is throw some chicken thighs in the air frier after putting seasoned salt on them. Great over rice and it counts as a real meal.', image: 'images/food of the year 2025/chicken thighs.jpg' },
      { name: 'QQ Express lo mein broccoli chicken', blurb: 'Best meal on campus probably. Ate this like once a week. Absolutely delicious.', image: 'images/food of the year 2025/qq express.webp' }
    ]
  },
  {
    id: 'best-picture-me',
    title: 'Best Picture (of me)',
    subtitle: 'Favorite photos of me',
    winner: 'James Madison Park',
    winnerBlurb: 'Taken on a stormy day, we were escaping a crowded house show. Lighting in this picture is so magical.',
    nominees: [
      { name: 'Baltimore Washington Monument', blurb: 'pc: Thomas', image: 'images/best picture me 2025/baltimore.JPG' },
      { name: 'Chicago Bridge', blurb: 'pc: Cash', image: 'images/best picture me 2025/bridge.JPG' },
      { name: 'James Madison Park', blurb: 'pc: Charlotte',isWinner:true, image: 'images/best picture me 2025/lake.JPG' },
      { name: 'Milwaukee Mall', blurb: 'pc: Macy', image: 'images/best picture me 2025/milwaukee mall.jpg' },
      { name: 'Burberry Store', blurb: 'pc: Thomas', image: 'images/best picture me 2025/burberry.JPG' },
      { name: 'Basketball in Olympia', blurb: 'pc: Cash', image: 'images/best picture me 2025/basketball.JPG' },
      { name: 'Plaza Tavern Halloween', blurb: 'pc: Serrae', image: 'images/best picture me 2025/plaza bar.jpg' },
      { name: 'Chicago River', blurb: 'pc: Cash', image: 'images/best picture me 2025/chicago.JPG' }
    ]
  }
];

const categoriesContainer = document.getElementById('categories');

// Initial Render
renderCategories(categories);

function renderCategories(list) {
  // Use a Fragment to minimize page reflows during initial render
  const fragment = document.createDocumentFragment();

  list.forEach((cat, idx) => {
    const section = document.createElement('section');
    section.className = 'category';
    section.id = cat.id;
    section.dataset.revealed = 'false'; // Track state on the DOM element

    const banner = document.createElement('div');
    banner.className = 'banner';
    section.appendChild(banner);

    const head = document.createElement('header');
    
    // Header Content
    const h2 = document.createElement('h2');
    h2.textContent = `${idx + 1} · ${cat.title}`;
    head.appendChild(h2);

    const subtitle = document.createElement('p');
    subtitle.className = 'subtitle';
    subtitle.textContent = cat.subtitle;
    head.appendChild(subtitle);

    if (cat.id === 'record-of-the-year') {
      const mixLink = document.createElement('a');
      mixLink.href = 'https://open.spotify.com/playlist/0hQ28CtW80NGUDa5fANTdU?si=m-sUga6NRJSKBd2eRFp7yg'; // Your link here
      mixLink.target = '_blank';
      mixLink.rel = 'noopener noreferrer';
      mixLink.className = 'subtitle';
      mixLink.textContent = 'Playlist link';
      head.appendChild(mixLink);
    }

    // Actions (Buttons)
    const actions = document.createElement('div');
    actions.className = 'actions';

    // Dynamic Load Button Logic
    if (loadedSections.hasOwnProperty(cat.id)) {
      const loadBtn = document.createElement('button');
      loadBtn.className = 'btn';
      // Determine label based on category type
      const labelType = cat.id === 'tweets' ? 'Tweets' : 'Videos';
      loadBtn.textContent = `Load ${labelType}`;
      
      loadBtn.addEventListener('click', (e) => {
        // OPTIMIZATION: Only update this specific grid, don't re-render page
        loadedSections[cat.id] = true;
        e.target.textContent = `${labelType} loaded`;
        e.target.disabled = true;
        
        // Re-render just the grid for this category
        const grid = section.querySelector('.grid');
        grid.innerHTML = '';
        cat.nominees.forEach(nominee => {
           grid.appendChild(createNomineeCard(nominee, cat.winner, { allowEmbeds: true, categoryId: cat.id }));
        });
      });
      actions.appendChild(loadBtn);
    }

    const revealBtn = document.createElement('button');
    revealBtn.className = 'btn';
    revealBtn.textContent = 'Reveal winner';
    revealBtn.addEventListener('click', () => revealWinner(section, cat));
    actions.appendChild(revealBtn);

    head.appendChild(actions);
    section.appendChild(head);

    // Grid
    const grid = document.createElement('div');
    grid.className = 'grid';
    
    // Check if embeds are allowed for this specific render
    const allowEmbeds = loadedSections[cat.id] === true;
    
    cat.nominees.forEach((nominee) => {
      const card = createNomineeCard(nominee, cat.winner, { allowEmbeds, categoryId: cat.id });
      grid.appendChild(card);
    });
    section.appendChild(grid);

    fragment.appendChild(section);
  });

  categoriesContainer.innerHTML = '';
  categoriesContainer.appendChild(fragment);
}

// Normalize asset paths so pages served from subfolders can still find
// images stored at the repo root. If the path is already absolute
// (starts with '/' or 'http'), return it unchanged; otherwise prefix
// with '../' so `sammys/index.html` can resolve `images/...` correctly.
function resolveAsset(path) {
  if (!path) return path;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) return path;
  return '../' + path;
}

function createNomineeCard(nominee, winnerName, options = {}) {
  const article = document.createElement('article');
  article.className = 'nominee';
  
  if (nominee.isWinner || nominee.name === winnerName) {
    article.dataset.winner = 'true';
  }

  const allowEmbeds = options.allowEmbeds !== false;
  const categoryId = options.categoryId || '';
  const isTweetCategory = categoryId === 'tweets';
  const isLongformCategory = categoryId === 'longform-video';
  
  const hasImage = Boolean(nominee.image);
  const hasEmbedFrame = allowEmbeds && Boolean(nominee.embed);
  const hasEmbedHtml = allowEmbeds && Boolean(nominee.embedHtml);
  const embedActive = hasEmbedFrame || hasEmbedHtml;

  article.dataset.hasImage = hasImage.toString();
  article.dataset.hasEmbed = embedActive.toString();

  if (embedActive && allowEmbeds) {
    article.classList.add('embed-active');
  }

  const wrapper = nominee.link ? document.createElement('a') : document.createElement('div');
  if (nominee.link) {
    wrapper.href = nominee.link;
    wrapper.target = '_blank';
    wrapper.rel = 'noopener noreferrer';
  }

  const showArt = embedActive || hasImage || Boolean(nominee.accent);

  if (showArt) {
    const art = document.createElement('div');
    art.className = 'nominee-art';

    if (hasEmbedHtml) {
      const container = document.createElement('div');
      container.className = 'embed-html';
      container.innerHTML = nominee.embedHtml;
      art.appendChild(container);

      // Handle Scripts (TikTok)
      if (!tiktokScriptInjected && nominee.embedHtml.includes('tiktok-embed')) {
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.tiktok.com/embed.js';
        document.head.appendChild(script);
        tiktokScriptInjected = true;
      }

      // Handle Scripts (Twitter) - FIXING RACE CONDITION
      if (nominee.embedHtml.includes('twitter-tweet')) {
        if (!twitterScriptInjected) {
            const script = document.createElement('script');
            script.async = true;
            script.src = 'https://platform.twitter.com/widgets.js';
            // Wait for load before initializing
            script.onload = () => {
                if (window.twttr) window.twttr.widgets.load();
            };
            document.head.appendChild(script);
            twitterScriptInjected = true;
        } else if (window.twttr && window.twttr.widgets) {
            // If already injected, just reload widgets
            window.twttr.widgets.load();
        }
      }

    } else if (hasEmbedFrame) {
      const frame = document.createElement('iframe');
      frame.className = 'embed-frame';
      frame.src = nominee.embed;
      frame.loading = "lazy"; // Native lazy loading for iframes
      frame.title = `${nominee.name} embed`;
      frame.allow = 'accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      frame.allowFullscreen = true;
      art.appendChild(frame);
    } else if (hasImage) {
      // PERFORMANCE: Switch from background-image to <img> for Lazy Loading
      const img = document.createElement('img');
      img.src = resolveAsset(nominee.image);
      img.loading = "lazy"; // Huge performance win
      img.alt = nominee.name;
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      if (nominee.cropTop) img.style.objectPosition = 'top center';
      art.appendChild(img);
    } 
    
    wrapper.appendChild(art);
  } else {
    article.classList.add('no-art');
  }

  const winnerLabel = document.createElement('div');
  winnerLabel.className = 'winner-label';
  winnerLabel.textContent = 'Winner';
  wrapper.appendChild(winnerLabel);

  const name = document.createElement('div');
  name.className = 'name';
  name.textContent = nominee.name;
  wrapper.appendChild(name);

  const meta = document.createElement('p');
  meta.className = 'meta';
  // Logic: Non-tweets start empty. Tweets show text if embeds aren't loaded.
  if (isTweetCategory && !allowEmbeds) {
    meta.textContent = nominee.tweetText || nominee.blurb || '';
  }
  meta.dataset.defaultText = meta.textContent || '';
  wrapper.appendChild(meta);

  const blurb = document.createElement('div');
  blurb.className = 'blurb';
  blurb.textContent = nominee.blurb;
  // Hide overlay blurb if it is a loaded longform video (so you can click play)
  if (isLongformCategory && allowEmbeds && embedActive) {
    blurb.style.display = 'none';
  }
  wrapper.appendChild(blurb);

  article.appendChild(wrapper);
  return article;
}

function revealWinner(section, cat) {
  const cards = Array.from(section.querySelectorAll('.nominee'));
  const alreadyRevealed = section.dataset.revealed === 'true';

  if (alreadyRevealed) {
    section.dataset.revealed = 'false';
    cards.forEach((card) => {
      card.classList.remove('winner');
      const meta = card.querySelector('.meta');
      if (meta) meta.textContent = meta.dataset.defaultText || '';
    });
    return;
  }

  section.dataset.revealed = 'true';
  cards.forEach((card) => {
    const meta = card.querySelector('.meta');
    // If winner: Show Winner Blurb. If loser: Show the specific blurb (review) in the meta slot.
    if (meta) {
        meta.textContent = card.dataset.winner === 'true' 
          ? cat.winnerBlurb 
          : (card.querySelector('.blurb')?.textContent || '');
    }
    
    if (card.dataset.winner === 'true') {
      card.classList.add('winner');
      sprinkleConfetti(card);
    }
  });
}

function sprinkleConfetti(target) {
  const colors = ['#8ab4f8', '#3dd2b4', '#f0c674', '#ff9580', '#c3f584'];
  const offsetParent = target.offsetParent || document.body;
  const rect = target.getBoundingClientRect();
  
  // Calculate position relative to the offsetParent
  const parentRect = offsetParent.getBoundingClientRect();
  const baseX = (rect.left - parentRect.left) + rect.width / 2;
  const baseY = (rect.top - parentRect.top) + 4;

  // OPTIMIZATION: Use DocumentFragment to batch DOM inserts
  const fragment = document.createDocumentFragment();

  for (let i = 0; i < 40; i += 1) {
    const piece = document.createElement('div');
    piece.className = 'confetti';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    
    const spread = 140;
    const x = baseX + (Math.random() * spread - spread / 2);
    const drift = Math.random() * 40 - 20;
    
    piece.style.left = `${x}px`;
    piece.style.top = `${baseY}px`;
    piece.style.width = `${6 + Math.random() * 6}px`;
    piece.style.height = `${10 + Math.random() * 12}px`;
    
    piece.style.setProperty('--rot-start', `${Math.random() * 360}deg`);
    piece.style.setProperty('--rot-end', `${Math.random() * 360}deg`);
    piece.style.setProperty('--drift', `${drift}px`);
    piece.style.setProperty('--dur', `${650 + Math.random() * 700}ms`);
    
    fragment.appendChild(piece);
    
    // Cleanup needs to be individual since animations vary
    // We can't easily clean up the fragment, so we query the piece
    setTimeout(() => piece.remove(), 1500); 
  }
  
  offsetParent.appendChild(fragment);
}