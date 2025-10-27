let currentQuestions = [];
let userAnswers = {};
let examStartTime = null;
let examCompleted = false;

// Функция для выбора случайных вопросов
function getRandomQuestions() {
    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 10);
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
        passed: correctCount >= 8 // Экзамен сдан при 8+ правильных ответов
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
    scoreDiv.innerHTML += `<p>Для успешной сдачи необходимо правильно ответить на 8 из 10 вопросов</p>`;
    
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
    examStartTime = new Date();
    document.getElementById('start-time').textContent = formatDateTime(examStartTime);
    document.getElementById('exam-info').style.display = 'block';
    
    currentQuestions = getRandomQuestions();
    displayQuestions();
    
    // Скрываем кнопку перезапуска в начале экзамена
    document.getElementById('restart-btn').style.display = 'none';
});
