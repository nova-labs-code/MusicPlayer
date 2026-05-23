let audio = new Audio();

/* =========================
   VISUALIZER SYSTEM
========================= */

const canvas =
  document.getElementById("visualizer");

const ctx =
  canvas.getContext("2d");

const vizToggle =
  document.getElementById("vizToggle");

let visualizerEnabled = false;

function resizeCanvas(){

  canvas.width =
    window.innerWidth;

  canvas.height =
    window.innerHeight;
}

window.addEventListener(
  "resize",
  resizeCanvas
);

resizeCanvas();

/* =========================
   AUDIO ANALYSER
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
   VISUALIZER TOGGLE
========================= */

vizToggle.onclick = async () => {

  if(audioCtx.state === "suspended"){
    await audioCtx.resume();
  }

  visualizerEnabled =
    !visualizerEnabled;

  canvas.classList.toggle(
    "active",
    visualizerEnabled
  );

  vizToggle.classList.toggle(
    "active",
    visualizerEnabled
  );
};

/* =========================
   VISUALIZER DRAW
========================= */

function drawVisualizer(){

  requestAnimationFrame(
    drawVisualizer
  );

  if(!visualizerEnabled) return;

  analyser.getByteFrequencyData(
    dataArray
  );

  for(let i=0;i<bufferLength;i++){

    smoothArray[i] =
      smoothArray[i] * 0.82 +
      dataArray[i] * 0.18;
  }

  ctx.fillStyle =
    "rgba(0,0,0,0.12)";

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  const centerX =
    canvas.width / 2;

  const centerY =
    canvas.height / 2;

  /* =========================
     BASS
  ========================= */

  let bass = 0;

  for(let i=0;i<40;i++){
    bass += smoothArray[i];
  }

  bass /= 40;

  const baseRadius =
    Math.min(
      canvas.width,
      canvas.height
    ) * 0.12;

  const radius =
    baseRadius +
    bass * 0.22;

  /* =========================
     ALBUM ART
  ========================= */

  if(cover.complete){

    ctx.save();

    ctx.beginPath();

    ctx.arc(
      centerX,
      centerY,
      radius,
      0,
      Math.PI * 2
    );

    ctx.clip();

    ctx.drawImage(
      cover,
      centerX - radius,
      centerY - radius,
      radius * 2,
      radius * 2
    );

    ctx.restore();
  }

  /* =========================
     VISUALIZER RING
  ========================= */

  const bars = 420;

  const hueShift =
    Date.now() * 0.02;

  for(let i=0;i<bars;i++){

    const angle =
      (i / bars) *
      Math.PI * 2;

    const freq =
      Math.floor(
        (i / bars) * 220
      );

    const amp =
      smoothArray[freq] / 255;

    const spike =
      amp *
      Math.min(
        canvas.width,
        canvas.height
      ) *
      0.22;

    const x1 =
      centerX +
      Math.cos(angle) *
      radius;

    const y1 =
      centerY +
      Math.sin(angle) *
      radius;

    const x2 =
      centerX +
      Math.cos(angle) *
      (radius + spike);

    const y2 =
      centerY +
      Math.sin(angle) *
      (radius + spike);

    const hue =
      (
        (i * 360 / bars) +
        hueShift
      ) % 360;

    ctx.strokeStyle =
      `hsl(${hue},100%,50%)`;

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.moveTo(x1,y1);

    ctx.lineTo(x2,y2);

    ctx.stroke();
  }

  /* =========================
     GLOW
  ========================= */

  ctx.beginPath();

  ctx.arc(
    centerX,
    centerY,
    radius + 8,
    0,
    Math.PI * 2
  );

  ctx.strokeStyle =
    `rgba(255,255,255,${
      0.08 + bass / 900
    })`;

  ctx.lineWidth = 4;

  ctx.stroke();
}

drawVisualizer();

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

const grid =
  document.getElementById("grid");

const songs =
  document.getElementById("songs");

const player =
  document.getElementById("player");

const songSearch =
  document.getElementById("songSearch");

const now =
  document.getElementById("now");

const cover =
  document.getElementById("cover");

const coverBig =
  document.getElementById("coverBig");

const songTitle =
  document.getElementById("songTitle");

const artistName =
  document.getElementById("artistName");

const progMini =
  document.getElementById("progMini");

const progFull =
  document.getElementById("progFull");

const barMini =
  document.getElementById("barMini");

const barFull =
  document.getElementById("barFull");

const time =
  document.getElementById("time");

const shuffleBtn =
  document.getElementById("shuffleBtn");

const shuffleBtnFS =
  document.getElementById("shuffleBtnFS");

const loopBtn =
  document.getElementById("loopBtn");

const loopBtnFS =
  document.getElementById("loopBtnFS");

const loopState =
  document.getElementById("loopState");

const backBtn =
  document.getElementById("backBtn");

/* =========================
   URL FIX
========================= */

function cleanURL(){

  const fixed =
    location.href.replace(
      /\+/g,
      "%20"
    );

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
    .forEach(([k,v])=>{

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

  document
    .getElementById("title")
    .innerText = text;

  document.title =
    text + " - MusicPlayer";
}

/* =========================
   ARTIST MODE
========================= */

function enterArtistMode(){

  grid.style.display = "none";

  songs.style.display = "grid";

  songSearch.style.display =
    "block";

  backBtn.style.display =
    "inline-block";

  songs.innerHTML = "";

  songElements = [];

  player.style.display =
    "none";

  window.scrollTo(0,0);
}

/* =========================
   LOAD ARTIST
========================= */

function loadArtist(
  name,
  skipURL=false,
  autoSong=null
){

  artist = name;

  fetch(`./${name}/config.json`)
    .then(r => r.json())
    .then(data => {

      enterArtistMode();

      setPageTitle(data.artist);

      if(!skipURL){
        setURL({ name });
      }

      allSongs =
        data.songs.map((s,i)=>({
          ...s,
          _id:i
        }));

      renderSongs(allSongs);

      if(autoSong !== null){

        const target =
          allSongs.find(
            s => s._id === autoSong
          );

        if(target){

          setTimeout(()=>{

            playSong(
              allSongs,
              target._id,
              name
            );

          },0);
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

    el.dataset.id = s._id;

    el.innerHTML = `
      <img src="./${artist}/${s.image}">
      <div>${s.title}</div>
    `;

    el.onclick = ()=>{

      playSong(
        allSongs,
        s._id,
        artist
      );
    };

    songs.appendChild(el);

    songElements.push(el);
  });

  updateHighlights();
}

/* =========================
   PLAY SONG
========================= */

function playSong(l,i,a){

  list = l;

  index = i;

  artist = a;

  const s =
    list.find(x => x._id === i);

  if(!s) return;

  audio.src =
    `./${a}/${s.file}`;

  audio.currentTime = 0;

  audio.play().catch(()=>{});

  player.style.display =
    "block";

  now.innerText = s.title;

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

  visibleSongs.forEach(el => {

    const id =
      Number(el.dataset.id);

    if(id === index){
      el.classList.add("active");
    }

    if(id > index){
      el.classList.add("queue");
    }
  });
}

/* =========================
   CONTROLS
========================= */

function togglePlay(){

  if(audioCtx.state === "suspended"){
    audioCtx.resume();
  }

  if(audio.paused){
    audio.play();
  }
  else{
    audio.pause();
  }
}

/* =========================
   SMART SHUFFLE
========================= */

function nextSong(){

  if(!list.length) return;

  if(shuffle){

    let available =
      list
        .map((_,i)=>i)
        .filter(i =>

          i !== index &&

          !recentShuffleHistory
            .includes(i)
        );

    if(available.length === 0){

      available =
        list
          .map((_,i)=>i)
          .filter(i => i !== index);
    }

    const n =
      available[
        Math.floor(
          Math.random() *
          available.length
        )
      ];

    recentShuffleHistory.push(n);

    if(
      recentShuffleHistory.length > 3
    ){
      recentShuffleHistory.shift();
    }

    playSong(
      list,
      n,
      artist
    );

    return;
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

  if(!shuffle){
    recentShuffleHistory = [];
  }

  updateButtons();
}

function toggleLoop(){

  if(loopMode === "none"){
    loopMode = "queue";
  }
  else if(loopMode === "queue"){
    loopMode = "song";
  }
  else{
    loopMode = "none";
  }

  updateButtons();
}

/* =========================
   ENDED
========================= */

audio.addEventListener(
  "ended",
  ()=>{

    if(loopMode === "song"){

      audio.currentTime = 0;

      audio.play();

      return;
    }

    nextSong();
  }
);

/* =========================
   PLAY BUTTONS
========================= */

function updatePlayButtons(){

  const playing =
    !audio.paused;

  document
    .querySelectorAll("button")
    .forEach(btn => {

      if(
        btn.innerText === "⏯" ||
        btn.innerText === "⏸" ||
        btn.innerText === "▶"
      ){

        btn.innerText =
          playing
            ? "⏸"
            : "▶";
      }
    });
}

audio.addEventListener(
  "play",
  updatePlayButtons
);

audio.addEventListener(
  "pause",
  updatePlayButtons
);

/* =========================
   PROGRESS
========================= */

audio.addEventListener(
  "timeupdate",
  ()=>{

    if(!audio.duration) return;

    const p =
      (audio.currentTime /
      audio.duration) * 100;

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
    ((e.clientX - r.left)
      / r.width) *
    audio.duration;
};

barFull.onclick = e => {

  const r =
    barFull.getBoundingClientRect();

  audio.currentTime =
    ((e.clientX - r.left)
      / r.width) *
    audio.duration;
};

/* =========================
   BUTTON UI
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

  loopState.innerText =

    loopMode === "none"

      ? "Loop: Off"

      : loopMode === "song"

        ? "Loop: Song"

        : "Loop: Queue";
}

/* =========================
   FULLSCREEN
========================= */

function toggleFullscreen(){

  if(!player) return;

  if(!document.fullscreenElement){

    player.classList.add(
      "fullscreen"
    );

    document.body.classList.add(
      "fullscreen-active"
    );

    document
      .documentElement
      .requestFullscreen?.();

  } else {

    document.exitFullscreen?.();
  }
}

window.toggleFullscreen =
  toggleFullscreen;

document.addEventListener(
  "fullscreenchange",
  ()=>{

    if(!document.fullscreenElement){

      player.classList.remove(
        "fullscreen"
      );

      document.body.classList.remove(
        "fullscreen-active"
      );
    }
  }
);

/* =========================
   MEDIA SESSION
========================= */

function updateMediaSession(song){

  if(
    !("mediaSession" in navigator)
  ) return;

  navigator.mediaSession.metadata =
    new MediaMetadata({

      title: song.title,

      artist: artist,

      album: artist,

      artwork: [{

        src:
          `./${artist}/${song.image}`,

        sizes: "512x512",

        type: "image/png"
      }]
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

      Promise.all(

        artists.map(name =>

          fetch(
            `./${name}/config.json`
          )
          .then(r => r.json())
          .then(data => ({
            name,
            data
          }))
        )

      ).then(results => {

        results.forEach(
          ({name,data}) => {

          const card =
            document.createElement("div");

          card.className = "card";

          card.innerHTML = `
            <img src="./${name}/${data.image}">
            <div>${data.artist}</div>
          `;

          card.onclick =
            ()=>loadArtist(name);

          grid.appendChild(card);
        });
      });
    });

} else {

  const songIndex =

    songParam
      ? parseInt(songParam)
      : null;

  loadArtist(
    artistParam,
    true,
    songIndex
  );

  setTimeout(()=>{

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