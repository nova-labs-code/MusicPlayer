/* =========================
   ELEMENTS
========================= */

const grid = document.getElementById("grid");
const songs = document.getElementById("songs");
const searchInput = document.getElementById("songSearch");

const audio = document.getElementById("audio");

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

const player = document.getElementById("player");

/* =========================
   STATE
========================= */

let artistsData = [];
let allSongs = [];

let list = [];
let index = 0;
let artist = "";

let currentCategory = "artists";

let shuffle = false;
let loopMode = "none";

/* 🔥 no-repeat memory */
let lastPlayed = [];
const NO_REPEAT_BUFFER = 3;

/* =========================
   VISUALIZER STATE
========================= */

let visualizerEnabled = false;

const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

function resize(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();

canvas.style.display = "none";

/* =========================
   AUDIO ENGINE
========================= */

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 32768;

const source = audioCtx.createMediaElementSource(audio);
source.connect(analyser);
analyser.connect(audioCtx.destination);

const bufferLength = analyser.frequencyBinCount;
const dataArray = new Uint8Array(bufferLength);
const smoothArray = new Float32Array(bufferLength);

/* unlock audio */
document.addEventListener("click", () => {
  if(audioCtx.state === "suspended"){
    audioCtx.resume();
  }
});

/* =========================
   VISUALIZER (YOUR STYLE)
========================= */

const actualBars = 15000;
const maxFreq = 1200;

function draw(){
  requestAnimationFrame(draw);

  if(!visualizerEnabled) return;

  analyser.getByteFrequencyData(dataArray);

  for(let i = 0; i < bufferLength; i++){
    smoothArray[i] =
      smoothArray[i] * 0.7 +
      dataArray[i] * 0.3;
  }

  const cx = canvas.width / 2;
  const cy = canvas.height / 2;

  const base = Math.min(canvas.width, canvas.height) * 0.12;
  let radius;

  ctx.fillStyle = "#000";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  let bass = 0;
  for(let i = 0; i < 60; i++) bass += smoothArray[i];
  bass /= 60;

  radius = base + (bass/255) * base * 0.5;

  const hueShift = Date.now() * 0.02;

  for(let i = 0; i < actualBars; i++){

    const angle = (i / actualBars) * Math.PI * 2;
    const freq = Math.floor((i / actualBars) * maxFreq);

    const spike =
      (smoothArray[freq]/255) * base * 1.5 +
      bass * 0.2;

    const x1 = cx + Math.cos(angle) * radius;
    const y1 = cy + Math.sin(angle) * radius;

    const x2 = cx + Math.cos(angle) * (radius + spike);
    const y2 = cy + Math.sin(angle) * (radius + spike);

    ctx.strokeStyle =
      `hsl(${(i*360/actualBars + hueShift)%360},100%,50%)`;

    ctx.lineWidth = 0.35;

    ctx.beginPath();
    ctx.moveTo(x1,y1);
    ctx.lineTo(x2,y2);
    ctx.stroke();
  }

  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(cx,cy,radius*0.9,0,Math.PI*2);
  ctx.fill();
}

draw();

/* =========================
   VISUAL TOGGLE
========================= */

function toggleVisualizer(){
  visualizerEnabled = !visualizerEnabled;
  canvas.style.display = visualizerEnabled ? "block" : "none";
  updateButtons();
}

/* =========================
   CATEGORY SWITCH
========================= */

document.querySelectorAll(".cat").forEach(btn=>{
  btn.onclick = () => {
    document.querySelectorAll(".cat").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    currentCategory = btn.dataset.type;
    runSearch();
  };
});

/* =========================
   LOAD DATA
========================= */

async function loadData(){

  const artistList =
    await fetch("./Artist/artist.json")
    .then(r=>r.json());

  for(const name of artistList){

    const config =
      await fetch(`./Artist/${name}/config.json`)
      .then(r=>r.json());

    artistsData.push({
      name,
      displayName: config.artist,
      image: config.image,
      songs: config.songs
    });

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="./Artist/${name}/${config.image}">
      <div>${config.artist}</div>
    `;

    card.onclick = () => {
      location.href =
        `./Artist/?name=${encodeURIComponent(name)}`;
    };

    grid.appendChild(card);
  }

  runSearch();
}

loadData();

/* =========================
   SEARCH
========================= */

function debounce(fn, d=120){
  let t;
  return (...a)=>{
    clearTimeout(t);
    t = setTimeout(()=>fn(...a),d);
  };
}

const runSearch = debounce(()=>{

  const q = searchInput.value.toLowerCase();

  const results = document.getElementById("results");

  results.innerHTML = "";
  grid.style.display = "none";
  results.style.display = "grid";

  if(!q){

    for(const a of artistsData){

      if(currentCategory==="artists"){
        results.appendChild(makeArtist(a));
      }

      if(currentCategory==="music"){
        a.songs.forEach((s,i)=>{
          results.appendChild(makeSong(a,s,i));
        });
      }
    }

    return;
  }

  for(const a of artistsData){

    const match =
      a.displayName.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q);

    if(currentCategory==="artists" && match){
      results.appendChild(makeArtist(a));
    }

    if(currentCategory==="music"){
      a.songs.forEach((s,i)=>{
        if(s.title.toLowerCase().includes(q)){
          results.appendChild(makeSong(a,s,i));
        }
      });
    }
  }

},120);

searchInput.addEventListener("input", runSearch);

/* =========================
   CARD BUILDERS
========================= */

function makeArtist(a){
  const el = document.createElement("div");
  el.className="card";

  el.innerHTML=`
    <img src="./Artist/${a.name}/${a.image}">
    <div>${a.displayName}</div>
  `;

  el.onclick=()=>{
    location.href=
      `./Artist/?name=${encodeURIComponent(a.name)}`;
  };

  return el;
}

function makeSong(a,s,i){
  const el=document.createElement("div");
  el.className="card";

  el.innerHTML=`
    <img src="./Artist/${a.name}/${s.image}">
    <div>${s.title}</div>
    <small>${a.displayName}</small>
  `;

  el.onclick=()=>{
    location.href=
      `./Artist/?name=${encodeURIComponent(a.name)}&song=${i+1}`;
  };

  return el;
}

/* =========================
   PLAYER CORE
========================= */

function playSong(l,i,a){

  list=l;
  index=i;
  artist=a;

  const s=list[i];
  if(!s) return;

  audio.src=`./Artist/${a}/${s.file}`;
  audio.currentTime=0;
  audio.play().catch(()=>{});

  now.innerText=s.title;
  cover.src=`./Artist/${a}/${s.image}`;
  coverBig.src=`./Artist/${a}/${s.image}`;

  songTitle.innerText=s.title;
  artistName.innerText=a;

  registerPlay(i);
}

/* =========================
   NO REPEAT SHUFFLE MEMORY
========================= */

function registerPlay(i){
  lastPlayed.push(i);
  if(lastPlayed.length>NO_REPEAT_BUFFER){
    lastPlayed.shift();
  }
}

function getRandomIndex(){
  let n;

  do{
    n=Math.floor(Math.random()*list.length);
  }while(lastPlayed.includes(n) && list.length>NO_REPEAT_BUFFER);

  return n;
}

/* =========================
   CONTROLS
========================= */

function togglePlay(){
  audio.paused ? audio.play() : audio.pause();
}

function nextSong(){

  if(shuffle){
    return playSong(list,getRandomIndex(),artist);
  }

  if(index<list.length-1){
    playSong(list,index+1,artist);
  } else if(loopMode==="queue"){
    playSong(list,0,artist);
  }
}

function prevSong(){
  if(index>0) playSong(list,index-1,artist);
}

/* =========================
   LOOP
========================= */

function toggleLoop(){
  loopMode =
    loopMode==="none"?"queue":
    loopMode==="queue"?"song":"none";

  updateButtons();
}

/* =========================
   END EVENT
========================= */

audio.addEventListener("ended",()=>{
  if(loopMode==="song"){
    audio.currentTime=0;
    audio.play();
  } else nextSong();
});

/* =========================
   PROGRESS
========================= */

audio.addEventListener("timeupdate",()=>{

  if(!audio.duration)return;

  const p=(audio.currentTime/audio.duration)*100;

  progMini.style.width=p+"%";
  progFull.style.width=p+"%";

  const m=Math.floor(audio.currentTime/60);
  const s=Math.floor(audio.currentTime%60);

  time.innerText=`${m}:${s<10?"0":""}${s}`;
});

/* seek */
barMini.onclick=e=>{
  const r=barMini.getBoundingClientRect();
  audio.currentTime=((e.clientX-r.left)/r.width)*audio.duration;
};

barFull.onclick=e=>{
  const r=barFull.getBoundingClientRect();
  audio.currentTime=((e.clientX-r.left)/r.width)*audio.duration;
};

/* =========================
   BUTTON STATE
========================= */

function updateButtons(){
  document.getElementById("visualBtn")
    ?.classList.toggle("active",visualizerEnabled);

  document.getElementById("visualBtnFS")
    ?.classList.toggle("active",visualizerEnabled);
}

/* =========================
   INIT FROM URL
========================= */

const params=new URLSearchParams(location.search);
const artistParam=params.get("name");
const songParam=parseInt(params.get("song"));

if(artistParam){
  loadArtist(artistParam,true,songParam);
}

/* expose */
window.toggleVisualizer=toggleVisualizer;