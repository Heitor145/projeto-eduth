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
const carouselButtons = [...document.querySelectorAll('[data-carousel]')];
const carouselProgress = document.querySelector('[data-carousel-progress]');
const carouselCounter = document.querySelector('[data-carousel-counter]');

carouselButtons.forEach((button) => {
  button.addEventListener('click', () => {
    if (!articleTrack) return;
    const card = articleTrack.querySelector('.article-card');
    const gap = 24;
    const distance = (card?.getBoundingClientRect().width || 420) + gap;
    const direction = button.dataset.carousel === 'next' ? 1 : -1;
    articleTrack.scrollBy({ left: direction * distance, behavior: 'smooth' });
  });
});

const updateArticleCarousel = () => {
  if (!articleTrack) return;
  const cards = [...articleTrack.querySelectorAll('.article-card')];
  const firstCard = cards[0];
  if (!firstCard) return;

  const styles = window.getComputedStyle(articleTrack);
  const gap = Number.parseFloat(styles.columnGap || styles.gap) || 24;
  const cardWidth = firstCard.getBoundingClientRect().width;
  const step = cardWidth + gap;
  const maxScroll = Math.max(0, articleTrack.scrollWidth - articleTrack.clientWidth);
  const normalizedScroll = maxScroll > 0 ? articleTrack.scrollLeft / maxScroll : 0;
  const visibleCards = Math.max(1, Math.min(cards.length, Math.round((articleTrack.clientWidth + gap) / step)));
  const firstVisible = Math.min(cards.length - visibleCards, Math.max(0, Math.round(articleTrack.scrollLeft / step)));
  const lastVisible = Math.min(cards.length, firstVisible + visibleCards);

  if (carouselCounter) {
    const formatIndex = (value) => String(value).padStart(2, '0');
    carouselCounter.textContent = `${formatIndex(firstVisible + 1)}–${formatIndex(lastVisible)} / ${formatIndex(cards.length)}`;
  }

  if (carouselProgress) {
    const indicatorWidth = Math.min(100, Math.max(18, (articleTrack.clientWidth / articleTrack.scrollWidth) * 100));
    carouselProgress.style.width = `${indicatorWidth}%`;
    carouselProgress.style.left = `${normalizedScroll * (100 - indicatorWidth)}%`;
  }

  carouselButtons.forEach((button) => {
    const isPrevious = button.dataset.carousel === 'prev';
    button.disabled = isPrevious ? articleTrack.scrollLeft <= 2 : articleTrack.scrollLeft >= maxScroll - 2;
  });
};

let carouselFrame = 0;
const queueCarouselUpdate = () => {
  window.cancelAnimationFrame(carouselFrame);
  carouselFrame = window.requestAnimationFrame(updateArticleCarousel);
};

articleTrack?.addEventListener('scroll', queueCarouselUpdate, { passive: true });
window.addEventListener('resize', queueCarouselUpdate);
queueCarouselUpdate();

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
} else if (page === 'home') {
  const sectionMap = {
    inicio: 'home',
    projeto: 'project',
    temas: 'themes',
    artigos: 'articles',
    empresas: 'companies'
  };
  const sections = [...document.querySelectorAll('main section[id]')]
    .filter((section) => sectionMap[section.id]);
  let navigationFrame = 0;

  const updateActiveSection = () => {
    const probe = window.scrollY + Math.max((header?.offsetHeight || 0) + 24, window.innerHeight * .38);
    const currentSection = sections.reduce((current, section) => (
      section.offsetTop <= probe ? section : current
    ), sections[0]);

    if (currentSection) setActiveNavigation(sectionMap[currentSection.id]);
  };

  const queueNavigationUpdate = () => {
    window.cancelAnimationFrame(navigationFrame);
    navigationFrame = window.requestAnimationFrame(updateActiveSection);
  };

  window.addEventListener('scroll', queueNavigationUpdate, { passive: true });
  window.addEventListener('resize', queueNavigationUpdate);
  queueNavigationUpdate();
}
