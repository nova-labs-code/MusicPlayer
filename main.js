const grid = document.getElementById("grid");
const results = document.getElementById("results");
const searchInput = document.getElementById("searchInput");

let artistsData = [];
let isLoaded = false;
let currentCategory = "artists";

/* =========================
   CATEGORY SWITCH
========================= */

document.querySelectorAll(".cat").forEach(btn => {
  btn.addEventListener("click", () => {

    document.querySelectorAll(".cat")
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");

    currentCategory = btn.dataset.type;

    runSearch();
  });
});

/* =========================
   URL SAFE
========================= */

function toURL(value){
  return encodeURIComponent(String(value));
}

/* =========================
   LOAD DATA
========================= */

async function loadData() {
  try {

    const artistList =
      await fetch("./Artist/artist.json")
        .then(r => r.json());

    const frag = document.createDocumentFragment();

    for (const name of artistList) {

      const config =
        await fetch(`./Artist/${name}/config.json`)
          .then(r => r.json());

      const artistObj = {
        name,
        displayName: config.artist,
        image: config.image,
        songs: config.songs || []
      };

      artistsData.push(artistObj);

      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <img src="./Artist/${name}/${config.image}">
        <div>${config.artist}</div>
      `;

      card.onclick = () => {
        location.href =
          `./Artist/?name=${toURL(name)}`;
      };

      frag.appendChild(card);
    }

    grid.appendChild(frag);

    isLoaded = true;

  } catch (err) {
    console.error(err);
    grid.innerHTML = "<p>Failed to load artists.</p>";
  }
}

loadData();

/* =========================
   DEBOUNCE
========================= */

function debounce(fn, delay = 120) {
  let t;

  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

/* =========================
   SEARCH ENGINE
========================= */

const runSearch = debounce(() => {

  if (!isLoaded) return;

  const q =
    searchInput.value
      .toLowerCase()
      .trim();

  results.innerHTML = "";

  const showArtists =
    currentCategory === "artists";

  const showMusic =
    currentCategory === "music";

  /* =========================
     EMPTY SEARCH = BROWSE
  ========================= */

  if (!q) {

    grid.style.display = "grid";
    results.style.display = "none";

    return;
  }

  grid.style.display = "none";
  results.style.display = "grid";

  const frag = document.createDocumentFragment();

  for (const artist of artistsData) {

    const artistMatch =
      artist.displayName
        .toLowerCase()
        .includes(q) ||
      artist.name
        .toLowerCase()
        .includes(q);

    if (showArtists && artistMatch) {
      frag.appendChild(
        makeArtistCard(artist)
      );
    }

    if (showMusic) {

      artist.songs.forEach((song, i) => {

        if (
          song.title
            .toLowerCase()
            .includes(q)
        ) {
          frag.appendChild(
            makeSongCard(
              artist,
              song,
              i
            )
          );
        }
      });
    }
  }

  results.appendChild(frag);

}, 120);

searchInput.addEventListener("input", runSearch);

/* =========================
   ARTIST CARD
========================= */

function makeArtistCard(artist) {

  const el = document.createElement("div");

  el.className = "card";

  el.innerHTML = `
    <img src="./Artist/${artist.name}/${artist.image}">
    <div>${artist.displayName}</div>
  `;

  el.onclick = () => {
    location.href =
      `./Artist/?name=${toURL(artist.name)}`;
  };

  return el;
}

/* =========================
   SONG CARD
========================= */

function makeSongCard(artist, song, i) {

  const el = document.createElement("div");

  el.className = "card";

  el.innerHTML = `
    <img src="./Artist/${artist.name}/${song.image}">
    <div>${song.title}</div>
    <small>${artist.displayName}</small>
  `;

  el.onclick = () => {
    location.href =
      `./Artist/?name=${toURL(artist.name)}&song=${i + 1}`;
  };

  return el;
}