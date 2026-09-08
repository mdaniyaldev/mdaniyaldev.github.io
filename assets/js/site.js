const THEME_KEY = 'theme';

const getPreferredTheme = () => {
  try {
    const storedTheme = localStorage.getItem(THEME_KEY);
    if (storedTheme === 'dark' || storedTheme === 'light') return storedTheme;
  } catch (_) {}

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyTheme = (theme, persist = false) => {
  document.documentElement.setAttribute('data-theme', theme);
  if (persist) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (_) {}
  }
};

const initThemeToggle = () => {
  const buttons = document.querySelectorAll('[data-theme-toggle]');
  if (!buttons.length) return;

  const syncButtons = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    buttons.forEach((button) => {
      button.setAttribute('aria-pressed', String(isDark));
      const icon = button.querySelector('[data-theme-icon]');
      if (icon) icon.textContent = isDark ? '🌙' : '☀️';
    });
  };

  syncButtons();

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const nextTheme = current === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme, true);
      syncButtons();
    });
  });
};

const initNavToggle = () => {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });
};

const initReveal = () => {
  const revealElements = document.querySelectorAll('.reveal');
  if (!revealElements.length || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.12 });

  revealElements.forEach((el) => observer.observe(el));
};

const initTyping = () => {
  const target = document.querySelector('[data-typing-target]');
  if (!target) return;

  const roles = (target.getAttribute('data-typing-items') || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (!roles.length) return;

  let roleIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  const tick = () => {
    const role = roles[roleIndex];
    target.textContent = role.slice(0, charIndex);

    if (!isDeleting && charIndex < role.length) {
      charIndex += 1;
      setTimeout(tick, 70);
      return;
    }

    if (!isDeleting && charIndex === role.length) {
      isDeleting = true;
      setTimeout(tick, 1400);
      return;
    }

    if (isDeleting && charIndex > 0) {
      charIndex -= 1;
      setTimeout(tick, 40);
      return;
    }

    isDeleting = false;
    roleIndex = (roleIndex + 1) % roles.length;
    setTimeout(tick, 240);
  };

  tick();
};

const initResumeButtons = async () => {
  const resumeButtons = document.querySelectorAll('.resume-download');
  if (!resumeButtons.length) return;

  const sanitizeResumeCandidate = (candidate) => {
    if (!candidate || /[:?#]/.test(candidate) || candidate.startsWith('//')) return '';
    if (!/^[./a-zA-Z0-9_-]+\.pdf$/.test(candidate)) return '';
    return candidate;
  };

  const allCandidates = new Set();
  resumeButtons.forEach((button) => {
    const candidates = (button.getAttribute('data-resume-candidates') || '')
      .split(',')
      .map((item) => item.trim())
      .map(sanitizeResumeCandidate)
      .filter(Boolean);
    candidates.forEach((candidate) => allCandidates.add(candidate));
  });

  let resolvedResume = '';
  for (const candidate of allCandidates) {
    try {
      const response = await fetch(candidate, { method: 'HEAD' });
      if (response.ok) {
        resolvedResume = candidate;
        break;
      }
    } catch (_) {}
  }

  resumeButtons.forEach((button) => {
    if (resolvedResume) {
      button.setAttribute('href', resolvedResume);
      button.setAttribute('download', resolvedResume.split('/').pop() || 'resume.pdf');
      button.removeAttribute('aria-disabled');
      button.classList.remove('is-disabled');
      return;
    }

    button.setAttribute('href', '#');
    button.setAttribute('aria-disabled', 'true');
    button.classList.add('is-disabled');
    button.setAttribute('title', 'Resume file is not yet available.');
    button.addEventListener('click', (event) => event.preventDefault());
  });
};

applyTheme(getPreferredTheme());
initThemeToggle();
initNavToggle();
initReveal();
initTyping();
initResumeButtons();
