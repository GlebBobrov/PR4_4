document.addEventListener('DOMContentLoaded', function () {

  const btnOpenModal = document.querySelector('#btnOpenModal');
  const modalBlock = document.querySelector('#modalBlock');
  const closeModal = document.querySelector('#closeModal');
  const questionTitle = document.querySelector('#question');
  const formAnswers = document.querySelector('#formAnswers');
  const btnPrev = document.querySelector('#prev');
  const btnNext = document.querySelector('#next');
  const btnSend = document.querySelector('#send');

  const firebaseUrl = 'https://burgproject-default-rtdb.europe-west1.firebasedatabase.app/';

  let questions = [];
  let currentQuestionIndex = 0;
  let userAnswers = {};

  btnOpenModal.addEventListener('click', () => {
    modalBlock.classList.add('d-block');
    loadQuestionsFromFirebase();
  });

  closeModal.addEventListener('click', () => {
    modalBlock.classList.remove('d-block');
  });

  btnPrev.addEventListener('click', () => {
    if (currentQuestionIndex > 0) {
      saveCurrentAnswer();
      currentQuestionIndex--;
      playTest();
    }
  });

  btnNext.addEventListener('click', () => {
    saveCurrentAnswer();
    if (currentQuestionIndex < questions.length - 1) {
      currentQuestionIndex++;
      playTest();
    }
  });

  btnSend.addEventListener('click', () => {
    saveCurrentAnswer();
    console.log('Ответы пользователя:', userAnswers);

    alert('Тест завершен! Результаты сохранены.');
    modalBlock.classList.remove('d-block');
  });

  const loadQuestionsFromFirebase = async () => {
    try {
      questionTitle.textContent = 'Завантаження...';
      formAnswers.innerHTML = '';

      const response = await fetch(`${firebaseUrl}questions.json`);
      const data = await response.json();


      if (data && Array.isArray(data)) {
        questions = data;
      } else if (data && data.questions && Array.isArray(data.questions)) {
        questions = data.questions;
      } else if (data) {

        questions = Object.values(data);
      }

      if (questions.length > 0) {
        currentQuestionIndex = 0;
        userAnswers = {};
        playTest();
      } else {
        questionTitle.textContent = 'Питання не знайдено';
        formAnswers.innerHTML = '<p>У базі даних немає питань</p>';
      }
    } catch (error) {
      console.error('Помилка завантаження з Firebase:', error);
      questionTitle.textContent = 'Помилка завантаження питань';
      formAnswers.innerHTML = '<p>Не вдалося завантажити питання з бази даних</p>';
    }
  };

  const saveCurrentAnswer = () => {
    if (questions.length === 0 || currentQuestionIndex >= questions.length) return;

    const currentQuestion = questions[currentQuestionIndex];
    const inputs = formAnswers.querySelectorAll(`input[name="answer${currentQuestionIndex}"]`);
    const checkedInputs = Array.from(inputs).filter(input => input.checked);
    
    if (checkedInputs.length > 0) {
      if (currentQuestion.type === 'checkbox') {
        userAnswers[currentQuestionIndex] = checkedInputs.map(input => input.value);
      } else {
        userAnswers[currentQuestionIndex] = checkedInputs[0].value;
      }
    }
  };

  const playTest = () => {
    if (questions.length === 0 || currentQuestionIndex >= questions.length) {
      return;
    }

    const currentQuestion = questions[currentQuestionIndex];
    renderQuestion(currentQuestion);
    updateNavigationButtons();
  };

  const updateNavigationButtons = () => {
    // Управление видимостью кнопок
    if (currentQuestionIndex === 0) {
      btnPrev.style.display = 'none';
    } else {
      btnPrev.style.display = 'inline-block';
    }

    if (currentQuestionIndex === questions.length - 1) {
      btnNext.style.display = 'none';
      btnSend.classList.remove('d-none');
    } else {
      btnNext.style.display = 'inline-block';
      btnSend.classList.add('d-none');
    }
  };

  const renderQuestion = (question) => {
    questionTitle.textContent = question.question || '';

    const savedAnswer = userAnswers[currentQuestionIndex];
    const inputsHtml = question.answers.map((answer, index) => {
      const inputType = question.type || 'radio';
      const inputId = `answerItem${currentQuestionIndex}_${index}`;
      const isChecked = savedAnswer && (
        (Array.isArray(savedAnswer) && savedAnswer.includes(answer.title)) ||
        savedAnswer === answer.title
      );
      
      return `
        <div class="answers-item d-flex flex-column">
          <input type="${inputType}" id="${inputId}" name="answer${currentQuestionIndex}" class="d-none" value="${answer.title}" ${isChecked ? 'checked' : ''}>
          <label for="${inputId}" class="d-flex flex-column justify-content-between">
            <img class="answerImg" src="${answer.url}" alt="${answer.title}">
            <span>${answer.title}</span>
          </label>
        </div>
      `;
    }).join('');

    formAnswers.innerHTML = inputsHtml;

    // Добавляем обработчики для визуальной обратной связи при клике
    const labels = formAnswers.querySelectorAll('label');
    labels.forEach(label => {
      label.addEventListener('click', function() {
        const input = formAnswers.querySelector(`#${label.getAttribute('for')}`);
        if (input.type === 'radio') {
          // Снимаем выделение с других радиокнопок
          labels.forEach(l => {
            if (l !== label) {
              l.classList.remove('active');
            }
          });
        }
        label.classList.toggle('active');
      });
    });
  };
});
