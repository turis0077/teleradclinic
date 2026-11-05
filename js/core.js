/* Agetel · motor compartido (nav, scroll, planes, contrato, utilidades). Requiere window.SITE */
(function () {
  var S = window.SITE, d = document, root = d.documentElement;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var rank = { basic: 0, plus: 1, pro: 2 };
  var A = window.AG = window.AG || {};

  /* ---------- utilidades ---------- */
  A.q = function (n) { return 'Q ' + Number(n).toLocaleString('es-GT', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }); };
  A.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };
  A.store = {
    get: function (k, def) { try { var v = localStorage.getItem(S.slug + ':' + k); return v ? JSON.parse(v) : def; } catch (e) { return def; } },
    set: function (k, v) { try { localStorage.setItem(S.slug + ':' + k, JSON.stringify(v)); } catch (e) {} window.dispatchEvent(new CustomEvent('ag:store', { detail: k })); }
  };
  A.uid = function (p) { return (p || 'id') + Math.random().toString(36).slice(2, 8).toUpperCase(); };
  A.toast = function (msg) {
    var t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(A._tt); A._tt = setTimeout(function () { t.classList.remove('on'); }, 2600);
  };
  A.wa = function (text) { return 'https://wa.me/' + S.contact.whatsapp + '?text=' + encodeURIComponent(text); };
  A.icon = function (n) { return (window.AG_ICONS || {})[n] || ''; };
  A.plan = function () { return localStorage.getItem(S.slug + ':plan') || 'pro'; };
  A.can = function (min) { return rank[A.plan()] >= rank[min]; };
  A.openModal = function (html, cls) {
    var m = $('#modal'); $('#modalCard').innerHTML = html; $('#modalCard').className = 'modal-card ' + (cls || '');
    m.classList.add('open'); d.body.style.overflow = 'hidden';
    var x = $('#modalCard .modal-x'); if (x) x.onclick = A.closeModal; var f = $('#modalCard [autofocus],#modalCard input,#modalCard button'); if (f) setTimeout(function () { f.focus(); }, 60);
  };
  A.confirm = function (title, text, yes, fn) {
    A.openModal('<div class="modal-b center" style="padding:34px 26px 10px"><div style="width:64px;height:64px;margin:0 auto 14px;border-radius:50%;background:rgba(229,72,77,.15);color:#ff7b80;display:grid;place-items:center;font-size:1.8rem;font-weight:900">!</div><h3 style="font-size:1.4rem">' + A.esc(title) + '</h3><p>' + A.esc(text) + '</p></div><div class="modal-f" style="justify-content:center"><button class="btn alt sm" id="cfNo">Volver</button><button class="btn sm" id="cfYes" style="background:#e5484d;color:#fff;box-shadow:none">' + A.esc(yes) + '</button></div>');
    $('#cfNo').onclick = A.closeModal; $('#cfYes').onclick = function () { A.busy(this, 'Un momento…', 500, function () { A.closeModal(); fn(); }); };
  };
  A.closeModal = function () { $('#modal').classList.remove('open'); d.body.style.overflow = ''; };
  A.today = function () { var n = new Date(); return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0'); };

  /* ---------- barra de progreso, nav, cortina ---------- */
  var bar = $('.progress'), nav = $('#nav'), lastY = 0;
  function onScroll() {
    var y = window.scrollY, h = root.scrollHeight - innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (h > 0 ? y / h : 0) + ')';
    if (nav) { nav.classList.toggle('hide', y > 500 && y > lastY + 4 && !nav.classList.contains('open')); if (y < lastY - 4) nav.classList.remove('hide'); }
    lastY = y; fx();
  }
  function fx() {
    var vh = innerHeight;
    $$('[data-pin]').forEach(function (el) {
      var r = el.getBoundingClientRect(), p = clamp(-r.top / (r.height - vh), 0, 1);
      el.style.setProperty('--p', p.toFixed(4));
      if (el.classList.contains('hero-story')) {
        var chaps = $$('.hs-chap', el), n = chaps.length, i = Math.min(n - 1, Math.floor(p * n * 0.999));
        chaps.forEach(function (c, k) { c.classList.toggle('on', k === i); });
        $$('.rail li', el).forEach(function (c, k) { c.classList.toggle('on', k === i); });
      }
    });
    $$('[data-sp]').forEach(function (el) {
      var r = el.getBoundingClientRect(); if (r.bottom < -200 || r.top > vh + 200) return;
      el.style.setProperty('--p', clamp((vh - r.top) / (vh + r.height), 0, 1).toFixed(4));
    });
    $$('[data-hp]').forEach(function (el) { var r = el.getBoundingClientRect(); el.style.setProperty('--p', clamp(-r.top / (r.height * .9), 0, 1).toFixed(4)); });
    $$('.words').forEach(function (el) {
      var r = el.getBoundingClientRect(), p = clamp((vh * .85 - r.top) / (vh * .55 + r.height * .3), 0, 1), ws = el.children, k = Math.round(p * ws.length);
      for (var i = 0; i < ws.length; i++) ws[i].classList.toggle('on', i < k);
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('resize', fx);

  var cur = d.createElement('div'); cur.className = 'curtain'; d.body.appendChild(cur);
    setTimeout(function () { if (!cur.classList.contains('out')) cur.style.display = 'none'; }, 1400);
  d.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]'); if (!a || a.target || e.metaKey || e.ctrlKey || e.shiftKey) return;
    var h = a.getAttribute('href'); if (!h || h[0] === '#' || /^(https?:|mailto:|tel:)/.test(h) || a.hasAttribute('download')) return;
    if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;
    e.preventDefault(); cur.style.display = ''; cur.classList.add('out'); setTimeout(function () { location.href = h; }, 420);
  });
  window.addEventListener('pageshow', function (e) { if (e.persisted) { cur.classList.remove('out'); cur.style.animation = 'none'; cur.style.visibility = 'hidden'; } });

  var burger = $('#burger');
  if (burger) burger.onclick = function () { var o = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', o); d.body.style.overflow = o ? 'hidden' : ''; };

  /* ---------- reveal ---------- */
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: .14, rootMargin: '0px 0px -6% 0px' });
  A.observe = function (scope) { $$('.rv:not(.in),.clip:not(.in)', scope).forEach(function (el) { io.observe(el); }); };
  A.observe();
  $$('.words').forEach(function (el) { el.innerHTML = el.textContent.trim().split(/\s+/).map(function (w) { return '<span>' + w + '</span> '; }).join(''); });
  /* contadores */
  var cio = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return; cio.unobserve(e.target);
      var el = e.target, to = parseFloat(el.dataset.count), pre = el.dataset.pre || '', suf = el.dataset.suf || '', t0 = performance.now();
      (function tick(t) { var k = clamp((t - t0) / 1600, 0, 1), v = to * (1 - Math.pow(1 - k, 4)); el.textContent = pre + Math.round(v).toLocaleString('es-GT') + suf; if (k < 1) requestAnimationFrame(tick); })(t0);
    });
  }, { threshold: .5});
  $$('[data-count]').forEach(function (el) { cio.observe(el); });
  /* parallax del ratón en hero split */
  var hs = $('.hero-split');
  if (hs) hs.addEventListener('pointermove', function (e) { var r = hs.getBoundingClientRect(); hs.style.setProperty('--mx', ((e.clientX - r.left) / r.width - .5).toFixed(3)); hs.style.setProperty('--my', ((e.clientY - r.top) / r.height - .5).toFixed(3)); });
  /* hero type: progreso con el scroll */
  $$('.hero-type').forEach(function (el) { el.setAttribute('data-hp', ''); });

  /* ---------- horarios: abierto ahora ---------- */
  A.openNow = function () {
    var h = S.contact.hoursRaw; if (!h) return null;
    var n = new Date(), day = n.getDay(), m = n.getHours() * 60 + n.getMinutes(), z = h[day]; if (!z) return false;
    for (var i = 0; i < z.length; i++) if (m >= z[i][0] && m < z[i][1]) return true; return false;
  };
  $$('[data-open]').forEach(function (el) {
    var o = A.openNow(); if (o === null) { el.remove(); return; }
    el.className = 'open-badge' + (o ? '' : ' off'); el.textContent = o ? 'Abierto ahora' : 'Cerrado ahora';
  });
  var days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  $$('.info-list [data-day]').forEach(function (li) { if (+li.dataset.day === new Date().getDay()) li.querySelector('span').classList.add('today'); });

  /* ---------- plan demo ---------- */
  function applyLocks() {
    var p = A.plan(); d.body.dataset.plan = p; var dl0 = $('.demo-bar .dl'); if (dl0) dl0.dataset.p = { basic: 'Esencial', plus: 'Plus', pro: 'Pro' }[p];
    $$('.demo-bar .seg button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.plan === p); });
    $$('.lock-wrap[data-min]').forEach(function (el) { el.classList.toggle('is-locked', !A.can(el.dataset.min)); });
    $$('[data-only]').forEach(function (el) { el.hidden = !A.can(el.dataset.only); });
  }
  function applyPlan() { applyLocks(); window.dispatchEvent(new CustomEvent('ag:plan', { detail: A.plan() })); }
  A.applyLocks = applyLocks; A.applyPlan = applyPlan;
  $$('.demo-bar .seg button').forEach(function (b) { b.onclick = function () { localStorage.setItem(S.slug + ':plan', b.dataset.plan); applyPlan(); A.toast('Vista del plan ' + S.plans[b.dataset.plan === 'basic' ? 0 : b.dataset.plan === 'plus' ? 1 : 2].name); }; });
  var dx = $('#demoX'); if (dx) dx.onclick = function () { $('.demo-bar').style.display = 'none'; };
  d.addEventListener('click', function (e) {
    var b = e.target.closest('.lock-badge span'); if (!b) return; var w = b.closest('.lock-wrap'); A.upsell(w.dataset.min, w.dataset.name);
  });
  A.upsell = function (min, what) {
    var pl = S.plans[rank[min]];
    A.openModal('<div class="modal-h"><h3>' + A.esc(what || 'Esta función') + ' está en el plan ' + pl.name + '</h3><button class="modal-x" aria-label="Cerrar">×</button></div><div class="modal-b"><p>Cambia la vista del plan abajo a la izquierda para verla en acción. Con <b>' + pl.name + '</b> (' + A.q(pl.price) + ') la activamos para ti.</p></div><div class="modal-f"><button class="btn alt sm" onclick="AG.closeModal()">Seguir viendo</button><a class="btn gold sm" href="tarifas.html">Ver tarifas</a></div>');
  };

  /* ---------- tarifas + contrato ---------- */
  function renderPlans() {
    var g = $('#planGrid'); if (!g) return;
    var ck = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>', xx = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    g.innerHTML = S.plans.map(function (p, i) {
      var best = i === 2, mid = i === 1;
      return '<article class="plan rv ' + (best ? 'best' : mid ? 'decoy' : '') + '" style="--i:' + i + '">' + (best ? '<span class="ribbon">★ Recomendado · el que más conviene</span>' : '') +
        '<h3>' + p.name + '</h3><p class="sub">' + p.blurb + '</p><div class="price">' + A.q(p.price) + ' <small>pago único</small></div><div class="mo">+ ' + A.q(p.monthly) + '/mes de mantenimiento</div>' +
        '<div class="save">' + (p.note || '') + '</div><ul>' + p.features.map(function (f) { return '<li' + (f[1] ? '' : ' class="no"') + '>' + (f[1] ? ck : xx) + '<span>' + f[0] + '</span></li>'; }).join('') + '</ul>' +
        '<button class="btn ' + (best ? 'gold' : 'alt') + '" data-pick="' + i + '">Elegir ' + p.name + '</button><p class="del">Entrega en ' + p.delivery + '</p></article>';
    }).join('');
    A.observe(g);
    var t = $('#cmpTbl');
    if (t) {
      t.innerHTML = '<thead><tr><th></th>' + S.plans.map(function (p, i) { return '<th' + (i === 2 ? ' class="hl"' : '') + '>' + p.name + '<br><small style="color:var(--mut);font-family:var(--fb)">' + A.q(p.price) + '</small></th>'; }).join('') + '</tr></thead><tbody>' +
        S.compare.map(function (r) { return '<tr><td>' + r[0] + '</td>' + [0, 1, 2].map(function (i) { var v = r[1][i]; return '<td' + (i === 2 ? ' class="hl"' : '') + '>' + (v === true ? '<span class="y">✓</span>' : v === false ? '<span class="n">—</span>' : v) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody>';
    }
    g.addEventListener('click', function (e) { var b = e.target.closest('[data-pick]'); if (b) startRequest(+b.dataset.pick); });
  }

  function contractHTML() {
    var C = S.contract;
    return '<p class="warn"><b>' + C.validity + '</b></p>' + C.sections.map(function (s) {
      return '<h4>' + s.h + '</h4>' + (s.p || []).map(function (x) { return '<p>' + x + '</p>'; }).join('') + (s.ul ? '<ul>' + s.ul.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' : '');
    }).join('') + '<p style="margin-top:26px"><b>Fin del documento.</b> Una copia completa y editable en Word acompaña esta propuesta.</p>';
  }
  A.showContract = function () {
    A.openModal('<div class="modal-h"><div><h3>Términos y Condiciones del Servicio</h3><p class="scroll-hint" style="margin:4px 0 0">' + S.name + ' · Agetel</p></div><button class="modal-x" aria-label="Cerrar">×</button></div><div class="modal-b">' + contractHTML() + '</div><div class="modal-f"><button class="btn sm" onclick="AG.closeModal()">Entendido</button></div>');
  };
  d.addEventListener('click', function (e) { if (e.target.closest('[data-contract]')) { e.preventDefault(); A.showContract(); } });

  var pickIdx = 0, form = {};
  function startRequest(i) {
    pickIdx = i; var p = S.plans[i];
    A.openModal('<div class="modal-h"><div><h3>Comencemos con el plan ' + p.name + '</h3><p class="scroll-hint" style="margin:4px 0 0">' + A.q(p.price) + ' + ' + A.q(p.monthly) + '/mes · Paso 1 de 2</p></div><button class="modal-x" aria-label="Cerrar">×</button></div>' +
      '<form id="reqForm" class="modal-b" novalidate><div class="row2"><div class="field"><label for="f1">Nombre completo</label><input id="f1" name="n" required autocomplete="name" value="' + A.esc(form.n || '') + '"><span class="err"></span></div><div class="field"><label for="f2">Teléfono / WhatsApp</label><input id="f2" name="t" type="tel" required autocomplete="tel" placeholder="+502 0000-0000" value="' + A.esc(form.t || '') + '"><span class="err"></span></div></div>' +
      '<div class="field"><label for="f3">Correo electrónico</label><input id="f3" name="e" type="email" required autocomplete="email" value="' + A.esc(form.e || '') + '"><span class="err"></span></div>' +
      '<div class="field"><label for="f4">¿Algo que debamos saber? (opcional)</label><textarea id="f4" name="m" rows="3">' + A.esc(form.m || '') + '</textarea></div><button class="btn" style="width:100%;justify-content:center">Continuar y leer los términos →</button></form>');
    $('#reqForm').onsubmit = function (ev) {
      ev.preventDefault(); var f = ev.target, ok = true;
      [['n', function (v) { return v.trim().length > 2; }, 'Escribe tu nombre'], ['t', function (v) { return v.replace(/\D/g, '').length >= 8; }, 'Teléfono de 8 dígitos o más'], ['e', function (v) { return /^\S+@\S+\.\S+$/.test(v); }, 'Correo no válido']].forEach(function (c) {
        var inp = f.elements[c[0]], good = c[1](inp.value); inp.setAttribute('aria-invalid', !good); inp.parentNode.querySelector('.err').textContent = good ? '' : c[2]; if (!good) ok = false; form[c[0]] = inp.value;
      });
      form.m = f.elements.m.value; if (ok) termsStep();
    };
  }
  function termsStep() {
    var p = S.plans[pickIdx];
    A.openModal('<div class="modal-h"><div><h3>Términos y Condiciones</h3><p class="scroll-hint" style="margin:4px 0 0">Paso 2 de 2 · desliza hasta el final para aceptar</p></div><button class="modal-x" aria-label="Cerrar">×</button></div><div class="modal-b" id="termsBody">' + contractHTML() + '</div>' +
      '<div class="modal-f" style="justify-content:space-between"><div style="display:flex;gap:12px;align-items:center;flex:1;min-width:150px"><div class="scroll-prog"><i id="tp"></i></div><span class="scroll-hint" id="th">Lee hasta el final</span></div></div>' +
      '<div class="modal-f"><label class="agree" style="margin:0;flex:1"><input type="checkbox" id="agree" disabled> <span>He leído y acepto los términos para el plan <b>' + p.name + '</b> (' + A.q(p.price) + ').</span></label><button class="btn alt sm" id="back">Atrás</button><button class="btn sm" id="send" disabled>Aceptar y enviar solicitud</button></div>');
    var tb = $('#termsBody'), ag = $('#agree'), sd = $('#send');
    tb.onscroll = function () { var k = tb.scrollTop / (tb.scrollHeight - tb.clientHeight || 1); $('#tp').style.width = Math.min(100, k * 100) + '%'; if (k > .97) { ag.disabled = false; $('#th').textContent = 'Listo: ya puedes aceptar'; } };
    ag.onchange = function () { sd.disabled = !ag.checked; };
    $('#back').onclick = function () { startRequest(pickIdx); };
    sd.onclick = function () { sd.disabled = true; sd.textContent = 'Enviando…'; send(p); };
  }
  function send(p) {
    var msg = 'Negocio: ' + S.name + '\nPlan: ' + p.name + ' (' + A.q(p.price) + ' + ' + A.q(p.monthly) + '/mes)\nTérminos aceptados: sí (' + new Date().toLocaleString('es-GT') + ')\n' + (form.m || 'Sin mensaje adicional.');
    var body = { service_id: 'service_nzjpll9', template_id: 'template_u09dz5p', user_id: 'YzWOzFQRTxZQM7mEv', template_params: { plan_seleccionado: S.name + ' · ' + p.name + ' (' + A.q(p.price) + ')', from_name: form.n, from_phone: form.t, from_email: form.e, message: msg, reply_to: form.e } };
    fetch('https://api.emailjs.com/api/v1.0/email/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { if (!r.ok) throw 0; return r; }).then(done).catch(function () { A.toast('No pudimos enviar la solicitud. Revisa tu conexión e inténtalo de nuevo.'); var s = document.getElementById('send'); if (s) { s.disabled = false; s.textContent = 'Aceptar y enviar solicitud'; } });
    function done() {
      A.openModal('<div class="modal-b center" style="padding:50px 30px"><div style="width:84px;height:84px;margin:0 auto 20px;border-radius:50%;background:var(--acc);display:grid;place-items:center;color:#14110c"><svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"><animate attributeName="stroke-dasharray" from="0 30" to="30 0" dur=".6s" fill="freeze"/></path></svg></div><h3>¡Solicitud enviada!</h3><p>Gracias, ' + A.esc((form.n || '').split(' ')[0]) + '. Recibimos tu elección del plan <b>' + p.name + '</b> para ' + A.esc(S.name) + '. Te contactaremos por WhatsApp para arrancar.</p><button class="btn" onclick="AG.closeModal()">Cerrar</button></div>');
    }
  }
  renderPlans();
  var st = S.plans && $('#planGrid');
  $$('#modal').forEach(function (m) { m.addEventListener('click', function (e) { if (e.target === m) A.closeModal(); }); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') { A.closeModal(); var dr = $('.drawer.open'); if (dr) A.closeDrawer(); } });

  /* ---------- drawers ---------- */
  A.openDrawer = function (id) { $('#' + id).classList.add('open'); $('#scrim').classList.add('on'); };
  A.closeDrawer = function () { $$('.drawer.open').forEach(function (x) { x.classList.remove('open'); }); $('#scrim').classList.remove('on'); };
  var sc = $('#scrim'); if (sc) sc.onclick = A.closeDrawer;

  /* ---------- WhatsApp simulado (demo): vista previa del mensaje + retroalimentación ---------- */
  var waSvg = '<svg viewBox="0 0 24 24" width="22" height="22" fill="#fff"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.2 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.9 2.2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.2 1.4 2.5 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l2 1c.3.1.5.2.5.3.1.2.1.8-.1 1.3z"/></svg>';
  A.busy = function (btn, label, ms, done) {
    if (!btn || btn.disabled) return; var old = btn.innerHTML; btn.disabled = true; btn.innerHTML = '<span class="spin"></span> ' + label;
    setTimeout(function () { btn.disabled = false; btn.innerHTML = old; if (done) done(); }, ms || 900);
  };
  A.sendWA = function (text, then) {
    A.openModal('<div class="modal-h"><div style="display:flex;gap:12px;align-items:center"><span class="wa-av">' + waSvg + '</span><div><h3 style="font-size:1.1rem;margin:0">' + A.esc(S.name) + '</h3><small style="color:var(--mut)">WhatsApp · en línea</small></div></div><button class="modal-x" aria-label="Cerrar">×</button></div><div class="modal-b wa-chat"><div class="bubble">' + A.esc(text).replace(/\n/g, '<br>') + '<small>ahora ✓✓</small></div></div><div class="modal-f"><button class="btn alt sm" id="waNo">Cancelar</button><button class="btn sm" id="waGo" style="background:#25d366;color:#06361a;box-shadow:none">Enviar mensaje</button></div>', 'wa');
    $('#waNo').onclick = A.closeModal;
    $('#waGo').onclick = function () { A.busy(this, 'Enviando…', 900, function () { A.closeModal(); A.toast('✓ Mensaje enviado a ' + S.name); if (then) then(); }); };
  };
  d.addEventListener('click', function (e) {
    var a = e.target.closest('a[href*="wa.me"]'); if (!a) return;
    e.preventDefault(); e.stopPropagation(); var m = a.href.match(/[?&]text=([^&]*)/), t = m ? decodeURIComponent(m[1]) : '';
    A.sendWA(t || 'Hola, quisiera más información, por favor.');
  }, true);
  /* ondas táctiles en botones */
  d.addEventListener('pointerdown', function (e) {
    var b = e.target.closest('.btn,.pill,.add,.mini,.fav,.btn-plans,.wa,.cart-fab'); if (!b || b.disabled) return;
    var r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) * 1.6, i = d.createElement('i'); i.className = 'ripple';
    i.style.cssText = 'width:' + s + 'px;height:' + s + 'px;left:' + (e.clientX - r.left - s / 2) + 'px;top:' + (e.clientY - r.top - s / 2) + 'px';
    if (getComputedStyle(b).position === 'static') b.style.position = 'relative'; b.style.overflow = 'hidden'; b.appendChild(i); setTimeout(function () { i.remove(); }, 650);
  });
  /* barra de plan compacta en móvil */
  var db = $('.demo-bar'); if (db) { if (innerWidth < 760) db.classList.add('min'); var dl = $('.dl', db); dl.onclick = function () { db.classList.toggle('min'); }; }
  applyPlan(); onScroll();
})();
