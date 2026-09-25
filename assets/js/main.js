/**
 * CYCLELAVA - Main Motion Graphics & Interactive Logic
 * Physical Store: Cycling Point, F-8 Markaz, Islamabad
 * Owner: Habib-ur-Rehman (0302800100)
 * Community: Hikencyc
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbarScroll();
  initMotionCanvas();
  initSundayCountdown();
  initBikeCatalog();
  initRentalCalculator();
  initSimulatedRideApp();
  initModals();
});

/* --------------------------------------------------------------------------
   1. NAVBAR SCROLL EFFECT
   -------------------------------------------------------------------------- */
function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

/* --------------------------------------------------------------------------
   2. MOTION GRAPHICS CANVAS (Lava Sparks & Cycling Velocity Trails)
   -------------------------------------------------------------------------- */
function initMotionCanvas() {
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
  const particleCount = Math.min(width > 768 ? 65 : 30, 80);

  let mouse = { x: width / 2, y: height / 2, isActive: false };

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.isActive = true;
  });

  window.addEventListener('mouseleave', () => {
    mouse.isActive = false;
  });

  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * width;
      this.y = height + Math.random() * 50;
      this.size = Math.random() * 2.8 + 1.2;
      this.speedY = Math.random() * 1.5 + 0.6;
      this.speedX = (Math.random() - 0.5) * 1.2;
      this.opacity = Math.random() * 0.7 + 0.3;
      this.hue = Math.random() > 0.4 ? 18 : Math.random() > 0.5 ? 32 : 355; // Orange, Amber, Red
      this.life = Math.random() * 180 + 100;
      this.currentLife = 0;
    }

    update() {
      this.y -= this.speedY;
      this.x += this.speedX;
      this.currentLife++;

      // React to mouse proximity
      if (mouse.isActive) {
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140) {
          const force = (140 - dist) / 140;
          this.x += (dx / dist) * force * 3;
          this.y += (dy / dist) * force * 3;
        }
      }

      if (this.currentLife >= this.life || this.y < -20 || this.x < -20 || this.x > width + 20) {
        this.reset();
      }
    }

    draw() {
      ctx.save();
      ctx.beginPath();
      const progress = this.currentLife / this.life;
      const alpha = (1 - progress) * this.opacity;
      ctx.fillStyle = `hsla(${this.hue}, 100%, 55%, ${alpha})`;
      ctx.shadowBlur = 12;
      ctx.shadowColor = `hsla(${this.hue}, 100%, 50%, 0.8)`;
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  for (let i = 0; i < particleCount; i++) {
    const p = new Particle();
    p.y = Math.random() * height; // Distribute initially
    particles.push(p);
  }

  function render() {
    ctx.clearRect(0, 0, width, height);

    // Draw velocity connection lines between nearby particles
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 90) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(255, 69, 0, ${(1 - dist / 90) * 0.15})`;
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

    requestAnimationFrame(render);
  }

  render();
}

/* --------------------------------------------------------------------------
   3. SUNDAY EVENT COUNTDOWN (HIKENCYC RIDE)
   -------------------------------------------------------------------------- */
function initSundayCountdown() {
  const daysEl = document.getElementById('cd-days');
  const hoursEl = document.getElementById('cd-hours');
  const minsEl = document.getElementById('cd-mins');
  const secsEl = document.getElementById('cd-secs');

  if (!daysEl || !hoursEl || !minsEl || !secsEl) return;

  function getNextSunday6AM() {
    const now = new Date();
    const result = new Date(now);
    const day = now.getDay(); // 0 is Sunday
    let diffDays = (7 - day) % 7;

    result.setDate(now.getDate() + diffDays);
    result.setHours(6, 0, 0, 0); // 6:00 AM PKT

    // If today is Sunday and already past 6:00 AM, target next Sunday
    if (diffDays === 0 && now.getTime() > result.getTime()) {
      result.setDate(result.getDate() + 7);
    }
    return result;
  }

  let targetDate = getNextSunday6AM();

  function updateTimer() {
    const now = new Date().getTime();
    const diff = targetDate.getTime() - now;

    if (diff <= 0) {
      targetDate = getNextSunday6AM();
      return;
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);

    daysEl.textContent = String(d).padStart(2, '0');
    hoursEl.textContent = String(h).padStart(2, '0');
    minsEl.textContent = String(m).padStart(2, '0');
    secsEl.textContent = String(s).padStart(2, '0');
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}

/* --------------------------------------------------------------------------
   4. BIKE CATALOG FILTERING
   -------------------------------------------------------------------------- */
function initBikeCatalog() {
  const filterBtns = document.querySelectorAll('.tab-btn');
  const bikeCards = document.querySelectorAll('.bike-card');

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      bikeCards.forEach((card) => {
        if (filter === 'all' || card.getAttribute('data-category') === filter) {
          card.style.display = 'flex';
          card.style.opacity = '0';
          setTimeout(() => {
            card.style.opacity = '1';
          }, 50);
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
}

/* --------------------------------------------------------------------------
   5. INTERACTIVE RENTAL CALCULATOR
   -------------------------------------------------------------------------- */
function initRentalCalculator() {
  const typeSelect = document.getElementById('rental-bike-type');
  const durationSelect = document.getElementById('rental-duration');
  const gearCheckbox = document.getElementById('rental-pro-gear');
  const priceDisplay = document.getElementById('calc-total-display');
  const bookBtn = document.getElementById('calc-book-btn');

  if (!typeSelect || !durationSelect || !priceDisplay || !bookBtn) return;

  const baseRates = {
    mtb: { hourly: 400, day: 2000, weekend: 4500 },
    road: { hourly: 600, day: 3000, weekend: 7000 },
    hybrid: { hourly: 350, day: 1800, weekend: 4000 },
    ebike: { hourly: 900, day: 4500, weekend: 10500 },
  };

  function recalculate() {
    const bike = typeSelect.value;
    const dur = durationSelect.value;
    const hasGear = gearCheckbox ? gearCheckbox.checked : false;

    let base = baseRates[bike][dur];
    let extra = hasGear ? (dur === 'hourly' ? 200 : dur === 'day' ? 500 : 1000) : 0;
    let total = base + extra;

    priceDisplay.textContent = `PKR ${total.toLocaleString()}`;

    // Update WhatsApp link directly to Habib-ur-Rehman
    const bikeNames = {
      mtb: 'Mountain MTB',
      road: 'Road Carbon Pro',
      hybrid: 'City Hybrid Cruiser',
      ebike: 'Electric E-MTB',
    };
    const durNames = {
      hourly: '2-Hour Ride',
      day: 'Full Day (24h)',
      weekend: '3-Day Weekend Special',
    };

    const message = encodeURIComponent(
      `Hello Habib-ur-Rehman! I want to rent a cycle from Cycling Point (F-8 Markaz):\n` +
      `• Bike: ${bikeNames[bike]}\n` +
      `• Duration: ${durNames[dur]}\n` +
      `• Pro Gear Kit: ${hasGear ? 'Included (Helmet + Lights)' : 'No'}\n` +
      `• Estimated: PKR ${total.toLocaleString()}\n\nPlease confirm availability!`
    );

    bookBtn.href = `https://wa.me/92302800100?text=${message}`;
  }

  typeSelect.addEventListener('change', recalculate);
  durationSelect.addEventListener('change', recalculate);
  if (gearCheckbox) gearCheckbox.addEventListener('change', recalculate);

  recalculate();
}

/* --------------------------------------------------------------------------
   6. STRAVA-LIKE APP LIVE SIMULATION WIDGET
   -------------------------------------------------------------------------- */
function initSimulatedRideApp() {
  const speedEl = document.getElementById('app-live-speed');
  const distEl = document.getElementById('app-live-dist');
  const timeEl = document.getElementById('app-live-time');
  const cadEl = document.getElementById('app-live-cadence');

  if (!speedEl) return;

  let currentSpeed = 32.4;
  let distance = 14.8;
  let seconds = 1940; // ~32 mins

  setInterval(() => {
    // Smooth speed oscillation between 28.5 and 39.8 km/h
    const delta = (Math.random() - 0.48) * 1.4;
    currentSpeed = Math.max(26.0, Math.min(41.5, currentSpeed + delta));
    speedEl.textContent = currentSpeed.toFixed(1);

    // Distance incremental
    distance += (currentSpeed / 3600);
    if (distEl) distEl.textContent = `${distance.toFixed(1)} km`;

    // Time counter
    seconds++;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (timeEl) timeEl.textContent = `${m}:${String(s).padStart(2, '0')}`;

    // Cadence
    if (cadEl) {
      const cad = Math.floor(78 + (currentSpeed - 26) * 1.5 + (Math.random() * 4 - 2));
      cadEl.textContent = `${cad} rpm`;
    }
  }, 1000);
}

/* --------------------------------------------------------------------------
   7. MODALS & RSVP TO WHATSAPP
   -------------------------------------------------------------------------- */
function initModals() {
  const rsvpModal = document.getElementById('rsvp-modal');
  const openBtns = document.querySelectorAll('[data-open-modal="rsvp"]');
  const closeBtns = document.querySelectorAll('.modal-close, .modal-overlay');

  openBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (rsvpModal) rsvpModal.classList.add('active');
    });
  });

  closeBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      if (e.target === btn) {
        rsvpModal?.classList.remove('active');
      }
    });
  });

  // Handle Form Submission -> WhatsApp
  const rsvpForm = document.getElementById('rsvp-form');
  if (rsvpForm) {
    rsvpForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('rsvp-name').value;
      const phone = document.getElementById('rsvp-phone').value;
      const bikeType = document.getElementById('rsvp-bike').value;
      const rentalNeeded = document.getElementById('rsvp-rental-needed').value;

      const text = encodeURIComponent(
        `Hi Habib-ur-Rehman! I want to join the Hikencyc Sunday Ride with Cyclelava!\n` +
        `• Name: ${name}\n` +
        `• Phone: ${phone}\n` +
        `• Cycle Status: ${rentalNeeded === 'yes' ? 'Need cycle on rent from Cycling Point' : 'Bringing my own cycle'}\n` +
        `• Category: ${bikeType}\n\nPlease add me to the Sunday riders squad!`
      );

      window.open(`https://wa.me/92302800100?text=${text}`, '_blank');
      rsvpModal.classList.remove('active');
    });
  }
}
