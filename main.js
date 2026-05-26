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

const loopState = document.getElementById("loopState");

const backBtn = document.getElementById("backBtn");

/* =========================
   URL CLEAN (+ → %20)
========================= */

function cleanURL(){
  const fixed = location.href.replace(/\+/g, "%20");
  if(fixed !== location.href){
    history.replaceState({}, "", fixed);
  }
}
setInterval(cleanURL, 1000);
cleanURL();

function getParam(name){
  return new URLSearchParams(location.search).get(name);
}

function setURL(obj){
  const url = new URL(location.href);
  Object.entries(obj).forEach(([k,v]) => url.searchParams.set(k,v));
  history.pushState({}, "", url.toString());
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
   SHUFFLE HELPER
========================= */

function shuffleArray(arr){
  const a = [...arr];
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

/* =========================
   HOME RESET
========================= */

function resetHomeUI(){
  grid.style.display = "grid";
  songs.style.display = "none";
  songSearch.style.display = "none";
  backBtn.style.display = "none";
  player.style.display = "none";

  allSongs = [];
  songElements = [];
  list = [];
  artist = "";

  setPageTitle("Artists");
}

/* =========================
   ENTER ARTIST MODE
========================= */

function enterArtistUI(){
  grid.style.display = "none";
  songs.style.display = "grid";
  songSearch.style.display = "block";
  backBtn.style.display = "inline-block";
}

/* =========================
   LOAD ARTIST
========================= */

function loadArtist(name, skipURL=false, autoSong=null){

  artist = name;

  fetch(`./${name}/config.json`)
    .then(r=>r.json())
    .then(data=>{

      enterArtistUI();
      setPageTitle(data.artist);

      if(!skipURL){
        setURL({ name });
      }

      allSongs = shuffleArray(data.songs).map((s,i)=>({
        ...s,
        _id:i
      }));

      renderSongs(allSongs);

      if(autoSong !== null){

        const target = allSongs.find(s =>
          (s.file || "").includes(`song${autoSong}`)
        );

        if(target){
          setTimeout(()=>{
            playSong(allSongs, target._id, name);
          },0);
        }
      }

    })
    .catch(err=>{
      console.error(err);
      now.innerText = "Failed to load artist";
    });
}

/* =========================
   RENDER SONGS
========================= */

function renderSongs(arr){

  songs.innerHTML = "";
  songElements = [];

  arr.forEach(s=>{

    const el=document.createElement("div");
    el.className="song";

    el.innerHTML=`
      <img src="./${artist}/${s.image}">
      <div>${s.title}</div>
    `;

    el.onclick=()=>playSong(allSongs,s._id,artist);

    songs.appendChild(el);
    songElements.push(el);
  });
}

/* =========================
   PLAY SONG
========================= */

function playSong(l,i,a){

  list=l;
  index=i;
  artist=a;

  const s=list[i];

  audio.src=`./${a}/${s.file}`;
  audio.currentTime=0;
  audio.play();

  player.style.display="block";

  now.innerText=s.title;
  cover.src=`./${a}/${s.image}`;
  coverBig.src=`./${a}/${s.image}`;

  songTitle.innerText=s.title;
  artistName.innerText=a;

  updateButtons();
  updateHighlights();
  updateMediaSession(s);
}

/* =========================
   SEARCH
========================= */

songSearch?.addEventListener("input",e=>{

  const q=e.target.value.toLowerCase();

  renderSongs(
    allSongs.filter(s=>
      s.title.toLowerCase().includes(q)
    )
  );
});

/* =========================
   HIGHLIGHTS
========================= */

function updateHighlights(){

  songElements.forEach((el,i)=>{
    el.classList.remove("active","queue");
    if(i===index) el.classList.add("active");
    if(i>index) el.classList.add("queue");
  });
}

/* =========================
   CONTROLS
========================= */

function toggleShuffle(){
  shuffle=!shuffle;
  updateButtons();
}

function toggleLoop(){
  loopMode=
    loopMode==="none"?"song":
    loopMode==="song"?"queue":
    "none";

  updateButtons();
}

function nextSong(){
  if(shuffle){
    let n;
    do{
      n=Math.floor(Math.random()*list.length);
    }while(list.length>1&&n===index);
    return playSong(list,n,artist);
  }

  if(index<list.length-1){
    playSong(list,index+1,artist);
  }
  else if(loopMode==="queue"){
    playSong(list,0,artist);
  }
}

function prevSong(){
  if(audio.currentTime>5){
    audio.currentTime=0;
    return;
  }

  if(index>0){
    playSong(list,index-1,artist);
  }
}

/* =========================
   UI BUTTONS
========================= */

function updateButtons(){

  shuffleBtn?.classList.toggle("active",shuffle);
  shuffleBtnFS?.classList.toggle("active",shuffle);

  loopBtn?.classList.toggle("loop-active",loopMode!=="none");
  loopBtnFS?.classList.toggle("loop-active",loopMode!=="none");

  loopState.innerText=
    loopMode==="none"?"Loop: Off":
    loopMode==="song"?"Loop: Song":
    "Loop: Queue";
}

/* =========================
   PROGRESS
========================= */

audio.addEventListener("timeupdate",()=>{

  if(!audio.duration) return;

  const p=(audio.currentTime/audio.duration)*100;

  progMini.style.width=p+"%";
  progFull.style.width=p+"%";

  const m=Math.floor(audio.currentTime/60);
  const s=Math.floor(audio.currentTime%60);

  time.innerText=`${m}:${s<10?"0":""}${s}`;
});

/* =========================
   END
========================= */

audio.addEventListener("ended",()=>{
  if(loopMode==="song"){
    audio.currentTime=0;
    audio.play();
    return;
  }
  nextSong();
});

/* =========================
   ROUTING
========================= */

const artistParam=getParam("name");
const songParam=getParam("song");

if(!artistParam){
  resetHomeUI();

  fetch("artist.json")
    .then(r=>r.json())
    .then(artists=>{

      artists.forEach(name=>{

        fetch(`./${name}/config.json`)
          .then(r=>r.json())
          .then(data=>{

            const card=document.createElement("div");
            card.className="card";

            card.innerHTML=`
              <img src="./${name}/${data.image}">
              <div>${data.artist}</div>
            `;

            card.onclick=()=>loadArtist(name);

            grid.appendChild(card);
          });
      });
    });

} else {

  const songIndex = songParam ? parseInt(songParam) : null;

  loadArtist(artistParam,true,songIndex);

  setTimeout(()=>{
    const url=new URL(location.href);
    url.searchParams.delete("song");
    history.replaceState({}, "", url.toString());
  },0);
}
