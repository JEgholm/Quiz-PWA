// src/data/questionSelector.js

import questions from './questions.json';
import { getHistory } from './history.js';

export const selectNextQuestion = () => {
  console.log("Selecting next question...");
  const history = getHistory();
  console.log("Current history:", history);

  // Sort questions by wrong answers descending
  const sortedQuestions = [...questions].sort((a, b) => {
    const aWrong = history[a.id]?.wrong || 0;
    const bWrong = history[b.id]?.wrong || 0;
    return bWrong - aWrong;
  });
  console.log("Sorted questions by wrong answers:", sortedQuestions);

  // Select unanswered or most wrong
  const unanswered = sortedQuestions.filter(q => !history[q.id]);
  console.log("Unanswered questions:", unanswered);

  let selected;
  if (unanswered.length > 0) {
    selected = unanswered[Math.floor(Math.random() * unanswered.length)];
    console.log("Selected unanswered question:", selected);
  } else if (sortedQuestions.length > 0) {
    selected = sortedQuestions[0];
    console.log("Selected question with most wrong answers:", selected);
  } else {
    console.warn("No questions available to select.");
    selected = null;
  }

  // Ensure 'useKatex' property exists in question
  if (selected) {
    selected.useKatex = selected.useKatex ?? false;
  }

  return selected;
};

export const getAllQuestions = () => {
  console.log("Retrieving all questions.");
  return questions.map(q => ({ ...q, useKatex: q.useKatex ?? false }));
};