let audio = new Audio();

/* =========================
   STATE
========================= */

let list = [];
let index = 0;
let artist = "";

let allSongs = [];
let songElements = [];

let shuffle = false;
let loopMode = "none";

let recentShuffleHistory = [];

/* =========================
   ELEMENTS
========================= */

const grid = document.getElementById("grid");
const songs = document.getElementById("songs");
const player = document.getElementById("player");

const songSearch = document.getElementById("songSearch");

const now = document.getElementById("now");
const cover = document.getElementById("cover");
const coverBig = document.getElementById("coverBig");

const songTitle = document.getElementById("songTitle");
const artistName = document.getElementById("artistName");

const progMini = document.getElementById("progMini");
const progFull = document.getElementById("progFull");

const barMini = document.getElementById("barMini");
const barFull = document.getElementById("barFull");

const time = document.getElementById("time");

const shuffleBtn = document.getElementById("shuffleBtn");
const shuffleBtnFS = document.getElementById("shuffleBtnFS");

const loopBtn = document.getElementById("loopBtn");
const loopBtnFS = document.getElementById("loopBtnFS");

const visualBtn = document.getElementById("visualBtn");
const visualBtnFS = document.getElementById("visualBtnFS");

const loopState = document.getElementById("loopState");

const backBtn = document.getElementById("backBtn");

const visualizer =
  document.getElementById("visualizer");

const vctx =
  visualizer.getContext("2d");

/* =========================
   VISUALIZER STATE
========================= */

let visualizerEnabled = false;

/* =========================
   URL FIX
========================= */

function cleanURL(){

  const fixed =
    location.href.replace(/\+/g, "%20");

  if(fixed !== location.href){

    history.replaceState(
      {},
      "",
      fixed
    );
  }
}

setInterval(cleanURL, 1000);

cleanURL();

/* =========================
   RESIZE VISUALIZER
========================= */

function resizeVisualizer(){

  visualizer.width =
    window.innerWidth;

  visualizer.height =
    window.innerHeight;
}

window.addEventListener(
  "resize",
  resizeVisualizer
);

resizeVisualizer();

/* =========================
   AUDIO ANALYZER
========================= */

const audioCtx =
  new (
    window.AudioContext ||
    window.webkitAudioContext
  )();

const analyser =
  audioCtx.createAnalyser();

analyser.fftSize = 2048;

const source =
  audioCtx.createMediaElementSource(audio);

source.connect(analyser);

analyser.connect(audioCtx.destination);

const bufferLength =
  analyser.frequencyBinCount;

const dataArray =
  new Uint8Array(bufferLength);

const smoothArray =
  new Float32Array(bufferLength);

/* =========================
   ENABLE AUDIO CONTEXT
========================= */

function unlockAudioContext(){

  if(audioCtx.state === "suspended"){
    audioCtx.resume();
  }
}

document.addEventListener(
  "click",
  unlockAudioContext,
  { once:false }
);

/* =========================
   SONG NUMBER
========================= */

function getSongNumber(song){

  if(!song?.file){
    return null;
  }

  const match =
    song.file.match(/\d+/);

  return match
    ? parseInt(match[0])
    : null;
}

/* =========================
   URL HELPERS
========================= */

function getParam(name){

  return new URLSearchParams(
    location.search
  ).get(name);
}

function setURL(obj){

  const url =
    new URL(location.href);

  Object.entries(obj)
    .forEach(([k,v]) => {

      url.searchParams.set(k,v);
    });

  history.pushState(
    {},
    "",
    url.toString()
  );
}

/* =========================
   NAV
========================= */

function goHome(){

  location.href =
    "https://nova-labs-code.github.io/MusicPlayer";
}

function goBack(){

  location.href = "?";
}

/* =========================
   TITLE
========================= */

function setPageTitle(text){

  document.getElementById(
    "title"
  ).innerText = text;

  document.title =
    text + " - MusicPlayer";
}

/* =========================
   SHUFFLE ARRAY
========================= */

function shuffleArray(arr){

  const a = [...arr];

  for(
    let i = a.length - 1;
    i > 0;
    i--
  ){

    const j =
      Math.floor(
        Math.random() * (i + 1)
      );

    [a[i], a[j]] =
      [a[j], a[i]];
  }

  return a;
}

/* =========================
   ARTIST MODE
========================= */

function enterArtistMode(){

  grid.style.display = "none";

  songs.style.display = "grid";

  songSearch.style.display = "block";

  backBtn.style.display =
    "inline-block";

  songs.innerHTML = "";

  songElements = [];

  player.style.display = "none";

  window.scrollTo(0,0);
}

/* =========================
   LOAD ARTIST
========================= */

function loadArtist(
  name,
  skipURL = false,
  autoSong = null
){

  artist = name;

  fetch(`./${name}/config.json`)
    .then(r => r.json())
    .then(data => {

      enterArtistMode();

      setPageTitle(data.artist);

      if(data.theme){

        document.documentElement
          .style
          .setProperty(
            "--bg",
            data.theme.bg
          );

        document.documentElement
          .style
          .setProperty(
            "--accent",
            data.theme.accent
          );
      }

      if(!skipURL){

        setURL({ name });
      }

      allSongs =
        shuffleArray(data.songs)
          .map((s,i)=>({
            ...s,
            _id:i
          }));

      renderSongs(allSongs);

      if(autoSong !== null){

        const target =
          allSongs.find(s =>
            getSongNumber(s)
            === autoSong
          );

        if(target){

          setTimeout(() => {

            playSong(
              allSongs,
              target._id,
              name
            );

          }, 0);
        }
      }
    });
}

/* =========================
   RENDER SONGS
========================= */

function renderSongs(arr){

  songs.innerHTML = "";

  songElements = [];

  arr.forEach(s => {

    const el =
      document.createElement("div");

    el.className = "song";

    el.innerHTML = `
      <img src="./${artist}/${s.image}">
      <div>${s.title}</div>
    `;

    el.onclick = () =>
      playSong(
        allSongs,
        s._id,
        artist
      );

    songs.appendChild(el);

    songElements.push(el);
  });
}

/* =========================
   PLAY SONG
========================= */

function playSong(l,i,a){

  list = l;
  index = i;
  artist = a;

  const s =
    list.find(x=>x._id===i)
    || list[i];

  if(!s){
    return;
  }

  const filePath =
    `./${a}/${s.file}`;

  audio.src = filePath;

  audio.currentTime = 0;

  audio.play().catch(()=>{});

  player.style.display =
    "block";

  now.innerText =
    s.title;

  cover.src =
    `./${a}/${s.image}`;

  coverBig.src =
    `./${a}/${s.image}`;

  songTitle.innerText =
    s.title;

  artistName.innerText =
    a;

  updateButtons();

  updateHighlights();

  updateMediaSession(s);
}

/* =========================
   SEARCH
========================= */

songSearch?.addEventListener(
  "input",
  e => {

    const q =
      e.target.value.toLowerCase();

    renderSongs(

      allSongs.filter(s =>

        s.title
          .toLowerCase()
          .includes(q)
      )
    );
  }
);

/* =========================
   HIGHLIGHTS
========================= */

function updateHighlights(){

  const visibleSongs =
    document.querySelectorAll(
      ".song"
    );

  visibleSongs.forEach(el => {

    el.classList.remove(
      "active",
      "queue"
    );
  });

  const current =
    visibleSongs[index];

  if(current){

    current.classList.add(
      "active"
    );
  }

  visibleSongs.forEach((el,i)=>{

    if(i > index){

      el.classList.add(
        "queue"
      );
    }
  });
}

/* =========================
   CONTROLS
========================= */

function togglePlay(){

  audio.paused
    ? audio.play()
    : audio.pause();
}

function nextSong(){

  if(shuffle){

    const available =
      list.filter((_,i)=>

        !recentShuffleHistory
          .includes(i)
      );

    let nextIndex;

    if(available.length > 0){

      const randomSong =
        available[
          Math.floor(
            Math.random()
            * available.length
          )
        ];

      nextIndex =
        randomSong._id;
    }
    else {

      nextIndex =
        Math.floor(
          Math.random()
          * list.length
        );
    }

    recentShuffleHistory.push(
      nextIndex
    );

    if(
      recentShuffleHistory.length > 3
    ){

      recentShuffleHistory.shift();
    }

    return playSong(
      list,
      nextIndex,
      artist
    );
  }

  if(index < list.length - 1){

    playSong(
      list,
      index + 1,
      artist
    );
  }
  else if(loopMode === "queue"){

    playSong(
      list,
      0,
      artist
    );
  }
}

function prevSong(){

  if(audio.currentTime > 5){

    audio.currentTime = 0;

    return;
  }

  if(index > 0){

    playSong(
      list,
      index - 1,
      artist
    );
  }
}

/* =========================
   TOGGLES
========================= */

function toggleShuffle(){

  shuffle = !shuffle;

  recentShuffleHistory = [];

  updateButtons();
}

function toggleLoop(){

  if(loopMode === "none"){

    loopMode = "queue";
  }
  else if(loopMode === "queue"){

    loopMode = "song";
  }
  else {

    loopMode = "none";
  }

  updateButtons();
}

/* =========================
   VISUALIZER TOGGLE
========================= */

function toggleVisualizer(){

  visualizerEnabled =
    !visualizerEnabled;

  visualizer.classList.toggle(
    "active",
    visualizerEnabled
  );

  updateButtons();
}

/* =========================
   BUTTON STATES
========================= */

function updateButtons(){

  shuffleBtn?.classList.toggle(
    "active",
    shuffle
  );

  shuffleBtnFS?.classList.toggle(
    "active",
    shuffle
  );

  const loopActive =
    loopMode !== "none";

  loopBtn?.classList.toggle(
    "loop-active",
    loopActive
  );

  loopBtnFS?.classList.toggle(
    "loop-active",
    loopActive
  );

  visualBtn?.classList.toggle(
    "active",
    visualizerEnabled
  );

  visualBtnFS?.classList.toggle(
    "active",
    visualizerEnabled
  );

  loopState.innerText =

    loopMode === "none"
      ? "Loop: Off"

      : loopMode === "song"
        ? "Loop: Song"

        : "Loop: Queue";
}

/* =========================
   SONG END
========================= */

audio.addEventListener(
  "ended",
  () => {

    if(loopMode === "song"){

      audio.currentTime = 0;

      audio.play();

      return;
    }

    nextSong();
  }
);

/* =========================
   PROGRESS
========================= */

audio.addEventListener(
  "timeupdate",
  () => {

    if(!audio.duration){
      return;
    }

    const p =
      (
        audio.currentTime
        / audio.duration
      ) * 100;

    progMini.style.width =
      p + "%";

    progFull.style.width =
      p + "%";

    const m =
      Math.floor(
        audio.currentTime / 60
      );

    const s =
      Math.floor(
        audio.currentTime % 60
      );

    time.innerText =
      `${m}:${s < 10 ? "0" : ""}${s}`;
  }
);

barMini.onclick = e => {

  const r =
    barMini.getBoundingClientRect();

  audio.currentTime =

    (
      (e.clientX - r.left)
      / r.width
    ) * audio.duration;
};

barFull.onclick = e => {

  const r =
    barFull.getBoundingClientRect();

  audio.currentTime =

    (
      (e.clientX - r.left)
      / r.width
    ) * audio.duration;
};

/* =========================
   FULLSCREEN
========================= */

function toggleFullscreen(){

  if(!player){
    return;
  }

  if(!document.fullscreenElement){

    player.classList.add(
      "fullscreen"
    );

    document.documentElement
      .requestFullscreen?.();
  }
  else {

    document.exitFullscreen?.();
  }
}

window.toggleFullscreen =
  toggleFullscreen;

document.addEventListener(
  "fullscreenchange",
  () => {

    if(!document.fullscreenElement){

      player.classList.remove(
        "fullscreen"
      );
    }
  }
);

/* =========================
   MEDIA SESSION
========================= */

function updateMediaSession(song){

  if(!("mediaSession" in navigator)){
    return;
  }

  navigator.mediaSession.metadata =
    new MediaMetadata({

      title:
        song.title,

      artist:
        artist,

      album:
        artist,

      artwork:[
        {
          src:
            `./${artist}/${song.image}`,

          sizes:
            "512x512",

          type:
            "image/png"
        }
      ]
    });

  navigator.mediaSession
    .setActionHandler(
      "play",
      togglePlay
    );

  navigator.mediaSession
    .setActionHandler(
      "pause",
      togglePlay
    );

  navigator.mediaSession
    .setActionHandler(
      "nexttrack",
      nextSong
    );

  navigator.mediaSession
    .setActionHandler(
      "previoustrack",
      prevSong
    );
}

/* =========================
   VISUALIZER DRAW
========================= */

function drawVisualizer(){

  requestAnimationFrame(
    drawVisualizer
  );

  if(!visualizerEnabled){

    vctx.clearRect(
      0,
      0,
      visualizer.width,
      visualizer.height
    );

    return;
  }

  const w =
    visualizer.width;

  const h =
    visualizer.height;

  const cx =
    w / 2;

  const cy =
    h / 2;

  analyser.getByteFrequencyData(
    dataArray
  );

  for(
    let i = 0;
    i < bufferLength;
    i++
  ){

    smoothArray[i] =

      smoothArray[i] * 0.82 +

      dataArray[i] * 0.18;
  }

  vctx.fillStyle =
    "rgba(0,0,0,0.14)";

  vctx.fillRect(
    0,
    0,
    w,
    h
  );

  let bass = 0;

  for(let i = 0; i < 25; i++){

    bass += smoothArray[i];
  }

  bass /= 25;

  const img =
    coverBig;

  const baseRadius =
    Math.min(w,h) * 0.16;

  const radius =

    baseRadius +

    bass * 0.08;

  if(img?.complete){

    vctx.save();

    vctx.beginPath();

    vctx.arc(
      cx,
      cy,
      radius,
      0,
      Math.PI * 2
    );

    vctx.clip();

    vctx.drawImage(
      img,
      cx - radius,
      cy - radius,
      radius * 2,
      radius * 2
    );

    vctx.restore();
  }

  const bars = 260;

  const spin =
    Date.now() * 0.00015;

  for(
    let i = 0;
    i < bars;
    i++
  ){

    const angle =

      (
        i / bars
      ) * Math.PI * 2 +

      spin;

    const freqIndex =
      Math.floor(

        (
          i / bars
        ) * bufferLength * 0.45
      );

    const value =
      smoothArray[freqIndex];

    const length =

      (
        value / 255
      ) *

      Math.min(w,h) * 0.22;

    const x1 =

      cx +

      Math.cos(angle) *

      (radius + 18);

    const y1 =

      cy +

      Math.sin(angle) *

      (radius + 18);

    const x2 =

      cx +

      Math.cos(angle) *

      (radius + 18 + length);

    const y2 =

      cy +

      Math.sin(angle) *

      (radius + 18 + length);

    const hue =

      (
        i * 1.8 +

        Date.now() * 0.02
      ) % 360;

    vctx.strokeStyle =

      `hsla(${hue},100%,60%,0.95)`;

    vctx.lineWidth = 2;

    vctx.beginPath();

    vctx.moveTo(x1,y1);

    vctx.lineTo(x2,y2);

    vctx.stroke();
  }
}

drawVisualizer();

/* =========================
   ROUTING
========================= */

const artistParam =
  getParam("name");

const songParam =
  getParam("song");

if(!artistParam){

  songSearch.style.display =
    "none";

  backBtn.style.display =
    "none";

  setPageTitle("Artists");

  fetch("artist.json")
    .then(r => r.json())
    .then(artists => {

      artists.forEach(name => {

        fetch(`./${name}/config.json`)
          .then(r => r.json())
          .then(data => {

            const card =
              document.createElement(
                "div"
              );

            card.className = "card";

            card.innerHTML = `
              <img src="./${name}/${data.image}">
              <div>${data.artist}</div>
            `;

            card.onclick = () =>
              loadArtist(name);

            grid.appendChild(card);
          });
      });
    });

}
else {

  const songIndex =
    songParam
      ? parseInt(songParam)
      : null;

  loadArtist(
    artistParam,
    true,
    songIndex
  );

  setTimeout(() => {

    const url =
      new URL(location.href);

    url.searchParams.delete(
      "song"
    );

    history.replaceState(
      {},
      "",
      url.toString()
    );

  },0);
}