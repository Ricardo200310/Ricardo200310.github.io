/* ============================================================
   田安个人主页 · 交互逻辑
   滚动联动 / 打字机 / 粒子交互 / 数字滚动 / 聚光灯
   ============================================================ */
(() => {
  'use strict';

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const progress = document.getElementById('scrollProgress');
  const navbar = document.getElementById('navbar');
  const navLinks = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  const navList = document.getElementById('navLinks');
  const navToggle = document.getElementById('navToggle');
  const backTop = document.getElementById('backTop');
  const roleText = document.getElementById('roleText');

  /* ---------- 滚动进度条 / 导航状态 / 回到顶部 / 滚动联动高亮 ---------- */
  const sectionEls = [...document.querySelectorAll('section[id]')];

  function onScroll() {
    const st = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (max > 0 ? (st / max) * 100 : 0) + '%';

    navbar.classList.toggle('scrolled', st > 24);
    backTop.classList.toggle('show', st > 640);

    // 滚动联动：高亮当前所在章节对应的导航项
    let current = sectionEls[0] ? sectionEls[0].id : '';
    for (const s of sectionEls) {
      const top = s.getBoundingClientRect().top + st;
      if (top <= st + 150) current = s.id;
    }
    if (st + window.innerHeight >= document.documentElement.scrollHeight - 4 && sectionEls.length) {
      current = sectionEls[sectionEls.length - 1].id;
    }
    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
  }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => { onScroll(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });
  onScroll();

  backTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  });

  /* ---------- 移动端菜单 ---------- */
  function closeNav() {
    navList.classList.remove('open');
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }
  navToggle.addEventListener('click', () => {
    const open = navList.classList.toggle('open');
    navToggle.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', String(open));
  });
  navLinks.forEach(a => a.addEventListener('click', closeNav));
  document.addEventListener('click', e => {
    if (navList.classList.contains('open') &&
        !navList.contains(e.target) && !navToggle.contains(e.target)) closeNav();
  });

  /* ---------- Hero 打字机 ---------- */
  const words = ['数字化工程师', '全栈开发', '大模型应用', '工业物联网'];
  if (reduced) {
    roleText.textContent = words.join(' · ');
  } else {
    let wi = 0, ci = 0, deleting = false;
    function type() {
      const word = words[wi];
      ci += deleting ? -1 : 1;
      roleText.textContent = word.slice(0, ci);
      let delay = deleting ? 42 : 95;
      if (!deleting && ci === word.length) { delay = 1700; deleting = true; }
      else if (deleting && ci === 0) { deleting = false; wi = (wi + 1) % words.length; delay = 420; }
      setTimeout(type, delay);
    }
    setTimeout(type, 600);
  }

  /* ---------- 粒子网络（鼠标联动） ---------- */
  const canvas = document.getElementById('gridCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let dots = [], W = 0, H = 0, raf = null;
    const mouse = { x: null, y: null };

    function seed() {
      const count = Math.min(90, Math.max(30, Math.round((W * H) / 14000)));
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.55,
        vy: (Math.random() - 0.5) * 0.55,
        r: Math.random() * 1.8 + 1,
      }));
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = rect.width; H = rect.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      if (reduced) draw();
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      const LINK = Math.min(W, H) * 0.24;

      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const a = dots[i], b = dots[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK) {
            ctx.strokeStyle = 'rgba(56,189,248,' + ((1 - d / LINK) * 0.42).toFixed(3) + ')';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        // 与鼠标连线（联动）
        if (mouse.x !== null) {
          const dx = a.x - mouse.x, dy = a.y - mouse.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < LINK * 1.5) {
            ctx.strokeStyle = 'rgba(129,140,248,' + ((1 - d / (LINK * 1.5)) * 0.6).toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      }

      for (const p of dots) {
        ctx.fillStyle = 'rgba(56,189,248,0.65)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function step() {
      for (const p of dots) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
      }
      draw();
      raf = requestAnimationFrame(step);
    }

    function start() { if (!raf && !reduced) raf = requestAnimationFrame(step); }
    function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }

    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', () => {
      document.hidden ? stop() : start();
    });

    const panel = canvas.parentElement;
    panel.addEventListener('mousemove', e => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    });
    panel.addEventListener('mouseleave', () => { mouse.x = null; mouse.y = null; });

    resize();
    start();
  }

  /* ---------- Hero 光球视差 ---------- */
  const hero = document.getElementById('hero');
  const orbs = hero ? hero.querySelectorAll('.orb') : [];
  if (!reduced && orbs.length && window.matchMedia('(pointer: fine)').matches) {
    let tx = 0, ty = 0, cx = 0, cy = 0;
    hero.addEventListener('mousemove', e => {
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
    });
    (function parallax() {
      cx += (tx - cx) * 0.05;
      cy += (ty - cy) * 0.05;
      orbs.forEach((o, i) => {
        const f = (i + 1) * 26;
        o.style.transform = 'translate3d(' + (cx * f).toFixed(1) + 'px,' + (cy * f).toFixed(1) + 'px,0)';
      });
      requestAnimationFrame(parallax);
    })();
  }

  /* ---------- 滚动渐入 + 交错延迟 ---------- */
  document.querySelectorAll('[data-stagger]').forEach(group => {
    group.querySelectorAll(':scope > [data-reveal]').forEach((el, i) => {
      el.style.setProperty('--d', (i * 90) + 'ms');
    });
  });
  // 时间线内的条目也做交错
  document.querySelectorAll('.tl-group').forEach(group => {
    group.querySelectorAll('.timeline-item[data-reveal]').forEach((el, i) => {
      el.style.setProperty('--d', (i * 110) + 'ms');
    });
  });

  const revealEls = document.querySelectorAll('[data-reveal]');
  revealEls.forEach(el => el.classList.add('reveal'));
  if (reduced) {
    revealEls.forEach(el => el.classList.add('visible'));
  } else {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          revealObserver.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => revealObserver.observe(el));
  }

  /* ---------- 数字滚动 ---------- */
  const counters = document.querySelectorAll('[data-count]');
  const runCounter = el => {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const dur = 1500;
    const t0 = performance.now();
    const tick = now => {
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if (reduced) {
    counters.forEach(el => { el.textContent = el.dataset.count + (el.dataset.suffix || ''); });
  } else {
    const countObserver = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          runCounter(e.target);
          countObserver.unobserve(e.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(el => countObserver.observe(el));
  }

  /* ---------- 光标聚光灯 ---------- */
  if (window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.spotlight').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }
})();
