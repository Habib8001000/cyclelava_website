/**
 * CYCLELAVA - Kinetic Motion Graphics & Interactive Application Engine
 * Physical Store: Cycling Point, F-8 Markaz, Islamabad
 * Owner: Habib-ur-Rehman (0302-800100)
 * Community: Hikencyc
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initMotionParticleCanvas();
  initSundayCountdown();
  initHudGauges();
  initFleetFilter();
  initRentalCalculator();
  initLiveTelemetryApp();
  initTiltMotion();
  initModals();
});

/* --------------------------------------------------------------------------
   1. NAVBAR SCROLL DYNAMICS
   -------------------------------------------------------------------------- */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 30) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

/* --------------------------------------------------------------------------
   2. MOTION GRAPHICS CANVAS (Volcanic Ember Sparks & Velocity Trails)
   -------------------------------------------------------------------------- */
function initMotionParticleCanvas() {
  const canvas = document.getElementById('motion-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const particleCount = width > 768 ? 70 : 35;

  let mouse = { x: width / 2, y: height / 2, vx: 0, vy: 0, lastX: width / 2, lastY: height / 2, isMoving: false };
  let mouseTimer = null;

  window.addEventListener('mousemove', (e) => {
    mouse.vx = e.clientX - mouse.lastX;
    mouse.vy = e.clientY - mouse.lastY;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.lastX = e.clientX;
    mouse.lastY = e.clientY;
    mouse.isMoving = true;

    clearTimeout(mouseTimer);
    mouseTimer = setTimeout(() => {
      mouse.isMoving = false;
      mouse.vx = 0;
      mouse.vy = 0;
    }, 150);
  });

  class EmberParticle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * width;
      this.y = height + Math.random() * 40;
      this.size = Math.random() * 2.5 + 1.2;
      this.vy = -(Math.random() * 1.8 + 0.8);
      this.vx = (Math.random() - 0.5) * 1.2;
      this.color = Math.random() > 0.45 ? '#ff3e00' : Math.random() > 0.3 ? '#ffaa00' : '#ff1144';
      this.alpha = Math.random() * 0.7 + 0.3;
      this.life = Math.random() * 160 + 90;
      this.age = 0;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.age++;

      // Velocity trail reaction to cursor motion
      if (mouse.isMoving) {
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180) {
          const force = (180 - dist) / 180;
          this.x += mouse.vx * force * 0.4;
          this.y += mouse.vy * force * 0.4;
        }
      }

      if (this.age >= this.life || this.y < -20 || this.x < -20 || this.x > width + 20) {
        this.reset();
      }
    }

    draw() {
      ctx.save();
      const progress = this.age / this.life;
      const currentAlpha = (1 - progress) * this.alpha;
      ctx.globalAlpha = currentAlpha;
      ctx.fillStyle = this.color;
      ctx.shadowBlur = 15;
      ctx.shadowColor = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  for (let i = 0; i < particleCount; i++) {
    const p = new EmberParticle();
    p.y = Math.random() * height;
    particles.push(p);
  }

  function loop() {
    ctx.clearRect(0, 0, width, height);

    // Draw velocity lines between adjacent embers
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 90) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255, 62, 0, ${(1 - dist / 90) * 0.16})`;
          ctx.lineWidth = 0.8;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }

    particles.forEach((p) => {
      p.update();
      p.draw();
    });

    requestAnimationFrame(loop);
  }

  loop();
}

/* --------------------------------------------------------------------------
   3. SUNDAY EVENT COUNTDOWN TIMER (HIKENCYC 06:00 AM PKT)
   -------------------------------------------------------------------------- */
function initSundayCountdown() {
  const dEl = document.getElementById('cd-days');
  const hEl = document.getElementById('cd-hours');
  const mEl = document.getElementById('cd-mins');
  const sEl = document.getElementById('cd-secs');

  if (!dEl || !hEl || !mEl || !sEl) return;

  function getUpcomingSunday6AM() {
    const now = new Date();
    const target = new Date(now);
    const day = now.getDay(); // 0 = Sunday
    let diffDays = (7 - day) % 7;

    target.setDate(now.getDate() + diffDays);
    target.setHours(6, 0, 0, 0);

    if (diffDays === 0 && now.getTime() > target.getTime()) {
      target.setDate(target.getDate() + 7);
    }
    return target;
  }

  let targetDate = getUpcomingSunday6AM();

  function tick() {
    const now = new Date().getTime();
    const diff = targetDate.getTime() - now;

    if (diff <= 0) {
      targetDate = getUpcomingSunday6AM();
      return;
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    dEl.textContent = String(d).padStart(2, '0');
    hEl.textContent = String(h).padStart(2, '0');
    mEl.textContent = String(m).padStart(2, '0');
    sEl.textContent = String(s).padStart(2, '0');
  }

  tick();
  setInterval(tick, 1000);
}

/* --------------------------------------------------------------------------
   4. HERO HUD SPEEDOMETER MOTION ENGINE
   -------------------------------------------------------------------------- */
function initHudGauges() {
  const heroSpeedEl = document.getElementById('hud-live-speed');
  if (!heroSpeedEl) return;

  let speed = 36.8;

  setInterval(() => {
    // Dynamic realistic bicycle sprint fluctuations
    const delta = (Math.random() - 0.48) * 2.2;
    speed = Math.max(28.0, Math.min(48.5, speed + delta));
    heroSpeedEl.textContent = speed.toFixed(1);
  }, 1200);
}

/* --------------------------------------------------------------------------
   5. FLEET CATALOG FILTER
   -------------------------------------------------------------------------- */
function initFleetFilter() {
  const buttons = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.fleet-card');

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      cards.forEach((card) => {
        if (filter === 'all' || card.getAttribute('data-category') === filter) {
          card.style.display = 'flex';
          card.style.opacity = '0';
          setTimeout(() => {
            card.style.opacity = '1';
          }, 40);
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/* --------------------------------------------------------------------------
   6. INTERACTIVE BIKE RENTAL CALCULATOR (WHATSAPP DEEP-LINK)
   -------------------------------------------------------------------------- */
function initRentalCalculator() {
  const modelSelect = document.getElementById('calc-bike-model');
  const timeSelect = document.getElementById('calc-duration');
  const proGearCheck = document.getElementById('calc-pro-kit');
  const priceDisplay = document.getElementById('calc-price-output');
  const bookBtn = document.getElementById('calc-whatsapp-btn');

  if (!modelSelect || !timeSelect || !priceDisplay || !bookBtn) return;

  const pricing = {
    mtb: { hourly: 450, day: 2200, weekend: 5000, name: 'Mountain MTB 29er' },
    road: { hourly: 650, day: 3200, weekend: 7500, name: 'Carbon Road Aero Pro' },
    hybrid: { hourly: 400, day: 1900, weekend: 4200, name: 'Islamabad City Hybrid' },
    ebike: { hourly: 950, day: 4800, weekend: 11000, name: 'Electric E-MTB' }
  };

  const durationTitles = {
    hourly: '2-Hour Quick Ride',
    day: 'Full Day (24 Hours)',
    weekend: '3-Day Weekend Special'
  };

  function updateCalculation() {
    const selectedModel = modelSelect.value;
    const selectedDuration = timeSelect.value;
    const hasGear = proGearCheck ? proGearCheck.checked : false;

    const baseCost = pricing[selectedModel][selectedDuration];
    const gearCost = hasGear ? (selectedDuration === 'hourly' ? 200 : selectedDuration === 'day' ? 500 : 1000) : 0;
    const grandTotal = baseCost + gearCost;

    priceDisplay.textContent = `PKR ${grandTotal.toLocaleString()}`;

    // Generate WhatsApp direct text to Habib-ur-Rehman (0302800100)
    const msg = encodeURIComponent(
      `Assalam-o-Alaikum Habib-ur-Rehman! I want to rent a bike from Cycling Point (F-8 Markaz):\n` +
      `🚴 Bike: ${pricing[selectedModel].name}\n` +
      `⏱️ Duration: ${durationTitles[selectedDuration]}\n` +
      `🛡️ Pro Kit (Lights & Cockpit Mount): ${hasGear ? 'Included' : 'No'}\n` +
      `💰 Total: PKR ${grandTotal.toLocaleString()}\n\nPlease confirm availability!`
    );

    bookBtn.href = `https://wa.me/92302800100?text=${msg}`;
  }

  modelSelect.addEventListener('change', updateCalculation);
  timeSelect.addEventListener('change', updateCalculation);
  if (proGearCheck) proGearCheck.addEventListener('change', updateCalculation);

  updateCalculation();
}

/* --------------------------------------------------------------------------
   7. STRAVA-LIKE TELEMETRY LIVE APP SIMULATION
   -------------------------------------------------------------------------- */
function initLiveTelemetryApp() {
  const speedEl = document.getElementById('device-live-speed');
  const distEl = document.getElementById('device-live-dist');
  const durEl = document.getElementById('device-live-dur');
  const cadEl = document.getElementById('device-live-cad');

  if (!speedEl) return;

  let speed = 33.6;
  let distance = 16.4;
  let totalSecs = 2050;

  setInterval(() => {
    // Speed fluctuation
    const delta = (Math.random() - 0.49) * 1.8;
    speed = Math.max(25.5, Math.min(43.2, speed + delta));
    speedEl.textContent = speed.toFixed(1);

    // Distance
    distance += speed / 3600;
    if (distEl) distEl.textContent = `${distance.toFixed(1)} km`;

    // Duration timer
    totalSecs++;
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    if (durEl) durEl.textContent = `${m}:${String(s).padStart(2, '0')}`;

    // Cadence RPM
    if (cadEl) {
      const rpm = Math.floor(75 + (speed - 25) * 1.8 + (Math.random() * 4 - 2));
      cadEl.textContent = `${rpm} rpm`;
    }
  }, 1000);
}

/* --------------------------------------------------------------------------
   8. 3D CARD TILT MOTION PHYSICS
   -------------------------------------------------------------------------- */
function initTiltMotion() {
  const cards = document.querySelectorAll('.fleet-card, .hero-main-card');
  if (window.innerWidth < 1024) return;

  cards.forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const rotateX = (-y / rect.height) * 10;
      const rotateY = (x / rect.width) * 10;

      card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-6px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
    });
  });
}

/* --------------------------------------------------------------------------
   9. MODALS & RSVP TO WHATSAPP
   -------------------------------------------------------------------------- */
function initModals() {
  const modal = document.getElementById('rsvp-modal-layer');
  const triggers = document.querySelectorAll('[data-action="open-rsvp"]');
  const closeTriggers = document.querySelectorAll('.modal-close-trigger, .modal-shield');

  triggers.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      modal?.classList.add('active');
    });
  });

  closeTriggers.forEach((el) => {
    el.addEventListener('click', (e) => {
      if (e.target === el) {
        modal?.classList.remove('active');
      }
    });
  });

  const form = document.getElementById('rsvp-sunday-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('f-name').value;
      const phone = document.getElementById('f-phone').value;
      const category = document.getElementById('f-category').value;
      const needRent = document.getElementById('f-rent').value;

      const message = encodeURIComponent(
        `Assalam-o-Alaikum Habib-ur-Rehman! I want to join Hikencyc Sunday Morning Ride!\n` +
        `👤 Name: ${name}\n` +
        `📱 Phone: ${phone}\n` +
        `🚵 Ride Type: ${category}\n` +
        `🚲 Cycle Needed: ${needRent === 'yes' ? 'Yes, need rental cycle from Cycling Point F-8' : 'Bringing my own cycle'}\n\n` +
        `Please add me to the riders lineup!`
      );

      window.open(`https://wa.me/92302800100?text=${message}`, '_blank');
      modal?.classList.remove('active');
    });
  }
}
