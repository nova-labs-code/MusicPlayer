const grid = document.getElementById("grid");
const results = document.getElementById("results");
const searchInput = document.getElementById("searchInput");

let artistsData = []; // [{name, displayName, image, songs[]}]

/* LOAD FROM REAL FILES */
async function loadData(){

  const artistList = await fetch("./Artist/artist.json").then(r=>r.json());

  for(const name of artistList){

    const data = await fetch(`./Artist/${name}/config.json`).then(r=>r.json());

    const artistObj = {
      name: name,
      displayName: data.artist,
      image: data.image,
      songs: data.songs
    };

    artistsData.push(artistObj);

    // 🎤 RENDER ARTIST CARD
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="./Artist/${name}/${data.image}">
      <div>${data.artist}</div>
    `;

    card.onclick = () => {
      location.href = `./Artist/?name=${name}`;
    };

    grid.appendChild(card);
  }
}

loadData();

---

/* 🔎 SEARCH (USES SAME DATA — NO FAKE STUFF) */
searchInput.addEventListener("input", ()=>{

  const q = searchInput.value.toLowerCase().trim();

  if(!q){
    grid.style.display = "grid";
    results.style.display = "none";
    return;
  }

  grid.style.display = "none";
  results.style.display = "grid";
  results.innerHTML = "";

  artistsData.forEach(artist => {

    /* 🎤 MATCH ARTIST */
    if(artist.displayName.toLowerCase().includes(q) || artist.name.toLowerCase().includes(q)){

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

    /* 🎵 MATCH SONGS */
    artist.songs.forEach((song, i)=>{

      if(song.title.toLowerCase().includes(q)){

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

  });

});