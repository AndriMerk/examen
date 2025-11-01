let currentQuestions = [];
let userAnswers = {};
let examStartTime = null;
let examCompleted = false;

// Функция для сброса прокрутки при загрузке страницы
function resetScrollPosition() {
    window.scrollTo(0, 0);
}

// Функция для выбора 5 случайных вопросов
function getRandomQuestions() {
    // Создаем копию массива вопросов
    const questionsCopy = [...questions];
    const selectedQuestions = [];
    
    // Используем улучшенный алгоритм Фишера-Йетса для перемешивания
    for (let i = questionsCopy.length - 1; i > 0; i--) {
        // Генерируем случайный индекс с использованием криптографически безопасного генератора
        const randomBuffer = new Uint32Array(1);
        crypto.getRandomValues(randomBuffer);
        const j = randomBuffer[0] % (i + 1);
        
        // Меняем местами элементы
        [questionsCopy[i], questionsCopy[j]] = [questionsCopy[j], questionsCopy[i]];
    }
    
    // Берем первые 5 вопросов из тщательно перемешанного массива
    return questionsCopy.slice(0, 5);
}

// Альтернативный вариант - еще более случайное перемешивание
function getRandomQuestionsAlternative() {
    // Создаем массив с индексами вопросов и случайными весами
    const questionsWithWeights = questions.map((question, index) => ({
        question,
        weight: Math.random() + Math.random() + Math.random() // Три случайных числа для большей энтропии
    }));
    
    // Сортируем по убыванию веса
    questionsWithWeights.sort((a, b) => b.weight - a.weight);
    
    // Берем первые 5 вопросов
    return questionsWithWeights.slice(0, 5).map(item => item.question);
}

// Еще один вариант - комбинированный подход
function getRandomQuestionsCombined() {
    // Шаг 1: Первое перемешивание
    let shuffled = [...questions];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Шаг 2: Второе перемешивание с другим алгоритмом
    shuffled = shuffled
        .map(question => ({ question, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ question }) => question);
    
    // Шаг 3: Третье перемешивание для максимальной случайности
    const finalShuffle = [];
    const tempArray = [...shuffled];
    
    while (tempArray.length > 0) {
        const randomIndex = Math.floor(Math.random() * tempArray.length);
        finalShuffle.push(tempArray.splice(randomIndex, 1)[0]);
    }
    
    return finalShuffle.slice(0, 5);
}

// Функция для удаления символа * из правильных ответов
function cleanAnswerText(text) {
    return text.replace('*', '');
}

// Функция для форматирования даты и времени
function formatDateTime(date) {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    
    return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
}

// Функция для обновления прогресса и состояния кнопки
function updateProgress() {
    const answeredCount = Object.keys(userAnswers).length;
    const totalQuestions = currentQuestions.length;
    const progressElement = document.getElementById('progress');
    const submitButton = document.getElementById('submit-btn');
    
    progressElement.textContent = `Отвечено: ${answeredCount} из ${totalQuestions} вопросов`;
    
    // Активируем кнопку только если ответили на все вопросы
    if (answeredCount === totalQuestions) {
        submitButton.disabled = false;
    } else {
        submitButton.disabled = true;
    }
}

// Функция для блокировки радио-кнопок после завершения экзамена
function lockRadioButtons() {
    const radioButtons = document.querySelectorAll('input[type="radio"]');
    radioButtons.forEach(radio => {
        radio.disabled = true;
    });
}

// Функция для отображения вопросов
function displayQuestions() {
    const container = document.getElementById('quiz-container');
    container.innerHTML = '';
    
    currentQuestions.forEach((question, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = 'question';
        
        const questionNumber = document.createElement('div');
        questionNumber.className = 'question-number';
        questionNumber.textContent = `${index + 1}. ${question.question}`;
        
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'options';
        
        question.answers.forEach((answer, answerIndex) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'option';
            
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = `question-${index}`;
            input.value = answerIndex;
            input.id = `q${index}-a${answerIndex}`;
            
            // Восстанавливаем выбранные ответы при перезапуске
            if (userAnswers[index] === answerIndex) {
                input.checked = true;
            }
            
            // Сохраняем выбор пользователя
            input.addEventListener('change', () => {
                if (!examCompleted) { // Только если экзамен не завершен
                    userAnswers[index] = answerIndex;
                    updateProgress();
                }
            });
            
            const label = document.createElement('label');
            label.htmlFor = `q${index}-a${answerIndex}`;
            label.textContent = cleanAnswerText(answer);
            
            optionDiv.appendChild(input);
            optionDiv.appendChild(label);
            optionsDiv.appendChild(optionDiv);
        });
        
        questionDiv.appendChild(questionNumber);
        questionDiv.appendChild(optionsDiv);
        container.appendChild(questionDiv);
    });
    
    // Обновляем прогресс после отображения вопросов
    updateProgress();
}

// Функция для проверки ответов
function checkAnswers() {
    let correctCount = 0;
    const results = [];
    
    currentQuestions.forEach((question, index) => {
        const userAnswerIndex = userAnswers[index];
        const correctAnswerIndex = question.answers.findIndex(answer => answer.startsWith('*'));
        
        const isCorrect = userAnswerIndex === correctAnswerIndex;
        if (isCorrect) {
            correctCount++;
        }
        
        results.push({
            question: question.question,
            userAnswer: userAnswerIndex !== undefined ? cleanAnswerText(question.answers[userAnswerIndex]) : 'Не отвечено',
            correctAnswer: cleanAnswerText(question.answers[correctAnswerIndex]),
            isCorrect: isCorrect
        });
    });
    
    return {
        score: correctCount,
        total: currentQuestions.length,
        results: results,
        passed: correctCount >= 4 // Экзамен сдан при 4+ правильных ответов из 5
    };
}

// Функция для отображения результатов
function displayResults(result) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';
    
    const completionTimeDiv = document.createElement('div');
    completionTimeDiv.className = 'completion-time';
    completionTimeDiv.innerHTML = `<strong>Экзамен завершен:</strong> ${formatDateTime(new Date())}`;
    resultsDiv.appendChild(completionTimeDiv);
    
    const scoreDiv = document.createElement('div');
    scoreDiv.className = `score ${result.passed ? 'passed' : 'failed'}`;
    scoreDiv.innerHTML = `<h2>Результат: ${result.score} из ${result.total}</h2>`;
    scoreDiv.innerHTML += `<h3>${result.passed ? '✅ Экзамен сдан успешно!' : '❌ Экзамен не сдан!'}</h3>`;
    scoreDiv.innerHTML += `<p>Для успешной сдачи необходимо правильно ответить на 4 из 5 вопросов</p>`;
    
    resultsDiv.appendChild(scoreDiv);
    
    result.results.forEach((item, index) => {
        const resultDiv = document.createElement('div');
        resultDiv.className = `result ${item.isCorrect ? 'correct' : 'incorrect'}`;
        
        resultDiv.innerHTML = `
            <strong>Вопрос ${index + 1}:</strong> ${item.question}<br>
            <strong>Ваш ответ:</strong> ${item.userAnswer}<br>
            <strong>Правильный ответ:</strong> ${item.correctAnswer}
        `;
        
        resultsDiv.appendChild(resultDiv);
    });
    
    // Скрываем прогресс после завершения экзамена
    document.getElementById('progress').style.display = 'none';
    
    // Показываем кнопку "Начать экзамен сначала" только после завершения
    document.getElementById('restart-btn').style.display = 'inline-block';
    
    // Прокрутка к результатам
    resultsDiv.scrollIntoView({ behavior: 'smooth' });
}

// Функция для завершения экзамена
function submitQuiz() {
    if (examCompleted) return;
    
    examCompleted = true;
    const result = checkAnswers();
    
    // Блокируем кнопку отправки после завершения
    document.getElementById('submit-btn').disabled = true;
    
    // Блокируем все радио-кнопки
    lockRadioButtons();
    
    // Отображаем результаты
    displayResults(result);
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Сбрасываем позицию прокрутки при загрузке страницы
    resetScrollPosition();
    
    examStartTime = new Date();
    document.getElementById('start-time').textContent = formatDateTime(examStartTime);
    document.getElementById('exam-info').style.display = 'block';
    
    // Используем улучшенную функцию перемешивания для выбора 5 вопросов
    currentQuestions = getRandomQuestionsCombined();
    
    displayQuestions();
    
    // Скрываем кнопку перезапуска в начале экзамена
    document.getElementById('restart-btn').style.display = 'none';
    
    // Также сбрасываем прокрутку при событии beforeunload (перед перезагрузкой)
    window.addEventListener('beforeunload', resetScrollPosition);
});