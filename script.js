// Animated grid background in hero
const canvas = document.getElementById('gridCanvas');
const DOT_COUNT = 40;
const dots = [];

for (let i = 0; i < DOT_COUNT; i++) {
  dots.push({
    x: Math.random() * 100,
    y: Math.random() * 100,
    vx: (Math.random() - 0.5) * 0.06,
    vy: (Math.random() - 0.5) * 0.06,
    r: Math.random() * 2 + 1,
  });
}

let svgEl = null;

function renderDots() {
  const w = canvas.offsetWidth;
  const h = canvas.offsetHeight;
  const CONNECT_DIST = 22; // percent

  const points = dots.map(d => ({ px: d.x / 100 * w, py: d.y / 100 * h, ...d }));

  let lines = '';
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      const dx = (points[i].x - points[j].x);
      const dy = (points[i].y - points[j].y);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < CONNECT_DIST) {
        const opacity = (1 - dist / CONNECT_DIST) * 0.4;
        lines += `<line x1="${points[i].px}" y1="${points[i].py}" x2="${points[j].px}" y2="${points[j].py}" stroke="#00d4ff" stroke-opacity="${opacity}" stroke-width="0.8"/>`;
      }
    }
  }

  const circles = points.map(p =>
    `<circle cx="${p.px}" cy="${p.py}" r="${p.r}" fill="#00d4ff" opacity="0.6"/>`
  ).join('');

  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">${lines}${circles}</svg>`;

  if (!svgEl) {
    svgEl = document.createElement('div');
    svgEl.style.cssText = 'position:absolute;inset:0;';
    canvas.appendChild(svgEl);
  }
  svgEl.innerHTML = svg;
}

function animate() {
  dots.forEach(d => {
    d.x += d.vx;
    d.y += d.vy;
    if (d.x < 0 || d.x > 100) d.vx *= -1;
    if (d.y < 0 || d.y > 100) d.vy *= -1;
  });
  renderDots();
  requestAnimationFrame(animate);
}

animate();

// Smooth active nav highlight
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('nav a[href^="#"]');

const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navLinks.forEach(a => a.style.color = '');
      const active = document.querySelector(`nav a[href="#${e.target.id}"]`);
      if (active) active.style.color = 'var(--accent)';
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => observer.observe(s));
