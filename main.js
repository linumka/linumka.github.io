/* ============ linumka portfolio – main.js ============ */
(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------
   * 1. Sparse twinkling stars (hero, banner, footer)
   * --------------------------------------------------- */
  function StarField(canvas) {
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, stars = [], t = 0, raf = null, running = false;

    function resize() {
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = [];
      var n = Math.round((W * H) / 26000);
      for (var i = 0; i < n; i++) {
        stars.push({
          x: Math.random() * W, y: Math.random() * H,
          s: 0.6 + Math.random() * 1.6,
          p: Math.random() * Math.PI * 2,
          v: 0.5 + Math.random() * 1.2,
          c: Math.random() < 0.35 ? '#b4cdfe' : '#ffe6e0'
        });
      }
    }

    function frame() {
      t += 0.016;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < stars.length; i++) {
        var st = stars[i];
        var tw = 0.3 + 0.7 * Math.abs(Math.sin(t * st.v + st.p));
        ctx.globalAlpha = tw * 0.8;
        ctx.fillStyle = st.c;
        ctx.shadowColor = st.c;
        ctx.shadowBlur = 6 * tw;
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.s * tw, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1; ctx.shadowBlur = 0;
      raf = requestAnimationFrame(frame);
    }

    function start() { if (!running) { running = true; raf = requestAnimationFrame(frame); } }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); }

    resize();
    window.addEventListener('resize', resize);
    if (reduced) { frame(); cancelAnimationFrame(raf); return; }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { e.isIntersecting ? start() : stop(); });
      }).observe(canvas);
    } else { start(); }
  }

  document.querySelectorAll('[data-stars]').forEach(function (c) { StarField(c); });

  /* ---------------------------------------------------
   * 2. Render cases from cases-data.js (portfolio page)
   * --------------------------------------------------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* хронология: свежие проекты выше; «н.в.» (идущие сейчас) – в самом верху */
  function caseSortKey(c) {
    var y = String(c.year || '');
    var years = y.match(/\d{4}/g);
    var key = years ? Math.max.apply(null, years.map(Number)) : 0;
    if (/н\.?\s?в|now|наст/i.test(y)) key += 100;
    return key;
  }

  function renderCases() {
    var wrap = document.querySelector('#cases[data-dynamic]');
    if (!wrap || !window.CASES) return;

    var sorted = window.CASES.slice().sort(function (a, b) {
      return caseSortKey(b) - caseSortKey(a);
    });

    var html = sorted.map(function (c) {
      var mediaInner =
        '<img src="' + esc(c.image) + '" alt="' + esc(c.title) + '" loading="lazy" ' +
        'onerror="this.parentElement.classList.add(\'ph\');this.remove()">';
      if (c.video) {
        mediaInner += '<span class="play-badge"><span class="spark"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 0c.9 7.4 4.6 11.1 12 12-7.4.9-11.1 4.6-12 12-.9-7.4-4.6-11.1-12-12C7.4 11.1 11.1 7.4 12 0Z"/></svg></span>смотреть анимацию</span>';
      }
      var media = '<div class="case-media">' + mediaInner + '</div>';

      var actions = '';
      if (c.featured) actions += '<button class="pill case-toggle" data-toggle>Подробнее о кейсе</button>';
      if (c.link && c.link.url) {
        actions += '<a class="pill" href="' + esc(c.link.url) + '" target="_blank" rel="noopener">' +
                   esc(c.link.label || 'Смотреть кейс') + '</a>';
      }

      var body =
        '<div class="case-body">' +
          '<p class="case-title">' + esc(c.title) + '<span class="year">' + esc(c.year) + '</span></p>' +
          '<div class="case-tags">' + (c.tags || []).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>' +
          '<p class="case-desc">' + esc(c.desc) + '</p>' +
          (actions ? '<div class="case-actions">' + actions + '</div>' : '') +
        '</div>';

      var videoAttr = c.video ? ' data-video="' + esc(c.video) + '"' : '';
      var videoClass = c.video ? ' case--video' : '';

      if (!c.featured) {
        return '<article class="case reveal' + videoClass + '" data-cats="' + esc(c.cats) + '"' + videoAttr + '>' + media + body + '</article>';
      }

      var d = c.details || {};
      var gallery = function (list) {
        if (!list || !list.length) return '';
        return '<div class="gallery-strip">' + list.map(function (src) {
          return '<img src="' + esc(src) + '" alt="' + esc(c.title) + ' – материалы" loading="lazy" onerror="this.remove()">';
        }).join('') + '</div>';
      };
      var solution = (d.solution || []).map(function (item) {
        var parts = String(item).split('|');
        if (parts.length > 1) {
          return '<li><span class="lead">' + esc(parts[0].trim()) + '.</span> ' + esc(parts.slice(1).join('|').trim()) + '</li>';
        }
        return '<li>' + esc(item) + '</li>';
      }).join('');

      var details =
        '<div class="case-details"><div class="case-details-inner">' +
          '<h4>Моя роль</h4>' +
          (d.roleIntro ? '<p>' + esc(d.roleIntro) + '</p>' : '') +
          ((d.role && d.role.length) ? '<ul>' + d.role.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul>' : '') +
          gallery(d.gallery1) +
          (d.task ? '<h4>Задача</h4><p>' + esc(d.task) + '</p>' : '') +
          (solution ? '<h4>Решение</h4>' + (d.solutionIntro ? '<p>' + esc(d.solutionIntro) + '</p>' : '') + '<ul>' + solution + '</ul>' : '') +
          (d.closing ? '<p style="margin-top:14px">' + esc(d.closing) + '</p>' : '') +
          gallery(d.gallery2) +
        '</div></div>';

      return '<article class="case case--featured reveal' + videoClass + '" data-cats="' + esc(c.cats) + '"' + videoAttr + '>' +
               '<div class="case-top">' + media + body + '</div>' + details +
             '</article>';
    }).join('');

    wrap.insertAdjacentHTML('beforeend', html);
  }

  renderCases();

  /* ---------------------------------------------------
   * 2.6 Видео-лайтбокс: клик по превью или названию кейса
   * --------------------------------------------------- */
  (function initLightbox() {
    var current = null;

    function sparkSvg() {
      return '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 0c.9 7.4 4.6 11.1 12 12-7.4.9-11.1 4.6-12 12-.9-7.4-4.6-11.1-12-12C7.4 11.1 11.1 7.4 12 0Z"/></svg>';
    }

    function open(src) {
      close();
      var lb = document.createElement('div');
      lb.className = 'lightbox';
      lb.innerHTML =
        '<div class="lightbox-frame">' +
          '<span class="frame-spark frame-spark--tl">' + sparkSvg() + '</span>' +
          '<span class="frame-spark frame-spark--br">' + sparkSvg() + '</span>' +
          '<div class="lightbox-ui">' +
            '<button class="pill" data-mute>Выключить звук</button>' +
            '<button class="pill" data-close>Закрыть ✕</button>' +
          '</div>' +
          '<video src="' + src + '" autoplay loop playsinline></video>' +
          '<p class="lightbox-hint">Esc или клик мимо видео – закрыть</p>' +
        '</div>';
      document.body.appendChild(lb);
      document.body.style.overflow = 'hidden';
      current = lb;

      var video = lb.querySelector('video');
      video.volume = 0.85;
      video.play().catch(function () {
        /* если браузер запретил звук на автоплей – стартуем без звука */
        video.muted = true;
        lb.querySelector('[data-mute]').textContent = 'Включить звук';
        video.play().catch(function () {});
      });

      lb.querySelector('[data-mute]').addEventListener('click', function (e) {
        e.stopPropagation();
        video.muted = !video.muted;
        this.textContent = video.muted ? 'Включить звук' : 'Выключить звук';
      });
      lb.querySelector('[data-close]').addEventListener('click', function (e) {
        e.stopPropagation(); close();
      });
      /* клик по любому месту вне видео закрывает */
      lb.addEventListener('click', function (e) {
        if (!e.target.closest('video') && !e.target.closest('.lightbox-ui')) close();
      });
      requestAnimationFrame(function () { lb.classList.add('on'); });
    }

    function close() {
      if (!current) return;
      var lb = current; current = null;
      var v = lb.querySelector('video');
      if (v) v.pause();
      lb.classList.remove('on');
      document.body.style.overflow = '';
      setTimeout(function () { lb.remove(); }, 300);
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });

    document.querySelectorAll('.case--video').forEach(function (card) {
      var src = card.getAttribute('data-video');
      ['.case-media', '.case-title'].forEach(function (sel) {
        var el = card.querySelector(sel);
        if (el) el.addEventListener('click', function () { open(src); });
      });
    });
  })();

  /* ---------------------------------------------------
   * 3. Entrances
   * --------------------------------------------------- */
  if (window.gsap && !reduced) {
    document.querySelectorAll('[data-split]').forEach(function (el) {
      var text = el.textContent;
      el.textContent = '';
      el.setAttribute('aria-label', text);
      text.split('').forEach(function (ch) {
        var s = document.createElement('span');
        s.className = 'ch';
        s.textContent = ch;
        s.setAttribute('aria-hidden', 'true');
        el.appendChild(s);
      });
      var tween = gsap.from(el.querySelectorAll('.ch'), {
        yPercent: 60, opacity: 0,
        duration: 0.9, ease: 'power3.out',
        stagger: 0.06, delay: 0.15
      });
      setTimeout(function () { if (tween.progress() < 1) tween.progress(1); }, 3500);
    });
  }

  var revealEls = document.querySelectorAll('.reveal');
  if (!reduced && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('shown'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('shown'); });
  }

  /* ---------------------------------------------------
   * 4. Case filtering
   * --------------------------------------------------- */
  var filterBtns = document.querySelectorAll('[data-filter]');
  if (filterBtns.length) {
    var cases = document.querySelectorAll('.case');

    function applyFilter(cat) {
      filterBtns.forEach(function (b) {
        b.classList.toggle('light', b.getAttribute('data-filter') === cat);
        b.classList.toggle('active', b.getAttribute('data-filter') === cat);
      });
      cases.forEach(function (card) {
        var match = cat === 'all' || (card.getAttribute('data-cats') || '').split(' ').indexOf(cat) !== -1;
        if (match) {
          if (card.style.display === 'none') {
            card.style.display = '';
            card.classList.remove('pop');
            void card.offsetWidth;
            card.classList.add('pop');
          }
        } else {
          card.style.display = 'none';
          card.classList.remove('pop');
        }
      });
    }

    filterBtns.forEach(function (b) {
      b.addEventListener('click', function () { applyFilter(b.getAttribute('data-filter')); });
    });
  }

  /* ---------------------------------------------------
   * 5. Featured case accordions
   * --------------------------------------------------- */
  document.querySelectorAll('[data-toggle]').forEach(function (btn) {
    var details = btn.closest('.case').querySelector('.case-details');
    btn.addEventListener('click', function () {
      var open = details.classList.toggle('open');
      btn.textContent = open ? 'Свернуть' : 'Подробнее о кейсе';
    });
  });

  /* ---------------------------------------------------
   * 6. Курсор-звёздочка
   * --------------------------------------------------- */
  if (!reduced && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var star = document.createElement('div');
    star.className = 'cursor-star';
    star.setAttribute('aria-hidden', 'true');
    star.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 0c.9 7.4 4.6 11.1 12 12-7.4.9-11.1 4.6-12 12-.9-7.4-4.6-11.1-12-12C7.4 11.1 11.1 7.4 12 0Z"/></svg>';
    document.body.appendChild(star);

    var mx = -100, my = -100, sx = -100, sy = -100, visible = false, rot = 0;

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (!visible) { visible = true; star.style.opacity = '1'; }
    });
    document.addEventListener('mouseleave', function () {
      visible = false; star.style.opacity = '0';
    });
    // над ссылками и кнопками звезда голубеет и растёт
    document.addEventListener('mouseover', function (e) {
      var interactive = e.target.closest && e.target.closest('a, button, [data-filter], [data-toggle]');
      star.style.color = interactive ? 'var(--blue2)' : 'var(--white1)';
      star.dataset.big = interactive ? '1' : '';
    });

    (function follow() {
      sx += (mx - sx) * 0.16;
      sy += (my - sy) * 0.16;
      rot += 0.6 + Math.min(6, Math.abs(mx - sx) + Math.abs(my - sy)) * 0.15;
      var scale = star.dataset.big ? 1.5 : 1;
      star.style.transform = 'translate(' + (sx + 14) + 'px,' + (sy + 16) + 'px) rotate(' + rot + 'deg) scale(' + scale + ')';
      requestAnimationFrame(follow);
    })();
  }

  /* ---------------------------------------------------
   * 7. Yakutsk weather – the joke is real
   * --------------------------------------------------- */
  var weatherEl = document.getElementById('weather');
  if (weatherEl && navigator.onLine) {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=62.03&longitude=129.73&current=temperature_2m')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var temp = Math.round(d.current.temperature_2m);
        weatherEl.textContent = 'Якутск ' + (temp > 0 ? '+' : temp < 0 ? '−' : '') + Math.abs(temp) + '°C';
      })
      .catch(function () { /* keep the -34 legend */ });
  }
})();
