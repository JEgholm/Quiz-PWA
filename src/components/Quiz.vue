<template>
  <div v-if="currentQuestion">
    <v-card
      class="mx-auto my-5 app-field"
      style="background-color: black; color: white;"
    >
      <v-card-title>
        <div class="question-container" :style="{ fontSize: adjustedQuestionFontSize }">
          <span class="text-h5">{{ currentQuestion.text }}</span>
        </div>
      </v-card-title>
      <v-card-text>
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
          <span
            class="option-text"
            v-html="processedOptions[index]"
          ></span>
        </v-btn>
      </v-card-text>
      <v-card-subtitle
        v-if="feedback"
        class="text-center"
        :style="{ fontSize: feedbackFontSize }"
      >
        {{ feedback }}
      </v-card-subtitle>
      <v-card-actions class="justify-center" v-if="feedback">
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
}

.question-container {
  width: 100%;
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: normal;
}

.option-text {
  display: block;
  white-space: normal;
  word-break: break-word;
}

.answer-button {
  background-color: lightgray;
  color: black;
  text-transform: none;
  padding: 12px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  min-height: 3em;
  height: auto;
  line-height: 1.4em;
  overflow: hidden;
  word-wrap: break-word;
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
  font-size: clamp(1rem, 2vw, 1.3rem);
  padding: 0.6rem 1.8rem;
  background-color: #333;
  color: white;
  border-radius: 8px;
}

/* Media queries for mobile devices */
@media (max-width: 600px) {
  .app-field {
    width: 95%;
    padding: 15px;
  }

  .question-container {
    font-size: clamp(1rem, 3vw, 1.2rem);
  }

  .answer-button {
    padding: 10px;
    font-size: clamp(0.9rem, 3vw, 1rem);
  }

  .next-button {
    font-size: clamp(0.9rem, 3vw, 1rem);
    padding: 0.5rem 1.5rem;
  }
}
</style>
