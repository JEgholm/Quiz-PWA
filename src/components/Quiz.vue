<template>
  <div v-if="currentQuestion">
    <v-card
      class="app-field"
      style="background-color: black; color: white;"
    >
      <!-- Question Text -->
      <v-card-title class="card-title">
        <div class="question-container" :style="{ fontSize: adjustedQuestionFontSize }">
          <span class="text-h5">{{ currentQuestion.text }}</span>
        </div>
      </v-card-title>

      <!-- Answer Buttons -->
      <v-card-text class="card-text">
        <v-btn
          v-for="(option, index) in currentQuestion.options"
          :key="index"
          class="my-2 answer-button"
          :class="{
            'correct-answer': feedback === 'Correct!' && option === currentQuestion.answer,
            'wrong-answer': feedback && option !== currentQuestion.answer && option === selectedAnswer
          }"
          color="default"
          block
          @click="checkAnswer(option)"
        >
          <span class="option-text" v-html="processedOptions[index]"></span>
        </v-btn>
      </v-card-text>

      <!-- Feedback Message -->
      <v-card-subtitle
        v-if="feedback"
        class="text-center feedback-message"
        :style="{ fontSize: feedbackFontSize }"
      >
        {{ feedback }}
      </v-card-subtitle>

      <!-- Next Question Button -->
      <v-card-actions class="actions-container" v-if="feedback">
        <v-btn color="secondary" @click="nextQuestion" class="next-button">
          Next Question
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
  <div v-else>
    <p>Loading question...</p>
  </div>
</template>

<script>
import katex from "katex";
import "katex/dist/katex.min.css";
import { selectNextQuestion } from "@/data/questionSelector.js";
import { updateHistory } from "@/data/history.js";

export default {
  data() {
    return {
      currentQuestion: null,
      feedback: "",
      selectedAnswer: null,
    };
  },
  computed: {
    processedOptions() {
      return this.currentQuestion?.options.map(option =>
        this.processText(option, this.currentQuestion?.useKatex)
      ) || [];
    },
    adjustedQuestionFontSize() {
      if (!this.currentQuestion) return "1.5rem";
      const length = this.currentQuestion.text.length;
      return length > 300 ? "0.9rem" : length > 200 ? "1.1rem" : "1.4rem";
    },
    feedbackFontSize() {
      return "1.3rem";
    }
  },
  methods: {
    loadQuestion() {
      this.currentQuestion = selectNextQuestion();
      if (!this.currentQuestion) {
        this.feedback = "No questions available.";
      } else {
        this.feedback = "";
        this.selectedAnswer = null;
      }
    },
    checkAnswer(selected) {
      if (!this.currentQuestion) return;
      this.selectedAnswer = selected;
      const isCorrect = selected === this.currentQuestion.answer;
      this.feedback = isCorrect ? "Correct!" : "Incorrect!";
      updateHistory(this.currentQuestion.id, isCorrect);
    },
    nextQuestion() {
      this.feedback = "";
      this.selectedAnswer = null;
      this.loadQuestion();
    },
    processText(text, useKatex) {
      if (!text) return "";
      if (useKatex) {
        try {
          return katex.renderToString(text, { throwOnError: false, displayMode: false });
        } catch (error) {
          console.error("KaTeX rendering error:", error);
          return text;
        }
      }
      return text;
    }
  },
  mounted() {
    this.loadQuestion();
  },
};
</script>

<style scoped>
/* Base styles for larger screens */
.app-field {
  width: 90%;
  max-width: 900px;
  min-height: 400px;
  padding: 30px;
  box-sizing: border-box;
  margin: 20px auto;
  border-radius: 12px;
}

.question-container {
  width: 100%;
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: normal;
}

/* Enlarged answer button styles */
.answer-button {
  background-color: lightgray;
  color: black;
  text-transform: none;
  padding: 16px;           /* Increased padding */
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  min-height: 4em;         /* Increased minimum height */
  height: auto;
  line-height: 1.4em;
  overflow: hidden;
  word-wrap: break-word;
}

/* Enlarged option text */
.option-text {
  display: block;
  white-space: normal;
  word-break: break-word;
  font-size: 1.1rem;       /* Slightly larger font */
}

.correct-answer {
  background-color: #4caf50;
  color: white;
}

.wrong-answer {
  background-color: #f44336;
  color: white;
}

/* Enlarged next button styles */
.next-button {
  font-size: clamp(1.1rem, 2vw, 1.5rem);  /* Increased font size */
  padding: 0.8rem 2rem;                    /* Increased padding */
  background-color: #333;
  color: white;
  border-radius: 8px;
}

/* Mobile styles for portrait orientation */
@media (max-width: 600px) {
  .app-field {
    width: 100vw;          /* Full viewport width */
    /* Instead of full viewport height, let content determine the height */
    height: auto;
    margin: 0;
    border-radius: 0;
    padding: 15px;
    /* Remove space-between to prevent pushing content to the bottom */
    display: block;
  }

  /* Reduce bottom margin so feedback and button appear closer to the question */
  .card-text {
    margin-bottom: 10px;
  }

  /* Increase font size for feedback and reduce top margin */
  .feedback-message {
    margin-top: 10px;
    font-size: clamp(1.3rem, 3vw, 1.5rem);
  }

  /* Increase next button size slightly and bring it closer */
  .actions-container {
    margin-top: 10px;
    text-align: center;
  }
  .next-button {
    font-size: clamp(1.2rem, 3vw, 1.4rem);
    padding: 0.9rem 2rem;
  }
}
</style>
