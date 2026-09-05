(() => {
  const FALLBACK_PROJECT_IMAGE = 'Images/project-placeholder.svg';

  const html = (value = '') =>
    String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');

  const safeUrl = (value = '', fallback = '') => {
    const raw = String(value || '').trim();
    if (!raw) return fallback;
    if (/^(https?:|mailto:|tel:)/i.test(raw)) return raw;
    if (/^(\/|\.\/|\.\.\/|Images\/)/.test(raw)) return raw;
    return fallback;
  };

  const formatDatePart = (value = '') => {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (/^\d{4}$/.test(raw)) return raw;
    const match = raw.match(/^(\d{4})-(\d{1,2})$/);
    if (!match) return raw;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, 1);
    return new Intl.DateTimeFormat('en', {
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const formatRange = (item) => {
    const start = formatDatePart(item.start_date);
    const end = item.is_current ? 'Present' : formatDatePart(item.end_date);
    return [start, end].filter(Boolean).join(' — ');
  };

  const socialIcon = (platform = '', icon = '') => {
    const value = `${platform} ${icon}`.toLowerCase();
    if (value.includes('linkedin')) return 'fa-brands fa-linkedin-in';
    if (value.includes('github')) return 'fa-brands fa-github';
    if (value.includes('telegram') || value.includes('send')) return 'fa-brands fa-telegram';
    if (value.includes('leetcode') || value.includes('code')) return 'fa-solid fa-code';
    if (value.includes('youtube')) return 'fa-brands fa-youtube';
    if (value.includes('facebook')) return 'fa-brands fa-facebook-f';
    if (value.includes('instagram')) return 'fa-brands fa-instagram';
    if (value.includes('twitter') || value.includes(' x ')) return 'fa-brands fa-x-twitter';
    if (value.includes('mail') || value.includes('email')) return 'fa-solid fa-envelope';
    return 'fa-solid fa-link';
  };

  const categoryIcon = (category = '') => {
    const value = category.toLowerCase();
    if (value.includes('android')) return 'fa-brands fa-android';
    if (value.includes('architecture') || value.includes('async')) return 'fa-solid fa-cubes';
    if (value.includes('data') || value.includes('network') || value.includes('cloud')) return 'fa-solid fa-database';
    if (value.includes('test') || value.includes('delivery')) return 'fa-solid fa-vial';
    if (value.includes('cross') || value.includes('other')) return 'fa-solid fa-mobile-screen';
    if (value.includes('foundation')) return 'fa-solid fa-brain';
    if (value.includes('domain')) return 'fa-solid fa-briefcase';
    return 'fa-solid fa-code';
  };

  const skillIconUrl = (skill) => {
    if (skill.icon_url) return safeUrl(skill.icon_url);
    const key = String(skill.name || '').trim().toLowerCase();
    const icons = {
      kotlin: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/kotlin/kotlin-original.svg',
      'jetpack compose': 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/jetpackcompose/jetpackcompose-original.svg',
      java: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg',
      flutter: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/flutter/flutter-original.svg',
      dart: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/dart/dart-original.svg',
      swift: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/swift/swift-original.svg',
      firebase: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/firebase/firebase-original.svg',
      git: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/git/git-original.svg',
      github: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/github/github-original.svg',
      javascript: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg',
      html5: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/html5/html5-original.svg',
      css3: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/css3/css3-original.svg',
      'c/c++': 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/cplusplus/cplusplus-original.svg',
      'c++': 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/cplusplus/cplusplus-original.svg',
      python: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg',
      'clean architecture': 'Images/skills/clean-architecture.svg',
      mvvm: 'Images/skills/mvvm.svg',
      'rest apis': 'Images/skills/rest-api.svg',
      room: 'Images/skills/room-sql.svg',
      'unit testing': 'Images/skills/unit-testing.svg',
      'data structures': 'Images/skills/data-structures.svg',
      'problem solving': 'Images/skills/problem-solving.svg'
    };
    return icons[key] || '';
  };

  const projectFallback = (project) => {
    const slug = String(project.slug || '').toLowerCase();
    const local = {
      tradify: 'Images/projects/project-tradify.svg',
      'tic-tac-toe': 'Images/projects/project-tictactoe.svg',
      fantazy: 'Images/projects/project-fantazy.svg',
      carto: 'Images/projects/project-carto.svg'
    };
    return local[slug] || FALLBACK_PROJECT_IMAGE;
  };

  async function fetchJson(url) {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(`Portfolio endpoint ${url} did not return JSON.`);
    }
    const body = await response.json();
    if (!response.ok || body?.ok === false) {
      throw new Error(body?.error || `Portfolio endpoint failed (${response.status}).`);
    }
    return body.data || body;
  }

  async function fetchPortfolioData() {
    try {
      return await fetchJson('/api/portfolio');
    } catch (error) {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.warn(
          'The Vercel API route /api/portfolio is unavailable. Run this project with `vercel dev`, not `python -m http.server`, when testing Supabase-backed data.',
          error
        );
      }
      throw error;
    }
  }

  function renderSocials(socials) {
    const container = document.querySelector('.hero .socials');
    if (!container || !socials?.length) return;
    container.innerHTML = socials
      .map((item) => {
        const url = safeUrl(item.url, '#');
        const external = /^https?:/i.test(url);
        return `<a href="${html(url)}"${external ? ' target="_blank" rel="noreferrer"' : ''} aria-label="${html(item.label || item.platform)}"><i class="${socialIcon(item.platform, item.icon)}"></i></a>`;
      })
      .join('');
  }

  function renderSkills(skills) {
    if (!skills?.length) return;

    const groups = new Map();
    skills.forEach((skill) => {
      const category = skill.category || 'Other';
      if (!groups.has(category)) groups.set(category, []);
      groups.get(category).push(skill);
    });

    const groupContainer = document.querySelector('.skill-groups');
    if (groupContainer) {
      groupContainer.innerHTML = [...groups.entries()]
        .map(([category, items]) => `
          <article class="skill-panel reveal">
            <i class="${categoryIcon(category)} panel-icon"></i>
            <h3>${html(category)}</h3>
            <div class="chip-list">${items.map((item) => `<span>${html(item.name)}</span>`).join('')}</div>
          </article>`)
        .join('');
    }

    const gallery = document.getElementById('skillGalleryView');
    const gallerySkills = skills.filter((skill) => skill.show_in_gallery);
    if (gallery && gallerySkills.length) {
      gallery.innerHTML = gallerySkills
        .map((skill) => {
          const icon = skillIconUrl(skill);
          const fallback = String(skill.name || '?').replace(/[^A-Za-z0-9+]/g, '').slice(0, 3) || '?';
          return `<article class="skill-tile">
            <div class="skill-icon-frame${icon ? '' : ' icon-fallback'}" data-fallback="${html(fallback)}">
              ${icon ? `<img src="${html(icon)}" alt="${html(skill.name)} logo" loading="lazy" />` : ''}
            </div>
            <span>${html(skill.name)}</span>
          </article>`;
        })
        .join('');
    }

    const toggle = document.getElementById('skillsViewToggle');
    if (toggle && !gallerySkills.length) toggle.hidden = true;
  }

  function renderTimeline(selector, items, kind) {
    const timeline = document.querySelector(selector);
    if (!timeline || !items?.length) return;

    const cards = items
      .map((item) => {
        const isExperience = kind === 'experience';
        const title = isExperience
          ? item.title
          : [item.degree, item.field_of_study].filter(Boolean).join(' · ');
        const subtitle = isExperience
          ? [item.company, item.location, item.work_mode].filter(Boolean).join(' · ')
          : item.institution;
        const details = [];
        if (!isExperience && item.grade) details.push(`<strong>${html(item.grade)}</strong>`);
        if (item.description) details.push(html(item.description));
        const skills = Array.isArray(item.skills) && item.skills.length
          ? `<div class="timeline-skills">${item.skills.map((skill) => `<span>${html(skill)}</span>`).join('')}</div>`
          : '';
        const companyLink = isExperience ? item.company_url : item.institution_url;
        const linkedSubtitle = companyLink
          ? `<a class="timeline-entity-link" href="${html(safeUrl(companyLink, '#'))}" target="_blank" rel="noreferrer">${html(subtitle)} <i class="fa-solid fa-arrow-up-right-from-square"></i></a>`
          : html(subtitle);
        const entityLogo = safeUrl(isExperience ? item.company_logo_url : item.institution_logo_url);

        return `<article class="timeline-item reveal">
          <div class="timeline-dot"></div>
          <div class="timeline-card">
            <div class="timeline-heading-row">
              ${entityLogo ? `<img class="timeline-entity-logo" src="${html(entityLogo)}" alt="${html(isExperience ? item.company : item.institution)} logo" loading="lazy" />` : ''}
              <div>
                <span class="timeline-date">${html(formatRange(item))}</span>
                <h3>${html(title)}</h3>
                <h4>${linkedSubtitle}</h4>
              </div>
            </div>
            ${details.length ? `<p>${details.join(details.length > 1 ? ' — ' : '')}</p>` : ''}
            ${skills}
          </div>
        </article>`;
      })
      .join('');

    timeline.innerHTML = `<div class="timeline-track" aria-hidden="true"><span class="timeline-progress"></span></div>${cards}`;
  }

  function renderProjects(projects) {
    const grid = document.querySelector('.project-grid');
    if (!grid || !projects?.length) return;

    const featured = projects.filter((project) => project.featured);
    const visible = featured.length ? featured : projects;

    grid.innerHTML = visible
      .map((project) => {
        const destination = safeUrl(project.demo_url || project.github_url, '#');
        const image = safeUrl(project.cover_image_url || project.gallery_urls?.[0], projectFallback(project));
        const tags = Array.isArray(project.tags) ? project.tags.slice(0, 6) : [];
        const github = safeUrl(project.github_url);
        const demo = safeUrl(project.demo_url);
        const video = safeUrl(project.video_url);
        const actions = [
          github ? `<a class="project-link" href="${html(github)}" target="_blank" rel="noreferrer"><i class="fa-brands fa-github"></i> Repository</a>` : '',
          demo ? `<a class="project-link" href="${html(demo)}" target="_blank" rel="noreferrer"><i class="fa-solid fa-arrow-up-right-from-square"></i> Live demo</a>` : '',
          video ? `<a class="project-link" href="${html(video)}" target="_blank" rel="noreferrer"><i class="fa-solid fa-circle-play"></i> Video</a>` : ''
        ].filter(Boolean).join('');

        return `<article class="project-card reveal">
          <a class="project-image" href="${html(destination)}" target="_blank" rel="noreferrer">
            ${project.year ? `<span class="project-year">${html(project.year)}</span>` : ''}
            <img src="${html(image)}" alt="${html(project.name)} project artwork" loading="lazy" onerror="this.src='${FALLBACK_PROJECT_IMAGE}'" />
          </a>
          <div class="project-body">
            <h3>${html(project.name)}</h3>
            <p>${html(project.short_description || project.full_description)}</p>
            ${tags.length ? `<div class="tags">${tags.map((tag) => `<span>${html(tag)}</span>`).join('')}</div>` : ''}
            ${actions ? `<div class="project-actions">${actions}</div>` : ''}
          </div>
        </article>`;
      })
      .join('');
  }

  function certificationLogo(item) {
    if (item.image_url) return safeUrl(item.image_url);
    if (item.issuer_logo_url) return safeUrl(item.issuer_logo_url);
    const issuer = String(item.issuer || '').toLowerCase();
    if (issuer.includes('udemy')) return 'Images/certificates/udemy.svg';
    if (issuer.includes('information technology institute') || issuer === 'iti') return 'Images/ITI.png';
    return '';
  }

  function renderCertifications(items) {
    const grid = document.querySelector('.certificate-grid');
    if (!grid || !items?.length) return;
    grid.innerHTML = items
      .map((item) => {
        const logo = certificationLogo(item);
        const credential = safeUrl(item.credential_url);
        const skills = Array.isArray(item.skills) ? item.skills.slice(0, 3) : [];
        return `<article class="certificate-card reveal">
          <div class="certificate-icon">${logo ? `<img src="${html(logo)}" alt="${html(item.issuer)}" />` : '<i class="fa-solid fa-certificate"></i>'}</div>
          <div class="certificate-content">
            <span class="certificate-date">${html(formatDatePart(item.issue_date) || item.issuer)}</span>
            <h3>${html(item.name)}</h3>
            <p>${html(item.description || item.issuer)}</p>
            ${skills.length ? `<div class="certificate-meta">${skills.map((skill) => `<span><i class="fa-solid fa-code"></i> ${html(skill)}</span>`).join('')}</div>` : ''}
            ${credential ? `<a class="certificate-link" href="${html(credential)}" target="_blank" rel="noreferrer">See certificate <i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : ''}
          </div>
        </article>`;
      })
      .join('');
  }

  function renderRecommendations(items) {
    const grid = document.getElementById('recommendationsGrid');
    if (!grid || !items?.length) return;
    grid.innerHTML = items
      .map((item) => {
        const image = safeUrl(item.author_image_url);
        const linkedIn = safeUrl(item.linkedin_url);
        return `<article class="recommendation-card reveal">
          <div class="recommendation-author">
            ${image ? `<img src="${html(image)}" alt="${html(item.author_name)}" loading="lazy" />` : `<span class="recommendation-avatar">${html(String(item.author_name || '?').charAt(0))}</span>`}
            <div>
              <h3>${html(item.author_name)}</h3>
              <p>${html([item.author_title, item.author_company].filter(Boolean).join(' · '))}</p>
            </div>
          </div>
          <blockquote>${html(item.content)}</blockquote>
          <div class="recommendation-meta">
            <span>${html(item.relationship || formatDatePart(item.recommendation_date))}</span>
            ${linkedIn ? `<a href="${html(linkedIn)}" target="_blank" rel="noreferrer">LinkedIn <i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : ''}
          </div>
        </article>`;
      })
      .join('');
  }

  function renderLanguages(items) {
    const grid = document.getElementById('languageGrid');
    if (!grid || !items?.length) return;
    grid.innerHTML = items
      .map((item) => `<article class="language-card reveal"><i class="fa-solid fa-language"></i><div><h3>${html(item.name)}</h3><p>${html(item.proficiency || 'Proficiency not specified')}</p></div></article>`)
      .join('');
  }

  function renderProfile(profile, settings, socials) {
    if (!profile) return;

    if (settings?.site_title) document.title = settings.site_title;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && settings?.meta_description) metaDescription.content = settings.meta_description;

    const brandName = document.querySelector('.brand-name');
    if (brandName && profile.brand_name) brandName.textContent = profile.brand_name;
    const brand = document.querySelector('.brand');
    if (brand && profile.full_name) brand.setAttribute('aria-label', `${profile.full_name} — Home`);

    const availability = document.querySelector('.hero-copy > .eyebrow');
    if (availability) {
      const label = profile.availability_label || (profile.open_to_work ? 'Open to opportunities' : 'Currently unavailable');
      availability.innerHTML = `${profile.open_to_work ? '<span class="status-dot"></span> ' : ''}${html(label)}`;
      const preferences = [
        ...(profile.preferred_regions || []),
        ...(profile.preferred_work_modes || [])
      ];
      if (preferences.length) availability.title = preferences.join(' · ');
    }

    const name = String(profile.full_name || '').trim();
    const heroName = document.querySelector('.hero-name');
    if (heroName && name) {
      const parts = name.split(/\s+/);
      const first = parts.shift() || name;
      const rest = parts.join(' ');
      heroName.setAttribute('aria-label', name);
      heroName.innerHTML = `<span>${html(first)}</span>${rest ? `<span>${html(rest)}</span>` : ''}`;
    }

    const typed = document.getElementById('typedText');
    if (typed && profile.hero_roles?.length) typed.textContent = profile.hero_roles[0];

    const heroDescription = document.querySelector('.hero-description');
    if (heroDescription && profile.hero_description) heroDescription.textContent = profile.hero_description;

    const cvButton = document.querySelector('.hero-actions .secondary-btn');
    if (cvButton && profile.cv_url) cvButton.href = safeUrl(profile.cv_url, cvButton.href);

    const heroImage = document.querySelector('.hero-visual img');
    const portraitImage = document.querySelector('.about-portrait > img');
    if (profile.avatar_url) {
      const avatar = safeUrl(profile.avatar_url);
      if (heroImage && avatar) heroImage.src = avatar;
      if (portraitImage && avatar) portraitImage.src = avatar;
    }
    [heroImage, portraitImage].forEach((image) => {
      if (image && name) image.alt = name;
    });

    const logo = document.querySelector('.role-logo-badge img');
    if (logo && profile.logo_url) logo.src = safeUrl(profile.logo_url, logo.src);
    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon && profile.logo_url) favicon.href = safeUrl(profile.logo_url, favicon.href);

    const aboutHeadline = document.querySelector('.about-copy h3');
    if (aboutHeadline && profile.about_headline) aboutHeadline.textContent = profile.about_headline;

    const aboutCopy = document.querySelector('.about-copy');
    const stats = aboutCopy?.querySelector('.about-stats');
    if (aboutCopy && stats) {
      aboutCopy.querySelectorAll(':scope > p').forEach((p) => p.remove());
      const paragraphs = profile.about_paragraphs?.length
        ? profile.about_paragraphs
        : [profile.long_bio || profile.short_bio].filter(Boolean);
      paragraphs.forEach((paragraph) => {
        const p = document.createElement('p');
        p.textContent = paragraph;
        aboutCopy.insertBefore(p, stats);
      });

      if (Array.isArray(profile.about_stats) && profile.about_stats.length) {
        stats.innerHTML = profile.about_stats
          .map((stat) => `<div><strong>${html(stat.value)}</strong><span>${html(stat.label)}</span></div>`)
          .join('');
      }
    }

    renderSocials(socials);

    const contactHeading = document.querySelector('.contact-intro h2');
    const contactDescription = document.querySelector('.contact-intro > p');
    if (contactHeading && settings?.contact_heading) contactHeading.textContent = settings.contact_heading;
    if (contactDescription && settings?.contact_description) contactDescription.textContent = settings.contact_description;

    const contactLinks = document.querySelector('.contact-links');
    if (contactLinks) {
      const linkedin = socials?.find((item) => String(item.platform).toLowerCase().includes('linkedin'))?.url || profile.linkedin_profile_url;
      const links = [];
      if (linkedin) links.push(`<a href="${html(safeUrl(linkedin, '#'))}" target="_blank" rel="noreferrer"><i class="fa-brands fa-linkedin"></i> LinkedIn</a>`);
      if (settings?.portfolio_url) links.push(`<a href="${html(safeUrl(settings.portfolio_url, '#'))}" target="_blank" rel="noreferrer"><i class="fa-solid fa-globe"></i> Portfolio</a>`);
      if (profile.phone) links.push(`<a href="tel:${html(profile.phone.replace(/\s+/g, ''))}"><i class="fa-solid fa-phone"></i> ${html(profile.phone)}</a>`);
      if (links.length) contactLinks.innerHTML = links.join('');
    }

    const telegram = socials?.find((item) => String(item.platform).toLowerCase().includes('telegram'))?.url || (settings?.telegram_username ? `https://t.me/${settings.telegram_username.replace(/^@/, '')}` : '');
    const telegramFallback = document.querySelector('.telegram-fallback');
    if (telegramFallback && telegram) telegramFallback.href = safeUrl(telegram, telegramFallback.href);

    if (profile.email) {
      const emailCard = document.querySelector('.email-address-card strong');
      if (emailCard) emailCard.textContent = profile.email;
      const emailAction = document.querySelector('.email-action');
      if (emailAction) {
        emailAction.href = `mailto:${encodeURIComponent(profile.email)}?subject=${encodeURIComponent('Portfolio inquiry from your website')}&body=${encodeURIComponent(`Hello ${profile.full_name || ''},\n\nI would like to discuss:\n\n`)}`;
      }
    }

    const footer = document.querySelector('footer p');
    if (footer) {
      const footerText = settings?.footer_text || 'Built with clean code.';
      footer.innerHTML = `© <span id="year"></span> ${html(profile.full_name || '')}. ${html(footerText)}`;
    }
  }

  function applySectionVisibility(data) {
    const configured = data.settings?.section_visibility || {};
    const collections = {
      experience: data.experiences,
      education: data.education,
      projects: data.projects,
      certifications: data.certifications,
      recommendations: data.recommendations,
      languages: data.languages,
      skills: data.skills
    };

    const keyToId = {
      about: 'about',
      skills: 'skills',
      experience: 'experience',
      education: 'education',
      projects: 'projects',
      certifications: 'certificates',
      recommendations: 'recommendations',
      languages: 'languages',
      contact: 'contact'
    };

    Object.entries(keyToId).forEach(([key, id]) => {
      const section = document.getElementById(id);
      if (!section) return;
      let visible = configured[key] !== false;
      if (collections[key] && collections[key].length === 0) visible = false;
      section.hidden = !visible;
      document.querySelectorAll(`.site-nav a[href="#${id}"]`).forEach((link) => {
        link.hidden = !visible;
      });
    });
  }

  function renumberSections() {
    let number = 1;
    document.querySelectorAll('main > section[id]').forEach((section) => {
      if (section.id === 'home' || section.hidden) return;
      const badge = section.querySelector('.section-heading > span');
      if (badge) badge.textContent = `${String(number).padStart(2, '0')}.`;
      number += 1;
    });
  }

  function hydrate(data) {
    if (!data) return;
    window.PORTFOLIO_DATA = data;

    renderProfile(data.profile, data.settings, data.socials || []);
    renderSkills(data.skills || []);
    renderTimeline('#experienceTimeline', data.experiences || [], 'experience');
    renderTimeline('#educationTimeline', data.education || [], 'education');
    renderProjects(data.projects || []);
    renderCertifications(data.certifications || []);
    renderRecommendations(data.recommendations || []);
    renderLanguages(data.languages || []);
    applySectionVisibility(data);
    renumberSections();

    const repoLinks = document.querySelectorAll('.view-all-projects, .projects-footer .secondary-btn');
    if (data.settings?.repositories_url) {
      repoLinks.forEach((link) => {
        link.href = safeUrl(data.settings.repositories_url, link.href);
      });
    }

    document.dispatchEvent(new CustomEvent('portfolio:data-ready', { detail: data }));
  }

  async function load() {
    try {
      const data = await fetchPortfolioData();
      hydrate(data);
      return data;
    } catch (error) {
      console.warn('Using built-in portfolio fallback because Supabase data could not be loaded:', error);
      document.documentElement.dataset.portfolioSource = 'fallback';
      return null;
    }
  }

  window.PortfolioDataBridge = {
    load,
    hydrate,
    fetchPortfolioData
  };
})();
