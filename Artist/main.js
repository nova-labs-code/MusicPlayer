let audio = new Audio();
let list=[], index=0, artist="";

let shuffle=false;
let loopMode="none";

let songElements=[];

/* NAV */
function goHome(){
  location.href="https://nova-labs-code.github.io/MusicPlayer";
}

function goBack(){
  location.href="?";
}

/* TITLE */
function setPageTitle(t){
  title.innerText=t;
  document.title=t+" - MusicPlayer";
}

/* UI */
function updateButtons(){

  shuffleBtn.classList.toggle("active", shuffle);
  shuffleBtnFS.classList.toggle("active", shuffle);

  loopBtn.classList.toggle("loop-active", loopMode!=="none");
}

/* SONG HIGHLIGHT */
function updateSongHighlights(){

  songElements.forEach((el,i)=>{

    el.classList.remove("active","queue");

    if(i===index) el.classList.add("active");
    if(i>index) el.classList.add("queue");

  });
}

/* PLAY */
function playSong(l,i,a){

  list=l;
  index=i;
  artist=a;

  let s=l[i];

  audio.src=`./${a}/${s.file}`;
  audio.play();

  player.style.display="block";

  now.innerText=s.title;
  cover.src=`./${a}/${s.image}`;
  coverBig.src=`./${a}/${s.image}`;

  songTitle.innerText=s.title;
  artistName.innerText=a;

  document.title=`${s.title} - MusicPlayer`;

  updateButtons();
  updateSongHighlights();
}

/* CONTROLS */
function togglePlay(){
  audio.paused ? audio.play() : audio.pause();
}

function toggleShuffle(){
  shuffle=!shuffle;
  updateButtons();
}

function toggleLoop(){
  loopMode = loopMode==="none" ? "song" :
             loopMode==="song" ? "queue" : "none";

  updateButtons();
}

function nextSong(){

  if(shuffle){
    let n;
    do{
      n=Math.floor(Math.random()*list.length);
    }while(list.length>1 && n===index);

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
  if(index>0) playSong(list,index-1,artist);
}

/* END */
audio.addEventListener("ended",()=>{

  if(loopMode==="song"){
    audio.currentTime=0;
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
  }else{
    document.exitFullscreen?.();
  }
}

document.addEventListener("fullscreenchange",()=>{
  if(!document.fullscreenElement){
    player.classList.remove("fullscreen");
  }
});

/* SYNC */
audio.addEventListener("timeupdate",()=>{

  let pct=(audio.currentTime/audio.duration)*100;

  progMini.style.width=pct+"%";
  progFull.style.width=pct+"%";

  let m=Math.floor(audio.currentTime/60);
  let s=Math.floor(audio.currentTime%60);

  time.innerText=`${m}:${s<10?"0":""}${s}`;
});

/* SEEK */
barMini.onclick=e=>{
  let r=barMini.getBoundingClientRect();
  audio.currentTime=((e.clientX-r.left)/r.width)*audio.duration;
};

barFull.onclick=e=>{
  let r=barFull.getBoundingClientRect();
  audio.currentTime=((e.clientX-r.left)/r.width)*audio.duration;
};

/* ROUTE */
const params=new URLSearchParams(location.search);
const artistName=params.get("name");

/* HOME */
if(!artistName){

  setPageTitle("🎧 Artists");

  backBtn.style.display="none";

  fetch("artist.json")
    .then(r=>r.json())
    .then(a=>{

      a.forEach(name=>{

        fetch(`./${name}/config.json`)
          .then(r=>r.json())
          .then(d=>{

            let c=document.createElement("div");
            c.className="card";

            c.innerHTML=`
              <img src="./${name}/${d.image}">
              <div>${d.artist}</div>
            `;

            c.onclick=()=>location.href=`?name=${name}`;

            grid.appendChild(c);
          });

      });

    });

}

/* ARTIST */
else{

  backBtn.style.display="inline-block";

  grid.style.display="none";
  songs.style.display="grid";

  fetch(`./${artistName}/config.json`)
    .then(r=>r.json())
    .then(d=>{

      setPageTitle(d.artist);

      d.songs.forEach((s,i)=>{

        let el=document.createElement("div");
        el.className="song";

        el.innerHTML=`
          <img src="./${artistName}/${s.image}">
          <div>${s.title}</div>
        `;

        el.onclick=()=>playSong(d.songs,i,artistName);

        songs.appendChild(el);
        songElements.push(el);
      });

    });

}
