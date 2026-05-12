const grid = document.getElementById("grid");
const results = document.getElementById("results");
const searchInput = document.getElementById("searchInput");

let artistsData = [];
let isLoaded = false;
let currentCategory = "all";

/* 🎛️ CATEGORY SWITCH */
document.querySelectorAll(".cat").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".cat").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    currentCategory = btn.dataset.type;
    runSearch();
  });
});

/* 📦 LOAD DATA */
async function loadData() {
  try {
    const artistList = await fetch("./Artist/artist.json").then(r => r.json());

    for (const name of artistList) {
      const config = await fetch(`./Artist/${name}/config.json`).then(r => r.json());

      const artist = {
        name,
        displayName: config.artist,
        image: config.image,
        songs: config.songs || []
      };

      artistsData.push(artist);

      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <img src="./Artist/${name}/${config.image}">
        <div>${config.artist}</div>
      `;

      card.onclick = () => {
        location.href = `./Artist/?name=${name}`;
      };

      grid.appendChild(card);
    }

    isLoaded = true;

  } catch (err) {
    console.error(err);
    grid.innerHTML = "<p>Failed to load artists.</p>";
  }
}

loadData();

/* ⏱️ debounce */
function debounce(fn, delay = 120) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

/* 🔎 SEARCH ENGINE */
const runSearch = debounce(() => {
  if (!isLoaded) return;

  const q = searchInput.value.toLowerCase().trim();

  results.innerHTML = "";

  const showArtists = currentCategory === "all" || currentCategory === "artists";
  const showMusic = currentCategory === "all" || currentCategory === "music";

  grid.style.display = "none";
  results.style.display = "grid";

  /* 🟢 NO SEARCH → BROWSE MODE */
  if (!q) {
    for (const artist of artistsData) {

      if (showArtists) {
        results.appendChild(makeArtistCard(artist));
      }

      if (showMusic) {
        artist.songs.forEach((song, i) => {
          results.appendChild(makeSongCard(artist, song, i));
        });
      }
    }
    return;
  }

  /* 🔎 SEARCH MODE */
  for (const artist of artistsData) {

    const artistMatch =
      artist.displayName.toLowerCase().includes(q) ||
      artist.name.toLowerCase().includes(q);

    if (showArtists && artistMatch) {
      results.appendChild(makeArtistCard(artist));
    }

    if (showMusic) {
      artist.songs.forEach((song, i) => {
        if (song.title.toLowerCase().includes(q)) {
          results.appendChild(makeSongCard(artist, song, i));
        }
      });
    }
  }

}, 120);

searchInput.addEventListener("input", runSearch);

/* 🎤 ARTIST CARD */
function makeArtistCard(artist) {
  const el = document.createElement("div");
  el.className = "card";

  el.innerHTML = `
    <img src="./Artist/${artist.name}/${artist.image}">
    <div>${artist.displayName}</div>
  `;

  el.onclick = () => {
    location.href = `./Artist/?name=${artist.name}`;
  };

  return el;
}

/* 🎵 SONG CARD */
function makeSongCard(artist, song, i) {
  const el = document.createElement("div");
  el.className = "card";

  el.innerHTML = `
    <img src="./Artist/${artist.name}/${song.image}">
    <div>${song.title}</div>
    <small>${artist.displayName}</small>
  `;

  el.onclick = () => {
    location.href = `./Artist/?name=${artist.name}&song=${i}`;
  };

  return el;
}
