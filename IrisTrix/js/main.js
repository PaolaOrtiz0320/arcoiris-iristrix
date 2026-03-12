/* IrisTrix — Memorama (juego de parejas) */

const CARD_IMAGES = ["jesus", "moises", "isaias", "david", "jeremias", "salomon", "eliseo", "jonas"];
const CARD_NAMES = {
  jesus: "Jesús", moises: "Moisés", isaias: "Isaías", david: "David",
  jeremias: "Jeremías", salomon: "Salomón", eliseo: "Eliseo", jonas: "Jonás"
};
const CARDS_PATH = "assets/cards";
const PAIRS_PER_GAME = 5;
const PREVIEW_SECONDS = 10; 
const PLAY_TIME_SECONDS = 15;
const STORAGE_BEST = "iristrix-memorama-best";
const gridEl = document.getElementById("memoramaGrid");
const gameStatusEl = document.getElementById("gameStatus");
const pairsCountEl = document.getElementById("pairsCount");
const movesCountEl = document.getElementById("movesCount");
const bestCountEl = document.getElementById("bestCount");
const newGameBtn = document.getElementById("newGameBtn");
const winModal = document.getElementById("winModal");
const winMessage = document.getElementById("winMessage");
const finalMovesEl = document.getElementById("finalMoves");
const finalBestEl = document.getElementById("finalBest");
const playAgainBtn = document.getElementById("playAgainBtn");
const timeUpModal = document.getElementById("timeUpModal");
const tryAgainBtn = document.getElementById("tryAgainBtn");
const comenzarBtn = document.getElementById("comenzarBtn");

let previewInterval = null;
let playInterval = null;

if (!gridEl) console.error("IrisTrix: no se encontró #memoramaGrid");

let cards = [];
let flipped = [];
let matched = new Set();
let moves = 0;
let locked = false;
let best = parseInt(localStorage.getItem(STORAGE_BEST), 10) || null;

function buildDeck() {
  const indices = CARD_IMAGES.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const chosen = indices.slice(0, PAIRS_PER_GAME);
  const deck = [];
  chosen.forEach((imageIndex, pairId) => {
    const imageName = CARD_IMAGES[imageIndex];
    deck.push({ id: pairId, imageName });
    deck.push({ id: pairId, imageName });
  });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function renderCards() {
  if (!gridEl) return;
  gridEl.innerHTML = "";
  cards.forEach((card, index) => {
    const div = document.createElement("button");
    div.type = "button";
    div.className = `memorama-card memorama-card--${card.imageName}`;
    div.dataset.index = index;
    const name = CARD_NAMES[card.imageName] || card.imageName;
    div.setAttribute("aria-label", "Carta " + (index + 1) + ", " + name);
    const imgSrc = `${CARDS_PATH}/${card.imageName}.png`;
    div.innerHTML = `
      <span class="card-back"><span class="card-back-cross" aria-hidden="true">✝</span></span>
      <span class="card-front">
        <span class="card-img-wrap"><img src="${imgSrc}" alt="${name}" class="card-img"></span>
        <span class="card-name">${name}</span>
      </span>
    `;
    if (matched.has(card.id)) {
      div.classList.add("matched");
    }
    gridEl.appendChild(div);
  });
}

function updateStats() {
  if (pairsCountEl) pairsCountEl.textContent = matched.size;
  if (movesCountEl) movesCountEl.textContent = moves;
  if (bestCountEl) bestCountEl.textContent = best === null ? "—" : best;
}

function flipCard(index) {
  const card = cards[index];
  if (!card || locked || matched.has(card.id)) return;
  const el = gridEl.querySelector(`[data-index="${index}"]`);
  if (!el || el.classList.contains("flipped")) return;

  el.classList.add("flipped");
  flipped.push({ index, id: card.id, el });

  if (flipped.length === 2) {
    moves++;
    updateStats();
    locked = true;
    const [a, b] = flipped;
    if (a.id === b.id) {
      matched.add(a.id);
      a.el.classList.add("matched");
      b.el.classList.add("matched");
      updateStats();
      flipped = [];
      locked = false;
      if (navigator.vibrate) navigator.vibrate(30);
      if (matched.size === PAIRS_PER_GAME) {
        stopPlayTimer();
        setTimeout(showWinModal, 400);
        return;
      }
    } else {
      setTimeout(() => {
        a.el.classList.remove("flipped");
        b.el.classList.remove("flipped");
        flipped = [];
        locked = false;
      }, 700);
    }
  }
}

function showWinModal() {
  const isNewBest = best === null || moves < best;
  if (isNewBest) {
    best = moves;
    localStorage.setItem(STORAGE_BEST, best);
  }
  if (winMessage) winMessage.textContent = isNewBest ? "¡Nueva mejor marca!" : `Lo lograste en ${moves} movimientos.`;
  if (finalMovesEl) finalMovesEl.textContent = moves;
  if (finalBestEl) finalBestEl.textContent = best === null ? "—" : best;
  const winCard = document.getElementById("winModalCard");
  if (winCard) {
    winCard.classList.remove("modal-card--win");
    void winCard.offsetWidth;
    winCard.classList.add("modal-card--win");
  }
  if (winModal) winModal.classList.remove("hidden");
}

function hideWinModal() {
  if (winModal) winModal.classList.add("hidden");
}

function setStatus(text) {
  if (gameStatusEl) gameStatusEl.textContent = text;
}

function showAllCards() {
  if (!gridEl) return;
  gridEl.querySelectorAll(".memorama-card").forEach((el) => el.classList.add("flipped"));
}

function hideAllCards() {
  if (!gridEl) return;
  gridEl.querySelectorAll(".memorama-card").forEach((el) => el.classList.remove("flipped"));
}

function stopPlayTimer() {
  if (playInterval) {
    clearInterval(playInterval);
    playInterval = null;
  }
}

function showTimeUpModal() {
  const timeUpCard = document.getElementById("timeUpModalCard");
  if (timeUpCard) {
    timeUpCard.classList.remove("modal-card--timeup");
    void timeUpCard.offsetWidth;
    timeUpCard.classList.add("modal-card--timeup");
  }
  if (timeUpModal) timeUpModal.classList.remove("hidden");
}

function hideTimeUpModal() {
  if (timeUpModal) timeUpModal.classList.add("hidden");
}

function startPlayPhase() {
  hideAllCards();
  locked = false;
  let timeLeft = PLAY_TIME_SECONDS;
  setStatus("¡Encuentra las parejas! Tiempo: " + timeLeft + " s");

  playInterval = setInterval(() => {
    timeLeft--;
    if (timeLeft > 0) {
      setStatus("¡Encuentra las parejas! Tiempo: " + timeLeft + " s");
    } else {
      stopPlayTimer();
      locked = true;
      setStatus("Se acabó el tiempo");
      showTimeUpModal();
    }
  }, 1000);
}

const IMAGES_LOAD_TIMEOUT_MS = 6000;

function whenAllImagesLoaded(callback) {
  if (!gridEl) {
    callback();
    return;
  }
  const imgs = gridEl.querySelectorAll(".card-img");
  if (imgs.length === 0) {
    callback();
    return;
  }
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    callback();
  };
  let loaded = 0;
  const check = () => {
    loaded++;
    if (loaded >= imgs.length) run();
  };
  imgs.forEach((img) => {
    if (img.complete) check();
    else img.addEventListener("load", check);
    img.addEventListener("error", check);
  });
  setTimeout(run, IMAGES_LOAD_TIMEOUT_MS);
}

function showPlayModal() {
  const el = document.getElementById("playModal");
  if (el) el.classList.remove("hidden");
}
function hidePlayModal() {
  const el = document.getElementById("playModal");
  if (el) el.classList.add("hidden");
}

function startNewGame() {
  hideWinModal();
  hideTimeUpModal();
  stopPlayTimer();
  if (previewInterval) {
    clearInterval(previewInterval);
    previewInterval = null;
  }
  cards = buildDeck();
  flipped = [];
  matched = new Set();
  moves = 0;
  locked = true;
  renderCards();
  updateStats();
  setStatus("Cargando cartas...");
  showAllCards();
  whenAllImagesLoaded(() => {
    setStatus("¡Listo! Memoriza...");
    setTimeout(() => {
      setStatus("Memoriza las cartas... " + PREVIEW_SECONDS);
      startPreviewCountdown();
    }, 2000);
  });
}

function onComenzarClick() {
  hidePlayModal();
  startNewGame();
}

function startPreviewCountdown() {
  let countdown = PREVIEW_SECONDS;
  previewInterval = setInterval(() => {
    countdown--;
    if (countdown > 0) {
      setStatus("Memoriza las cartas... " + countdown);
    } else {
      clearInterval(previewInterval);
      previewInterval = null;
      startPlayPhase();
    }
  }, 1000);
}

if (gridEl) {
  gridEl.addEventListener("click", (e) => {
    const card = e.target.closest(".memorama-card");
    if (!card) return;
    const index = parseInt(card.dataset.index, 10);
    if (!isNaN(index)) flipCard(index);
  });
}

if (newGameBtn) {
  newGameBtn.addEventListener("click", (e) => {
    e.preventDefault();
    showPlayModal();
  });
}
if (comenzarBtn) {
  comenzarBtn.addEventListener("click", (e) => {
    e.preventDefault();
    onComenzarClick();
  });
}
if (playAgainBtn) {
  playAgainBtn.addEventListener("click", (e) => {
    e.preventDefault();
    hideWinModal();
    showPlayModal();
  });
}
if (tryAgainBtn) {
  tryAgainBtn.addEventListener("click", (e) => {
    e.preventDefault();
    hideTimeUpModal();
    showPlayModal();
  });
}

showPlayModal();
