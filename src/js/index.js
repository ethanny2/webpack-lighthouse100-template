import "../sass/style.scss";
import "../static/html/index.html";
import sucessSound from "../static/audio/sucess.mp3";
import failureSound from "../static/audio/failure.mp3";

/*
 Distributon of tiles found here
 https://www.thesprucecrafts.com/how-many-letter-tiles-are-in-scrabble-410933
 This distribution doesn't work well for my game where you cannot continue building upon other
 words, frequency has been tuned from base scrabble game
*/
const success = new Audio(sucessSound);
success.muted = true;
const failure = new Audio(failureSound);
failure.muted = true;
const TIMER_SECONDS = 64;
let guessedWords = [];
const tileFrequencies =
  "AAAAAAAAABBBBBCCCCCCDDDDDEEEEEEEEEFFFFFGGGGGHHHHHIIIIIIIIJJJJKKKKKLLLLLLLMMMMMNNNNNNOOOOOOOOPPPPPPQQRRRRRSSSSSTTTTTTTUUUUUUUUVVVWWWWXYZ";
let playTiles; //Array of tiles
const tileValueMap = new Map();
tileValueMap.set("1", ["A", "E", "I", "O", "U", "L", "N", "S", "T", "R"]);
tileValueMap.set("2", ["D", "G"]);
tileValueMap.set("3", ["B", "C", "M", "P"]);
tileValueMap.set("4", ["F", "H", "V", "W", "Y"]);
tileValueMap.set("5", ["K"]);
tileValueMap.set("8", ["J", "X"]);
tileValueMap.set("10", ["Q", "Z"]);

async function checkWord(word) {
  const options = {
    method: "POST",
    body: JSON.stringify({
      word: word
    })
  };
  const request = await fetch("/.netlify/functions/validateWord", options);
  const data = await request.json();
  return data;
}

function getLetterValue(letter) {
  for (const [key, val] of tileValueMap) {
    if (val.find(temp => temp === letter)) {
      return parseInt(key, 10); //10 is radix
    }
  }
}

function displayScoreEffect(points) {
  const anim = document.getElementById("score-animation");
  const converted = Number(points);
  if (converted > 0 && converted <= 3) {
    anim.innerText = "Nice! +" + converted;
    anim.classList.toggle("lowScore", true);
    setTimeout(() => {
      anim.classList.toggle("lowScore");
    }, 500);
  } else if (converted > 3 && converted <= 5) {
    anim.innerText = "Wonderful! +" + converted;
    anim.classList.toggle("midScore", true);
    setTimeout(() => {
      anim.classList.toggle("midScore");
    }, 500);
  } else if (converted > 5) {
    anim.innerText = "Amazing!!! +" + converted;
    anim.classList.toggle("highScore", true);
    setTimeout(() => {
      anim.classList.toggle("highScore");
    }, 500);
  }
}

function addToScore(wordValue) {
  let score = document.getElementById("score");
  let newScore = parseInt(score.innerText, 10) + wordValue;
  if (!isNaN(newScore)) {
    score.innerText = newScore;
    generateTiles(registerTileEvents);
  }
}

async function getWordValue() {
  let score = document.getElementById("score");
  let answerRow = document.getElementById("answer-row");
  let answerLetterArr = Array.from(answerRow.children);
  let total = 0;
  let word = "";
  answerLetterArr.forEach(val => {
    total += parseInt(val.firstElementChild.innerText, 10);
    word += val.innerText.charAt(0);
  });
  let newScore = parseInt(score.innerText, 10) + total;
  word = word.toLowerCase();
  let wordExist = await checkWord(word);
  let wordUsedBefore = guessedWords.includes(word);
  if (!isNaN(newScore) && wordExist && !wordUsedBefore && word.length > 1) {
    addToScore(total);
    displayScoreEffect(total);
    guessedWords.push(word);
    success.play();
  } else {
    answerRow.classList.toggle("wrong", true);
    failure.play();
    setTimeout(() => {
      answerRow.classList.toggle("wrong");
    }, 800);
  }
  return [word, total];
}

/*
  Generates random letters for word based on actual scrabble data.
  100 tiles total , more weight to get vowels than consonants 
  7 tiles total. 
  -callback is to register animationend eventListeners on newly created tiles 
*/
function generateTiles(callback) {
  let temp = "";
  let markup;
  let startRow = document.getElementById("tile-row");
  let answerRow = document.getElementById("answer-row");
  let letterVal = 0;
  //Remove anything there
  while (startRow.firstChild) {
    startRow.removeChild(startRow.firstChild);
  }
  while (answerRow.firstChild) {
    answerRow.removeChild(answerRow.firstChild);
  }

  for (let i = 0; i < 7; i++) {
    temp += tileFrequencies.charAt(
      Math.floor(Math.random() * tileFrequencies.length)
    );
  }
  playTiles = [...temp];
  playTiles.forEach((tile, index) => {
    letterVal = getLetterValue(tile);
    markup = `<li  class="tile tile-${index}" >
    ${tile} 
    <span class="tile-value"> ${letterVal}</span>
    </li>
    <li class="tile tile-${index} tile-clone" >${tile} <span class="tile-value"> ${letterVal}</span></li>
    `;
    startRow.innerHTML += markup;
  });
  callback();
}

/* When tile clicked play animation that adds it to the answer grid */
function insertLetter(tile) {
  //Find class with "-"" in name
  const className = Array.from(tile.classList).find(e => e.includes("-"));
  const cloneTile = document.querySelector(`.${className}.tile-clone`);
  const relativeXPos = tile.offsetLeft;
  const startRect = findAbsPos(tile);
  const width = Number(cloneTile.offsetWidth);
  const height = Number(cloneTile.offsetHeight);
  cloneTile.style.position = "absolute";
  cloneTile.style.left = relativeXPos + "px";
  cloneTile.style.visibility = "inherit";
  cloneTile.style.zIndex = 5;
  tile.classList.toggle("tileHidden");

  let endNode = document.createElement("div");
  endNode.style.height = `${height}px`;
  endNode.style.width = `${width}px`;
  endNode.style.background = "red";
  document.getElementById("answer-row").appendChild(endNode);

  let endRect = findAbsPos(endNode);
  endNode.remove();
  computeVector(startRect, endRect);
  cloneTile.classList.add("setTileAnim");
}

function removeLetter(tile) {
  const className = Array.from(tile.classList).find(e => e.includes("-"));
  const orignalTile = document.querySelector(
    `.tile:not(.tile-clone).${className}`
  );
  const endRect = findAbsPos(orignalTile);
  const startRect = findAbsPos(tile);
  tile.style.left = startRect[0] + "px";
  tile.style.position = "fixed";
  tile.style.zIndex = 5;
  computeVector(startRect, endRect);
  tile.classList.add("removeTileAnim");
}

function endRemoveLetter(tile) {
  const className = Array.from(tile.classList).find(e => e.includes("-"));
  const orignalTile = document.querySelector(
    `.tile:not(.tile-clone).${className}`
  );
  tile.style.cssText = "";
  tile.classList.remove("removeTileAnim");
  orignalTile.classList.toggle("tileHidden");
  document.getElementById("tile-row").append(tile);
}

function endInsertLetter(cloneTile) {
  cloneTile.classList.toggle("setTileAnim");
  cloneTile.style.left = "";
  cloneTile.style.position = "initial ";
  document.getElementById("answer-row").appendChild(cloneTile);
}

/* Listen for end of both animations */
function registerTileEvents() {
  Array.from(document.getElementsByClassName("tile-clone")).forEach(e => {
    e.addEventListener("animationend", event => {
      const tile = event.target;
      const className = Array.from(tile.classList).find(e =>
        e.includes("remove")
      );
      if (className) {
        endRemoveLetter(tile);
      } else {
        endInsertLetter(tile);
      }
    });
  });
}

/* Helper function to compute the distance of the 2D vector needed for 
the CSS setTile animation
startCoords- array returned from findAbsPos  
endCoords - ' '
*/
function computeVector(startCoords, endCoords) {
  let xDist = startCoords[0] - endCoords[0];
  startCoords[0] > endCoords[0] ? (xDist *= -1) : (xDist *= -1);
  let yDist = -(startCoords[1] - endCoords[1]); //Always negative ; moves up to answer board
  document.documentElement.style.setProperty("--tx", `${xDist}px`);
  document.documentElement.style.setProperty("--ty", `${yDist}px`);
}

/*https://www.quirksmode.org/js/findpos.html */
function findAbsPos(obj) {
  let curleft = 0;
  let curtop = 0;
  if (obj.offsetParent) {
    do {
      curleft += obj.offsetLeft;
      curtop += obj.offsetTop;
    } while ((obj = obj.offsetParent));
  }
  return [curleft, curtop];
}

function toggleGameOverModal() {
  document.getElementById("content").classList.toggle("darken");
  document.querySelector(".game-over").classList.toggle("hide");
  const scoreElem = document.getElementById("score");
  let finalScore = scoreElem.innerText;
  document.getElementById("final-score").innerText = finalScore;
  scoreElem.innerText = 0;
  document.getElementById(
    "twitter-share"
  ).href = `https://twitter.com/intent/tweet?text=Scored:+${finalScore}+playing+word+scramble&url=https%3A%2F%2Fword-scramble.netlify.app`;
}

function toggleSound() {
  const choice = document.getElementById("sound").checked;
  success.muted = !choice;
  failure.muted = !choice;
}

/* Resets game after finishing*/
function resetGame() {
  generateTiles(registerTileEvents);
  startTimer(TIMER_SECONDS);
  toggleGameOverModal();
}

function startTimer(time) {
  let id = setInterval(() => {
    //Update view every 1s
    time -= 1;
    updateTimer(time, id);
  }, 1000);
}

/* Updates view of timer
time remaining passed in in seconds*/
function updateTimer(time, id) {
  document.getElementById("timer-num").innerHTML = `${time} `;
  if (time <= 0) {
    clearInterval(id);
    toggleGameOverModal();
  }
}

function gameLoop() {
  generateTiles(registerTileEvents);
  startTimer(TIMER_SECONDS);
}

document.querySelector("#tile-row").addEventListener("click", event => {
  if (event.target && event.target.classList.contains("tile")) {
    insertLetter(event.target);
  }
});
document.querySelector("#reset").addEventListener("click", resetGame);
document.querySelector("#sound").addEventListener("change", toggleSound);
document.getElementById("refresh").addEventListener("click", () => {
  generateTiles(registerTileEvents);
});
document.getElementById("submit").addEventListener("click", getWordValue);
/*Enter key submits word */
document.addEventListener("keypress", event => {
  if (event.keyCode == 13) {
    getWordValue();
  }
});
/*
  For mobile users let them double tap to submit instead
  http://jsfiddle.net/brettwp/J4djY/
*/
if (
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
) {
  document.body.addEventListener("touchend", detectDoubleTapClosure());
}

function detectDoubleTapClosure() {
  let lastTap = 0;
  let timeout;
  return function detectDoubleTap(event) {
    const curTime = new Date().getTime();
    const tapLen = curTime - lastTap;
    if (tapLen < 500 && tapLen > 0) {
      getWordValue();
      event.preventDefault();
    } else {
      timeout = setTimeout(() => {
        clearTimeout(timeout);
      }, 500);
    }
    lastTap = curTime;
  };
}

document.querySelector("#answer-row").addEventListener("click", event => {
  if (event.target && event.target.classList.contains("tile")) {
    removeLetter(event.target);
  }
});
gameLoop();
