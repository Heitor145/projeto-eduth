const header = document.querySelector('.site-header');
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');
const navLinks = [...document.querySelectorAll('.site-nav a')];
const topicsNav = document.querySelector('.topics-nav');
const topicsToggle = document.querySelector('.topics-toggle');

const setHeaderState = () => {
  header?.classList.toggle('scrolled', window.scrollY > 24);
};

const setTopicsOpen = (open) => {
  topicsNav?.classList.toggle('open', open);
  topicsToggle?.setAttribute('aria-expanded', String(open));
};

const closeMenu = () => {
  document.body.classList.remove('menu-open');
  menuToggle?.setAttribute('aria-expanded', 'false');
  setTopicsOpen(false);
};

setHeaderState();
window.addEventListener('scroll', setHeaderState, { passive: true });

menuToggle?.addEventListener('click', () => {
  const open = !document.body.classList.contains('menu-open');
  document.body.classList.toggle('menu-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  if (!open) setTopicsOpen(false);
});

topicsToggle?.addEventListener('click', (event) => {
  event.stopPropagation();
  setTopicsOpen(!topicsNav?.classList.contains('open'));
});

topicsNav?.addEventListener('click', (event) => event.stopPropagation());
document.addEventListener('click', () => setTopicsOpen(false));
navLinks.forEach((link) => link.addEventListener('click', closeMenu));

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;

  if (topicsNav?.classList.contains('open')) {
    setTopicsOpen(false);
    topicsToggle?.focus();
    return;
  }

  if (document.body.classList.contains('menu-open')) {
    closeMenu();
    menuToggle?.focus();
  }
});

window.addEventListener('resize', () => {
  if (window.innerWidth > 1020) closeMenu();
});

document.querySelectorAll('.faq-item button').forEach((button) => {
  button.addEventListener('click', () => {
    const item = button.closest('.faq-item');
    const wasOpen = item.classList.contains('open');

    document.querySelectorAll('.faq-item.open').forEach((openItem) => {
      openItem.classList.remove('open');
      openItem.querySelector('button')?.setAttribute('aria-expanded', 'false');
    });

    if (!wasOpen) {
      item.classList.add('open');
      button.setAttribute('aria-expanded', 'true');
    }
  });
});

const articleTrack = document.querySelector('.article-track');

document.querySelectorAll('[data-carousel]').forEach((button) => {
  button.addEventListener('click', () => {
    if (!articleTrack) return;
    const card = articleTrack.querySelector('.article-card');
    const gap = 24;
    const distance = (card?.getBoundingClientRect().width || 420) + gap;
    const direction = button.dataset.carousel === 'next' ? 1 : -1;
    articleTrack.scrollBy({ left: direction * distance, behavior: 'smooth' });
  });
});

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const revealItems = document.querySelectorAll('.reveal');

if (reducedMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -9% 0px', threshold: 0.08 });

  revealItems.forEach((item) => revealObserver.observe(item));
}

const page = document.body.dataset.page;
const mainNavItems = [...document.querySelectorAll('[data-nav]')];

const setActiveNavigation = (name) => {
  mainNavItems.forEach((item) => item.classList.toggle('active', item.dataset.nav === name));
  topicsToggle?.classList.toggle('active', name === 'themes');
};

if (page === 'game') {
  setActiveNavigation('game');
} else if (['environment', 'mobility', 'housing', 'cities'].includes(page)) {
  setActiveNavigation('themes');
} else if (page === 'home' && 'IntersectionObserver' in window) {
  const sectionMap = {
    inicio: 'home',
    projeto: 'project',
    temas: 'themes',
    artigos: 'articles',
    empresas: 'companies'
  };
  const sections = [...document.querySelectorAll('main section[id], header[id]')];
  const activeSectionObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;
    const activeName = sectionMap[visible.target.id];
    if (activeName) setActiveNavigation(activeName);
  }, { rootMargin: '-34% 0px -56% 0px', threshold: [0, 0.05, 0.15] });

  sections.forEach((section) => activeSectionObserver.observe(section));
}

const memoryCards = [...document.querySelectorAll('.memory-card')];
const restartButton = document.querySelector('#restart-game');
const gameStatus = document.querySelector('#game-status');
let firstCard = null;
let secondCard = null;
let boardLocked = false;
let matchedPairs = 0;

const updateGameStatus = () => {
  if (!gameStatus) return;
  gameStatus.textContent = matchedPairs === 4
    ? '4 de 4 pares — partida concluída!'
    : `${matchedPairs} de 4 pares`;
};

const resetTurn = () => {
  firstCard = null;
  secondCard = null;
  boardLocked = false;
};

const checkMemoryPair = () => {
  if (!firstCard || !secondCard) return;
  const isMatch = firstCard.dataset.pair === secondCard.dataset.pair;

  if (isMatch) {
    firstCard.classList.add('matched');
    secondCard.classList.add('matched');
    firstCard.disabled = true;
    secondCard.disabled = true;
    matchedPairs += 1;
    updateGameStatus();
    resetTurn();
    return;
  }

  boardLocked = true;
  window.setTimeout(() => {
    firstCard?.classList.remove('flipped');
    secondCard?.classList.remove('flipped');
    resetTurn();
  }, 850);
};

memoryCards.forEach((card) => {
  card.addEventListener('click', () => {
    if (boardLocked || card === firstCard || card.classList.contains('matched')) return;
    card.classList.add('flipped');

    if (!firstCard) {
      firstCard = card;
      return;
    }

    secondCard = card;
    checkMemoryPair();
  });
});

const restartMemoryGame = () => {
  matchedPairs = 0;
  resetTurn();
  memoryCards
    .map((card) => ({ card, order: Math.random() }))
    .sort((a, b) => a.order - b.order)
    .forEach(({ card }, index) => {
      card.classList.remove('flipped', 'matched');
      card.disabled = false;
      card.style.order = String(index);
    });
  updateGameStatus();
};

restartButton?.addEventListener('click', restartMemoryGame);
if (memoryCards.length) restartMemoryGame();
