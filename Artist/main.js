
/* AUDIO CORE */
let audio = new Audio();

let list = [];
let index = 0;
let artist = "";

let shuffle = false;
let loopMode = "none";

let songElements = [];

/* NAV */
function goHome(){
  location.href = "https://nova-labs-code.github.io/MusicPlayer";
}

function goBack(){
  location.href = "?";
}

/* TITLE SYSTEM */
function setPageTitle(text){
  document.getElementById("title").innerText = text;
  document.title = text + " - MusicPlayer";
}

/* LOOP TEXT */
function getLoopText(){
  if(loopMode === "none") return "Loop: Off";
  if(loopMode === "song") return "Loop: Current Song";
  return "Loop: Queue";
}

/* UI UPDATE */
function updateButtons(){

  // shuffle
  shuffleBtn.classList.toggle("active", shuffle);
  shuffleBtnFS.classList.toggle("active", shuffle);

  // loop (mini + fullscreen)
  [loopBtn, loopBtnFS].forEach(btn => {

    btn.classList.toggle("loop-active", loopMode !== "none");
    btn.title = getLoopText();

  });

  // fullscreen loop text
  if(loopState){
    loopState.innerText = getLoopText();
  }
}

/* SONG HIGHLIGHTS */
function updateSongHighlights(){

  songElements.forEach((el, i) => {

    el.classList.remove("active", "queue");

    if(i === index) el.classList.add("active");
    if(i > index) el.classList.add("queue");

  });
}

/* PLAY SONG */
function playSong(l, i, a){

  list = l;
  index = i;
  artist = a;

  let s = l[i];

  audio.src = `./${a}/${s.file}`;
  audio.currentTime = 0;
  audio.play();

  player.style.display = "block";

  now.innerText = s.title;
  cover.src = `./${a}/${s.image}`;
  coverBig.src = `./${a}/${s.image}`;

  songTitle.innerText = s.title;
  artistName.innerText = a;

  // 🎵 page title = song
  document.title = `${s.title} - MusicPlayer`;

  updateButtons();
  updateSongHighlights();
}

/* CONTROLS */
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

/* NEXT */
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

/* PREV */
function prevSong(){

  if(audio.currentTime > 5){
    audio.currentTime = 0;
    return;
  }

  if(index > 0){
    playSong(list, index - 1, artist);
  }
}

/* END LOGIC */
audio.addEventListener("ended", () => {

  if(loopMode === "song"){
    audio.currentTime = 0;
    audio.play();
    return;
  }

  nextSong();
});

/* FULLSCREEN */
function toggleFullscreen(){

  if(!player.classList.contains("fullscreen")){
    player.classList.add("fullscreen");
    document.documentElement.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

/* EXIT FULLSCREEN FIX */
document.addEventListener("fullscreenchange", () => {

  if(!document.fullscreenElement){
    player.classList.remove("fullscreen");
  }

});

/* PROGRESS SYNC */
audio.addEventListener("timeupdate", () => {

  if(!audio.duration) return;

  let percent = (audio.currentTime / audio.duration) * 100;

  progMini.style.width = percent + "%";
  progFull.style.width = percent + "%";

  let m = Math.floor(audio.currentTime / 60);
  let s = Math.floor(audio.currentTime % 60);

  time.innerText = `${m}:${s < 10 ? "0" : ""}${s}`;
});

/* SEEK */
barMini.onclick = (e) => {
  let r = barMini.getBoundingClientRect();
  audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
};

barFull.onclick = (e) => {
  let r = barFull.getBoundingClientRect();
  audio.currentTime = ((e.clientX - r.left) / r.width) * audio.duration;
};

/* LOOP STATE REF */
let loopState;

window.addEventListener("DOMContentLoaded", () => {
  loopState = document.getElementById("loopState");
});

/* ROUTING */
const params = new URLSearchParams(location.search);
const artistParam = params.get("name");

/* HOME VIEW */
if(!artistParam){

  setPageTitle("🎧 Artists");
  backBtn.style.display = "none";

  fetch("artist.json")
    .then(r => r.json())
    .then(artists => {

      artists.forEach(name => {

        fetch(`./${name}/config.json`)
          .then(r => r.json())
          .then(data => {

            let card = document.createElement("div");
            card.className = "card";

            card.innerHTML = `
              <img src="./${name}/${data.image}">
              <div>${data.artist}</div>
            `;

            card.onclick = () => {
              location.href = `?name=${name}`;
            };

            grid.appendChild(card);

          });

      });

    });

}

/* ARTIST VIEW */
else{

  backBtn.style.display = "inline-block";

  grid.style.display = "none";
  songs.style.display = "grid";

  fetch(`./${artistParam}/config.json`)
    .then(r => r.json())
    .then(data => {

      setPageTitle(data.artist);

      data.songs.forEach((s, i) => {

        let el = document.createElement("div");
        el.className = "song";

        el.innerHTML = `
          <img src="./${artistParam}/${s.image}">
          <div>${s.title}</div>
        `;

        el.onclick = () => playSong(data.songs, i, artistParam);

        songs.appendChild(el);
        songElements.push(el);

      });

    });

}
