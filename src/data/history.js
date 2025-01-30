// src/data/history.js

const HISTORY_KEY = 'quiz_history';

export const getHistory = () => {
  console.log("Retrieving history from localStorage...");
  const history = localStorage.getItem(HISTORY_KEY);
  console.log("Raw history data:", history);
  try {
    const parsedHistory = history ? JSON.parse(history) : {};
    console.log("Parsed history:", parsedHistory);
    return parsedHistory;
  } catch (error) {
    console.error("Failed to parse history:", error);
    return {};
  }
};

export const updateHistory = (questionId, isCorrect) => {
  console.log(`Updating history for question ID ${questionId} | Correct: ${isCorrect}`);
  const history = getHistory();
  if (!history[questionId]) {
    history[questionId] = { correct: 0, wrong: 0 };
  }
  if (isCorrect) {
    history[questionId].correct += 1;
  } else {
    history[questionId].wrong += 1;
  }
  console.log("Updated history:", history);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  console.log("History saved to localStorage.");
};

export const resetHistory = () => {
  console.log("Resetting history...");
  localStorage.removeItem(HISTORY_KEY);
  console.log("History removed from localStorage.");
};
