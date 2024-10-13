export const WORD_LENGTH = 5;

const ABSENT = 0;
const PRESENT = 1;
const CORRECT = 2;

export function computePattern(guess, answer) {
  const answerFreq = {};
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] !== answer[i]) {
      answerFreq[answer[i]] = (answerFreq[answer[i]] ?? 0) + 1;
    }
  }
  let pattern = 0;
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === answer[i]) {
      pattern += CORRECT * 3 ** i;
    } else if (answerFreq[guess[i]] > 0) {
      pattern += PRESENT * 3 ** i;
      answerFreq[guess[i]]--;
    } else {
      pattern += ABSENT * 3 ** i;
    }
  }
  return pattern;
}
