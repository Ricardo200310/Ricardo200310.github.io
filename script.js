/* ============================================================
   田安个人主页 · 交互逻辑
   滚动联动 / 打字机 / 数字孪生核心 / 数字滚动 / 聚光灯
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

  /* ============================================================
     数字孪生核心 · 3D 旋转粒子球
     - 斐波那契球面节点 + 3D 投影连线 + 数据脉冲 + 呼吸光核 + 轨道环
     - 鼠标拖拽旋转（带惯性）、悬停联动微调
     ============================================================ */
  (function () {
    const canvas = document.getElementById('coreCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const finePointer = window.matchMedia('(pointer: fine)').matches;

    let W = 0, H = 0;
    let nodes = [], edges = [], stars = [], pulses = [];
    let raf = null, running = false;
    const rot = { x: -0.38, y: 0.7, vx: 0, vy: 0.0016 };
    let dragging = false, lastPX = 0, lastPY = 0;
    const hover = { x: 0.5, y: 0.5 };

    const EDGE_TH = 0.74;
    const BASE_SPIN = 0.0016;

    function build() {
      // 斐波那契球面均匀分布
      const N = Math.round(Math.min(140, Math.max(70, (W * H) / 5000)));
      nodes = [];
      const GA = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < N; i++) {
        const y = 1 - 2 * (i + 0.5) / N;
        const r = Math.sqrt(Math.max(0, 1 - y * y));
        const t = i * GA;
        nodes.push({ x: Math.cos(t) * r, y, z: Math.sin(t) * r });
      }
      // 预计算 3D 邻接连线（随球体一起旋转）
      edges = [];
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
          if (dx * dx + dy * dy + dz * dz < EDGE_TH * EDGE_TH) edges.push([i, j]);
        }
      }
      stars = Array.from({ length: 80 }, () => ({
        x: Math.random(), y: Math.random(),
        r: Math.random() * 1.2 + 0.3,
        ph: Math.random() * Math.PI * 2,
      }));
      pulses = Array.from({ length: 7 }, () => ({
        e: edges.length ? Math.floor(Math.random() * edges.length) : 0,
        t: Math.random(),
        sp: 0.005 + Math.random() * 0.01,
      }));
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = rect.width; H = rect.height;
      if (W < 4 || H < 4) { W = 0; H = 0; stop(); return; }
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
      if (reduced) frame(0); else start();
    }

    // 3D 旋转 + 透视投影
    function project(p, rad) {
      const cy = Math.cos(rot.y), sy = Math.sin(rot.y);
      const cx = Math.cos(rot.x), sx = Math.sin(rot.x);
      const x1 = p.x * cy + p.z * sy;
      const z1 = -p.x * sy + p.z * cy;
      const y1 = p.y * cx - z1 * sx;
      const z2 = p.y * sx + z1 * cx;
      const s = 3.4 / (3.4 + z2);
      return { x: x1 * s * rad, y: y1 * s * rad, z: z2, s };
    }

    function frame(now) {
      const t = now * 0.001;
      ctx.clearRect(0, 0, W, H);
      const cx0 = W / 2, cy0 = H / 2;
      const rad = Math.min(W, H) * 0.34;

      // 星空背景
      ctx.globalCompositeOperation = 'source-over';
      for (const s of stars) {
        const a = Math.max(0.05, 0.22 + 0.2 * Math.sin(t * 1.6 + s.ph));
        ctx.fillStyle = 'rgba(148,163,184,' + a.toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      const pts = nodes.map(n => project(n, rad));

      // 连线与节点（加色混合，制造辉光）
      ctx.globalCompositeOperation = 'lighter';
      ctx.lineWidth = 0.7;
      for (const [i, j] of edges) {
        const a = pts[i], b = pts[j];
        const depth = (a.z + b.z) / 2;
        const alpha = 0.05 + 0.3 * (1 - Math.abs(depth));
        if (alpha <= 0.05) continue;
        const col = depth > 0.15 ? '56,189,248' : depth < -0.15 ? '192,132,252' : '129,140,248';
        ctx.strokeStyle = 'rgba(' + col + ',' + alpha.toFixed(3) + ')';
        ctx.beginPath();
        ctx.moveTo(cx0 + a.x, cy0 + a.y);
        ctx.lineTo(cx0 + b.x, cy0 + b.y);
        ctx.stroke();
      }

      // 数据脉冲：沿连线飞行的光点
      if (edges.length) {
        for (const p of pulses) {
          p.t += p.sp;
          if (p.t >= 1) { p.t = 0; p.e = Math.floor(Math.random() * edges.length); }
          const [i, j] = edges[p.e];
          const a = pts[i], b = pts[j];
          const px = cx0 + a.x + (b.x - a.x) * p.t;
          const py = cy0 + a.y + (b.y - a.y) * p.t;
          const grd = ctx.createRadialGradient(px, py, 0, px, py, 7);
          grd.addColorStop(0, 'rgba(186,230,253,0.95)');
          grd.addColorStop(0.35, 'rgba(56,189,248,0.5)');
          grd.addColorStop(1, 'rgba(56,189,248,0)');
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(px, py, 7, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 节点（近处大而亮·青色，远处小而暗·紫色）
      for (const p of pts) {
        const depth = p.z;
        const sz = 0.9 + 1.6 * (1 - Math.abs(depth) * 0.65);
        const col = depth > 0.15 ? '56,189,248' : depth < -0.15 ? '192,132,252' : '129,140,248';
        const alpha = 0.35 + 0.55 * (1 - Math.abs(depth));
        ctx.fillStyle = 'rgba(' + col + ',' + alpha.toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(cx0 + p.x, cy0 + p.y, sz, 0, Math.PI * 2);
        ctx.fill();
      }

      // 中心呼吸光核
      const br = rad * (0.16 + 0.02 * Math.sin(t * 1.8));
      const core = ctx.createRadialGradient(cx0, cy0, 0, cx0, cy0, br * 2.4);
      core.addColorStop(0, 'rgba(255,255,255,0.95)');
      core.addColorStop(0.18, 'rgba(125,211,252,0.8)');
      core.addColorStop(0.5, 'rgba(56,189,248,0.22)');
      core.addColorStop(1, 'rgba(56,189,248,0)');
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(cx0, cy0, br * 2.4, 0, Math.PI * 2);
      ctx.fill();

      // 双层轨道环（虚线滚动 = 旋转感）
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 9]);
      ctx.strokeStyle = 'rgba(56,189,248,0.3)';
      ctx.lineDashOffset = -t * 22;
      ctx.beginPath();
      ctx.ellipse(cx0, cy0, rad * 1.18, rad * 0.42, rot.x * 0.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(129,140,248,0.25)';
      ctx.lineDashOffset = t * 16;
      ctx.beginPath();
      ctx.ellipse(cx0, cy0, rad * 0.42, rad * 1.18, rot.x * 0.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    function step(now) {
      if (!running) return;
      if (reduced && !dragging) { stop(); return; }  // 减少动效：仅拖拽时按需重绘
      if (dragging) {
        rot.vy *= 0.97; rot.vx *= 0.97;   // 拖拽摩擦力
      } else {
        // 惯性回落：自动旋转基准 + 鼠标悬停微调
        rot.vy += (BASE_SPIN - rot.vy) * 0.04;
        rot.vx += ((hover.y - 0.5) * 0.005 - rot.vx) * 0.05;
        if (finePointer) rot.vy += (hover.x - 0.5) * 0.0009;
      }
      rot.x = Math.max(-1.2, Math.min(1.2, rot.x + rot.vx));
      rot.y += rot.vy;
      frame(now);
      raf = requestAnimationFrame(step);
    }

    function start() { if (!running) { running = true; raf = requestAnimationFrame(step); } }
    function stop() { running = false; if (raf) { cancelAnimationFrame(raf); raf = null; } }

    /* 交互：拖拽旋转 + 悬停联动 */
    canvas.addEventListener('pointerdown', e => {
      dragging = true;
      lastPX = e.clientX; lastPY = e.clientY;
      canvas.setPointerCapture(e.pointerId);
      canvas.classList.add('dragging');
      if (reduced) start();
    });
    canvas.addEventListener('pointermove', e => {
      const r = canvas.getBoundingClientRect();
      if (r.width > 0) {
        hover.x = (e.clientX - r.left) / r.width;
        hover.y = (e.clientY - r.top) / r.height;
      }
      if (dragging) {
        rot.vy += (e.clientX - lastPX) * 0.004;
        rot.vx += (e.clientY - lastPY) * 0.004;
        lastPX = e.clientX; lastPY = e.clientY;
      }
    });
    function endDrag(e) {
      dragging = false;
      canvas.classList.remove('dragging');
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
      if (reduced) stop();
    }
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);
    canvas.addEventListener('mouseleave', () => { hover.x = 0.5; hover.y = 0.5; });

    document.addEventListener('visibilitychange', () => {
      document.hidden ? stop() : (W > 0 && !reduced && start());
    });
    window.addEventListener('resize', resize);

    resize();
  })();

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

  /* ============================================================
     鼠标交互动画
     1) 全局光标辉光（两层视差光斑） 2) 磁吸按钮
     3) 卡片 3D 倾斜             4) 点击涟漪
     ============================================================ */
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  /* 1) 光标辉光：两层不同速度的光斑跟随鼠标 */
  const glow = document.querySelector('.cursor-glow');
  if (glow && finePointer && !reduced) {
    const g = { x1: innerWidth * 0.4, y1: innerHeight * 0.4, x2: innerWidth * 0.6, y2: innerHeight * 0.5 };
    let mx = innerWidth / 2, my = innerHeight / 2;
    window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
    (function glowLoop() {
      g.x1 += (mx - g.x1) * 0.09;
      g.y1 += (my - g.y1) * 0.09;
      g.x2 += (mx - g.x2) * 0.045;
      g.y2 += (my - g.y2) * 0.045;
      glow.style.setProperty('--g1x', g.x1.toFixed(1) + 'px');
      glow.style.setProperty('--g1y', g.y1.toFixed(1) + 'px');
      glow.style.setProperty('--g2x', g.x2.toFixed(1) + 'px');
      glow.style.setProperty('--g2y', g.y2.toFixed(1) + 'px');
      requestAnimationFrame(glowLoop);
    })();
  }

  /* 2) 磁吸按钮：鼠标靠近时按钮向光标轻微靠拢 */
  if (finePointer && !reduced) {
    document.querySelectorAll('.magnetic').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        btn.style.transform = 'translate(' + (dx * 0.16).toFixed(1) + 'px,' + (dy * 0.22).toFixed(1) + 'px)';
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  /* 3) 卡片 3D 倾斜：随鼠标位置轻微翻转（带透视） */
  if (finePointer && !reduced) {
    document.querySelectorAll('.skill-card, .project-card, .stat, .award-card').forEach(el => {
      const max = el.classList.contains('featured') ? 2.5
        : (el.classList.contains('stat') || el.classList.contains('award-card')) ? 3.5 : 5;
      el.addEventListener('pointerenter', () => {
        el.style.transition = 'transform 0.12s ease-out, box-shadow 0.3s ease, border-color 0.3s ease';
      });
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform =
          'perspective(900px) rotateX(' + (-py * max).toFixed(2) + 'deg)' +
          ' rotateY(' + (px * max).toFixed(2) + 'deg) translateY(-4px)';
      });
      el.addEventListener('pointerleave', () => {
        el.style.transition = '';
        el.style.transform = '';
      });
    });
  }

  /* 4) 点击涟漪 */
  if (finePointer && !reduced) {
    document.querySelectorAll('.btn-primary, .btn-outline, .contact-item, .back-top').forEach(el => {
      el.addEventListener('pointerdown', e => {
        const r = el.getBoundingClientRect();
        const size = Math.max(r.width, r.height) * 2;
        const span = document.createElement('span');
        span.className = 'ripple';
        span.style.width = size + 'px';
        span.style.height = size + 'px';
        span.style.left = (e.clientX - r.left - size / 2) + 'px';
        span.style.top = (e.clientY - r.top - size / 2) + 'px';
        el.appendChild(span);
        span.addEventListener('animationend', () => span.remove());
      });
    });
  }
})();
