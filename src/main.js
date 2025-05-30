// Script.js - Full Version
console.log("Script Js Initializing");

let currentSong = new Audio();
let songs;
let currFolder;

const play = document.getElementById("play");
const previous = document.getElementById("previous");
const next = document.getElementById("next");
const unmute = document.getElementById("unmute");

function secondsToMinutesSeconds(seconds) {
  if (isNaN(seconds) || seconds < 0) return "00:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
}

async function getsongs(folder) {
  currFolder = folder;
  let a = await fetch(`${currFolder}/info.json`);
  let response = await a.json();
  songs = response.songs;

  let songsUL = document.querySelector(".songList ul");
  songsUL.innerHTML = "";

  for (const song of songs) {
    const songName = song.split("-")[1].split(".mp3")[0].trim();
    const songArtist = song.split("-")[0].trim();
    songsUL.innerHTML += `
      <li>
        <img class="invert" src="img/music.svg" alt="">
        <div class="info">
          <div class="songName">${songName}</div>
          <div class="songArtist">${songArtist}</div>
          <div class="songPath">${song}</div>
        </div>
        <div class="playNow">
          <span>Play Now</span>
          <img class="invert" src="/img/play.svg" alt="">
        </div>
      </li>
    `;
  }

  Array.from(
    document.querySelector(".songList").getElementsByTagName("li")
  ).forEach((e) => {
    e.addEventListener("click", () => {
      playMusic(e.querySelector(".info .songPath").innerHTML);
    });
  });

  return songs;
}

const playMusic = (track, pause = false) => {
  // Encode the file name for URL safety
  const encodedTrack = encodeURIComponent(track);
  const songPath = `${currFolder}/${encodedTrack}`;

  currentSong.src = songPath;

  // Display song name (remove .mp3 and decode safely)
  const displayName = decodeURIComponent(
    track.split(".mp3")[0].replace(/%26/g, "&").trim()
  );

  document.querySelector(".songInfo").innerText = displayName;
  document.querySelector(".songTime").innerText = "00:00 / 00:00";

  if (!pause) {
    currentSong.play().then(() => {
      play.src = "/img/pause.svg";
    }).catch(err => {
      console.warn("Autoplay failed or user interaction required", err);
    });
  }
};


async function displayAlbums() {
  let cardContainer = document.querySelector(".cardContainer");

  try {
    let res = await fetch("/songs/albums.json");
    let albumFolders = await res.json();

    for (let folder of albumFolders) {
      try {
        let metadataRes = await fetch(`/songs/${folder}/info.json`);
        let metadata = await metadataRes.json();

        cardContainer.innerHTML += `
          <div data-folder="${folder}" class="card">
              <div class="play">
                <svg width="50" height="50" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="50" cy="50" r="45" fill="#1fdf64" />
                  <polygon points="40,30 40,70 70,50" fill="black" />
                </svg>
              </div>
              <img src="/songs/${folder}/cover.jpg" alt="" />
              <h2>${metadata.title}</h2>
              <p>${metadata.description}</p>
          </div>`;
      } catch (err) {
        console.warn(`Could not load metadata for ${folder}`);
      }
    }

    // Attach click listeners
    Array.from(document.getElementsByClassName("card")).forEach((e) => {
      e.addEventListener("click", async (item) => {
        songs = await getsongs(`/songs/${item.currentTarget.dataset.folder}`);
        playMusic(songs[0], false);
      });
    });
  } catch (err) {
    console.error("Could not load albums.json:", err);
  }
}

async function main() {
  await getsongs("/songs/atbsm");
  playMusic(songs[0], true);
  displayAlbums();

  play.addEventListener("click", () => {
    if (currentSong.paused) {
      currentSong.play();
      play.src = "/img/pause.svg";
    } else {
      currentSong.pause();
      play.src = "/img/play.svg";
    }
  });

  currentSong.addEventListener("timeupdate", () => {
    document.querySelector(".songTime").innerHTML = `${secondsToMinutesSeconds(
      currentSong.currentTime
    )} / ${secondsToMinutesSeconds(currentSong.duration)}`;
    if (!isNaN(currentSong.duration)) {
      document.querySelector(".circle").style.left =
        (currentSong.currentTime / currentSong.duration) * 100 + "%";
    }
  });

  document.querySelector(".seekBar").addEventListener("click", (e) => {
    let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
    document.querySelector(".circle").style.left = percent + "%";
    currentSong.currentTime = (currentSong.duration * percent) / 100;
  });

  document.querySelector(".hamburger").addEventListener("click", () => {
    document.querySelector(".left").style.left = "0";
  });

  document.querySelector(".close").addEventListener("click", () => {
    document.querySelector(".left").style.left = "-120%";
  });

  previous.addEventListener("click", () => {
    currentSong.pause();
    let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
    if (index - 1 >= 0) {
      playMusic(songs[index - 1]);
    } else {
      playMusic(songs[songs.length - 1]);
    }
  });

  next.addEventListener("click", () => {
    currentSong.pause();
    let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
    if (index + 1 < songs.length) {
      playMusic(songs[index + 1]);
    } else {
      playMusic(songs[0]);
    }
  });

  document.querySelector(".range input").addEventListener("change", (e) => {
    currentSong.volume = parseInt(e.target.value) / 100;
    if (currentSong.muted) {
      currentSong.muted = false;
      unmute.src = "/img/volume.svg";
    }
  });

  unmute.addEventListener("click", () => {
    currentSong.muted = !currentSong.muted;
    if (currentSong.muted) {
      unmute.src = "/img/mute.svg";
      document.querySelector(".range input").value = 0;
    } else {
      unmute.src = "/img/volume.svg";
      document.querySelector(".range input").value = 40;
    }
  });

  document.addEventListener("keydown", (e) => {
    if (
      e.code === "Space" &&
      !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)
    ) {
      e.preventDefault();
      if (currentSong.paused) {
        currentSong.play();
        play.src = "/img/pause.svg";
      } else {
        currentSong.pause();
        play.src = "/img/play.svg";
      }
    }
  });

  currentSong.addEventListener("ended", () => {
    let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
    if (index + 1 < songs.length) {
      playMusic(songs[index + 1]);
    } else {
      playMusic(songs[0]);
    }
  });
}

main();
