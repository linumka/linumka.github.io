/* ============ linumka portfolio — main.js ============ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------
   * 1. Garland of lights — canvas animation
   *    Strings of glowing bulbs that sway and twinkle,
   *    echoing the light-garland photos in the identity.
   * --------------------------------------------------- */
  function Garland(canvas) {
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, strings = [], t = 0, running = false, raf = null;
    var sparse = canvas.hasAttribute('data-sparse');

    var PALETTE = ['#ffe6e0', '#ffd9e8', '#b4cdfe', '#fff6d8'];

    function resize() {
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    function rnd(a, b) { return a + Math.random() * (b - a); }

    function build() {
      strings = [];
      var count = sparse ? 2 : 3;
      for (var s = 0; s < count; s++) {
        var y0 = H * rnd(0.15, 0.45) + s * (H * 0.18);
        var y1 = H * rnd(0.25, 0.6) + s * (H * 0.15);
        var sag = rnd(H * 0.15, H * 0.4);
        var n = Math.max(10, Math.round(W / (sparse ? 120 : 80)));
        var bulbs = [];
        for (var i = 0; i <= n; i++) {
          bulbs.push({
            phase: rnd(0, Math.PI * 2),
            speed: rnd(0.6, 1.6),
            size: rnd(1.2, 2.6),
            color: PALETTE[(Math.random() * PALETTE.length) | 0],
            big: Math.random() < 0.12
          });
        }
        strings.push({ y0: y0, y1: y1, sag: sag, bulbs: bulbs, drift: rnd(0, Math.PI * 2) });
      }
    }

    function pointAt(str, u, time) {
      var sway = Math.sin(time * 0.4 + str.drift + u * 3) * 6;
      var x = u * W;
      var y = (1 - u) * str.y0 + u * str.y1 + Math.sin(Math.PI * u) * str.sag + sway;
      return { x: x, y: y };
    }

    function drawSpark(x, y, r, color, alpha) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - r * 3, y); ctx.lineTo(x + r * 3, y);
      ctx.moveTo(x, y - r * 3); ctx.lineTo(x, y + r * 3);
      ctx.stroke();
      ctx.restore();
    }

    function frame() {
      t += 0.016;
      ctx.clearRect(0, 0, W, H);

      for (var s = 0; s < strings.length; s++) {
        var str = strings[s];

        // wire
        ctx.beginPath();
        for (var u = 0; u <= 1.001; u += 0.02) {
          var p = pointAt(str, u, t);
          if (u === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y);
        }
        ctx.strokeStyle = 'rgba(255, 230, 224, 0.16)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // bulbs
        var n = str.bulbs.length - 1;
        for (var i = 0; i <= n; i++) {
          var b = str.bulbs[i];
          var q = pointAt(str, i / n, t);
          var tw = 0.55 + 0.45 * Math.sin(t * b.speed * 2 + b.phase);
          var r = b.size * (0.8 + tw * 0.5);

          ctx.save();
          ctx.globalAlpha = 0.35 + tw * 0.65;
          ctx.fillStyle = b.color;
          ctx.shadowColor = b.color;
          ctx.shadowBlur = 8 + tw * 14;
          ctx.beginPath();
          ctx.arc(q.x, q.y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          if (b.big && tw > 0.85) drawSpark(q.x, q.y, r, b.color, (tw - 0.85) * 4);
        }
      }
      raf = requestAnimationFrame(frame);
    }

    function start() { if (!running) { running = true; raf = requestAnimationFrame(frame); } }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); }

    resize();
    window.addEventListener('resize', resize);

    if (reduced) { t = 1; frame(); cancelAnimationFrame(raf); return; }

    // only animate while visible
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { e.isIntersecting ? start() : stop(); });
      }, { rootMargin: '100px' }).observe(canvas);
    } else {
      start();
    }
  }

  /* ---------------------------------------------------
   * 2. Sparse twinkling stars behind hero
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

  document.querySelectorAll('[data-garland]').forEach(function (c) { Garland(c); });
  document.querySelectorAll('[data-stars]').forEach(function (c) { StarField(c); });

  /* ---------------------------------------------------
   * 2.5 Render cases from cases-data.js (portfolio page)
   * --------------------------------------------------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function renderCases() {
    var wrap = document.querySelector('#cases[data-dynamic]');
    if (!wrap || !window.CASES) return;

    var html = window.CASES.map(function (c) {
      var media =
        '<div class="case-media">' +
          '<img src="' + esc(c.image) + '" alt="' + esc(c.title) + '" loading="lazy" ' +
          'onerror="this.parentElement.classList.add(\'ph\');this.remove()">' +
        '</div>';

      var body =
        '<div class="case-body">' +
          '<p class="case-title">' + esc(c.title) + '<span class="year">' + esc(c.year) + '</span></p>' +
          '<div class="case-tags">' + (c.tags || []).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>' +
          '<p class="case-desc">' + esc(c.desc) + '</p>' +
          (c.featured ? '<button class="pill case-toggle" data-toggle>Подробнее о кейсе</button>' : '') +
        '</div>';

      if (!c.featured) {
        return '<article class="case reveal" data-cats="' + esc(c.cats) + '">' + media + body + '</article>';
      }

      var d = c.details || {};
      var gallery = function (list) {
        if (!list || !list.length) return '';
        return '<div class="gallery-strip">' + list.map(function (src) {
          return '<img src="' + esc(src) + '" alt="' + esc(c.title) + ' — материалы" loading="lazy" onerror="this.remove()">';
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

      return '<article class="case case--featured reveal" data-cats="' + esc(c.cats) + '">' +
               '<div class="case-top">' + media + body + '</div>' + details +
             '</article>';
    }).join('');

    wrap.insertAdjacentHTML('beforeend', html);
  }

  renderCases();

  /* ---------------------------------------------------
   * 3. GSAP entrances
   * --------------------------------------------------- */
  // wordmark: letter-by-letter rise (GSAP, с страховкой на фоновые окна)
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
      // если окно в фоне и rAF заморожен — достроить мгновенно
      setTimeout(function () { if (tween.progress() < 1) tween.progress(1); }, 3500);
    });
  }

  // scroll reveals: IntersectionObserver + CSS-переходы (не зависят от rAF)
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
            void card.offsetWidth; /* restart animation */
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
   * 6. Yakutsk weather — the joke is real
   * --------------------------------------------------- */
  var weatherEl = document.getElementById('weather');
  if (weatherEl && navigator.onLine) {
    fetch('https://api.open-meteo.com/v1/forecast?latitude=62.03&longitude=129.73&current=temperature_2m')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var temp = Math.round(d.current.temperature_2m);
        weatherEl.innerHTML = 'Якутск&nbsp;' + (temp > 0 ? '+' : temp < 0 ? '−' : '') + Math.abs(temp) + '°C';
      })
      .catch(function () { /* keep the -34 legend */ });
  }
})();
