(function () {
  var S = window.SITE, A = window.AG, AD = window.AGADMIN;
  function menu() { return A.store.get('menu', S.menu); }
  function orders() { return A.store.get('orders', seedOrders()); }
  function seedOrders() {
    var its = []; menu().forEach(function (c) { c.items.forEach(function (i) { its.push(i); }); });
    var names = ['Andrea M.', 'José P.', 'Lucía R.', 'Marco T.', 'Sofía L.', 'Diego C.', 'Carla V.'], st = ['entregado', 'entregado', 'listo', 'nuevo', 'entregado', 'nuevo', 'entregado'], out = [];
    for (var k = 0; k < 14; k++) { var a = its[(k * 3) % its.length], b = its[(k * 5 + 1) % its.length], t = a.price + b.price * 2; var dt = new Date(Date.now() - k * 86400000 * .6); out.push({ id: 'P' + (1040 + k), at: dt.toISOString(), name: names[k % 7], phone: '5' + (4000000 + k * 13713).toString().slice(0, 7), mode: ['Recoger en el local', 'A domicilio', 'Comer en el local'][k % 3], note: '', total: t, status: st[k % 7], lines: [{ name: a.name, n: 1, price: a.price }, { name: b.name, n: 2, price: b.price }] }); }
    return out;
  }
  function overview(el) {
    var os = orders(), today = os.filter(function (o) { return o.at.slice(0, 10) === A.today(); }), sum = function (a) { return a.reduce(function (s, o) { return s + o.total; }, 0); };
    var days = []; for (var i = 6; i >= 0; i--) { var dd = new Date(Date.now() - i * 86400000), k = dd.toISOString().slice(0, 10), v = os.filter(function (o) { return o.at.slice(0, 10) === k; }); days.push([['D', 'L', 'M', 'M', 'J', 'V', 'S'][dd.getDay()], sum(v), A.q(sum(v))]); }
    var cnt = {}; os.forEach(function (o) { o.lines.forEach(function (l) { cnt[l.name] = (cnt[l.name] || 0) + l.n; }); });
    var top = Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; }).slice(0, 5);
    el.innerHTML = '<div class="kpis">' + AD.kpi('Pedidos hoy', today.length, '+ en vivo') + AD.kpi('Ventas hoy', A.q(sum(today))) + AD.kpi('Ventas 7 días', A.q(days.reduce(function (s, x) { return s + x[1]; }, 0))) + AD.kpi('Ticket promedio', A.q(os.length ? Math.round(sum(os) / os.length) : 0)) + '</div>' +
      '<div class="panel"><h3>Ventas de la última semana</h3>' + AD.bars(days) + '</div><div class="panel"><h3>Lo más pedido</h3>' + (top.length ? '<ol>' + top.map(function (t) { return '<li>' + A.esc(t) + ' <b style="color:var(--acc)">× ' + cnt[t] + '</b></li>'; }).join('') + '</ol>' : 'Aún no hay pedidos.') + '</div>';
  }
  function ordersTab(el) {
    var os = orders(); A.store.set('orders', os);
    el.innerHTML = '<div class="panel"><div class="tbl-scroll"><table class="tbl"><thead><tr><th>Pedido</th><th>Cliente</th><th>Detalle</th><th>Modalidad</th><th>Total</th><th>Estado</th></tr></thead><tbody>' + os.map(function (o, i) {
      return '<tr><td><b>' + o.id + '</b><br><small style="color:#8e95a8">' + new Date(o.at).toLocaleString('es-GT', { dateStyle: 'short', timeStyle: 'short' }) + '</small></td><td>' + A.esc(o.name) + '<br><small style="color:#8e95a8">' + A.esc(o.phone) + '</small></td><td>' + o.lines.map(function (l) { return l.n + '× ' + A.esc(l.name); }).join('<br>') + '</td><td>' + A.esc(o.mode) + '</td><td>' + A.q(o.total) + '</td><td><select data-o="' + i + '" aria-label="Estado" style="background:#0c0d10;color:#fff;border:1px solid #333;border-radius:10px;padding:8px">' + ['nuevo', 'listo', 'entregado', 'cancelado'].map(function (s) { return '<option' + (o.status === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></td></tr>';
    }).join('') + '</tbody></table></div><p style="margin-top:14px"><button class="mini" id="exp">Exportar a CSV</button></p></div>';
    el.onchange = function (e) { var i = e.target.dataset.o; if (i != null) { os[i].status = e.target.value; A.store.set('orders', os); A.toast('Estado actualizado'); } };
    document.getElementById('exp').onclick = function () { AD.csv('pedidos-' + S.slug + '.csv', [['Pedido', 'Fecha', 'Cliente', 'Teléfono', 'Modalidad', 'Total', 'Estado']].concat(os.map(function (o) { return [o.id, o.at, o.name, o.phone, o.mode, o.total, o.status]; }))); };
  }
  function menuTab(el) {
    var m = menu();
    el.innerHTML = '<p>Cambia precios y disponibilidad en segundos: el sitio público se actualiza al instante (abre la carta en otra pestaña).</p><p><button class="btn sm" id="addI">+ Nuevo platillo</button> <button class="btn alt sm" id="addC">+ Nueva categoría</button> <button class="mini" id="reset">Restaurar carta original</button></p>' +
      m.map(function (c, ci) { return '<div class="panel"><h3>' + A.esc(c.name) + '</h3><div class="tbl-scroll"><table class="tbl"><tbody>' + c.items.map(function (i, ii) { return '<tr><td style="width:46%"><b>' + A.esc(i.name) + '</b><br><small style="color:#8e95a8">' + A.esc((i.desc || '').slice(0, 70)) + '</small></td><td><input type="number" min="0" step="1" value="' + i.price + '" data-p="' + ci + ',' + ii + '" aria-label="Precio" style="width:90px;background:#0c0d10;border:1px solid #333;color:#fff;border-radius:10px;padding:8px"></td><td><label><input type="checkbox" data-a="' + ci + ',' + ii + '"' + (i.available === false ? '' : ' checked') + '> Disponible</label></td><td><button class="mini" data-e="' + ci + ',' + ii + '">Editar</button> <button class="mini danger" data-x="' + ci + ',' + ii + '">Borrar</button></td></tr>'; }).join('') + '</tbody></table></div></div>'; }).join('');
    el.onchange = function (e) {
      var p = e.target.dataset.p, a = e.target.dataset.a;
      if (p) { var k = p.split(','); m[k[0]].items[k[1]].price = +e.target.value; A.store.set('menu', m); A.toast('Precio guardado'); }
      if (a) { var k2 = a.split(','); m[k2[0]].items[k2[1]].available = e.target.checked; A.store.set('menu', m); A.toast(e.target.checked ? 'Marcado disponible' : 'Marcado agotado'); }
    };
    el.onclick = function (e) {
      var x = e.target.dataset.x, ed = e.target.dataset.e;
      if (x) { var k = x.split(','); A.confirm('¿Borrar "' + m[k[0]].items[k[1]].name + '"?', 'Se quitará de la carta pública.', 'Sí, borrar', function () { m[k[0]].items.splice(k[1], 1); A.store.set('menu', m); AD.refresh(); A.toast('Platillo eliminado'); }); }
      if (ed) form(ed.split(',').map(Number));
      if (e.target.id === 'addI') form(null);
      if (e.target.id === 'reset') { A.store.set('menu', S.menu); AD.refresh(); A.toast('Carta restaurada'); }
      if (e.target.id === 'addC') { A.openModal('<div class="modal-h"><h3>Nueva categoría</h3><button class="modal-x">×</button></div><form class="modal-b" id="catf"><div class="field"><label>Nombre</label><input name="n" required autofocus></div><button class="btn">Crear categoría</button></form>'); document.getElementById('catf').onsubmit = function (ev) { ev.preventDefault(); var n = ev.target.n.value.trim(); if (!n) return; m.push({ id: 'c' + Date.now(), name: n, items: [] }); A.store.set('menu', m); A.closeModal(); AD.refresh(); A.toast('Categoría creada'); }; }
    };
    function form(pos) {
      var it = pos ? m[pos[0]].items[pos[1]] : { name: '', desc: '', price: '', tags: [] };
      A.openModal('<div class="modal-h"><h3>' + (pos ? 'Editar' : 'Nuevo') + ' platillo</h3><button class="modal-x">×</button></div><form class="modal-b" id="itf"><div class="adm-form"><div class="field wide"><label>Nombre</label><input name="name" required value="' + A.esc(it.name) + '"></div><div class="field wide"><label>Descripción</label><textarea name="desc" rows="2">' + A.esc(it.desc) + '</textarea></div><div class="field"><label>Precio (Q)</label><input name="price" type="number" min="0" required value="' + it.price + '"></div><div class="field"><label>Etiquetas (coma)</label><input name="tags" value="' + A.esc((it.tags || []).join(', ')) + '"></div>' + (pos ? '' : '<div class="field wide"><label>Categoría</label><select name="cat">' + m.map(function (c, i) { return '<option value="' + i + '">' + A.esc(c.name) + '</option>'; }).join('') + '</select></div>') + '</div><p style="margin-top:16px"><button class="btn">Guardar</button></p></form>');
      document.getElementById('itf').onsubmit = function (ev) {
        ev.preventDefault(); var f = ev.target, o = { name: f.name.value, desc: f.desc.value, price: +f.price.value, tags: f.tags.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean) };
        if (pos) Object.assign(it, o); else { o.id = A.uid('i'); m[+f.cat.value].items.push(o); }
        A.store.set('menu', m); A.closeModal(); AD.refresh(); A.toast('Guardado');
      };
    }
  }
  function settings(el) {
    var cfg = A.store.get('promo', { on: true, text: S.promo || '' });
    el.innerHTML = '<div class="panel"><h3>Aviso / promoción del día</h3><p>Aparece como cinta en la portada del sitio.</p><div class="adm-form"><div class="field wide"><label>Texto</label><input id="pt" value="' + A.esc(cfg.text) + '"></div><label><input type="checkbox" id="po"' + (cfg.on ? ' checked' : '') + '> Mostrar aviso</label></div><p><button class="btn sm" id="ps">Guardar</button></p></div>' +
      '<div class="panel"><h3>Datos del negocio</h3><p>Horario: ' + A.esc(S.contact.hours.map(function (h) { return h[0] + ' ' + h[1]; }).join(' · ')) + '<br>WhatsApp: +' + S.contact.whatsapp + '<br>Dirección: ' + A.esc(S.contact.address) + '</p></div>';
    document.getElementById('ps').onclick = function () { A.store.set('promo', { on: document.getElementById('po').checked, text: document.getElementById('pt').value }); A.toast('Aviso actualizado'); };
  }
  AD.start({ tabs: [
    { id: 'resumen', label: 'Resumen', ico: 'chart', min: 'plus', render: overview, upsell: 'El plan Esencial no incluye panel. Con Plus controlas tu carta; con Pro, además, pedidos y analíticas.' },
    { id: 'menu', label: 'Carta y precios', ico: 'bag', min: 'plus', render: menuTab },
    { id: 'pedidos', label: 'Pedidos', ico: 'bell', min: 'pro', render: ordersTab, upsell: 'Recibe pedidos desde la carta, cambia su estado y exporta todo. Disponible en el plan Pro.' },
    { id: 'ajustes', label: 'Avisos y datos', ico: 'star', min: 'plus', render: settings }
  ] });
})();
