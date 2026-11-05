/* Armazón del panel administrativo (login demo, pestañas, utilidades) */
(function () {
  var S = window.SITE, A = window.AG, d = document, $ = function (s, c) { return (c || d).querySelector(s); };
  var AD = window.AGADMIN = {};
  AD.kpi = function (l, v, e) { return '<div class="kpi"><small>' + l + '</small><b>' + v + '</b>' + (e ? '<em>' + e + '</em>' : '') + '</div>'; };
  AD.bars = function (data) { var mx = Math.max.apply(null, data.map(function (x) { return x[1]; }).concat([1])); return '<div class="bars">' + data.map(function (x) { return '<div><span>' + (x[1] ? (x[2] || x[1]) : '') + '</span><i style="height:' + Math.max(3, x[1] / mx * 100) + '%"></i>' + x[0] + '</div>'; }).join('') + '</div>'; };
  AD.status = function (s) { var m = { nuevo: 'st-pend', pendiente: 'st-pend', confirmada: 'st-ok', confirmado: 'st-ok', listo: 'st-ok', completada: 'st-done', entregado: 'st-done', pagada: 'st-done', cancelada: 'st-no', cancelado: 'st-no' }; return '<span class="status ' + (m[s] || 'st-pend') + '">' + s + '</span>'; };
  AD.csv = function (name, rows) {
    var out = rows.map(function (r) { return r.map(function (c) { return '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
    var a = d.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + out], { type: 'text/csv' })); a.download = name; a.click(); A.toast('✓ Archivo descargado: ' + name);
  };
  AD.upsell = function (min, what, text) { var pl = S.plans[min === 'plus' ? 1 : 2]; return '<div class="upsell"><h3>' + what + '</h3><p>' + (text || 'Esta herramienta está incluida desde el plan ' + pl.name + '.') + '</p><p>Usa el selector “Vista del plan” (abajo a la izquierda) para verla funcionando.</p><a class="btn gold" href="tarifas.html">Ver planes</a></div>'; };

  AD.start = function (cfg) {
    var body = d.body;
    function login() {
      body.innerHTML = '<div class="login"><div class="card center"><div style="width:64px;height:64px;margin:0 auto 14px;border-radius:18px;background:var(--pri);display:grid;place-items:center" data-ico="lock"></div><h3>Panel de ' + A.esc(S.name) + '</h3><p>Demostración del panel administrativo.<br>PIN de demo: <b>1234</b></p><form id="lf"><div class="field"><input id="pin" type="password" inputmode="numeric" placeholder="PIN" aria-label="PIN" autocomplete="off"><span class="err" id="lerr"></span></div><button class="btn" style="width:100%;justify-content:center">Entrar</button></form><p style="margin-top:14px"><button class="link" id="demo">Entrar como demo sin PIN</button></p><p><a class="link" href="index.html">← Volver al sitio</a></p></div></div>';
      d.querySelectorAll('[data-ico]').forEach(function (el) { el.innerHTML = window.AG_ICONS[el.dataset.ico] || ''; el.style.color = '#fff'; el.firstChild && (el.firstChild.style.width = '30px'); });
      $('#lf').onsubmit = function (e) { e.preventDefault(); if ($('#pin').value === '1234') { sessionStorage.setItem(S.slug + ':adm', 1); app(); } else { $('#lerr').textContent = 'PIN incorrecto (en la demo es 1234)'; } };
      $('#demo').onclick = function () { sessionStorage.setItem(S.slug + ':adm', 1); app(); };
    }
    function app() {
      var tabs = cfg.tabs, cur = location.hash.slice(1) || tabs[0].id;
      body.innerHTML = '<div class="adm"><aside class="adm-side"><div class="brand"><span style="color:var(--acc)">●</span> ' + A.esc(S.short || S.name) + '</div>' + tabs.map(function (t) { return '<button class="tab" data-t="' + t.id + '">' + (t.ico ? '<span style="width:20px;height:20px;display:block">' + (window.AG_ICONS[t.ico] || '') + '</span>' : '') + t.label + (t.min ? ' <small style="opacity:.6">· ' + (t.min === 'plus' ? 'Plus' : 'Pro') + '</small>' : '') + '</button>'; }).join('') +
        '<div class="sub">Vista del plan:<div class="demo-bar" style="position:static;margin-top:8px;background:#000"><div class="seg"><button data-plan="basic">Esencial</button><button data-plan="plus">Plus</button><button data-plan="pro">Pro</button></div></div><p style="margin-top:20px"><a class="link" href="index.html">← Ver el sitio</a><br><button class="link" id="out" style="margin-top:8px">Salir</button></p></div></aside><main class="adm-main" id="admMain"></main></div>' +
        '<div class="modal" id="modal"><div class="modal-card" id="modalCard"></div></div><div class="toast" id="toast"></div>';
      var m = $('#modal'); m.onclick = function (e) { if (e.target === m) A.closeModal(); };
      d.querySelectorAll('.demo-bar .seg button').forEach(function (b) { b.onclick = function () { localStorage.setItem(S.slug + ':plan', b.dataset.plan); show(cur); }; });
      d.querySelectorAll('[data-t]').forEach(function (b) { b.onclick = function () { cur = b.dataset.t; try { history.replaceState(null, '', '#' + cur); } catch (e) {} show(cur); }; });
      $('#out').onclick = function () { sessionStorage.removeItem(S.slug + ':adm'); login(); };
      function show(id) {
        var t = tabs.filter(function (x) { return x.id === id; })[0] || tabs[0], p = A.plan();
        d.querySelectorAll('[data-t]').forEach(function (b) { b.classList.toggle('on', b.dataset.t === t.id); });
        d.querySelectorAll('.demo-bar .seg button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.plan === p); });
        var el = $('#admMain'); el.innerHTML = '<div class="adm-top"><h1>' + t.label + '</h1><span class="status st-ok">Demo · plan ' + p + '</span></div><div id="admBody"></div>';
        var bd = $('#admBody');
        if (t.min && !A.can(t.min)) bd.innerHTML = AD.upsell(t.min, t.label, t.upsell); else t.render(bd);
      }
      AD.refresh = function () { show(cur); };
      show(cur);
    }
    if (sessionStorage.getItem(S.slug + ':adm')) app(); else login();
  };
})();
