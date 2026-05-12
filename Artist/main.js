let audio = new Audio();

let list = [];
let index = 0;
let artist = "";

let shuffle = false;
let loopMode = "none";

let songElements = [];
let allSongs = [];

/* =========================
   🧼 URL CLEAN SYSTEM
========================= */

function cleanURLString(str){
  return str ? str.replace(/\+/g, "%20") : "";
}

function getCleanParam(name){
  const fixed = cleanURLString(location.search);
  const params = new URLSearchParams(fixed);
  const value = params.get(name);
  return value ? decodeURIComponent(value) : null;
}

function setURL(paramsObj){
  const url = new URL(location.href);

  Object.entries(paramsObj).forEach(([k, v]) => {
    url.searchParams.set(k, v);
  });

  history.pushState({}, "", encodeURI(url.toString()));
}

function forceFixURL(){
  if (!location.href.includes("+")) return;
  history.replaceState({}, "", location.href.replace(/\+/g, "%20"));
}

forceFixURL();
setInterval(forceFixURL, 500);

/* =========================
   ELEMENTS
========================= */

const songSearch = document.getElementById("songSearch");

/* =========================
   🎲 SHUFFLE
========================= */

function shuffleArray(arr){
  const a = [...arr];

  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }

  return a;
}

/* =========================
   🎭 UI SWITCH
========================= */

function enterArtistUI(name){

  grid.style.display = "none";
  songs.style.display = "grid";
  songSearch.style.display = "block";

  songs.innerHTML = "";
  songElements = [];

  now.innerText = "Loading songs...";
  setPageTitle(name);
}

/* =========================
   🎧 MASTER LOADER (FIXED)
========================= */

function loadArtist(name, skipURL = false){

  artist = name;

  enterArtistUI(name);

  if(!skipURL){
    setURL({ name });
  }

  fetch(`./${name}/config.json`)
    .then(r => r.json())
    .then(data => {

      setPageTitle(data.artist);

      /* 🆔 GIVE EACH SONG A STABLE ID */
      allSongs = shuffleArray(data.songs).map((s, i) => ({
        ...s,
        _id: i
      }));

      renderSongs(allSongs);

    })
    .catch(err => {
      now.innerText = "Failed to load artist";
      console.error(err);
    });
}

/* =========================
   NAV
========================= */

function goHome(){
  location.href = "https://nova-labs-code.github.io/MusicPlayer";
}

function goBack(){
  location.href = "?";
}

/* =========================
   TITLE
========================= */

function setPageTitle(text){
  document.getElementById("title").innerText = text;
  document.title = text + " - MusicPlayer";
}

/* =========================
   LOOP TEXT
========================= */

function getLoopText(){
  if(loopMode === "none") return "Loop: Off";
  if(loopMode === "song") return "Loop: Current Song";
  return "Loop: Queue";
}

/* =========================
   UI UPDATE
========================= */

function updateButtons(){

  shuffleBtn.classList.toggle("active", shuffle);
  shuffleBtnFS.classList.toggle("active", shuffle);

  [loopBtn, loopBtnFS].forEach(btn => {
    btn.classList.toggle("loop-active", loopMode !== "none");
    btn.title = getLoopText();
  });

  if(loopState){
    loopState.innerText = getLoopText();
  }
}

/* =========================
   SONG HIGHLIGHTS
========================= */

function updateSongHighlights(){

  songElements.forEach((el, i) => {
    el.classList.remove("active", "queue");
    if(i === index) el.classList.add("active");
    if(i > index) el.classList.add("queue");
  });
}

/* =========================
   🎧 PLAY SONG (ID SAFE)
========================= */

function playSong(l, i, a){

  list = l;
  index = i;
  artist = a;

  const s = list.find(x => x._id === i) || list[i];

  audio.src = `./${a}/${s.file}`;
  audio.currentTime = 0;
  audio.play();

  player.style.display = "block";

  now.innerText = s.title;
  cover.src = `./${a}/${s.image}`;
  coverBig.src = `./${a}/${s.image}`;

  songTitle.innerText = s.title;
  artistName.innerText = a;

  updateButtons();
  updateSongHighlights();

  updateMediaSession(s);
}

/* =========================
   CONTROLS
========================= */

function togglePlay(){
  audio.paused ? audio.play() : audio.pause();
}

function toggleShuffle(){
  shuffle = !shuffle;
  updateButtons();
}

function toggleLoop(){
  loopMode =
    loopMode === "none" ? "song" :
    loopMode === "song" ? "queue" :
    "none";

  updateButtons();
}

/* =========================
   NEXT / PREV
========================= */

function nextSong(){

  if(shuffle){
    let n;
    do{
      n = Math.floor(Math.random() * list.length);
    } while(list.length > 1 && n === index);

    return playSong(list, n, artist);
  }

  if(index < list.length - 1){
    playSong(list, index + 1, artist);
  }
  else if(loopMode === "queue"){
    playSong(list, 0, artist);
  }
}

function prevSong(){

  if(audio.currentTime > 5){
    audio.currentTime = 0;
    return;
  }

  if(index > 0){
    playSong(list, index - 1, artist);
  }
}

/* =========================
   END LOGIC
========================= */

audio.addEventListener("ended", () => {
  if(loopMode === "song"){
    audio.currentTime = 0;
    audio.play();
    return;
  }
  nextSong();
});

/* =========================
   FULLSCREEN
========================= */

function toggleFullscreen(){

  if(!player.classList.contains("fullscreen")){
    player.classList.add("fullscreen");
    document.documentElement.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

document.addEventListener("fullscreenchange", () => {
  if(!document.fullscreenElement){
    player.classList.remove("fullscreen");
  }
});

/* =========================
   PROGRESS
========================= */

audio.addEventListener("timeupdate", () => {

  if(!audio.duration) return;

  const percent = (audio.currentTime / audio.duration) * 100;

  progMini.style.width = percent + "%";
  progFull.style.width = percent + "%";

  const m = Math.floor(audio.currentTime / 60);
  const s = Math.floor(audio.currentTime % 60);

  time.innerText = `${m}:${s < 10 ? "0" : ""}${s}`;
});

/* =========================
   SEEK
========================= */

barMini.onclick = (e) => {
  const r = barMini.getBoundingClientRect();
  audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
};

barFull.onclick = (e) => {
  const r = barFull.getBoundingClientRect();
  audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
};

/* =========================
   🔍 SEARCH + CLICK FIXED
========================= */

function renderSongs(filtered){

  songs.innerHTML = "";
  songElements = [];

  filtered.forEach((s) => {

    const el = document.createElement("div");
    el.className = "song";

    el.innerHTML = `
      <img src="./${artist}/${s.image}">
      <div>${s.title}</div>
    `;

    /* 🆔 ALWAYS USE STABLE ID */
    el.onclick = () => {
      playSong(allSongs, s._id, artist);
    };

    songs.appendChild(el);
    songElements.push(el);
  });

}

songSearch?.addEventListener("input", (e) => {

  const q = e.target.value.toLowerCase();

  const filtered = allSongs.filter(s =>
    s.title.toLowerCase().includes(q)
  );

  renderSongs(filtered);

});

/* =========================
   MEDIA SESSION
========================= */

function updateMediaSession(song){

  if(!("mediaSession" in navigator)) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: song.title,
    artist: artist,
    album: artist,
    artwork: [{
      src: `./${artist}/${song.image}`,
      sizes: "512x512",
      type: "image/png"
    }]
  });

  navigator.mediaSession.setActionHandler("play", () => audio.play());
  navigator.mediaSession.setActionHandler("pause", () => audio.pause());
  navigator.mediaSession.setActionHandler("previoustrack", () => prevSong());
  navigator.mediaSession.setActionHandler("nexttrack", () => nextSong());
}

/* =========================
   ROUTING
========================= */

const artistParam = getCleanParam("name");
const songParam = getCleanParam("song");

/* =========================
   HOME VIEW
========================= */

if(!artistParam){

  songSearch.style.display = "none";

  setPageTitle("Artist");
  backBtn.style.display = "none";

  fetch("artist.json")
    .then(r => r.json())
    .then(artists => {

      artists.forEach(name => {

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
              loadArtist(name);
            };

            grid.appendChild(card);

          });

      });

    });

}

/* =========================
   ARTIST VIEW (URL)
========================= */

else {

  songSearch.style.display = "block";
  backBtn.style.display = "inline-block";

  loadArtist(artistParam, true);

}
