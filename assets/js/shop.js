/* Cyclelava shop — fetches the public Hikencyc shop API and renders catalogue, product page and cart. */
(function () {
  'use strict';

  var API = 'https://hikencyc.runasp.net/api/public/shop'; // live Hikencyc portal
  var WA_NUMBER = '923001294738';                            // keep in sync with main.js
  var CUR = 'Rs.';
  var CART_KEY = 'cyclelava_cart_v1';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var money = function (n) { return CUR + ' ' + Number(n).toLocaleString('en-PK', { maximumFractionDigits: 0 }); };
  var safeUrl = function (u) { return /^https?:\/\//i.test(u || '') ? u : ''; };

  // Images are stored on the portal. If the API returns a relative path ("/images/shop/x.png"),
  // point it at the portal's origin, otherwise the browser would look for it on cyclelava.com.
  var ORIGIN = API.replace(/\/api\/.*$/, '');
  function fixImg(u) { return typeof u === 'string' && u.charAt(0) === '/' && u.charAt(1) !== '/' ? ORIGIN + u : u; }
  function fixImages(o) {
    if (Array.isArray(o)) { o.forEach(fixImages); return o; }
    if (o && typeof o === 'object') {
      Object.keys(o).forEach(function (k) {
        if (k === 'imageUrl') o[k] = fixImg(o[k]);
        else if (k === 'images' && Array.isArray(o[k])) o[k] = o[k].map(fixImg);
        else fixImages(o[k]);
      });
    }
    return o;
  }

  function get(path, opts) {
    return fetch(API + path, opts).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(fixImages);
  }

  var ICON_CART = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h2l2.4 11.2a2 2 0 002 1.6h7.7a2 2 0 002-1.5L20.5 8H6"/><circle cx="10" cy="20" r="1.2"/><circle cx="17" cy="20" r="1.2"/></svg>';
  var ICON_PLUS = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>';
  var ICON_BIKE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="17" r="3.5"/><circle cx="18.5" cy="17" r="3.5"/><path d="M5.5 17l4-8h6l3 8M9.5 9L8 6H6m6.5 3L10 17m5.5-8l-1-3h2.5"/></svg>';
  var ICON_WA = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.225 8.225 0 012.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 01-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.64c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.01-1.24-.74-.66-1.25-1.48-1.39-1.73-.14-.25-.01-.39.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.71 4.3 3.8 2.53 1.08 2.53.72 2.98.68.46-.05 1.47-.6 1.68-1.18.21-.58.21-1.08.15-1.18-.06-.1-.23-.17-.48-.29z"/></svg>';

  /* ---------------- Cart (localStorage) ---------------- */
  var Cart = {
    read: function () { try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch (e) { return []; } },
    write: function (items) { try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch (e) {} Cart.badge(); },
    add: function (id, qty) {
      var items = Cart.read(), it = items.filter(function (i) { return i.id === id; })[0];
      if (it) it.qty = Math.min(99, it.qty + qty); else items.push({ id: id, qty: qty });
      Cart.write(items);
    },
    setQty: function (id, qty) {
      Cart.write(Cart.read().map(function (i) { return i.id === id ? { id: id, qty: qty } : i; }).filter(function (i) { return i.qty > 0; }));
    },
    clear: function () { Cart.write([]); },
    count: function () { return Cart.read().reduce(function (a, i) { return a + i.qty; }, 0); },
    badge: function () {
      var n = Cart.count();
      document.querySelectorAll('.cart-count').forEach(function (e) { e.textContent = n; });
      var fab = $('.cart-fab'); if (fab) fab.hidden = false;
    }
  };

  /* ---------------- WhatsApp ---------------- */
  function whatsapp(lines, total) {
    var msg = 'Assalam-o-Alaikum! I would like to book from the Cyclelava shop:\n\n' +
      lines.map(function (l, i) { return (i + 1) + '. ' + l.name + ' x ' + l.quantity + ' = ' + money(l.lineTotal); }).join('\n') +
      '\n\nTotal: ' + money(total) + '\n\nPlease confirm availability.';
    window.open('https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
  }

  function toast(text) {
    var t = $('.toast');
    if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
    t.textContent = text; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('show'); }, 1800);
  }

  /* ---------------- Cart drawer (injected) ---------------- */
  function mountCart() {
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<button class="cart-fab" type="button" aria-label="Open cart" hidden>' + ICON_CART + '<span>Cart</span><span class="cart-count">0</span></button>' +
      '<div class="cart-overlay"></div>' +
      '<aside class="cart-drawer" aria-label="Shopping cart" aria-hidden="true">' +
        '<div class="cd-head"><h3>Your cart</h3><button class="cd-close" type="button" aria-label="Close cart">&times;</button></div>' +
        '<div class="cd-body"></div>' +
        '<div class="cd-foot"><div class="cd-total"><span>Estimated total</span><strong class="cd-sum">' + money(0) + '</strong></div>' +
        '<button class="btn btn-wa cd-wa" type="button" disabled>' + ICON_WA + ' Book on WhatsApp</button>' +
        '<p class="cd-hint">No online payment. We confirm availability and finalise on WhatsApp.</p>' +
        '<button class="cd-clear" type="button">Clear cart</button></div>' +
      '</aside>';
    while (wrap.firstChild) document.body.appendChild(wrap.firstChild);

    var drawer = $('.cart-drawer'), overlay = $('.cart-overlay');
    function close() { drawer.classList.remove('open'); overlay.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }
    function open() { drawer.classList.add('open'); overlay.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; render(); }
    $('.cart-fab').addEventListener('click', open);
    overlay.addEventListener('click', close);
    $('.cd-close').addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    $('.cd-clear').addEventListener('click', function () { Cart.clear(); render(); });
    window.openCart = open;

    var body = $('.cd-body'), sum = $('.cd-sum'), waBtn = $('.cd-wa');
    var last = null;

    body.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-id]'); if (!b) return;
      var id = +b.dataset.id, cur = (Cart.read().filter(function (i) { return i.id === id; })[0] || {}).qty || 0;
      Cart.setQty(id, b.dataset.d === 'x' ? 0 : cur + (+b.dataset.d));
      render();
    });
    waBtn.addEventListener('click', function () { if (last) whatsapp(last.ok, last.total); });

    function render() {
      var items = Cart.read();
      last = null; waBtn.disabled = true;
      if (!items.length) { body.innerHTML = '<div class="cd-empty"><p><strong>Your cart is empty.</strong></p><p>Add a cycle or some gear to see the total here.</p></div>'; sum.textContent = money(0); return; }
      body.innerHTML = '<div class="cd-empty">Calculating…</div>';
      get('/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: items.map(function (i) { return { productId: i.id, quantity: i.qty }; }) }) })
        .then(function (q) {
          // drop products that no longer exist and sync quantities capped by stock
          Cart.write(q.lines.filter(function (l) { return l.name !== 'Unavailable product'; }).map(function (l) { return { id: l.productId, qty: l.available ? l.quantity : (items.filter(function (i) { return i.id === l.productId; })[0] || { qty: 1 }).qty }; }));
          body.innerHTML = q.lines.filter(function (l) { return l.name !== 'Unavailable product'; }).map(function (l) {
            var img = safeUrl(l.imageUrl);
            return '<div class="cd-line">' + (img ? '<img src="' + esc(img) + '" alt="">' : '<span class="cd-ph"></span>') +
              '<div><span class="cd-name">' + esc(l.name) + '</span>' +
              (l.available ? '<span class="cd-unit">' + money(l.unitPrice) + ' each</span>' : '') +
              (l.note ? '<div class="cd-note">' + esc(l.note) + '</div>' : '') +
              '<div class="cd-ctrl">' + (l.available ? '<div class="qty sm"><button data-id="' + l.productId + '" data-d="-1" aria-label="Decrease">&minus;</button><span>' + l.quantity + '</span><button data-id="' + l.productId + '" data-d="1" aria-label="Increase">+</button></div>' : '') +
              '<button class="cd-rm" data-id="' + l.productId + '" data-d="x">Remove</button></div></div>' +
              '<div class="cd-lt">' + (l.available ? money(l.lineTotal) : '—') + '</div></div>';
          }).join('') || '<div class="cd-empty">Your cart is empty.</div>';
          sum.textContent = money(q.total);
          var ok = q.lines.filter(function (l) { return l.available; });
          last = { ok: ok, total: q.total };
          waBtn.disabled = !ok.length;
        })
        .catch(function () { body.innerHTML = '<div class="cd-empty">Could not calculate the total right now. Please check your connection and try again.</div>'; });
    }
    Cart.badge();
  }

  function addToCart(id, qty, name) {
    Cart.add(id, qty);
    var fab = $('.cart-fab'); if (fab) { fab.classList.remove('bump'); void fab.offsetWidth; fab.classList.add('bump'); }
    toast((name ? name + ' ' : '') + 'added to cart');
  }

  /* ---------------- Shared renderers ---------------- */
  function priceBlock(p) {
    return p.discountPrice && p.discountPrice < p.price
      ? '<span class="p-price">' + money(p.discountPrice) + '<span class="p-old">' + money(p.price) + '</span></span>'
      : '<span class="p-price">' + money(p.price) + '</span>';
  }

  function productCard(p) {
    var onSale = p.discountPrice && p.discountPrice < p.price;
    var left = p.condition && p.condition !== 'N/A' ? '<span class="p-badge">' + esc(p.condition) + '</span>' : '<span></span>';
    var right = !p.inStock ? '<span class="p-badge out">Out of stock</span>' : onSale ? '<span class="p-badge sale">Sale</span>' : '';
    return '<a class="p-card" href="/shop/product/?p=' + encodeURIComponent(p.slug) + '">' +
      '<div class="p-img">' + (safeUrl(p.imageUrl) ? '<img loading="lazy" src="' + esc(p.imageUrl) + '" alt="' + esc(p.name) + '">' : '<div class="p-noimg">' + ICON_BIKE + '</div>') +
      '<div class="p-badges">' + left + right + '</div></div>' +
      '<div class="p-body"><span class="p-brand">' + esc(p.brand || p.categoryName) + '</span><h3 class="p-title">' + esc(p.name) + '</h3>' +
      (p.shortDescription ? '<p class="p-short">' + esc(p.shortDescription) + '</p>' : '') +
      '<div class="p-foot">' + priceBlock(p) +
      '<button class="p-add" type="button" data-add="' + p.id + '" data-name="' + esc(p.name) + '" aria-label="Add ' + esc(p.name) + ' to cart"' + (p.inStock ? '' : ' disabled') + '>' + ICON_PLUS + '</button></div></div></a>';
  }

  function bindAdd(root) {
    root.addEventListener('click', function (e) {
      var b = e.target.closest('[data-add]'); if (!b) return;
      e.preventDefault(); e.stopPropagation();
      addToCart(+b.dataset.add, 1, b.dataset.name);
    });
  }

  /* ---------------- Catalogue page ---------------- */
  function initShop() {
    var grid = $('#pGrid'), pager = $('#pPager'), chips = $('#shopChips'), tabs = $('#shopTabs'), meta = $('#shopMeta');
    var qs = new URLSearchParams(location.search);
    var state = { group: qs.get('group') || '', category: qs.get('cat') || '', q: '', sort: '', page: 1 };
    var cats = [];

    function skeleton() { grid.innerHTML = new Array(6 + 1).join('<div class="p-skel"></div>'); }

    function drawTabs() {
      var defs = [['', 'All'], ['Bicycle', 'Bicycles'], ['Accessory', 'Accessories']];
      tabs.innerHTML = defs.map(function (d) { return '<button class="shop-tab' + (state.group === d[0] ? ' on' : '') + '" data-g="' + d[0] + '" type="button">' + d[1] + '</button>'; }).join('');
    }
    function drawChips() {
      var list = cats.filter(function (c) { return !state.group || c.group === state.group; });
      chips.hidden = list.length === 0;
      chips.innerHTML = '<button class="shop-chip' + (!state.category ? ' on' : '') + '" data-c="" type="button">All</button>' +
        list.map(function (c) { return '<button class="shop-chip' + (state.category === c.slug ? ' on' : '') + '" data-c="' + esc(c.slug) + '" type="button">' + esc(c.name) + ' <small>' + c.productCount + '</small></button>'; }).join('');
    }
    function sync() {
      var u = new URLSearchParams();
      if (state.group) u.set('group', state.group);
      if (state.category) u.set('cat', state.category);
      history.replaceState(null, '', location.pathname + (u.toString() ? '?' + u : ''));
    }

    function load() {
      skeleton(); sync();
      var p = new URLSearchParams({ page: state.page, pageSize: 12 });
      ['group', 'category', 'q', 'sort'].forEach(function (k) { if (state[k]) p.set(k, state[k]); });
      get('/products?' + p).then(function (r) {
        meta.textContent = r.totalCount ? r.totalCount + (r.totalCount === 1 ? ' product' : ' products') : '';
        grid.innerHTML = r.items.length ? r.items.map(productCard).join('') :
          '<div class="shop-empty"><h3>Nothing here yet</h3><p>Try another category, or message us on WhatsApp and we will tell you what is on the floor today.</p>' +
          '<a class="btn btn-wa" href="https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent('Assalam-o-Alaikum! I am looking for: ') + '" target="_blank" rel="noopener">' + ICON_WA + ' Ask on WhatsApp</a></div>';
        var pg = '';
        if (r.totalPages > 1) for (var i = 1; i <= r.totalPages; i++) pg += '<button type="button" data-p="' + i + '" class="' + (i === r.page ? 'on' : '') + '">' + i + '</button>';
        pager.innerHTML = pg;
        grid.querySelectorAll('.reveal').forEach(function (e) { e.classList.add('in'); });
      }).catch(function () {
        meta.textContent = '';
        grid.innerHTML = '<div class="shop-empty"><h3>Could not load the shop</h3><p>Please check your connection and refresh, or message us on WhatsApp.</p></div>';
      });
    }

    tabs.addEventListener('click', function (e) { var b = e.target.closest('[data-g]'); if (!b) return; state.group = b.dataset.g; state.category = ''; state.page = 1; drawTabs(); drawChips(); load(); });
    chips.addEventListener('click', function (e) { var b = e.target.closest('[data-c]'); if (!b) return; state.category = b.dataset.c; state.page = 1; drawChips(); load(); });
    pager.addEventListener('click', function (e) { var b = e.target.closest('[data-p]'); if (!b) return; state.page = +b.dataset.p; load(); window.scrollTo({ top: $('#catalogue').offsetTop - 80, behavior: 'smooth' }); });
    var t; $('#shopSearch').addEventListener('input', function (e) { clearTimeout(t); var v = e.target.value.trim(); t = setTimeout(function () { state.q = v; state.page = 1; load(); }, 300); });
    $('#shopSort').addEventListener('change', function (e) { state.sort = e.target.value; state.page = 1; load(); });
    bindAdd(grid);

    drawTabs();
    get('/categories').then(function (c) { cats = c; drawChips(); }).catch(function () { chips.hidden = true; });
    load();
  }

  /* ---------------- Product page ---------------- */
  function initProduct() {
    var root = $('#pd'), slug = new URLSearchParams(location.search).get('p');
    if (!slug) { root.innerHTML = notFound(); return; }

    function notFound() {
      return '<div class="shop-empty"><h3>Product not found</h3><p>It may have been sold or removed.</p><a class="btn btn-primary" href="/shop/">Back to the shop</a></div>';
    }

    get('/products/' + encodeURIComponent(slug)).then(function (p) {
      document.title = p.name + ' | Cyclelava Shop, Islamabad';
      var md = document.querySelector('meta[name="description"]');
      if (md) md.content = (p.shortDescription || p.name) + ' Available at The Cycling Point, F-8 Markaz, Islamabad. Book on WhatsApp.';
      var crumb = $('#crumbName'); if (crumb) crumb.textContent = p.name;
      var catCrumb = $('#crumbCat'); if (catCrumb) { catCrumb.textContent = p.categoryName; catCrumb.href = '/shop/?group=' + encodeURIComponent(p.categoryGroup) + '&cat=' + encodeURIComponent(p.categorySlug); }
      var h = $('#pdTitle'); if (h) h.textContent = p.name;

      var ld = document.createElement('script'); ld.type = 'application/ld+json';
      ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'Product', name: p.name, image: p.images, description: p.shortDescription || p.name,
        brand: p.brand ? { '@type': 'Brand', name: p.brand } : undefined, sku: p.sku || undefined,
        offers: { '@type': 'Offer', priceCurrency: 'PKR', price: p.effectivePrice, availability: p.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', url: location.href } });
      document.head.appendChild(ld);

      var onSale = p.discountPrice && p.discountPrice < p.price;
      var save = onSale ? Math.round((1 - p.discountPrice / p.price) * 100) : 0;
      var imgs = p.images.filter(safeUrl);
      var qty = 1;

      root.innerHTML =
        '<div class="pd-gallery"><div class="pd-main">' + (imgs[0] ? '<img id="pdMain" src="' + esc(imgs[0]) + '" alt="' + esc(p.name) + '">' : '<div class="p-noimg">' + ICON_BIKE + '</div>') + '</div>' +
        (imgs.length > 1 ? '<div class="pd-thumbs">' + imgs.map(function (u, i) { return '<button type="button" class="' + (i ? '' : 'on') + '" data-src="' + esc(u) + '" aria-label="Image ' + (i + 1) + '"><img src="' + esc(u) + '" alt=""></button>'; }).join('') + '</div>' : '') + '</div>' +
        '<div class="pd-info"><span class="eyebrow">' + esc(p.categoryName) + (p.brand ? ' · ' + esc(p.brand) : '') + '</span>' +
        '<h1 style="font-size:clamp(1.9rem,3.8vw,2.9rem);margin:.1rem 0 1rem">' + esc(p.name) + '</h1>' +
        '<div class="pd-price"><strong>' + money(p.effectivePrice) + '</strong>' + (onSale ? '<del>' + money(p.price) + '</del><span class="pd-save">Save ' + save + '%</span>' : '') + '</div>' +
        '<div class="pd-tags"><span class="pd-tag ' + (p.inStock ? 'ok' : 'no') + '">' + (p.inStock ? (p.stockQuantity <= 5 ? 'Only ' + p.stockQuantity + ' left' : 'In stock') : 'Out of stock') + '</span>' +
        (p.condition !== 'N/A' ? '<span class="pd-tag">' + esc(p.condition) + '</span>' : '') + (p.warranty ? '<span class="pd-tag">' + esc(p.warranty) + '</span>' : '') + '</div>' +
        (p.shortDescription ? '<p class="lead" style="font-size:1.08rem">' + esc(p.shortDescription) + '</p>' : '') +
        (p.inStock ? '<div class="pd-buy"><div class="pd-buy-row"><div class="qty"><button type="button" id="qm" aria-label="Decrease">&minus;</button><span id="qv">1</span><button type="button" id="qp" aria-label="Increase">+</button></div>' +
          '<div class="pd-sub">Total <strong id="pdSub">' + money(p.effectivePrice) + '</strong></div></div>' +
          '<div class="pd-actions"><button class="btn btn-dark" type="button" id="pdAdd">' + ICON_CART + ' Add to cart</button><button class="btn btn-wa" type="button" id="pdWa">' + ICON_WA + ' Book on WhatsApp</button></div></div>' :
          '<div class="pd-buy"><p style="margin:0">This one is out of stock. <a href="https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent('Assalam-o-Alaikum! Will you get ' + p.name + ' back in stock?') + '" target="_blank" rel="noopener"><strong>Ask us on WhatsApp</strong></a> about similar options.</p></div>') +
        (p.description ? '<h3>About this product</h3><p class="pd-desc">' + esc(p.description) + '</p>' : '') +
        (p.specs.length ? '<h3>Specifications</h3><table class="pd-specs">' + p.specs.map(function (s) { return '<tr><th>' + esc(s.name) + '</th><td>' + esc(s.value) + '</td></tr>'; }).join('') + '</table>' : '') +
        '</div>';

      var thumbs = root.querySelector('.pd-thumbs');
      if (thumbs) thumbs.addEventListener('click', function (e) {
        var b = e.target.closest('button[data-src]'); if (!b) return;
        $('#pdMain').src = b.dataset.src;
        thumbs.querySelectorAll('button').forEach(function (x) { x.classList.toggle('on', x === b); });
      });

      if (p.inStock) {
        var max = Math.min(99, p.stockQuantity);
        var upd = function () { $('#qv').textContent = qty; $('#pdSub').textContent = money(p.effectivePrice * qty); };
        $('#qm').onclick = function () { qty = Math.max(1, qty - 1); upd(); };
        $('#qp').onclick = function () { qty = Math.min(max, qty + 1); upd(); };
        $('#pdAdd').onclick = function () { addToCart(p.id, qty, p.name); };
        $('#pdWa').onclick = function () { whatsapp([{ name: p.name, quantity: qty, lineTotal: p.effectivePrice * qty }], p.effectivePrice * qty); };
      }

      // related products from the same category
      get('/products?category=' + encodeURIComponent(p.categorySlug) + '&pageSize=5').then(function (r) {
        var rel = r.items.filter(function (x) { return x.id !== p.id; }).slice(0, 4);
        if (!rel.length) return;
        var box = $('#related'); box.hidden = false;
        $('#relGrid').innerHTML = rel.map(productCard).join('');
        bindAdd($('#relGrid'));
      }).catch(function () {});
    }).catch(function () { root.innerHTML = notFound(); });
  }

  /* ---------------- boot ---------------- */
  mountCart();
  if ($('#pGrid')) initShop();
  if ($('#pd')) initProduct();
})();
