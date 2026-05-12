const grid = document.getElementById("grid");
const results = document.getElementById("results");
const searchInput = document.getElementById("searchInput");

let artistsData = [];
let isLoaded = false;
let currentCategory = "all";

/* 🎯 CATEGORY SWITCH */
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

  if (!q) {
    grid.style.display = "grid";
    results.style.display = "none";
    return;
  }

  grid.style.display = "none";
  results.style.display = "grid";
  results.innerHTML = "";

  for (const artist of artistsData) {

    const artistMatch =
      artist.displayName.toLowerCase().includes(q) ||
      artist.name.toLowerCase().includes(q);

    /* 🎤 ARTISTS */
    if ((currentCategory === "all" || currentCategory === "artists") && artistMatch) {

      const el = document.createElement("div");
      el.className = "card";

      el.innerHTML = `
        <img src="./Artist/${artist.name}/${artist.image}">
        <div>${artist.displayName}</div>
      `;

      el.onclick = () => {
        location.href = `./Artist/?name=${artist.name}`;
      };

      results.appendChild(el);
    }

    /* 🎵 SONGS */
    if (currentCategory === "all" || currentCategory === "music") {

      artist.songs.forEach((song, i) => {

        if (song.title.toLowerCase().includes(q)) {

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

          results.appendChild(el);
        }

      });
    }
  }

}, 120);

searchInput.addEventListener("input", runSearch);
