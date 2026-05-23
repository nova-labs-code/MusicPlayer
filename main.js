const artistsView = document.getElementById("artistsView");
const musicView = document.getElementById("musicView");

const tabArtists = document.getElementById("tabArtists");
const tabMusic = document.getElementById("tabMusic");

const search = document.getElementById("homeSearch");

let allArtists = [];
let allMusic = [];

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

fetch("./Artist/artist.json")
  .then(r => r.json())
  .then(artists => {

    allArtists = artists;

    artists.forEach(name => {

      fetch(`./${name}/config.json`)
        .then(r => r.json())
        .then(data => {

          // ARTIST CARD
          const card = document.createElement("div");
          card.className = "card";

          card.innerHTML = `
            <img src="./${name}/${data.image}">
            <div>${data.artist}</div>
          `;

          card.onclick = () => {
            location.href = `?name=${name}`;
          };

          artistsView.appendChild(card);

          // MUSIC FLATTENING
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

        });

    });

  });

/* =========================
   MUSIC RENDER
========================= */

function renderMusic(list){

  musicView.innerHTML = "";

  list.forEach(song => {

    const el = document.createElement("div");
    el.className = "song";

    el.innerHTML = `
      <img src="./${song.artistKey}/${song.image}">
      <div>${song.title}</div>
    `;

    el.onclick = () => {
      location.href =
        `?name=${song.artistKey}&song=${song.id}`;
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

  filteredArtists.forEach(name => {

    fetch(`./${name}/config.json`)
      .then(r => r.json())
      .then(data => {

        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
          <img src="./${name}/${data.image}">
          <div>${data.artist}</div>
        `;

        card.onclick = () => {
          location.href = `?name=${name}`;
        };

        artistsView.appendChild(card);
      });

  });

  renderMusic(filteredMusic);
});

/* initial render after delay */
setTimeout(() => renderMusic(allMusic), 1200);