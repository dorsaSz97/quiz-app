'use strict';

class End {
  #endingMessage = document.querySelector('.message');
  #retryBtn = document.querySelector('.btn-retry');

  constructor(score) {
    this.#endingMessage.innerHTML = `You have answered to <br> <span class='score'><span class='score--correct'>${score}</span> / 10</span> <br> questions correctly`;

    this.#retryBtn.addEventListener('click', this._reloadTheGame);
  }

  _reloadTheGame() {
    // reloading the window programatically
    location.reload(); //LESSON
  }
}

class Question {
  answersEls = document.querySelectorAll('.answer label');
  #questionEl = document.querySelector('.question');
  isCorrect = false;

  constructor(question) {
    // when we are trying to create a question object, we get the question's text, all the answers and the correct answer
    this.questionText = question.question;
    this.answers = this._shuffleAnswers([
      ...question.incorrect_answers,
      question.correct_answer,
    ]);
    this.correctAnswer = question.correct_answer;
  }

  _shuffleAnswers(allAnswers) {
    for (let i = 0; i < allAnswers.length; i++) {
      const random = Math.floor(Math.random() * i);
      const temp = allAnswers[i];
      allAnswers[i] = allAnswers[random];
      allAnswers[random] = temp;
    }
    return allAnswers;
  }

  assembleQuestion() {
    // we assemble the question section (the question's text, answers and unchecked inputs)
    this.#questionEl.innerHTML = this.questionText;
    this.answersEls.forEach((answerEl, i) => {
      answerEl.innerHTML = this.answers[i];
      answerEl.nextElementSibling.checked = false;
    });
  }

  checkAnswer(checkedAnswer) {
    this.isCorrect =
      checkedAnswer[0].closest('.answer').querySelector('label').innerText ===
      this.correctAnswer;
  }
}

class Quiz {
  #quizContainer = document.querySelector('.quiz');
  #endingContainer = document.querySelector('.end');
  #currQText = document.querySelector('.current');
  #answeredQs = 0;
  #nextBtn = document.querySelector('.btn--next');

  constructor(questions) {
    // as soon as we got the data and hid the setting container, we show the quiz container, get all the questions' objects from the data, create our own question object for each of them and put them in an array
    this.questions = this._createQuestions(questions.results);

    // after creating objects for all the questions, we have to show the first one
    this._showQuestion();

    this.#nextBtn.addEventListener('click', this._goToNextQuestion.bind(this));
  }

  _createQuestions(questions) {
    return questions.map(question => new Question(question));
  }

  _showQuestion() {
    this.questions[this.#answeredQs].assembleQuestion();
    this.#currQText.innerText = this.#answeredQs + 1;
  }

  _goToNextQuestion() {
    // checking if the user has chosen an answer
    const checkedAnswer = Array.from(
      this.questions[this.#answeredQs].answersEls
    ).filter(a => a.nextElementSibling.checked);

    if (checkedAnswer.length !== 0) {
      this.questions[this.#answeredQs].checkAnswer(checkedAnswer);

      this.#answeredQs++;

      // if we have reached the end, finish the game
      this.#answeredQs < 10 ? this._showQuestion() : this._endQuiz();
    } else {
      alert('Pick an answer!');
    }
  }

  _calculateCorrectAnswers() {
    let sum = 0;
    this.questions.forEach(question => {
      if (question.isCorrect) {
        sum++;
      }
    });
    return sum;
  }

  _endQuiz() {
    this.#endingContainer.classList.add('show');
    this.#quizContainer.style.display = 'none';
    const score = this._calculateCorrectAnswers();
    this.ending = new End(score);
  }
}

class Setting {
  // private fields (only needed here in this class)
  #settingContainer = document.querySelector('.setting');
  #quizContainer = document.querySelector('.quiz');

  #categoryInputs = document.querySelectorAll('.category input');
  #difficultyInputs = document.querySelectorAll('.difficulty input');

  #startBtn = document.querySelector('.btn-start');

  #quiz = {};

  constructor() {
    // attaching event listeners
    this.#startBtn.addEventListener('click', this._setupQuiz.bind(this));
  }

  // private methods
  async _setupQuiz() {
    try {
      // 1) check if the category ID and the difficulty's value are correctly selected, if they are, get their value
      const categoryId = this._getCategoryID();
      const difficultyLevel = this._getDifficultyLevel();

      // 2) fetch the data from the opentrivia DB
      const url = `https://opentdb.com/api.php?amount=10&category=${categoryId}&difficulty=${difficultyLevel}&type=multiple`;
      const data = await this._fetchFromDB(url); // data's format: {response_code: 0, results: Array(10)}

      // 3) create a quiz object for our quiz section
      this.#quiz = new Quiz(data);

      // 3) hide the settings and show the quiz container
      this._toggleDisplay();
    } catch (error) {
      // only for the loss of internet connection / no category / no difficulty
      alert(error);
    }
  }

  _getCategoryID() {
    // finding out if there is any category selected
    const selectedCategory = Array.from(this.#categoryInputs).filter(
      categoryInput => categoryInput.checked
    ); // this returns an array (because of the filter method)

    // a category or more is selected (there are of type radio and have the same name attr so only one can be selected):
    if (selectedCategory.length !== 0) {
      return selectedCategory[0].closest('.category').dataset.categoryId;
    } else {
      throw new Error('Select a category!');
    }
  }

  _getDifficultyLevel() {
    const selectedDifficulty = Array.from(this.#difficultyInputs).filter(
      difficultyInput => difficultyInput.checked
    );

    if (selectedDifficulty.length !== 0) {
      return selectedDifficulty[0].value;
    } else {
      throw new Error('Select the difficulty!');
    }
  }

  async _fetchFromDB(url) {
    try {
      const response = await fetch(url);

      // maybe the url is wrong
      if (!response.ok) throw new Error('Couldnt get the questions');

      const data = await response.json();

      if (data.results.length === 0)
        throw new Error('Wrong URL! Couldnt get the questions');

      return data;
    } catch (err) {
      throw new Error(err.message);
    }
  }

  _toggleDisplay() {
    this.#settingContainer.style.display = 'none';
    this.#quizContainer.style.display = 'flex';
  }
}

const setting = new Setting();
