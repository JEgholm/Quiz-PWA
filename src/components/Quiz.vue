<template>
  <div v-if="currentQuestion" class="app-field">
    <!-- Question Title -->
    <v-card-title class="card-title">
      <div class="question-container" :style="{ fontSize: adjustedQuestionFontSize }">
        <span class="text-h5" v-html="processedQuestionText"></span>
      </div>
    </v-card-title>

    <!-- Question Body -->
    <v-card-text class="card-text">
      <!-- Multiple Choice & True/False -->
      <div v-if="questionType === 'multiple-choice' || questionType === 'truefalse'">
        <v-btn
          v-for="(option, index) in questionOptions"
          :key="index"
          class="my-2 answer-button"
          :class="{
            'correct-answer': feedback === 'Correct!' && option === currentQuestion.answer,
            'wrong-answer': feedback && option !== currentQuestion.answer && option === selectedAnswer
          }"
          color="default"
          block
          @click="checkSingleAnswer(option)"
        >
          <span class="option-text" v-html="processText(option, currentQuestion.useKatex)"></span>
        </v-btn>
      </div>

      <!-- Fill-in-the-Blank -->
      <div v-else-if="questionType === 'fill-in-the-blank'">
        <div class="fill-blank-container">
          <input
            v-model="userAnswer"
            type="text"
            class="fill-blank-input"
            placeholder="Your answer"
          />
        </div>
        <v-btn color="primary" @click="checkFillInAnswer" class="submit-button">
          Submit Answer
        </v-btn>
      </div>

      <!-- Matching -->
      <div v-else-if="questionType === 'matching'">
        <div class="matching-container">
          <div
            v-for="(pair, index) in currentQuestion.matches"
            :key="index"
            class="matching-row"
          >
            <div class="matching-left">
              <span v-html="processText(pair.left, currentQuestion.useKatex)"></span>
            </div>
            <div class="matching-right">
              <v-select
                :items="rightItems"
                v-model="userMatches[index]"
                label="Select match"
                dense
              ></v-select>
            </div>
          </div>
        </div>
        <v-btn color="primary" @click="checkMatchingAnswer" class="submit-button">
          Submit Answer
        </v-btn>
      </div>

      <!-- Multiple Correct Answers -->
      <div v-else-if="questionType === 'multiple-correct'">
        <v-btn
          v-for="(option, index) in processedOptions"
          :key="index"
          class="my-2 answer-button"
          :class="{ 'selected-answer': selectedAnswers.includes(rawOptions[index]) }"
          color="default"
          block
          @click="toggleMultipleSelection(rawOptions[index])"
        >
          <span class="option-text" v-html="option"></span>
        </v-btn>
        <v-btn color="primary" @click="checkMultipleCorrectAnswer" class="submit-button">
          Submit Answer
        </v-btn>
      </div>

      <!-- Self-Explanation -->
      <div v-else-if="questionType === 'self-explanation'">
        <div class="self-explanation-container">
          <textarea
            v-model="userExplanation"
            class="self-explanation-input"
            placeholder="Explain your answer"
          ></textarea>
        </div>
        <v-btn color="primary" @click="submitSelfExplanation" class="submit-button">
          Submit Explanation
        </v-btn>
      </div>
    </v-card-text>

    <!-- Feedback Area -->
    <div v-if="feedback" class="feedback-container">
      <!-- For self-explanation questions, show both the submitted explanation and reference answer -->
      <div v-if="questionType === 'self-explanation'" class="self-explanation-feedback">
        <p>
          <strong>Your Explanation:</strong>
          {{ userExplanation }}
        </p>
        <p>
          <strong>Reference Answer:</strong>
          <span v-html="processText(currentQuestion.referenceAnswer, currentQuestion.useKatex)"></span>
        </p>
      </div>
      <!-- For all other question types, simply show the feedback message -->
      <div v-else class="desktop-feedback">
        <p class="feedback-text">{{ feedback }}</p>
      </div>
    </div>

    <!-- Fixed Next Question Button -->
    <div v-if="feedback" class="fixed-next-button">
      <v-btn color="secondary" @click="nextQuestion" class="next-button">
        Next Question
      </v-btn>
    </div>
  </div>
  <div v-else>
    <p>Loading question...</p>
  </div>
</template>

<script>
import katex from "katex";
import "katex/dist/katex.min.css";
import confetti from "canvas-confetti";
import { selectNextQuestion } from "@/data/questionSelector.js";
import { updateHistory } from "@/data/history.js";

export default {
  data() {
    return {
      currentQuestion: null,
      feedback: "",
      // For single–answer questions
      selectedAnswer: null,
      // For fill–in–the–blank questions
      userAnswer: "",
      // For multiple-correct questions
      selectedAnswers: [],
      // For matching questions (indexed by the left–item index)
      userMatches: {},
      // For self–explanation questions
      userExplanation: "",
      // Store raw options for multiple-correct questions
      rawOptions: [],
    };
  },
  computed: {
    // Determine the question type (defaults to "multiple-choice" if not specified)
    questionType() {
      return this.currentQuestion?.type || "multiple-choice";
    },
    processedQuestionText() {
      return this.processText(this.currentQuestion?.text, this.currentQuestion?.useKatex);
    },
    // Process options for multiple-choice and multiple-correct questions.
    processedOptions() {
      if (this.currentQuestion?.options) {
        this.rawOptions = this.currentQuestion.options;
        return this.currentQuestion.options.map((option) =>
          this.processText(option, this.currentQuestion.useKatex)
        );
      }
      return [];
    },
    // For true/false questions: default options if none are provided.
    questionOptions() {
      if (this.questionType === "truefalse") {
        return this.currentQuestion.options && this.currentQuestion.options.length
          ? this.currentQuestion.options
          : ["True", "False"];
      }
      return this.currentQuestion.options;
    },
    // For matching questions: determine the items for the right–side dropdown.
    rightItems() {
      if (this.questionType === "matching") {
        if (this.currentQuestion.options && this.currentQuestion.options.rightItems) {
          return this.currentQuestion.options.rightItems;
        } else if (this.currentQuestion.matches) {
          return this.currentQuestion.matches.map((pair) =>
            this.processText(pair.right, this.currentQuestion.useKatex)
          );
        }
      }
      return [];
    },
    adjustedQuestionFontSize() {
      if (!this.currentQuestion) return "1.5rem";
      const length = this.currentQuestion.text.length;
      return length > 300 ? "0.9rem" : length > 200 ? "1.1rem" : "1.4rem";
    },
    feedbackFontSize() {
      return "1.3rem";
    },
  },
  methods: {
    loadQuestion() {
      this.currentQuestion = selectNextQuestion();
      if (!this.currentQuestion) {
        this.feedback = "No questions available.";
      } else {
        // Clear all user inputs
        this.feedback = "";
        this.selectedAnswer = null;
        this.userAnswer = "";
        this.selectedAnswers = [];
        this.userMatches = {};
        this.userExplanation = "";
      }
    },
    // For multiple-choice and true/false questions:
    checkSingleAnswer(selected) {
      if (!this.currentQuestion) return;
      this.selectedAnswer = selected;
      const isCorrect = selected === this.currentQuestion.answer;
      this.feedback = isCorrect ? "Correct!" : "Incorrect!";
      if (isCorrect) {
        confetti({
          particleCount: 20,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
      updateHistory(this.currentQuestion.id, isCorrect);
    },
    // For fill-in-the-blank questions:
    checkFillInAnswer() {
      if (!this.currentQuestion) return;
      const trimmed = this.userAnswer.trim();
      const isCorrect =
        trimmed.toLowerCase() === this.currentQuestion.answer.toLowerCase();
      this.feedback = isCorrect ? "Correct!" : "Incorrect!";
      if (isCorrect) {
        confetti({
          particleCount: 20,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
      updateHistory(this.currentQuestion.id, isCorrect);
    },
    // For matching questions:
    checkMatchingAnswer() {
      if (!this.currentQuestion) return;
      let allCorrect = true;
      this.currentQuestion.matches.forEach((pair, index) => {
        if (this.userMatches[index] !== pair.right) {
          allCorrect = false;
        }
      });
      this.feedback = allCorrect ? "Correct!" : "Incorrect!";
      if (allCorrect) {
        confetti({
          particleCount: 20,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
      updateHistory(this.currentQuestion.id, allCorrect);
    },
    // For multiple-correct questions:
    toggleMultipleSelection(option) {
      const index = this.selectedAnswers.indexOf(option);
      if (index > -1) {
        this.selectedAnswers.splice(index, 1);
      } else {
        this.selectedAnswers.push(option);
      }
    },
    checkMultipleCorrectAnswer() {
      if (!this.currentQuestion) return;
      const correctAnswers = this.currentQuestion.answers;
      const sortedUser = [...this.selectedAnswers].sort();
      const sortedCorrect = [...correctAnswers].sort();
      const isCorrect =
        JSON.stringify(sortedUser) === JSON.stringify(sortedCorrect);
      this.feedback = isCorrect ? "Correct!" : "Incorrect!";
      if (isCorrect) {
        confetti({
          particleCount: 20,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
      updateHistory(this.currentQuestion.id, isCorrect);
    },
    // For self-explanation questions:
    submitSelfExplanation() {
      if (!this.currentQuestion) return;
      // (Optionally store the explanation here)
      this.feedback = "Submitted";
      updateHistory(this.currentQuestion.id, null);
    },
    nextQuestion() {
      // Clear all fields and load the next question.
      this.feedback = "";
      this.selectedAnswer = null;
      this.userAnswer = "";
      this.selectedAnswers = [];
      this.userMatches = {};
      this.userExplanation = "";
      this.loadQuestion();
    },
    processText(text, useKatex) {
      if (!text) return "";
      if (useKatex) {
        try {
          return katex.renderToString(text, {
            throwOnError: false,
            displayMode: false,
          });
        } catch (error) {
          console.error("KaTeX rendering error:", error);
          return text;
        }
      }
      return text;
    },
  },
  mounted() {
    this.loadQuestion();
  },
};
</script>

<!-- Global styles for the page background (remove "scoped" here so body rules apply) -->
<style>
body {
  background-color: #000;
  margin: 0;
  padding: 0;
}
</style>

<style scoped>
/* App container styling */
.app-field {
  position: relative;
  width: 90%;
  max-width: 900px;
  min-height: 400px;
  padding: 30px;
  box-sizing: border-box;
  margin: 20px auto;
  border-radius: 12px;
  background-color: #000;
  color: white;
}

/* Question container */
.question-container {
  width: 100%;
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: normal;
}

/* Answer button styling */
.answer-button {
  background-color: lightgray;
  color: black;
  text-transform: none;
  padding: 16px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  min-height: 4em;
  line-height: 1.4em;
  word-wrap: break-word;
}

/* Option text */
.option-text {
  display: block;
  white-space: normal;
  word-break: break-word;
  font-size: 1.1rem;
}

/* Submit and Next button styling (centered text) */
.submit-button,
.next-button {
  font-size: clamp(1.1rem, 2vw, 1.5rem);
  padding: 0.8rem 2rem;
  background-color: #333;
  color: white;
  border-radius: 8px;
  text-align: center;
}

/* Fixed Next Question Button (always at the bottom center) */
.fixed-next-button {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
}

/* Correct / Incorrect answers */
.correct-answer {
  background-color: #4caf50;
  color: white;
}
.wrong-answer {
  background-color: #f44336;
  color: white;
}

/* Selected answer for multiple-correct questions */
.selected-answer {
  background-color: #2196f3 !important;
  color: white;
}

/* Fill-in-the-blank input */
.fill-blank-container {
  margin-bottom: 1rem;
}
.fill-blank-input {
  width: 100%;
  padding: 0.8rem;
  font-size: 1rem;
  border-radius: 4px;
  border: none;
  text-align: center;
}

/* Self-explanation input */
.self-explanation-container {
  margin-bottom: 1rem;
}
.self-explanation-input {
  width: 100%;
  min-height: 100px;
  padding: 0.8rem;
  font-size: 1rem;
  border-radius: 4px;
  border: none;
  background-color: #333;
  color: white;
  text-align: center;
}

/* Feedback container */
.feedback-container {
  margin-top: 20px;
  text-align: center;
}
.feedback-text {
  font-size: 1.3rem;
}

/* Mobile styles */
@media (max-width: 600px) {
  .app-field {
    width: 100vw;
    min-height: 100vh;
    margin: 0;
    border-radius: 0;
    padding: 15px;
  }
  .submit-button,
  .next-button {
    font-size: clamp(1.2rem, 3vw, 1.4rem);
    padding: 0.9rem 2rem;
    text-align: center;
  }
}
</style>
