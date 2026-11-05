/* Tienda de videojuegos: catálogo, carrito y ventas conectadas al inventario */
(function () {
  var S = window.SITE, A = window.AG, d = document, $ = function (s, c) { return (c || d).querySelector(s); }, $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var G = A.shop = {};
  G.products = function () { return A.store.get('products', S.shop.products); };
  G.saveProducts = function (p) { A.store.set('products', p); };
  G.sales = function () { return A.store.get('sales', seedSales()); };
  G.saveSales = function (s) { A.store.set('sales', s); };
  G.art = function (p) { var a = { 'PlayStation': 'controller', 'Xbox': 'controller', 'Nintendo': 'controller', 'PC': 'controller', 'Accesorios': 'controller', 'Retro': 'ticket', 'Coleccionables': 'cake' }; return window.AG_ART[p.art || a[p.platform] || 'controller']; };
  var cols = { 'PlayStation': ['#2457d6', '#0b1d52'], 'Xbox': ['#2eaa54', '#0d3d1b'], 'Nintendo': ['#e4002b', '#6f0016'], 'PC': ['#8a4dff', '#2a1359'], 'Accesorios': ['#ff8a00', '#6b2f00'], 'Retro': ['#ffcf26', '#6b4f00'], 'Coleccionables': ['#ff4fa3', '#5a0f3a'] };
  G.cols = function (p) { return cols[p.platform] || ['var(--pri)', 'var(--acc2)']; };
  function seedSales() {
    var pr = S.shop.products, out = [], pay = ['Efectivo', 'Tarjeta', 'Transferencia', 'Efectivo'];
    for (var k = 0; k < 18; k++) {
      var a = pr[(k * 3) % pr.length], b = pr[(k * 7 + 2) % pr.length], dt = new Date(Date.now() - (k % 8) * 86400000 - k * 3600000), lines = [{ id: a.id, name: a.name, n: 1, price: a.price, cost: a.cost }];
      if (k % 3 === 0) lines.push({ id: b.id, name: b.name, n: 1, price: b.price, cost: b.cost });
      out.push({ id: 'V' + (3100 + k), at: dt.toISOString(), source: k % 4 === 0 ? 'web' : 'tienda', customer: ['Mostrador', 'Kevin R.', 'Daniela S.', 'Mostrador'][k % 4], phone: '', pay: pay[k % 4], lines: lines, total: lines.reduce(function (s, l) { return s + l.price * l.n; }, 0), discount: 0, status: 'pagada' });
    }
    return out;
  }
  G.lowStock = function () { return G.products().filter(function (p) { return p.stock <= (S.shop.lowStock || 3); }); };

  /* ---------- tienda pública ---------- */
  var mount = $('#shopMount'); if (!mount) return;
  var f = { q: '', plat: '', cat: '', sort: 'rel', stock: false }, cart = A.store.get('scart', []);
  function find(id) { return G.products().filter(function (p) { return p.id === id; })[0]; }
  function card(p, i) {
    var c = G.cols(p), out = p.stock <= 0;
    return '<article class="gcard rv" style="--i:' + (i % 4) + ';--c1:' + c[0] + ';--c2:' + c[1] + '"><button class="gv" data-q="' + p.id + '" aria-label="Ver ' + A.esc(p.name) + '">' + (p.img ? '<img src="' + p.img + '" alt="">' : G.art(p)) + '<span class="plat">' + p.platform + '</span>' + (p.stock > 0 && p.stock <= 3 ? '<span class="last">¡Últimas ' + p.stock + '!</span>' : '') + (out ? '<span class="last off">Agotado</span>' : '') + (p.tag ? '<span class="new">' + A.esc(p.tag) + '</span>' : '') + '</button><div class="gb"><small>' + A.esc(p.category) + '</small><h4>' + A.esc(p.name) + '</h4><div class="gp"><b>' + A.q(p.price) + '</b>' + (A.can('plus') ? '<button class="add" data-add="' + p.id + '" ' + (out ? 'disabled style="opacity:.3"' : '') + ' aria-label="Agregar al carrito">+</button>' : '<a class="add" style="display:grid;place-items:center" target="_blank" rel="noopener" href="' + A.wa('Hola, me interesa: ' + p.name + ' (' + A.q(p.price) + ')') + '" aria-label="Consultar">✉</a>') + '</div></div></article>';
  }
  function render() {
    var all = G.products(), plats = all.map(function (p) { return p.platform; }).filter(function (v, i, a) { return a.indexOf(v) === i; }), cats = all.map(function (p) { return p.category; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
    var list = all.filter(function (p) { return (!f.q || (p.name + ' ' + p.platform + ' ' + p.category).toLowerCase().indexOf(f.q) > -1) && (!f.plat || p.platform === f.plat) && (!f.cat || p.category === f.cat) && (!f.stock || p.stock > 0); });
    if (f.sort === 'lo') list.sort(function (a, b) { return a.price - b.price; }); if (f.sort === 'hi') list.sort(function (a, b) { return b.price - a.price; });
    mount.innerHTML = '<div class="menu-tools" style="position:static"><input type="search" id="sq" placeholder="Busca un juego, consola o accesorio…" value="' + A.esc(f.q) + '" aria-label="Buscar"><select id="ss" class="pill" aria-label="Ordenar"><option value="rel">Destacados</option><option value="lo"' + (f.sort === 'lo' ? ' selected' : '') + '>Precio: menor a mayor</option><option value="hi"' + (f.sort === 'hi' ? ' selected' : '') + '>Precio: mayor a menor</option></select><button class="pill" id="sk" aria-pressed="' + f.stock + '">Solo en stock</button></div>' +
      '<div class="menu-tools" style="position:static;margin-top:-10px"><button class="pill" data-plat="" aria-pressed="' + !f.plat + '">Todas</button>' + plats.map(function (x) { return '<button class="pill" data-plat="' + x + '" aria-pressed="' + (f.plat === x) + '">' + x + '</button>'; }).join('') + '</div>' +
      '<div class="menu-tools" style="position:static;margin-top:-10px">' + cats.map(function (x) { return '<button class="pill" data-cat="' + A.esc(x) + '" aria-pressed="' + (f.cat === x) + '" style="font-size:.78rem;min-height:36px">' + A.esc(x) + '</button>'; }).join('') + (f.cat ? '<button class="link" data-cat="">Quitar filtro</button>' : '') + '</div>' +
      '<p>' + list.length + ' productos</p><div class="gridg">' + (list.map(card).join('') || '<div class="empty">Nada por aquí… prueba otra búsqueda 🎮</div>') + '</div>';
    A.observe(mount);
    var si = $('#sq'); si.oninput = function () { f.q = si.value.toLowerCase(); var p = si.selectionStart; render(); var n = $('#sq'); n.focus(); n.setSelectionRange(p, p); };
    $('#ss').onchange = function (e) { f.sort = e.target.value; render(); }; $('#sk').onclick = function () { f.stock = !f.stock; render(); };
  }
  mount.addEventListener('click', function (e) {
    var t = e.target.closest('[data-plat],[data-cat],[data-add],[data-q]'); if (!t) return;
    if ('plat' in t.dataset) { f.plat = t.dataset.plat; render(); }
    else if ('cat' in t.dataset) { f.cat = f.cat === t.dataset.cat ? '' : t.dataset.cat; render(); }
    else if (t.dataset.add) { add(t.dataset.add); }
    else if (t.dataset.q) { quick(t.dataset.q); }
  });
  function quick(id) {
    var p = find(id), c = G.cols(p);
    A.openModal('<div class="modal-h"><h3>' + A.esc(p.name) + '</h3><button class="modal-x" aria-label="Cerrar">×</button></div><div class="modal-b"><div style="display:grid;grid-template-columns:1fr 1fr;gap:22px;align-items:center" class="qv"><div style="aspect-ratio:1;border-radius:20px;display:grid;place-items:center;background:linear-gradient(140deg,' + c[0] + ',' + c[1] + ')"><div style="width:70%">' + G.art(p) + '</div></div><div><span class="tag">' + p.platform + '</span><span class="tag">' + A.esc(p.category) + '</span><p style="margin-top:12px">' + A.esc(p.desc || 'Producto original con garantía de la tienda.') + '</p><p style="font-family:var(--fd);font-size:2.2rem;color:var(--acc);margin:0">' + A.q(p.price) + '</p><p>' + (p.stock > 0 ? '<b style="color:#46e08c">En stock: ' + p.stock + '</b>' : '<b style="color:#ff7b80">Agotado — pregunta por reposición</b>') + '</p>' + (A.can('plus') ? '<button class="btn" data-addq="' + p.id + '" ' + (p.stock <= 0 ? 'disabled' : '') + '>Agregar al carrito</button>' : '<a class="btn" target="_blank" rel="noopener" href="' + A.wa('Hola, me interesa: ' + p.name) + '">Preguntar por WhatsApp</a>') + '</div></div></div>');
    var b = $('[data-addq]'); if (b) b.onclick = function () { add(id); A.closeModal(); };
  }
  function add(id) { var p = find(id), l = cart.filter(function (x) { return x.id === id; })[0]; if ((l ? l.n : 0) >= p.stock) { A.toast('No hay más unidades en stock'); return; } l ? l.n++ : cart.push({ id: id, n: 1 }); sv(); A.toast('Agregado: ' + p.name); }
  function sv() { A.store.set('scart', cart); cu(); }
  function total() { return cart.reduce(function (s, l) { var p = find(l.id); return s + (p ? p.price * l.n : 0); }, 0); }
  var fab = $('#cartFab'), drawer = $('#cartDrawer');
  function cu() {
    var n = cart.reduce(function (s, l) { return s + l.n; }, 0);
    fab.hidden = !A.can('plus') || !n; fab.querySelector('b').textContent = n; fab.querySelector('em').textContent = A.q(total());
    $('.drawer-b', drawer).innerHTML = cart.length ? cart.map(function (l) { var p = find(l.id); if (!p) return ''; return '<div class="line-item"><div><b>' + A.esc(p.name) + '</b><br><small style="color:var(--mut)">' + A.q(p.price) + '</small></div><b>' + A.q(p.price * l.n) + '</b><div class="qty"><button data-m="' + l.id + '">−</button><b>' + l.n + '</b><button data-p="' + l.id + '">+</button></div><button class="link" data-rm="' + l.id + '" style="justify-self:end">Quitar</button></div>'; }).join('') +
      '<form id="ckForm" style="margin-top:18px" novalidate><div class="row2"><div class="field"><label for="g1">Nombre</label><input id="g1" name="n" required autocomplete="name"></div><div class="field"><label for="g2">WhatsApp</label><input id="g2" name="t" type="tel" required autocomplete="tel"></div></div><div class="field"><label for="g3">Entrega y pago</label><select id="g3" name="m"><option>Recoger en tienda · pago en tienda</option><option>Recoger en tienda · transferencia</option><option>Envío (Forza / Guatex) · transferencia</option><option>Entrega en Antigua · contra entrega</option></select></div></form>' : '<div class="empty">Tu carrito está vacío 🎮</div>';
    $('.drawer-f', drawer).innerHTML = cart.length ? '<div style="display:flex;justify-content:space-between;font-size:1.2rem;margin-bottom:12px"><b>Total</b><b style="color:var(--acc)">' + A.q(total()) + '</b></div><button class="btn" id="buy" style="width:100%;justify-content:center">Reservar y enviar por WhatsApp</button><p style="font-size:.78rem;text-align:center;margin:10px 0 0">Apartamos tu stock al instante.</p>' : '';
  }
  fab.onclick = function () { cu(); A.openDrawer('cartDrawer'); };
  $('.drawer-h button', drawer).onclick = A.closeDrawer;
  drawer.addEventListener('click', function (e) {
    var t = e.target, l = function (id) { return cart.filter(function (x) { return x.id === id; })[0]; };
    if (t.dataset.m) { var a = l(t.dataset.m); a.n--; if (a.n < 1) cart.splice(cart.indexOf(a), 1); sv(); }
    if (t.dataset.p) { var b = l(t.dataset.p); if (b.n < find(b.id).stock) b.n++; else A.toast('Sin más stock'); sv(); }
    if (t.dataset.rm) { cart.splice(cart.indexOf(l(t.dataset.rm)), 1); sv(); }
    if (t.id === 'buy') {
      var fm = $('#ckForm'), nm = fm.n.value.trim(), tl = fm.t.value.replace(/\D/g, ''); if (nm.length < 2 || tl.length < 8) { A.toast('Completa tu nombre y WhatsApp'); return; }
      var prods = G.products(), lines = [];
      cart.forEach(function (c) { var p = prods.filter(function (x) { return x.id === c.id; })[0]; p.stock -= c.n; lines.push({ id: p.id, name: p.name, n: c.n, price: p.price, cost: p.cost || 0 }); });
      G.saveProducts(prods); var sale = { id: A.uid('V').slice(0, 6), at: new Date().toISOString(), source: 'web', customer: nm, phone: fm.t.value, pay: fm.m.value, lines: lines, total: total(), discount: 0, status: 'pendiente' };
      var all = G.sales(); all.unshift(sale); G.saveSales(all);
      A.sendWA('Hola ' + S.name + ', quiero reservar:\n' + lines.map(function (x) { return '• ' + x.n + ' × ' + x.name + ' — ' + A.q(x.price * x.n); }).join('\n') + '\nTotal: ' + A.q(sale.total) + '\n' + fm.m.value + '\nNombre: ' + nm + '\nOrden ' + sale.id, function () {
        cart = []; sv(); A.closeDrawer(); render(); A.openModal('<div class="modal-b center" style="padding:44px 26px"><div style="width:84px;height:84px;margin:0 auto 18px;border-radius:50%;background:var(--acc);color:#14110c;display:grid;place-items:center;animation:pop .7s var(--ease)"><svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div><h3>¡Orden ' + sale.id + ' reservada!</h3><p>Apartamos tus productos. Confirma el pago por WhatsApp y los entregamos.</p><button class="btn" onclick="AG.closeModal()">Seguir viendo</button></div>'); });
    }
  });
  window.addEventListener('ag:plan', function () { render(); cu(); }); window.addEventListener('ag:store', function (e) { if (e.detail === 'products') render(); });
  render(); cu();
})();
