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
      var vids = c.video ? (Array.isArray(c.video) ? c.video : [c.video]) : [];
      var mediaInner =
        '<img src="' + esc(c.image) + '" alt="' + esc(c.title) + '" loading="lazy" ' +
        'onerror="this.parentElement.classList.add(\'ph\');this.remove()">';
      if (vids.length) {
        var label = vids.length > 1 ? 'смотреть анимации (' + vids.length + ')' : 'смотреть анимацию';
        mediaInner += '<span class="play-badge"><span class="spark"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 0c.9 7.4 4.6 11.1 12 12-7.4.9-11.1 4.6-12 12-.9-7.4-4.6-11.1-12-12C7.4 11.1 11.1 7.4 12 0Z"/></svg></span>' + label + '</span>';
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

      /* video может быть строкой или массивом */
      var videoList = c.video ? (Array.isArray(c.video) ? c.video : [c.video]) : [];
      var videoAttr = videoList.length ? ' data-video="' + esc(videoList.join('|')) + '"' : '';
      var videoClass = videoList.length ? ' case--video' : '';

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
   * 2.6 Видео-лайтбокс
   *     Десктоп: рамка + квадратные кнопки (пауза/звук на видео,
   *              стрелки prev/next по бокам, ✕ в углу экрана)
   *     Мобайл:  вертикальная лента как в Reels – свайп = следующее
   * --------------------------------------------------- */
  (function initLightbox() {
    var current = null;
    var soundOn = true; /* запоминаем выбор звука между роликами */

    var I = {
      play:  '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M7.5 4.5v15l13-7.5z"/></svg>',
      pause: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M6 4h4.4v16H6zM13.6 4H18v16h-4.4z"/></svg>',
      volOn: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 9v6h4l5 4.5v-15L8 9H4z"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M16 8.7a4.7 4.7 0 0 1 0 6.6M18.6 6.2a8.2 8.2 0 0 1 0 11.6"/></svg>',
      volOff:'<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 9v6h4l5 4.5v-15L8 9H4z"/><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="m15.8 9.6 5 5M20.8 9.6l-5 5"/></svg>',
      up:    '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" d="m5.5 14.5 6.5-6.5 6.5 6.5"/></svg>',
      down:  '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" d="m5.5 9.5 6.5 6.5 6.5-6.5"/></svg>',
      close: '<svg viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" d="m5.5 5.5 13 13M18.5 5.5l-13 13"/></svg>',
      spark: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 0c.9 7.4 4.6 11.1 12 12-7.4.9-11.1 4.6-12 12-.9-7.4-4.6-11.1-12-12C7.4 11.1 11.1 7.4 12 0Z"/></svg>'
    };

    function btn(cls, icon, label) {
      return '<button class="lb-btn ' + cls + '" aria-label="' + label + '">' + icon + '</button>';
    }

    function tryPlay(video, muteBtn) {
      video.muted = !soundOn;
      video.play().catch(function () {
        /* браузер запретил звук – играем без него */
        soundOn = false;
        video.muted = true;
        if (muteBtn) muteBtn.innerHTML = I.volOff;
        video.play().catch(function () {});
      });
    }

    function open(srcList) {
      close();
      var playlist = String(srcList).split('|');
      var isMobile = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches;
      if (isMobile) openReels(playlist);
      else openDesktop(playlist);
    }

    /* ---------- десктоп: рамка + стрелки ---------- */
    function openDesktop(playlist) {
      var idx = 0, multi = playlist.length > 1;
      var lb = document.createElement('div');
      lb.className = 'lightbox';
      lb.innerHTML =
        '<div class="lightbox-frame">' +
          '<span class="frame-spark frame-spark--tl">' + I.spark + '</span>' +
          '<span class="frame-spark frame-spark--br">' + I.spark + '</span>' +
          '<video autoplay playsinline' + (multi ? '' : ' loop') + '></video>' +
          (multi ? '<div class="lb-badge" data-counter>1 / ' + playlist.length + '</div>' : '') +
          '<div class="lb-controls">' +
            btn('lb-pause', I.pause, 'Пауза') +
            btn('lb-mute', soundOn ? I.volOn : I.volOff, 'Звук') +
          '</div>' +
        '</div>' +
        btn('lb-close', I.close, 'Закрыть') +
        (multi ? '<div class="lb-nav">' + btn('lb-prev', I.up, 'Предыдущее') + btn('lb-next', I.down, 'Следующее') + '</div>' : '');
      mount(lb);

      var video = lb.querySelector('video');
      var counter = lb.querySelector('[data-counter]');
      var pauseBtn = lb.querySelector('.lb-pause');
      var muteBtn = lb.querySelector('.lb-mute');
      video.volume = 0.85;

      function playIdx(i) {
        idx = (i + playlist.length) % playlist.length;
        video.src = playlist[idx];
        if (counter) counter.textContent = (idx + 1) + ' / ' + playlist.length;
        pauseBtn.innerHTML = I.pause;
        tryPlay(video, muteBtn);
      }
      playIdx(0);

      /* вниз после последнего ролика = выход обратно в портфолио */
      function goDown() {
        if (idx >= playlist.length - 1) close();
        else playIdx(idx + 1);
      }
      function goUp() {
        if (idx > 0) playIdx(idx - 1);
      }

      if (multi) {
        video.addEventListener('ended', function () { playIdx(idx + 1); });
        lb.querySelector('.lb-next').addEventListener('click', function (e) { e.stopPropagation(); goDown(); });
        lb.querySelector('.lb-prev').addEventListener('click', function (e) { e.stopPropagation(); goUp(); });
      }

      lb._keys = function (e) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') goDown();
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') goUp();
      };
      document.addEventListener('keydown', lb._keys);

      /* колесо мыши листает ролики */
      var wheelAcc = 0, wheelLock = false;
      lb.addEventListener('wheel', function (e) {
        e.preventDefault();
        if (wheelLock) return;
        wheelAcc += e.deltaY;
        if (wheelAcc > 60) { wheelLock = true; wheelAcc = 0; goDown(); }
        else if (wheelAcc < -60) { wheelLock = true; wheelAcc = 0; goUp(); }
        else return;
        setTimeout(function () { wheelLock = false; }, 500);
      }, { passive: false });

      wireCommon(lb, function () { return video; }, pauseBtn, muteBtn);
    }

    /* ---------- мобайл: вертикальная лента (reels) ---------- */
    function openReels(playlist) {
      var lb = document.createElement('div');
      lb.className = 'lightbox lightbox--reels';
      lb.innerHTML =
        '<div class="reels-scroll">' +
          playlist.map(function (src, i) {
            return '<div class="reel"><video src="' + src + '" loop playsinline preload="metadata" data-i="' + i + '"></video></div>';
          }).join('') +
        '</div>' +
        (playlist.length > 1 ? '<div class="lb-badge lb-badge--fixed" data-counter>1 / ' + playlist.length + '</div>' : '') +
        '<div class="lb-controls lb-controls--fixed">' +
          btn('lb-pause', I.pause, 'Пауза') +
          btn('lb-mute', soundOn ? I.volOn : I.volOff, 'Звук') +
        '</div>' +
        btn('lb-close', I.close, 'Закрыть');
      mount(lb);

      var videos = [].slice.call(lb.querySelectorAll('video'));
      var counter = lb.querySelector('[data-counter]');
      var pauseBtn = lb.querySelector('.lb-pause');
      var muteBtn = lb.querySelector('.lb-mute');
      var activeVideo = videos[0];
      videos.forEach(function (v) { v.volume = 0.85; });

      /* играет только видимый ролик */
      var vio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var v = e.target;
          if (e.isIntersecting && e.intersectionRatio > 0.6) {
            activeVideo = v;
            if (counter) counter.textContent = (+v.dataset.i + 1) + ' / ' + videos.length;
            pauseBtn.innerHTML = I.pause;
            tryPlay(v, muteBtn);
          } else {
            v.pause();
            v.currentTime = 0;
          }
        });
      }, { root: lb.querySelector('.reels-scroll'), threshold: 0.6 });
      videos.forEach(function (v) { vio.observe(v); });

      /* свайп вверх после последнего ролика = выход в портфолио */
      var scroller = lb.querySelector('.reels-scroll');
      var touchY = 0;
      scroller.addEventListener('touchstart', function (e) {
        touchY = e.touches[0].clientY;
      }, { passive: true });
      scroller.addEventListener('touchmove', function (e) {
        var dy = touchY - e.touches[0].clientY; /* >0 – тянут вверх, к следующему */
        var atEnd = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2;
        if (dy > 70 && atEnd) close();
      }, { passive: true });

      wireCommon(lb, function () { return activeVideo; }, pauseBtn, muteBtn);
    }

    /* ---------- общее: пауза, звук, закрытие ---------- */
    function wireCommon(lb, getVideo, pauseBtn, muteBtn) {
      function togglePause(e) {
        if (e) e.stopPropagation();
        var v = getVideo();
        if (v.paused) { v.play().catch(function () {}); pauseBtn.innerHTML = I.pause; }
        else { v.pause(); pauseBtn.innerHTML = I.play; }
      }
      pauseBtn.addEventListener('click', togglePause);
      /* тап по самому видео = пауза, как в Instagram */
      lb.addEventListener('click', function (e) {
        if (e.target.closest('video')) { togglePause(); return; }
        if (!e.target.closest('.lb-btn') && !e.target.closest('.lb-badge')) close();
      });
      muteBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        soundOn = !soundOn;
        getVideo().muted = !soundOn;
        muteBtn.innerHTML = soundOn ? I.volOn : I.volOff;
      });
      lb.querySelector('.lb-close').addEventListener('click', function (e) {
        e.stopPropagation(); close();
      });
    }

    function mount(lb) {
      document.body.appendChild(lb);
      document.body.style.overflow = 'hidden';
      current = lb;
      requestAnimationFrame(function () { lb.classList.add('on'); });
    }

    function close() {
      if (!current) return;
      var lb = current; current = null;
      lb.querySelectorAll('video').forEach(function (v) { v.pause(); });
      if (lb._keys) document.removeEventListener('keydown', lb._keys);
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
      /* фильтр живёт в адресе: перезагрузка и «назад» его не сбрасывают */
      try {
        history.replaceState(null, '', cat === 'all' ? location.pathname : '#' + cat);
      } catch (err) {}
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

    /* восстановить фильтр из адреса при загрузке */
    var initial = location.hash.slice(1);
    if (initial && document.querySelector('[data-filter="' + initial + '"]')) {
      applyFilter(initial);
    }
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
   * 6.5 Почтовые ссылки: копируем адрес в буфер
   *     (mailto может никуда не вести, если нет почтового
   *      клиента – а адрес в буфере выручает всегда)
   * --------------------------------------------------- */
  (function initEmailCopy() {
    var toast = null, hideTimer = null;

    function showToast(text) {
      if (!toast) {
        toast = document.createElement('div');
        toast.className = 'copy-toast';
        document.body.appendChild(toast);
      }
      toast.textContent = text;
      toast.classList.add('on');
      clearTimeout(hideTimer);
      hideTimer = setTimeout(function () { toast.classList.remove('on'); }, 2200);
    }

    document.querySelectorAll('a[href^="mailto:"]').forEach(function (a) {
      a.addEventListener('click', function () {
        var email = a.getAttribute('href').replace('mailto:', '').split('?')[0];
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(email).then(function () {
            showToast('✦ ' + email + ' – скопировано');
          }).catch(function () {});
        }
        /* mailto продолжает работать как обычно */
      });
    });
  })();

  /* ---------------------------------------------------
   * 7. Yakutsk weather – the joke is real
   * --------------------------------------------------- */
  var weatherEl = document.getElementById('weather');
  if (weatherEl && navigator.onLine) {
    // два города одним запросом: Санкт-Петербург и Якутск
    fetch('https://api.open-meteo.com/v1/forecast?latitude=59.94,62.03&longitude=30.31,129.73&current=temperature_2m')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var list = Array.isArray(d) ? d : [d];
        function fmt(t) {
          t = Math.round(t);
          return (t > 0 ? '+' : t < 0 ? '−' : '') + Math.abs(t) + '°C';
        }
        if (list.length >= 2) {
          weatherEl.textContent = 'СПб ' + fmt(list[0].current.temperature_2m) +
            ' · Якутск ' + fmt(list[1].current.temperature_2m);
        }
      })
      .catch(function () { /* остаётся легендарное «Якутск −34°C» */ });
  }
})();
