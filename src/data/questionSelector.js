// questionSelector.js
import { getHistory } from "@/data/history.js";
import questions from "@/data/questions.json"; // assuming your questions are stored here

// Keys and settings for recent questions tracking.
const RECENT_KEY = "recentQuestions";
const RECENT_LIMIT = 5; // number of most recent questions to avoid

// Helper: Retrieve the array of recent question IDs from localStorage.
const getRecentQuestions = () => {
  const recent = localStorage.getItem(RECENT_KEY);
  try {
    return recent ? JSON.parse(recent) : [];
  } catch (error) {
    console.error("Error parsing recent questions:", error);
    return [];
  }
};

// Helper: Update the recent questions list when a question is selected.
const updateRecentQuestions = (questionId) => {
  let recent = getRecentQuestions();
  // Remove the question if it is already in the list (to avoid duplicates)
  recent = recent.filter((id) => id !== questionId);
  // Add this question to the end of the list.
  recent.push(questionId);
  // If we have exceeded the limit, remove the oldest question.
  if (recent.length > RECENT_LIMIT) {
    recent.shift();
  }
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent));
};

/**
 * Selects the next question according to the following criteria:
 * - Questions in the "recent" list are temporarily given zero weight.
 * - Each question is weighted as (wrong + 1) / (correct + 1),
 *   so questions answered incorrectly more frequently are more likely to be selected.
 * - If all questions have zero weight (e.g. because of the recent filter),
 *   then the recent filter is ignored.
 */
export const selectNextQuestion = () => {
  const history = getHistory();
  const recent = getRecentQuestions();

  // Map questions to an object containing the question and its computed weight.
  let weightedQuestions = questions.map((q) => {
    // Retrieve history for this question or use default values.
    const qHistory = history[q.id] || { correct: 0, wrong: 0 };
    // Compute weight: questions answered incorrectly more get a higher weight.
    let weight = (qHistory.wrong + 1) / (qHistory.correct + 1);

    // Exclude questions that were recently shown.
    if (recent.includes(q.id)) {
      weight = 0;
    }
    return { question: q, weight };
  });

  // Sum up the weights.
  let totalWeight = weightedQuestions.reduce((sum, q) => sum + q.weight, 0);

  // If the recent filter excluded all questions, ignore it.
  if (totalWeight === 0) {
    weightedQuestions = questions.map((q) => {
      const qHistory = history[q.id] || { correct: 0, wrong: 0 };
      return { question: q, weight: (qHistory.wrong + 1) / (qHistory.correct + 1) };
    });
    totalWeight = weightedQuestions.reduce((sum, q) => sum + q.weight, 0);
  }

  // Weighted random selection: pick a random value in [0, totalWeight) and iterate.
  let randomValue = Math.random() * totalWeight;
  for (let i = 0; i < weightedQuestions.length; i++) {
    randomValue -= weightedQuestions[i].weight;
    if (randomValue <= 0) {
      // Update the recent list with the selected question ID.
      updateRecentQuestions(weightedQuestions[i].question.id);
      return weightedQuestions[i].question;
    }
  }

  // Fallback: return the first question (should rarely happen).
  const fallback = questions[0];
  updateRecentQuestions(fallback.id);
  return fallback;
};
