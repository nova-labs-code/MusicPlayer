const artistsView = document.getElementById("artistsView");
const musicView = document.getElementById("musicView");

const tabArtists = document.getElementById("tabArtists");
const tabMusic = document.getElementById("tabMusic");

const search = document.getElementById("homeSearch");

const ARTIST_ROOT = "./";

let allArtists = [];
let allMusic = [];
const artistCache = new Map();

/* =========================
   URL PARAMS
========================= */

const params = new URLSearchParams(location.search);
const artistName = params.get("name");
const songKey = params.get("song");

/* song1 -> 0 index */
function resolveSong(songKey) {
  if (!songKey) return null;

  const match = songKey.match(/song(\d+)/i);
  if (!match) return null;

  return parseInt(match[1], 10) - 1;
}

const songIndex = resolveSong(songKey);

/* =========================
   TAB SWITCH
========================= */

tabArtists.onclick = () => {
  artistsView.classList.remove("hidden");
  musicView.classList.add("hidden");

  tabArtists.classList.add("active");
  tabMusic.classList.remove("active");
};

tabMusic.onclick = () => {
  musicView.classList.remove("hidden");
  artistsView.classList.add("hidden");

  tabMusic.classList.add("active");
  tabArtists.classList.remove("active");
};

/* =========================
   LOAD ARTISTS
========================= */

fetch("artist.json")
  .then(r => r.json())
  .then(async (artists) => {

    allArtists = artists;

    for (const name of artists) {

      const res = await fetch(`./Artist/${name}/config.json`);
      const data = await res.json();

      artistCache.set(name, data);

      /* ARTIST CARD */
      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <img src="./Artist/${name}/${data.image}">
        <div>${data.artist}</div>
      `;

      card.onclick = () => {
        location.href = `?name=${name}`;
      };

      artistsView.appendChild(card);

      /* FLATTEN MUSIC */
      data.songs.forEach((s, i) => {
        allMusic.push({
          title: s.title,
          image: s.image,
          artist: data.artist,
          file: s.file,
          artistKey: name,
          id: i
        });
      });
    }

    renderMusic(allMusic);

    /* =========================
       AUTO PLAY FROM URL
    ========================= */

    if (artistName) {
      fetch(`./Artist/${artistName}/config.json`)
        .then(r => r.json())
        .then(data => {

          const songs = data.songs;

          if (songIndex !== null && songs[songIndex]) {

            const song = songs[songIndex];

            const audio = new Audio(
              `./Artist/${artistName}/${song.file}`
            );

            audio.play();
          }

        });
    }

  });

/* =========================
   MUSIC RENDER
========================= */

function renderMusic(list) {

  musicView.innerHTML = "";

  list.forEach(song => {

    const el = document.createElement("div");
    el.className = "song";

    el.innerHTML = `
      <img src="./Artist/${song.artistKey}/${song.image}">
      <div>${song.title}</div>
    `;

    el.onclick = () => {
      location.href = `?name=${song.artistKey}&song=song${song.id + 1}`;
    };

    musicView.appendChild(el);
  });
}

/* =========================
   SEARCH
========================= */

search.addEventListener("input", e => {

  const q = e.target.value.toLowerCase();

  const filteredArtists = allArtists.filter(a =>
    a.toLowerCase().includes(q)
  );

  const filteredMusic = allMusic.filter(m =>
    m.title.toLowerCase().includes(q) ||
    m.artist.toLowerCase().includes(q)
  );

  artistsView.innerHTML = "";
  musicView.innerHTML = "";

  /* ARTISTS */
  filteredArtists.forEach(name => {

    const data = artistCache.get(name);
    if (!data) return;

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="./Artist/${name}/${data.image}">
      <div>${data.artist}</div>
    `;

    card.onclick = () => {
      location.href = `?name=${name}`;
    };

    artistsView.appendChild(card);
  });

  /* MUSIC */
  renderMusic(filteredMusic);
});