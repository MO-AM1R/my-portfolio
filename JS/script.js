// Load the public portfolio content from the same Supabase project used by the CMS.
// If the endpoint is unavailable, the static HTML remains as a resilient fallback.
const bootStartedAt = performance.now();
const root = document.documentElement;
const loaderElement = document.getElementById('siteLoader');
const loaderStatusElement = document.getElementById('loaderStatus');
const loaderProgressBar = document.getElementById('loaderProgressBar');
const body = document.body;

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function updateLoader(status, fallback = false) {
  if (loaderStatusElement && status) loaderStatusElement.textContent = status;
  body?.classList.toggle('loader-fallback', Boolean(fallback));
}

async function finishLoader(minimumDuration = 2600) {
  const elapsed = performance.now() - bootStartedAt;
  const remaining = Math.max(0, minimumDuration - elapsed);
  if (remaining) await wait(remaining);
  if (loaderProgressBar) loaderProgressBar.style.width = '100%';
  loaderElement?.classList.add('is-exiting');
  body?.classList.remove('is-booting');
  body?.classList.add('is-ready');
  window.setTimeout(() => {
    if (loaderElement) loaderElement.hidden = true;
  }, 760);
}

updateLoader('Syncing live portfolio data');
const loadedData = await window.PortfolioDataBridge?.load?.();
if (loadedData) {
  updateLoader('Portfolio ready — launching experience');
} else {
  updateLoader('Live data unavailable — opening local snapshot', true);
}

const toggle = document.getElementById('themeToggle');
const transitionOverlay = document.getElementById('themeTransitionOverlay');
const storedTheme = localStorage.getItem('portfolio-theme');
const preferredTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

root.dataset.theme = storedTheme || preferredTheme;

function updateThemeUI() {
  const isDark = root.dataset.theme === 'dark';
  document.querySelector('meta[name="theme-color"]').content = isDark ? '#071619' : '#f5f8f8';
  toggle?.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} theme`);
  if (toggle) toggle.title = `Switch theme`;
  window.dispatchEvent(new CustomEvent('portfolio:theme-changed', { detail: { theme: root.dataset.theme } }));
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
  if (!toggle || toggle.disabled) return;
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
toggle?.addEventListener('click', switchTheme);

// Mobile navigation.
const menu = document.querySelector('.site-nav');
const menuBtn = document.querySelector('.menu-toggle');
menuBtn?.addEventListener('click', () => {
  const open = menu.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.innerHTML = `<i class="fa-solid fa-${open ? 'xmark' : 'bars'}"></i>`;
});
document.querySelectorAll('.site-nav a').forEach((link) => link.addEventListener('click', () => {
  menu?.classList.remove('open');
  menuBtn?.setAttribute('aria-expanded', 'false');
  if (menuBtn) menuBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
}));

// Section reveal animations.
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

document.addEventListener('portfolio:data-ready', () => {
  document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));
});

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
  const label = skillsViewToggle.querySelector('span');
  const icon = skillsViewToggle.querySelector('i');
  if (label) label.textContent = showGallery ? 'Show Skill Categories' : 'Explore Skill Gallery';
  if (icon) icon.className = showGallery ? 'fa-solid fa-layer-group' : 'fa-solid fa-table-cells-large';

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
const typingPhrases = window.PORTFOLIO_DATA?.profile?.hero_roles?.length
  ? window.PORTFOLIO_DATA.profile.hero_roles
  : [
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

// Timelines grow according to the visitor's scroll position.
const timelineControllers = [...document.querySelectorAll('.timeline')].map((timeline) => {
  const progress = timeline.querySelector('.timeline-progress');
  const items = [...timeline.querySelectorAll('.timeline-item')];
  return { timeline, progress, items };
});
let timelineTicking = false;

function updateTimelineProgress() {
  timelineTicking = false;
  const viewportAnchor = innerHeight * 0.58;

  timelineControllers.forEach(({ timeline, progress, items }) => {
    if (!progress || timeline.closest('section')?.hidden) return;
    const rect = timeline.getBoundingClientRect();
    const rawProgress = (viewportAnchor - rect.top) / Math.max(rect.height, 1);
    const progressValue = Math.min(1, Math.max(0, rawProgress));
    progress.style.height = `${progressValue * 100}%`;

    items.forEach((item) => {
      const dot = item.querySelector('.timeline-dot');
      if (!dot) return;
      const dotRect = dot.getBoundingClientRect();
      item.classList.toggle('is-active', dotRect.top + dotRect.height / 2 <= viewportAnchor);
    });
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

function initInteractiveCards() {
  const selectors = '.skill-panel, .timeline-card, .project-card, .certificate-card, .recommendation-card, .language-card, .contact-option, .about-stage';
  document.querySelectorAll(selectors).forEach((card) => {
    const handlePointer = (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
      card.style.setProperty('--my', `${event.clientY - rect.top}px`);
    };
    card.addEventListener('pointermove', handlePointer, { passive: true });
    card.addEventListener('pointerenter', handlePointer, { passive: true });
  });
}

function initNetworkBackground() {
  const canvas = document.getElementById('networkCanvas');
  if (!canvas || reduceMotion) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const pointer = {
    x: null,
    y: null,
    active: false,
    radius: 160
  };

  const network = {
    points: [],
    width: 0,
    height: 0,
    colors: {
      node: 'rgba(66,232,216,0.85)',
      lineBase: 'rgba(66,232,216,0.12)',
      lineHighlight: 'rgba(92,124,255,0.36)',
      halo: 'rgba(66,232,216,0.22)'
    }
  };

  const POINT_DENSITY = () => Math.max(36, Math.min(72, Math.floor((window.innerWidth * window.innerHeight) / 24000)));

  function updateColors() {
    const isDark = root.dataset.theme === 'dark';
    network.colors = isDark
      ? {
          node: 'rgba(66,232,216,0.85)',
          lineBase: 'rgba(66,232,216,0.12)',
          lineHighlight: 'rgba(92,124,255,0.36)',
          halo: 'rgba(66,232,216,0.22)'
        }
      : {
          node: 'rgba(10,162,148,0.72)',
          lineBase: 'rgba(10,162,148,0.10)',
          lineHighlight: 'rgba(91,124,255,0.22)',
          halo: 'rgba(10,162,148,0.16)'
        };
  }

  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    network.width = window.innerWidth;
    network.height = window.innerHeight;
    canvas.width = Math.floor(network.width * dpr);
    canvas.height = Math.floor(network.height * dpr);
    canvas.style.width = `${network.width}px`;
    canvas.style.height = `${network.height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const targetCount = POINT_DENSITY();
    if (network.points.length > targetCount) {
      network.points.length = targetCount;
    }
    while (network.points.length < targetCount) {
      network.points.push({
        x: Math.random() * network.width,
        y: Math.random() * network.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        size: 1.4 + Math.random() * 2.4
      });
    }
  }

  function animate() {
    ctx.clearRect(0, 0, network.width, network.height);

    const maxDistance = Math.min(170, Math.max(110, network.width * 0.12));
    const mouseRange = pointer.radius;

    for (const point of network.points) {
      point.x += point.vx;
      point.y += point.vy;
      if (point.x <= 0 || point.x >= network.width) point.vx *= -1;
      if (point.y <= 0 || point.y >= network.height) point.vy *= -1;
      point.x = Math.max(0, Math.min(network.width, point.x));
      point.y = Math.max(0, Math.min(network.height, point.y));
    }

    for (let i = 0; i < network.points.length; i += 1) {
      const a = network.points[i];
      for (let j = i + 1; j < network.points.length; j += 1) {
        const b = network.points[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distance = Math.hypot(dx, dy);
        if (distance > maxDistance) continue;

        let alpha = 1 - distance / maxDistance;
        let width = 1;
        let stroke = network.colors.lineBase;

        if (pointer.active && pointer.x != null && pointer.y != null) {
          const da = Math.hypot(a.x - pointer.x, a.y - pointer.y);
          const db = Math.hypot(b.x - pointer.x, b.y - pointer.y);
          const influence = Math.max(0, 1 - Math.min(da, db) / mouseRange);
          if (influence > 0) {
            alpha = Math.min(1, alpha + influence * 0.8);
            width = 1 + influence * 1.4;
            stroke = influence > 0.32 ? network.colors.lineHighlight : network.colors.lineBase;
          }
        }

        ctx.strokeStyle = stroke.replace(/\d?\.\d+\)|\d+\)$/g, `${(alpha * (stroke === network.colors.lineHighlight ? 0.85 : 0.55)).toFixed(3)})`);
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    if (pointer.active && pointer.x != null && pointer.y != null) {
      ctx.fillStyle = network.colors.halo;
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, 88, 0, Math.PI * 2);
      ctx.fill();

      network.points.forEach((point) => {
        const distance = Math.hypot(point.x - pointer.x, point.y - pointer.y);
        if (distance > mouseRange) return;
        const influence = 1 - distance / mouseRange;
        ctx.strokeStyle = network.colors.lineHighlight.replace(/\d?\.\d+\)|\d+\)$/g, `${(0.22 + influence * 0.52).toFixed(3)})`);
        ctx.lineWidth = 1.1 + influence * 1.6;
        ctx.beginPath();
        ctx.moveTo(pointer.x, pointer.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
      });
    }

    network.points.forEach((point) => {
      const distanceToPointer = pointer.active && pointer.x != null && pointer.y != null
        ? Math.hypot(point.x - pointer.x, point.y - pointer.y)
        : Infinity;
      const highlighted = distanceToPointer < mouseRange;
      const size = point.size + (highlighted ? (1 - distanceToPointer / mouseRange) * 2.6 : 0);
      ctx.fillStyle = highlighted ? network.colors.lineHighlight : network.colors.node;
      ctx.beginPath();
      ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(animate);
  }

  window.addEventListener('pointermove', (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
  }, { passive: true });

  window.addEventListener('pointerleave', () => {
    pointer.active = false;
    pointer.x = null;
    pointer.y = null;
  }, { passive: true });

  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('portfolio:theme-changed', updateColors);

  updateColors();
  resizeCanvas();
  animate();
}

// Telegram contact form. The bot token remains inside the Vercel Function.
const telegramForm = document.getElementById('telegramForm');
const telegramStatus = document.getElementById('telegramStatus');

function setTelegramStatus(message, type = '') {
  if (!telegramStatus) return;
  telegramStatus.textContent = message;
  telegramStatus.className = `form-status ${type}`.trim();
}

function extractApiError(value, depth = 0) {
  if (depth > 4 || value == null) return '';

  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.message;

  if (typeof value === 'object') {
    const preferredKeys = [
      'message',
      'description',
      'error',
      'details',
      'detail'
    ];

    for (const key of preferredKeys) {
      const message = extractApiError(value[key], depth + 1);
      if (message) return message;
    }

    try {
      const serialized = JSON.stringify(value);
      return serialized === '{}' ? '' : serialized;
    } catch {
      return '';
    }
  }

  return String(value);
}

async function postTelegramMessage(payload) {
  const response = await fetch('/api/contact', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const contentType = response.headers.get('content-type') || '';
  let result;

  if (contentType.includes('application/json')) {
    result = await response.json().catch(() => ({}));
  } else {
    const responseText = await response.text().catch(() => '');
    result = { error: responseText.slice(0, 300) };
  }

  if (!response.ok || result?.ok === false) {
    const deploymentHint =
      response.status === 404
        ? 'The Vercel Function was not found. Make sure api/contact.js is in the deployed project root, then redeploy.'
        : '';

    const apiMessage =
      extractApiError(result?.error) ||
      extractApiError(result) ||
      deploymentHint ||
      `Request failed with status ${response.status}.`;

    throw new Error(apiMessage);
  }

  return result;
}

telegramForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  setTelegramStatus('');

  if (!telegramForm.checkValidity()) {
    telegramForm.reportValidity();
    return;
  }

  if (window.location.protocol === 'file:') {
    setTelegramStatus(
      'Run the project with “vercel dev” or test it on the deployed Vercel website. A local file preview cannot execute /api/contact.',
      'error'
    );
    return;
  }

  const data = Object.fromEntries(new FormData(telegramForm).entries());
  if (data.website) return; // Honeypot.

  const submitButton = telegramForm.querySelector('button[type="submit"]');
  const originalContent = submitButton.innerHTML;

  submitButton.disabled = true;
  submitButton.innerHTML =
    '<span>Sending…</span><i class="fa-solid fa-spinner fa-spin"></i>';
  setTelegramStatus('Sending your message…');

  try {
    await postTelegramMessage(data);
    telegramForm.reset();
    setTelegramStatus(
      'Message sent successfully. I’ll get back to you soon.',
      'success'
    );
  } catch (error) {
    console.error('Telegram contact error:', error);

    const message =
      extractApiError(error) ||
      'Could not send through Telegram.';

    setTelegramStatus(
      `${message} You can use “Open Telegram” or email instead.`,
      'error'
    );
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = originalContent;
  }
});

// Email copy helper.
const copyEmailButton = document.getElementById('copyEmail');
copyEmailButton?.addEventListener('click', async () => {
  const email = document.querySelector('.email-address-card strong')?.textContent?.trim()
    || window.PORTFOLIO_DATA?.profile?.email
    || 'mohamedamir5050@gmail.com';
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
  if (!glow) return;
  glow.style.left = `${event.clientX}px`;
  glow.style.top = `${event.clientY}px`;
}, { passive: true });

initInteractiveCards();
initNetworkBackground();
requestAnimationFrame(requestTimelineUpdate);
await finishLoader(2600);
