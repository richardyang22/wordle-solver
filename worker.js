import { computePattern } from './utils.js';

onmessage = (e) => {
  const [dictionary, possibilities] = e.data;
  const recommendations = {};
  for (const guess of dictionary) {
    const score = computeScore(guess, possibilities);
    recommendations[guess] = score;
    postMessage({ type: 'progress' });
  }
  postMessage({ type: 'done', recommendations });
};

function computeScore(guess, possibilities) {
  const patternFreq = {};
  for (const possibility of possibilities) {
    const pattern = computePattern(guess, possibility);
    patternFreq[pattern] = (patternFreq[pattern] || 0) + 1;
  }
  let total = 0;
  for (const pattern in patternFreq) {
    total += patternFreq[pattern] ** 2;
  }
  return total / possibilities.size;
}
