const root = document.documentElement;
const toggle = document.getElementById('themeToggle');
const transitionOverlay = document.getElementById('themeTransitionOverlay');
const storedTheme = localStorage.getItem('portfolio-theme');
const preferredTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

root.dataset.theme = storedTheme || preferredTheme;

function updateThemeUI() {
  const isDark = root.dataset.theme === 'dark';
  document.querySelector('meta[name="theme-color"]').content = isDark ? '#071619' : '#f5f8f8';
  toggle.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} theme`);
  toggle.title = `Switch to ${isDark ? 'light' : 'dark'} theme`;
}

function themeRevealGeometry() {
  const rect = toggle.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  root.style.setProperty('--theme-x', `${x}px`);
  root.style.setProperty('--theme-y', `${y}px`);
  root.style.setProperty('--theme-radius', `${radius}px`);
  return { x, y, radius };
}

function commitTheme(nextTheme) {
  root.dataset.theme = nextTheme;
  localStorage.setItem('portfolio-theme', nextTheme);
  updateThemeUI();
}

async function switchTheme() {
  if (toggle.disabled) return;
  toggle.disabled = true;
  const nextTheme = root.dataset.theme === 'dark' ? 'light' : 'dark';
  const { x, y, radius } = themeRevealGeometry();

  if (!reduceMotion && document.startViewTransition) {
    root.classList.add('theme-transition');
    const transition = document.startViewTransition(() => commitTheme(nextTheme));
    try {
      await transition.finished;
    } finally {
      root.classList.remove('theme-transition');
      toggle.disabled = false;
    }
    return;
  }

  if (!reduceMotion && transitionOverlay) {
    transitionOverlay.style.setProperty('--theme-x', `${x}px`);
    transitionOverlay.style.setProperty('--theme-y', `${y}px`);
    transitionOverlay.style.setProperty('--theme-radius', `${radius}px`);
    transitionOverlay.style.background = nextTheme === 'dark' ? '#071619' : '#f5f8f8';
    transitionOverlay.classList.add('is-revealing');
    window.setTimeout(() => commitTheme(nextTheme), 820);
    window.setTimeout(() => {
      transitionOverlay.classList.remove('is-revealing');
      toggle.disabled = false;
    }, 930);
    return;
  }

  commitTheme(nextTheme);
  toggle.disabled = false;
}

updateThemeUI();
toggle.addEventListener('click', switchTheme);

// Mobile navigation.
const menu = document.querySelector('.site-nav');
const menuBtn = document.querySelector('.menu-toggle');
menuBtn.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.innerHTML = `<i class="fa-solid fa-${open ? 'xmark' : 'bars'}"></i>`;
});
document.querySelectorAll('.site-nav a').forEach((link) => link.addEventListener('click', () => {
  menu.classList.remove('open');
  menuBtn.setAttribute('aria-expanded', 'false');
  menuBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
}));

// Section reveal animations.
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));


// Skills can switch between grouped categories and a visual icon gallery.
const skillsViewToggle = document.getElementById('skillsViewToggle');
const skillCategoryView = document.getElementById('skillCategoryView');
const skillGalleryView = document.getElementById('skillGalleryView');

function setSkillsView(showGallery, persist = true) {
  if (!skillsViewToggle || !skillCategoryView || !skillGalleryView) return;

  skillCategoryView.hidden = showGallery;
  skillGalleryView.hidden = !showGallery;
  skillCategoryView.classList.toggle('is-active', !showGallery);
  skillGalleryView.classList.toggle('is-active', showGallery);
  skillsViewToggle.setAttribute('aria-pressed', String(showGallery));
  skillsViewToggle.querySelector('span').textContent = showGallery
    ? 'Show Skill Categories'
    : 'Explore Skill Gallery';
  skillsViewToggle.querySelector('i').className = showGallery
    ? 'fa-solid fa-layer-group'
    : 'fa-solid fa-table-cells-large';

  if (persist) localStorage.setItem('portfolio-skills-view', showGallery ? 'gallery' : 'categories');
}

setSkillsView(localStorage.getItem('portfolio-skills-view') === 'gallery', false);
skillsViewToggle?.addEventListener('click', () => {
  setSkillsView(skillsViewToggle.getAttribute('aria-pressed') !== 'true');
});

document.querySelectorAll('.skill-icon-frame img').forEach((image) => {
  image.addEventListener('error', () => {
    image.hidden = true;
    image.parentElement?.classList.add('icon-fallback');
  }, { once: true });
});

// Active navigation item.
const sections = [...document.querySelectorAll('main section[id]')];
const navigationLinks = [...document.querySelectorAll('.site-nav a')];
const navObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navigationLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
    });
  });
}, { rootMargin: '-42% 0px -48% 0px' });
sections.forEach((section) => navObserver.observe(section));

// Auto-typing role animation without an external dependency.
const typedElement = document.getElementById('typedText');
const typingPhrases = [
  'Android Developer',
  'Jetpack Compose Developer',
  'Kotlin Multiplatform Dev',
  'Cairo University Graduate',
  'ITI Native Mobile Trainee'
];

function startTypewriter() {
  if (!typedElement) return;
  if (reduceMotion) {
    typedElement.textContent = typingPhrases[0];
    return;
  }

  let phraseIndex = 0;
  let characterIndex = 0;
  let deleting = false;

  const tick = () => {
    const phrase = typingPhrases[phraseIndex];
    characterIndex += deleting ? -1 : 1;
    typedElement.textContent = phrase.slice(0, Math.max(0, characterIndex));

    let delay = deleting ? 34 : 64;
    if (!deleting && characterIndex === phrase.length) {
      deleting = true;
      delay = 1450;
    } else if (deleting && characterIndex === 0) {
      deleting = false;
      phraseIndex = (phraseIndex + 1) % typingPhrases.length;
      delay = 350;
    }
    window.setTimeout(tick, delay);
  };

  typedElement.textContent = '';
  window.setTimeout(tick, 350);
}
startTypewriter();

// Education timeline grows according to the visitor's scroll position.
const timeline = document.getElementById('educationTimeline');
const timelineProgress = document.getElementById('timelineProgress');
const timelineItems = timeline ? [...timeline.querySelectorAll('.timeline-item')] : [];
let timelineTicking = false;

function updateTimelineProgress() {
  timelineTicking = false;
  if (!timeline || !timelineProgress) return;

  const rect = timeline.getBoundingClientRect();
  const viewportAnchor = innerHeight * 0.58;
  const rawProgress = (viewportAnchor - rect.top) / Math.max(rect.height, 1);
  const progress = Math.min(1, Math.max(0, rawProgress));
  timelineProgress.style.height = `${progress * 100}%`;

  timelineItems.forEach((item) => {
    const dot = item.querySelector('.timeline-dot');
    if (!dot) return;
    const dotRect = dot.getBoundingClientRect();
    item.classList.toggle('is-active', dotRect.top + dotRect.height / 2 <= viewportAnchor);
  });
}

function requestTimelineUpdate() {
  if (timelineTicking) return;
  timelineTicking = true;
  requestAnimationFrame(updateTimelineProgress);
}
window.addEventListener('scroll', requestTimelineUpdate, { passive: true });
window.addEventListener('resize', requestTimelineUpdate);
requestTimelineUpdate();

// Telegram contact form. The browser never receives the bot token.
const telegramForm = document.getElementById('telegramForm');
const telegramStatus = document.getElementById('telegramStatus');

function setTelegramStatus(message, type = '') {
  if (!telegramStatus) return;
  telegramStatus.textContent = message;
  telegramStatus.className = `form-status ${type}`.trim();
}

async function postTelegramMessage(payload) {
  // /api/contact is the friendly Netlify redirect. The direct function URL is
  // kept as a fallback for older deployments that have not applied netlify.toml.
  const endpoints = ['/api/contact', '/.netlify/functions/send-telegram'];
  let lastError = new Error('Telegram endpoint is unavailable.');

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const contentType = response.headers.get('content-type') || '';
      const result = contentType.includes('application/json')
        ? await response.json().catch(() => ({}))
        : { error: (await response.text().catch(() => '')).slice(0, 180) };
      if (response.ok) return result;

      const deploymentHint = response.status === 404
        ? 'Telegram function was not found. Deploy the complete project through Netlify Git or Netlify CLI, not as static files only.'
        : '';
      lastError = new Error(result.error || deploymentHint || `Request failed with status ${response.status}.`);
      // A missing redirect may return 404; try the direct function URL.
      if (response.status !== 404 || endpoint === endpoints[endpoints.length - 1]) {
        throw lastError;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Could not send the message.');
      if (endpoint === endpoints[endpoints.length - 1]) throw lastError;
    }
  }

  throw lastError;
}

telegramForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  setTelegramStatus('');

  if (!telegramForm.checkValidity()) {
    telegramForm.reportValidity();
    return;
  }

  if (window.location.protocol === 'file:') {
    setTelegramStatus('Run the site with “netlify dev” or deploy it through Netlify Git/CLI to test Telegram. Static file preview cannot execute the serverless function.', 'error');
    return;
  }

  const data = Object.fromEntries(new FormData(telegramForm).entries());
  if (data.website) return; // Honeypot.

  const submitButton = telegramForm.querySelector('button[type="submit"]');
  const originalContent = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.innerHTML = '<span>Sending…</span><i class="fa-solid fa-spinner fa-spin"></i>';
  setTelegramStatus('Sending your message…');

  try {
    await postTelegramMessage(data);
    telegramForm.reset();
    setTelegramStatus('Message sent successfully. I’ll get back to you soon.', 'success');
  } catch (error) {
    console.error('Telegram contact error:', error);
    setTelegramStatus(`${error.message || 'Could not send through Telegram.'} You can use “Open Telegram” or email instead.`, 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = originalContent;
  }
});

// Email copy helper.
const copyEmailButton = document.getElementById('copyEmail');
copyEmailButton?.addEventListener('click', async () => {
  const email = 'mohamedamir5050@gmail.com';
  try {
    await navigator.clipboard.writeText(email);
    copyEmailButton.innerHTML = '<i class="fa-solid fa-check"></i><span>Copied</span>';
    copyEmailButton.setAttribute('aria-label', 'Email address copied');
    window.setTimeout(() => {
      copyEmailButton.innerHTML = '<i class="fa-regular fa-copy"></i><span>Copy</span>';
      copyEmailButton.setAttribute('aria-label', 'Copy email address');
    }, 1800);
  } catch {
    window.location.href = `mailto:${email}`;
  }
});

// Footer year and pointer glow.
document.getElementById('year').textContent = new Date().getFullYear();
const glow = document.querySelector('.cursor-glow');
window.addEventListener('pointermove', (event) => {
  glow.style.left = `${event.clientX}px`;
  glow.style.top = `${event.clientY}px`;
}, { passive: true });
