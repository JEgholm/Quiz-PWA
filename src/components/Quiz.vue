<template>
  <div v-if="currentQuestion" class="app-field">
    <!-- Main Content (Question & Answer Buttons) -->
    <v-card-title class="card-title">
      <div class="question-container" :style="{ fontSize: adjustedQuestionFontSize }">
        <span class="text-h5">{{ currentQuestion.text }}</span>
      </div>
    </v-card-title>
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

    <!-- Desktop Feedback (visible on larger screens) -->
    <v-card-subtitle
      v-if="feedback"
      class="text-center desktop-feedback"
      :style="{ fontSize: feedbackFontSize }"
    >
      {{ feedback }}
    </v-card-subtitle>
    <v-card-actions class="justify-center desktop-feedback" v-if="feedback">
      <v-btn color="secondary" @click="nextQuestion" class="next-button">
        Next Question
      </v-btn>
    </v-card-actions>

    <!-- Mobile Feedback Overlay (visible on small screens) -->
    <div v-if="feedback" class="feedback-overlay mobile-feedback">
      <div class="overlay-content">
        <div class="feedback-message">{{ feedback }}</div>
        <v-btn color="secondary" @click="nextQuestion" class="next-button">
          Next Question
        </v-btn>
      </div>
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
      if (isCorrect) {
        // Fire confetti on a correct answer.
        confetti({
          particleCount: 20,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
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
/* Base styling for full-screen container */
.app-field {
  position: relative; /* Needed for the mobile overlay positioning */
  width: 90%;
  max-width: 900px;
  min-height: 400px;
  padding: 30px;
  box-sizing: border-box;
  margin: 20px auto;
  border-radius: 12px;
  background-color: black;
  color: white;
}

/* Question container and answer styling */
.question-container {
  width: 100%;
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: normal;
}
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
  height: auto;
  line-height: 1.4em;
  overflow: hidden;
  word-wrap: break-word;
}
.option-text {
  display: block;
  white-space: normal;
  word-break: break-word;
  font-size: 1.1rem;
}
.correct-answer {
  background-color: #4caf50;
  color: white;
}
.wrong-answer {
  background-color: #f44336;
  color: white;
}
.next-button {
  font-size: clamp(1.1rem, 2vw, 1.5rem);
  padding: 0.8rem 2rem;
  background-color: #333;
  color: white;
  border-radius: 8px;
}

/* Desktop feedback remains as-is */
.desktop-feedback {
  display: block;
}

/* Mobile feedback overlay (hidden on desktop) */
.mobile-feedback {
  display: none;
}

/* Mobile Styles */
@media (max-width: 600px) {
  .app-field {
    width: 100vw;   /* Full viewport width */
    height: 100vh;  /* Full viewport height */
    margin: 0;
    border-radius: 0;
    padding: 15px;
  }

  /* Hide desktop feedback on mobile */
  .desktop-feedback {
    display: none;
  }

  /* Show the overlay on mobile */
  .mobile-feedback {
    display: flex;
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 33vh; /* About one-third of the viewport height */
    background: rgba(0, 0, 0, 0.85); /* Slightly transparent overlay */
    align-items: center;
    justify-content: center;
    padding: 10px;
  }

  .overlay-content {
    text-align: center;
    width: 100%;
  }

  .feedback-message {
    font-size: clamp(1.3rem, 3vw, 1.5rem);
    margin-bottom: 10px;
    color: white;
  }

  .next-button {
    font-size: clamp(1.2rem, 3vw, 1.4rem);
    padding: 0.9rem 2rem;
  }
}
</style>
