import { WORD_LENGTH, computePattern } from './utils.js';

const NUM_GUESSES = 6;
const DICT_SIZE = 5;

const dictionary = await fetchDictionary();
// const possibilities = new Set(dictionary);
const possibilities = new Set([...dictionary].slice(0, 100));
// const possibilities = await fetchAnswers();

const worker = new Worker('worker.js', { type: 'module' });

const board = document.getElementById('board');
const possibilityList = document.querySelector('#possibility-list');
const recommendationTable = document.querySelector('#recommendation-table');
const progressSpan = document.querySelector('#progress');

for (let i = 0; i < NUM_GUESSES; i++) {
  const wordRow = document.createElement('div');
  wordRow.classList.add('word-row');
  for (let j = 0; j < WORD_LENGTH; j++) {
    const tile = document.createElement('div');
    tile.classList.add('tile');
    tile.setAttribute('data-state', 'empty');
    wordRow.appendChild(tile);
  }
  board.appendChild(wordRow);
}

const listContainers = document.querySelectorAll('.list-container');
listContainers.forEach((container) => {
  container.style.height = `${board.offsetHeight}px`;
});

updatePossibilityList(possibilities);
updateRecommendationList(possibilities);

let currRow = 0;
let currCol = 0;
let letterMode = true;
let guess = '';
let pattern = [];
let wordsDone = 0;
document.addEventListener('keydown', (event) => {
  if (letterMode) {
    if (/^[a-z]$/i.test(event.key) && currCol < WORD_LENGTH && currRow < NUM_GUESSES) {
      board.children[currRow].children[currCol].textContent = event.key.toUpperCase();
      board.children[currRow].children[currCol].setAttribute('data-state', 'filled');
      guess += event.key.toUpperCase();
      currCol++;
    } else if (event.key === 'Enter' && currCol === WORD_LENGTH) {
      letterMode = false;
      currCol = 0;
    } else if (event.key === 'Backspace' && currCol > 0) {
      currCol--;
      guess.slice(0, -1);
      board.children[currRow].children[currCol].textContent = '';
      board.children[currRow].children[currCol].setAttribute('data-state', 'empty');
    }
  } else {
    if (/^[1-3]$/.test(event.key) && currCol < WORD_LENGTH) {
      if (event.key === '1') {
        board.children[currRow].children[currCol].setAttribute('data-state', 'absent');
      } else if (event.key === '2') {
        board.children[currRow].children[currCol].setAttribute('data-state', 'present');
      } else {
        board.children[currRow].children[currCol].setAttribute('data-state', 'correct');
      }
      pattern.push(parseInt(event.key));
      currCol++;
    } else if (event.key === 'Enter' && currCol === WORD_LENGTH) {
      handleSubmit(guess, pattern);
      letterMode = true;
      currRow++;
      currCol = 0;
      guess = '';
      pattern = [];
      wordsDone = 0;
      progressSpan.textContent = '';
    } else if (event.key === 'Backspace' && currCol > 0) {
      currCol--;
      pattern.pop();
      board.children[currRow].children[currCol].setAttribute('data-state', 'filled');
    }
  }
});

async function fetchDictionary() {
  try {
    const response = await fetch('dictionary.txt');
    const text = await response.text();
    const dictionary = new Set(text.split(/\r?\n/).filter((word) => word.length == WORD_LENGTH));
    return dictionary;
  } catch (error) {
    console.error(error);
    return new Set();
  }
}

async function fetchAnswers() {
  try {
    const response = await fetch('answers.txt');
    const text = await response.text();
    const answers = new Set(
      text
        .split(/\r?\n/)
        .filter((word) => word.length == WORD_LENGTH)
        .map((word) => word.toUpperCase())
    );
    return answers;
  } catch (error) {
    console.error(error);
    return new Set();
  }
}

function updatePossibilityList(possibilities) {
  possibilityList.innerHTML = '';
  for (const possibility of possibilities) {
    const possibilityItem = document.createElement('li');
    possibilityItem.textContent = possibility;
    possibilityList.appendChild(possibilityItem);
  }
}

function updateRecommendationList(possibilities) {
  recommendationTable.classList.add('loading');
  worker.postMessage([dictionary, possibilities]);
}

function updateProgress() {
  wordsDone++;
  progressSpan.textContent = Math.round((wordsDone / dictionary.size) * 100) + '%';
}

worker.onmessage = (e) => {
  if (e.data.type === 'progress') {
    updateProgress();
  } else {
    const recommendations = e.data.recommendations;
    const sortedRecommendations = Object.entries(recommendations).sort((rec1, rec2) => rec1[1] - rec2[1]);
    recommendationTable.innerHTML = '';
    for (const [word, score] of sortedRecommendations) {
      const wordCell = document.createElement('td');
      wordCell.textContent = word;
      const scoreCell = document.createElement('td');
      scoreCell.classList.add('score-cell')
      scoreCell.textContent = Math.round(score * 100) / 100;
      const recommendationRow = document.createElement('tr');
      recommendationRow.appendChild(wordCell);
      recommendationRow.appendChild(scoreCell);
      recommendationTable.appendChild(recommendationRow);
    }
    recommendationTable.classList.remove('loading');
  }
};

function handleSubmit(guess, pattern) {
  let numPattern = 0;
  for (let i = 0; i < WORD_LENGTH; i++) {
    numPattern += (pattern[i] - 1) * 3 ** i;
  }
  possibilities.forEach((possibility) => {
    if (computePattern(guess, possibility) !== numPattern) {
      possibilities.delete(possibility);
    }
  });
  updatePossibilityList(possibilities);
  updateRecommendationList(possibilities);
}
