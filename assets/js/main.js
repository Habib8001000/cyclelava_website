/* Cyclelava — small, dependency-free UI helpers */
(function () {
  'use strict';

  var WA_NUMBER = '923028001000';

  function waLink(text) {
    return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(text);
  }

  /* Header: shadow on scroll + mobile menu */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    var toggle = header.querySelector('.nav-toggle');
    if (toggle) {
      toggle.addEventListener('click', function () {
        var open = header.classList.toggle('nav-open');
        document.body.classList.toggle('menu-open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      header.querySelectorAll('.nav-links a').forEach(function (a) {
        a.addEventListener('click', function () {
          header.classList.remove('nav-open');
          document.body.classList.remove('menu-open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    }
  }

  /* Reveal on scroll */
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  /* Footer year */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* Forms -> WhatsApp */
  function val(form, name) {
    var f = form.elements[name];
    return f ? String(f.value).trim() : '';
  }

  var ride = document.getElementById('ride-form');
  if (ride) {
    ride.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = 'Assalam-o-Alaikum! I would like to join a Hikencyc ride.\n' +
        'Name: ' + val(ride, 'name') + '\n' +
        'Ride: ' + val(ride, 'ride') + '\n' +
        'Riding level: ' + val(ride, 'level') + '\n' +
        'Cycle: ' + val(ride, 'cycle') + '\n' +
        'Group size: ' + val(ride, 'people');
      window.open(waLink(msg), '_blank', 'noopener');
    });
  }

  var rent = document.getElementById('rent-form');
  if (rent) {
    rent.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = 'Assalam-o-Alaikum! I would like to rent a cycle from The Cycling Point (F-8 Markaz).\n' +
        'Name: ' + val(rent, 'name') + '\n' +
        'Cycle type: ' + val(rent, 'type') + '\n' +
        'Duration: ' + val(rent, 'duration') + '\n' +
        'Date: ' + (val(rent, 'date') || 'to be confirmed') + '\n' +
        'Please share the rate and availability.';
      window.open(waLink(msg), '_blank', 'noopener');
    });
  }

  var contact = document.getElementById('contact-form');
  if (contact) {
    contact.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = 'Assalam-o-Alaikum! This is ' + val(contact, 'name') + '.\nTopic: ' + val(contact, 'topic') + '\n' + val(contact, 'message');
      window.open(waLink(msg), '_blank', 'noopener');
    });
  }

  var rentDate = document.querySelector('#rent-form [name="date"]');
  if (rentDate) { rentDate.min = new Date().toISOString().split('T')[0]; }

  /* Hero bike stage: gentle 3D tilt on mouse move (desktop only) */
  var heroSection = document.getElementById('top');
  var bikeStage = document.getElementById('heroBikeStage');
  if (heroSection && bikeStage && window.matchMedia && window.matchMedia('(pointer: fine)').matches) {
    heroSection.addEventListener('mousemove', function (e) {
      var rect = heroSection.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;
      bikeStage.style.transform = 'perspective(900px) rotateY(' + (x * 8).toFixed(2) + 'deg) rotateX(' + (-y * 8).toFixed(2) + 'deg)';
    });
    heroSection.addEventListener('mouseleave', function () {
      bikeStage.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg)';
    });
  }

  /* Bike hotspots tap / click interaction */
  var hotspots = document.querySelectorAll('.bike-hotspot');
  if (hotspots.length) {
    hotspots.forEach(function (spot) {
      var btn = spot.querySelector('.hotspot-trigger');
      if (!btn) return;
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var wasActive = spot.classList.contains('active');
        hotspots.forEach(function (s) { s.classList.remove('active'); });
        if (!wasActive) spot.classList.add('active');
      });
    });
    document.addEventListener('click', function () {
      hotspots.forEach(function (s) { s.classList.remove('active'); });
    });
  }

  /* Animated stats counter in hero */
  var statStrip = document.querySelector('.hero-stats-strip');
  var statAnimated = false;
  if (statStrip && 'IntersectionObserver' in window) {
    var statObserver = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting && !statAnimated) {
        statAnimated = true;
        document.querySelectorAll('.stat-number[data-target]').forEach(function (el) {
          var target = parseInt(el.getAttribute('data-target'), 10);
          var suffix = el.getAttribute('data-suffix') || '';
          var duration = 1500;
          var startTime = performance.now();
          function updateCounter(now) {
            var elapsed = now - startTime;
            var progress = Math.min(elapsed / duration, 1);
            var ease = 1 - Math.pow(1 - progress, 3);
            var current = Math.floor(ease * target);
            el.innerHTML = current + '<em>' + suffix + '</em>';
            if (progress < 1) {
              requestAnimationFrame(updateCounter);
            } else {
              el.innerHTML = target + '<em>' + suffix + '</em>';
            }
          }
          requestAnimationFrame(updateCounter);
        });
        statObserver.disconnect();
      }
    }, { threshold: 0.15 });
    statObserver.observe(statStrip);
  }
})();
