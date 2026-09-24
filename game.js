(() => {
  const root = document.querySelector('[data-urban-game]');
  if (!root) return;

  const canvas = root.querySelector('#urban-game-canvas');
  const context = canvas?.getContext('2d');
  if (!canvas || !context) return;

  const populationElement = root.querySelector('[data-urban-population]');
  const bestElement = root.querySelector('[data-urban-best]');
  const correctElement = root.querySelector('[data-urban-correct]');
  const statusElement = root.querySelector('[data-urban-status]');
  const liveElement = root.querySelector('[data-urban-live]');
  const startButton = root.querySelector('[data-urban-start]');
  const resetButton = root.querySelector('[data-urban-reset]');
  const quizActions = root.querySelector('[data-urban-quiz-actions]');
  const directionButtons = [...root.querySelectorAll('[data-urban-direction]')];
  const answerButtons = [...root.querySelectorAll('[data-urban-answer]')];

  const gridSize = 20;
  const cellSize = canvas.width / gridSize;
  const tickDuration = 125;
  const storageKey = 'urbanizacao-maior-populacao';

  const directions = Object.freeze({
    up: Object.freeze({ x: 0, y: -1 }),
    down: Object.freeze({ x: 0, y: 1 }),
    left: Object.freeze({ x: -1, y: 0 }),
    right: Object.freeze({ x: 1, y: 0 })
  });

  const directionKeys = Object.freeze({
    ArrowUp: 'up',
    ArrowDown: 'down',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    w: 'up',
    W: 'up',
    s: 'down',
    S: 'down',
    a: 'left',
    A: 'left',
    d: 'right',
    D: 'right'
  });

  const questions = [
    { text: 'A urbanização é o crescimento da população nas cidades.', answer: true },
    { text: 'A urbanização acontece somente em países desenvolvidos.', answer: false },
    { text: 'O crescimento desordenado das cidades pode causar problemas de trânsito.', answer: true },
    { text: 'Urbanização significa diminuir o número de pessoas vivendo nas cidades.', answer: false },
    { text: 'A falta de planejamento urbano pode contribuir para problemas ambientais.', answer: true }
  ];

  const earthMap = [
    'BBBBBBBBBBBBBBBBBBBB',
    'BBBBBBBBBBGGGBBBBBBB',
    'BBBBBBBGGGGGGGBBBBBB',
    'BBBBGGGGGGGGGGGBBBBB',
    'BBBGGGGGGGGGGGGGGGBB',
    'BBGGGGGGGGGGGGGGGGBB',
    'BBGGGGGGGGGGGGGGGGGB',
    'BGGGGGGGGGGGGGGGGGGB',
    'BGGGGGGGGGGGGGGGGGGB',
    'BGGGGGGGGGGGGGGGGGGB',
    'BGGGGGGGGGGGGGGGGGGB',
    'BBGGGGGGGGGGGGGGGGGB',
    'BBGGGGGGGGGGGGGGGGBB',
    'BBBGGGGGGGGGGGGGGGBB',
    'BBBBGGGGGGGGGGGBBBBB',
    'BBBBBBBGGGGGGGBBBBBB',
    'BBBBBBBBBBGGGBBBBBBB',
    'BBBBBBBBBBBBBBBBBBBB',
    'BBBBBBBBBBBBBBBBBBBB',
    'BBBBBBBBBBBBBBBBBBBB'
  ];

  let snake = [];
  let food = null;
  let direction = directions.down;
  let nextDirection = directions.down;
  let directionQueued = false;
  let state = 'idle';
  let loopId = null;
  let currentQuestion = null;
  let lastQuestionIndex = -1;
  let correctAnswers = 0;
  let pointerStart = null;

  const readBest = () => {
    try {
      const value = Number.parseInt(window.localStorage.getItem(storageKey) || '1', 10);
      return Number.isFinite(value) && value > 0 ? value : 1;
    } catch {
      return 1;
    }
  };

  let bestPopulation = readBest();

  const writeBest = () => {
    try {
      window.localStorage.setItem(storageKey, String(bestPopulation));
    } catch {
      // O jogo continua normalmente quando o armazenamento local está indisponível.
    }
  };

  const formatValue = (value) => String(value).padStart(2, '0');

  const updateStats = () => {
    const population = snake.length || 1;
    if (populationElement) populationElement.textContent = formatValue(population);
    if (bestElement) bestElement.textContent = formatValue(bestPopulation);
    if (correctElement) correctElement.textContent = formatValue(correctAnswers);
  };

  const announce = (message) => {
    if (liveElement) liveElement.textContent = message;
  };

  const setState = (nextState, label) => {
    state = nextState;
    root.dataset.gameState = nextState;
    root.classList.toggle('is-running', nextState === 'running');
    root.classList.toggle('is-paused', nextState === 'paused');
    root.classList.toggle('is-quiz', nextState === 'quiz');
    root.classList.toggle('is-game-over', nextState === 'game-over');
    if (statusElement) statusElement.textContent = label;
    if (quizActions) quizActions.hidden = nextState !== 'quiz';

    if (startButton) {
      startButton.disabled = nextState === 'quiz';
      startButton.textContent = nextState === 'running'
        ? 'Pausar'
        : nextState === 'paused'
          ? 'Continuar'
          : nextState === 'game-over'
            ? 'Jogar novamente'
            : 'Jogar';
    }

    if (resetButton) resetButton.disabled = nextState === 'idle';
  };

  const stopLoop = () => {
    if (loopId !== null) window.clearInterval(loopId);
    loopId = null;
  };

  const startLoop = () => {
    stopLoop();
    loopId = window.setInterval(gameTick, tickDuration);
  };

  const roundedRect = (x, y, width, height, radius) => {
    const safeRadius = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + safeRadius, y);
    context.arcTo(x + width, y, x + width, y + height, safeRadius);
    context.arcTo(x + width, y + height, x, y + height, safeRadius);
    context.arcTo(x, y + height, x, y, safeRadius);
    context.arcTo(x, y, x + width, y, safeRadius);
    context.closePath();
  };

  const drawEarth = () => {
    earthMap.forEach((row, y) => {
      [...row].forEach((tile, x) => {
        const isLand = tile === 'G';
        const lightnessShift = ((x + y) % 3) * 3;
        context.fillStyle = isLand
          ? `hsl(145 49% ${33 + lightnessShift}%)`
          : `hsl(215 74% ${30 + lightnessShift}%)`;
        context.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      });
    });

    context.strokeStyle = 'rgba(255, 255, 255, .035)';
    context.lineWidth = 1;
    for (let index = 1; index < gridSize; index += 1) {
      const point = index * cellSize + .5;
      context.beginPath();
      context.moveTo(point, 0);
      context.lineTo(point, canvas.height);
      context.stroke();
      context.beginPath();
      context.moveTo(0, point);
      context.lineTo(canvas.width, point);
      context.stroke();
    }
  };

  const drawGame = () => {
    drawEarth();

    if (food) {
      const centerX = (food.x + .5) * cellSize;
      const centerY = (food.y + .5) * cellSize;
      context.save();
      context.shadowColor = 'rgba(255, 191, 92, .8)';
      context.shadowBlur = 14;
      context.fillStyle = '#ffbe5c';
      context.beginPath();
      context.arc(centerX, centerY, cellSize * .28, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#fff4cf';
      context.beginPath();
      context.arc(centerX - 2, centerY - 3, cellSize * .08, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }

    snake.forEach((segment, index) => {
      const inset = cellSize * .1;
      const x = segment.x * cellSize + inset;
      const y = segment.y * cellSize + inset;
      const size = cellSize - inset * 2;
      const gradient = context.createLinearGradient(x, y, x + size, y + size);
      gradient.addColorStop(0, index === 0 ? '#d6c6ff' : '#9a75e5');
      gradient.addColorStop(1, index === 0 ? '#51c6ff' : '#348fd0');
      context.fillStyle = gradient;
      if (index === 0) {
        context.shadowColor = 'rgba(81, 198, 255, .62)';
        context.shadowBlur = 12;
      }
      roundedRect(x, y, size, size, cellSize * .22);
      context.fill();
      context.shadowBlur = 0;
    });

    context.fillStyle = 'rgba(5, 10, 30, .72)';
    roundedRect(10, 10, 126, 34, 10);
    context.fill();
    context.fillStyle = '#fff';
    context.font = '700 15px Inter, Arial, sans-serif';
    context.textAlign = 'left';
    context.fillText(`População: ${formatValue(snake.length || 1)}`, 22, 32);
  };

  const wrapText = (text, maxWidth) => {
    const lines = [];
    let line = '';
    text.split(' ').forEach((word) => {
      const testLine = `${line}${word} `;
      if (line && context.measureText(testLine).width > maxWidth) {
        lines.push(line.trim());
        line = `${word} `;
      } else {
        line = testLine;
      }
    });
    if (line) lines.push(line.trim());
    return lines;
  };

  const drawPanel = (eyebrow, title, copy) => {
    context.fillStyle = 'rgba(4, 8, 25, .82)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.textAlign = 'center';
    context.fillStyle = '#63c7ff';
    context.font = '800 12px Inter, Arial, sans-serif';
    context.fillText(eyebrow, canvas.width / 2, 112);
    context.fillStyle = '#fff';
    context.font = '400 34px Cambo, Georgia, serif';
    context.fillText(title, canvas.width / 2, 158);
    context.fillStyle = 'rgba(255, 255, 255, .72)';
    context.font = '500 16px Inter, Arial, sans-serif';
    wrapText(copy, 310).slice(0, 4).forEach((line, index) => {
      context.fillText(line, canvas.width / 2, 205 + index * 25);
    });
  };

  const draw = () => {
    drawGame();
    if (state === 'idle') {
      drawPanel('JOGO EDUCATIVO', 'Urbanização', 'Clique em Jogar ou pressione F para começar.');
    } else if (state === 'paused') {
      drawPanel('PAUSADO', 'Respire um pouco', 'Clique em Continuar quando estiver pronto.');
    } else if (state === 'game-over') {
      drawPanel('FIM DA RODADA', `${formatValue(snake.length || 1)} habitantes`, 'Uma resposta incorreta encerrou a rodada. Tente novamente.');
    } else if (state === 'quiz' && currentQuestion) {
      drawPanel('QUIZ DE URBANIZAÇÃO', 'Verdadeiro ou falso?', currentQuestion.text);
      context.font = '800 14px Inter, Arial, sans-serif';
      context.fillStyle = '#6be0a7';
      context.fillText('V — VERDADEIRO', canvas.width / 2, 320);
      context.fillStyle = '#ff93af';
      context.fillText('F — FALSO', canvas.width / 2, 350);
    }
  };

  const placeFood = () => {
    const freeCells = [];
    for (let y = 0; y < gridSize; y += 1) {
      for (let x = 0; x < gridSize; x += 1) {
        if (!snake.some((segment) => segment.x === x && segment.y === y)) freeCells.push({ x, y });
      }
    }
    return freeCells.length ? freeCells[Math.floor(Math.random() * freeCells.length)] : null;
  };

  const resetBoard = () => {
    snake = [{ x: 10, y: 10 }];
    direction = directions.down;
    nextDirection = directions.down;
    directionQueued = false;
    currentQuestion = null;
    correctAnswers = 0;
    food = placeFood();
    updateStats();
  };

  const startGame = () => {
    stopLoop();
    resetBoard();
    setState('running', 'Em movimento');
    announce('Partida iniciada. População: 1.');
    draw();
    startLoop();
    root.focus({ preventScroll: true });
  };

  const pauseGame = () => {
    if (state !== 'running') return;
    stopLoop();
    setState('paused', 'Pausado');
    announce('Partida pausada.');
    draw();
  };

  const resumeGame = () => {
    if (state !== 'paused') return;
    setState('running', 'Em movimento');
    announce('Partida retomada.');
    draw();
    startLoop();
    root.focus({ preventScroll: true });
  };

  const finishGame = () => {
    stopLoop();
    setState('game-over', 'Fim da rodada');
    announce(`Fim da rodada. População final: ${snake.length || 1}.`);
    draw();
  };

  const chooseQuestion = () => {
    let questionIndex = Math.floor(Math.random() * questions.length);
    if (questions.length > 1 && questionIndex === lastQuestionIndex) {
      questionIndex = (questionIndex + 1) % questions.length;
    }
    lastQuestionIndex = questionIndex;
    return questions[questionIndex];
  };

  const openQuiz = () => {
    stopLoop();
    currentQuestion = chooseQuestion();
    setState('quiz', 'Responda ao quiz');
    announce(`Quiz: ${currentQuestion.text}`);
    draw();
  };

  const recoverFromCollision = () => {
    if (snake.length > 1) {
      snake.reverse();
      direction = {
        x: snake[0].x - snake[1].x,
        y: snake[0].y - snake[1].y
      };
    } else {
      const head = snake[0];
      if (head.x <= 0) direction = directions.right;
      else if (head.x >= gridSize - 1) direction = directions.left;
      else if (head.y <= 0) direction = directions.down;
      else if (head.y >= gridSize - 1) direction = directions.up;
      else direction = directions.right;
    }
    nextDirection = direction;
    directionQueued = false;
  };

  const answerQuiz = (answer) => {
    if (state !== 'quiz' || !currentQuestion) return;
    if (answer !== currentQuestion.answer) {
      currentQuestion = null;
      finishGame();
      return;
    }

    correctAnswers += 1;
    currentQuestion = null;
    recoverFromCollision();
    updateStats();
    setState('running', 'Resposta correta');
    announce('Resposta correta. A partida continua.');
    draw();
    window.setTimeout(() => {
      if (state === 'running' && statusElement) statusElement.textContent = 'Em movimento';
    }, 900);
    startLoop();
    root.focus({ preventScroll: true });
  };

  function gameTick() {
    direction = nextDirection;
    directionQueued = false;
    const head = snake[0];
    const nextHead = { x: head.x + direction.x, y: head.y + direction.y };
    const hitBoundary = nextHead.x < 0 || nextHead.x >= gridSize || nextHead.y < 0 || nextHead.y >= gridSize;
    const willEat = Boolean(food && nextHead.x === food.x && nextHead.y === food.y);
    const bodyToCheck = willEat ? snake : snake.slice(0, -1);
    const hitBody = bodyToCheck.some((segment) => segment.x === nextHead.x && segment.y === nextHead.y);

    if (hitBoundary || hitBody) {
      openQuiz();
      return;
    }

    snake.unshift(nextHead);
    if (willEat) {
      if (snake.length > bestPopulation) {
        bestPopulation = snake.length;
        writeBest();
      }
      food = placeFood();
      announce(`Recurso coletado. População: ${snake.length}.`);
    } else {
      snake.pop();
    }

    updateStats();
    draw();
  }

  const requestDirection = (name) => {
    const candidate = directions[name];
    if (!candidate || directionQueued || state !== 'running') return;
    const isOpposite = candidate.x + direction.x === 0 && candidate.y + direction.y === 0;
    const isSame = candidate.x === direction.x && candidate.y === direction.y;
    if (isOpposite || isSame) return;
    nextDirection = candidate;
    directionQueued = true;
  };

  const handleDirection = (name) => {
    if (state === 'idle' || state === 'game-over') startGame();
    else if (state === 'paused') resumeGame();
    requestDirection(name);
  };

  startButton?.addEventListener('click', () => {
    if (state === 'idle' || state === 'game-over') startGame();
    else if (state === 'running') pauseGame();
    else if (state === 'paused') resumeGame();
  });

  resetButton?.addEventListener('click', startGame);
  directionButtons.forEach((button) => {
    button.addEventListener('click', () => handleDirection(button.dataset.urbanDirection));
  });
  answerButtons.forEach((button) => {
    button.addEventListener('click', () => answerQuiz(button.dataset.urbanAnswer === 'true'));
  });

  window.addEventListener('keydown', (event) => {
    if (state === 'quiz') {
      const key = event.key.toLowerCase();
      if (key === 'v' || key === 'f') {
        event.preventDefault();
        answerQuiz(key === 'v');
      }
      return;
    }

    if ((state === 'idle' || state === 'game-over') && event.key.toLowerCase() === 'f') {
      event.preventDefault();
      startGame();
      return;
    }

    const requestedDirection = directionKeys[event.key];
    if (!requestedDirection) return;
    event.preventDefault();
    handleDirection(requestedDirection);
  });

  canvas.addEventListener('pointerdown', (event) => {
    pointerStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
    canvas.setPointerCapture?.(event.pointerId);
  });

  canvas.addEventListener('pointerup', (event) => {
    if (!pointerStart || pointerStart.id !== event.pointerId) return;
    const deltaX = event.clientX - pointerStart.x;
    const deltaY = event.clientY - pointerStart.y;
    pointerStart = null;
    if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 24) return;
    const requestedDirection = Math.abs(deltaX) > Math.abs(deltaY)
      ? (deltaX > 0 ? 'right' : 'left')
      : (deltaY > 0 ? 'down' : 'up');
    handleDirection(requestedDirection);
  });

  canvas.addEventListener('pointercancel', () => { pointerStart = null; });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state === 'running') pauseGame();
  });
  window.addEventListener('blur', () => {
    if (state === 'running') pauseGame();
  });

  resetBoard();
  setState('idle', 'Aguardando');
  draw();
})();
