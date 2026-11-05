/* Carta interactiva + pre-orden (restaurantes y cafés) */
(function () {
  var S = window.SITE, A = window.AG, d = document, $ = function (s, c) { return (c || d).querySelector(s); }, $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var mount = $('#menuMount'); if (!mount) return;
  var menu = A.store.get('menu', S.menu), favs = A.store.get('favs', []), cart = A.store.get('cart', []), q = '', tag = '';
  var heart = '♥';
  function items() { return menu.reduce(function (a, c) { return a.concat(c.items.map(function (i) { i.cat = c.id; return i; })); }, []); }
  function find(id) { return items().filter(function (i) { return i.id === id; })[0]; }
  function itemHTML(i, n) {
    var th = i.img ? '<img src="' + i.img + '" alt="" loading="lazy">' : (window.AG_ART[i.art || S.defaultArt] || '');
    var off = i.available === false;
    return '<article class="m-item rv' + (off ? ' soldout' : '') + '" style="--i:' + (n % 4) + ';--c1:' + (i.c1 || 'var(--pri)') + ';--c2:' + (i.c2 || 'var(--acc2)') + '"><div class="th">' + th + '</div><div><h4>' + A.esc(i.name) + '</h4><p>' + A.esc(i.desc || '') + '</p><div>' +
      (i.tags || []).map(function (t) { return '<span class="tag' + (t === 'Favorito' || t === 'Picante' ? ' hot' : '') + '">' + A.esc(t) + '</span>'; }).join('') + (off ? '<span class="tag">Agotado hoy</span>' : '') + '</div></div>' +
      '<div class="act"><span class="pr">' + A.q(i.price) + '</span>' + (A.can('plus') ? '<button class="fav" data-fav="' + i.id + '" aria-pressed="' + (favs.indexOf(i.id) > -1) + '" aria-label="Favorito">' + heart + '</button>' : '') + (A.can('pro') ? '<button class="add" data-add="' + i.id + '" aria-label="Agregar ' + A.esc(i.name) + '">+</button>' : '') + '</div></article>';
  }
  function render() {
    var allTags = {}; items().forEach(function (i) { (i.tags || []).forEach(function (t) { allTags[t] = 1; }); });
    var cats = menu.map(function (c) {
      var its = c.items.filter(function (i) { return (!q || (i.name + ' ' + (i.desc || '')).toLowerCase().indexOf(q) > -1) && (!tag || (tag === '♥' ? favs.indexOf(i.id) > -1 : (i.tags || []).indexOf(tag) > -1)); });
      return its.length ? '<section class="m-cat" id="c-' + c.id + '" data-cat="' + c.id + '"><header' + (c.img ? ' class="has-img"' : '') + '><div><h2>' + A.esc(c.name) + '</h2>' + (c.desc ? '<p>' + A.esc(c.desc) + '</p>' : '') + '</div>' + (c.img ? '<div class="cimg"><img src="' + c.img + '" alt="" loading="lazy"></div>' : '') + '</header><div class="m-items">' + its.map(itemHTML).join('') + '</div></section>' : '';
    }).join('') || '<div class="empty">No encontramos nada con ese filtro. 🙈<br><button class="link" id="clr">Limpiar búsqueda</button></div>';
    mount.innerHTML = '<div class="menu-layout"><nav class="menu-rail" aria-label="Categorías">' + menu.map(function (c) { return '<a href="#c-' + c.id + '" data-r="' + c.id + '">' + A.esc(c.name) + '</a>'; }).join('') + '</nav><div>' +
      '<div class="lock-wrap" data-min="plus" data-name="Buscador, filtros y favoritos"><div class="lock-badge"><span>🔒 Buscador y favoritos · Plan Plus</span></div><div class="lock-body menu-tools"><input type="search" id="mq" placeholder="Buscar en la carta…" value="' + A.esc(q) + '" aria-label="Buscar"><button class="pill" data-tag="" aria-pressed="' + (!tag) + '">Todo</button>' +
      '<button class="pill" data-tag="♥" aria-pressed="' + (tag === '♥') + '">♥ Mis favoritos (' + favs.length + ')</button>' + Object.keys(allTags).slice(0, 5).map(function (t) { return '<button class="pill" data-tag="' + A.esc(t) + '" aria-pressed="' + (tag === t) + '">' + A.esc(t) + '</button>'; }).join('') + '</div></div>' + cats + '</div></div>';
    A.observe(mount); A.applyLocks(); spy();
    var mqI = $('#mq'); if (mqI) { mqI.oninput = function () { q = mqI.value.toLowerCase(); var pos = mqI.selectionStart; render(); var n = $('#mq'); n.focus(); n.setSelectionRange(pos, pos); }; }
    var c = $('#clr'); if (c) c.onclick = function () { q = ''; tag = ''; render(); };
  }
  function spy() {
    var secs = $$('.m-cat'), links = $$('.menu-rail a');
    if (!secs.length) return;
    var o = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) links.forEach(function (l) { l.classList.toggle('on', l.dataset.r === e.target.dataset.cat); }); }); }, { rootMargin: '-30% 0px -60% 0px' });
    secs.forEach(function (s) { o.observe(s); });
  }
  mount.addEventListener('click', function (e) {
    var f = e.target.closest('[data-fav]'), a = e.target.closest('[data-add]'), t = e.target.closest('[data-tag]');
    if (f) { var id = f.dataset.fav, k = favs.indexOf(id); k > -1 ? favs.splice(k, 1) : favs.push(id); A.store.set('favs', favs); f.setAttribute('aria-pressed', k < 0); A.toast(k < 0 ? 'Guardado en favoritos ♥' : 'Quitado de favoritos'); $$('[data-tag="♥"]').forEach(function (b) { b.textContent = '♥ Mis favoritos (' + favs.length + ')'; }); }
    if (a) { add(a.dataset.add); a.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }], 300); }
    if (t) { tag = t.dataset.tag; render(); }
  });
  window.addEventListener('ag:plan', function () { render(); cartUI(); });

  /* ----- carrito / pre-orden ----- */
  var fab = $('#cartFab'), drawer = $('#cartDrawer');
  function add(id) { var l = cart.filter(function (x) { return x.id === id; })[0]; l ? l.n++ : cart.push({ id: id, n: 1 }); save(); A.toast('Agregado a tu pedido'); }
  function save() { A.store.set('cart', cart); cartUI(); }
  function total() { return cart.reduce(function (s, l) { var i = find(l.id); return s + (i ? i.price * l.n : 0); }, 0); }
  function cartUI() {
    var n = cart.reduce(function (s, l) { return s + l.n; }, 0);
    if (fab) { fab.hidden = !A.can('pro') || !n; fab.querySelector('b').textContent = n; fab.querySelector('em').textContent = A.q(total()); }
    if (!drawer) return;
    var body = $('.drawer-b', drawer);
    body.innerHTML = cart.length ? cart.map(function (l) { var i = find(l.id); if (!i) return ''; return '<div class="line-item"><div><b>' + A.esc(i.name) + '</b><br><small style="color:var(--mut)">' + A.q(i.price) + ' c/u</small></div><b>' + A.q(i.price * l.n) + '</b><div class="qty"><button data-m="' + l.id + '" aria-label="Menos">−</button><b>' + l.n + '</b><button data-p="' + l.id + '" aria-label="Más">+</button></div><button class="link" data-rm="' + l.id + '" style="justify-self:end">Quitar</button></div>'; }).join('') +
      '<form id="ckForm" style="margin-top:20px" novalidate><div class="row2"><div class="field"><label for="ck1">Tu nombre</label><input id="ck1" name="n" required autocomplete="name"></div><div class="field"><label for="ck2">WhatsApp</label><input id="ck2" name="t" type="tel" required autocomplete="tel"></div></div><div class="field"><label for="ck3">¿Cómo lo quieres?</label><select id="ck3" name="m"><option>Recoger en el local</option><option>Comer en el local</option><option>A domicilio</option></select></div><div class="field"><label for="ck4">Notas (sin cebolla, alergias…)</label><textarea id="ck4" name="o" rows="2"></textarea></div></form>' : '<div class="empty">Tu pedido está vacío.<br>Agrega algo rico de la carta 😋</div>';
    $('.drawer-f', drawer).innerHTML = cart.length ? '<div style="display:flex;justify-content:space-between;font-size:1.2rem;margin-bottom:12px"><b>Total</b><b style="color:var(--acc)">' + A.q(total()) + '</b></div><button class="btn" id="sendOrder" style="width:100%;justify-content:center">Enviar pedido por WhatsApp</button><p style="font-size:.78rem;text-align:center;margin:10px 0 0">El pedido también queda registrado en el panel del negocio.</p>' : '';
  }
  if (fab) fab.onclick = function () { cartUI(); A.openDrawer('cartDrawer'); };
  if (drawer) {
    drawer.addEventListener('click', function (e) {
      var m = e.target.dataset.m, p = e.target.dataset.p, r = e.target.dataset.rm;
      var l = function (id) { return cart.filter(function (x) { return x.id === id; })[0]; };
      if (m) { var a = l(m); a.n--; if (a.n < 1) cart.splice(cart.indexOf(a), 1); save(); }
      if (p) { l(p).n++; save(); }
      if (r) { cart.splice(cart.indexOf(l(r)), 1); save(); }
      if (e.target.id === 'sendOrder') {
        var f = $('#ckForm'), nm = f.n.value.trim(), tl = f.t.value.replace(/\D/g, '');
        if (nm.length < 2 || tl.length < 8) { A.toast('Escribe tu nombre y un WhatsApp válido'); (nm.length < 2 ? f.n : f.t).focus(); return; }
        var lines = cart.map(function (x) { var i = find(x.id); return '• ' + x.n + ' × ' + i.name + ' — ' + A.q(i.price * x.n); }).join('\n');
        var ord = { id: A.uid('P'), at: new Date().toISOString(), name: nm, phone: f.t.value, mode: f.m.value, note: f.o.value, total: total(), status: 'nuevo', lines: cart.map(function (x) { var i = find(x.id); return { name: i.name, n: x.n, price: i.price }; }) };
        var os = A.store.get('orders', []); os.unshift(ord); A.store.set('orders', os);
        var txt = 'Hola ' + S.name + ', quiero hacer un pedido:\n' + lines + '\nTotal: ' + A.q(total()) + '\nModalidad: ' + f.m.value + (f.o.value ? '\nNotas: ' + f.o.value : '') + '\nNombre: ' + nm + '\nPedido ' + ord.id;
        A.sendWA(txt, function () { cart = []; save(); A.closeDrawer(); A.openModal('<div class="modal-b center" style="padding:44px 26px"><div style="width:84px;height:84px;margin:0 auto 18px;border-radius:50%;background:var(--acc);color:#14110c;display:grid;place-items:center;animation:pop .7s var(--ease)"><svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div><h3>¡Pedido ' + ord.id + ' enviado!</h3><p>Lo recibimos en el panel y en WhatsApp. En unos minutos te confirmamos.</p><button class="btn" onclick="AG.closeModal()">Genial</button></div>'); });
      }
    });
    $('.drawer-h button', drawer).onclick = A.closeDrawer;
  }
  window.addEventListener('ag:store', function (e) { if (e.detail === 'menu') { menu = A.store.get('menu', S.menu); render(); } });
  render(); cartUI();
})();
