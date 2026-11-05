(function () {
  var S = window.SITE, A = window.AG, AD = window.AGADMIN, G = A.shop;
  var inp = 'background:#0c0d10;color:#fff;border:1px solid #333;border-radius:10px;padding:8px';
  function sumSales(a) { return a.filter(function (s) { return s.status !== 'anulada'; }).reduce(function (t, s) { return t + s.total; }, 0); }
  function profit(a) { return a.filter(function (s) { return s.status !== 'anulada'; }).reduce(function (t, s) { return t + s.lines.reduce(function (u, l) { return u + (l.price - (l.cost || 0)) * l.n; }, 0) - (s.discount || 0); }, 0); }

  function overview(el) {
    var sl = G.sales(), t = A.today(), today = sl.filter(function (s) { return s.at.slice(0, 10) === t; }), low = G.lowStock(), pr = G.products();
    var days = []; for (var i = 6; i >= 0; i--) { var dd = new Date(Date.now() - i * 86400000), k = dd.toISOString().slice(0, 10), v = sl.filter(function (s) { return s.at.slice(0, 10) === k; }); days.push([['D', 'L', 'M', 'M', 'J', 'V', 'S'][dd.getDay()], sumSales(v), A.q(sumSales(v))]); }
    var web = sl.filter(function (s) { return s.status === 'pendiente'; });
    el.innerHTML = '<div class="kpis">' + AD.kpi('Ventas hoy', A.q(sumSales(today)), today.length + ' ventas') + AD.kpi('Productos', pr.length, pr.reduce(function (s, p) { return s + p.stock; }, 0) + ' unidades') + AD.kpi('Valor del inventario', A.q(pr.reduce(function (s, p) { return s + p.stock * (p.cost || 0); }, 0)), 'a costo') + AD.kpi('Stock bajo', low.length, low.length ? '¡Reponer!' : 'Todo bien') + AD.kpi('Órdenes web pendientes', web.length) + '</div>' +
      '<div class="panel"><h3>Ventas, últimos 7 días</h3>' + AD.bars(days) + '</div>' +
      '<div class="panel"><h3>⚠ Alertas de reposición</h3>' + (low.length ? '<div class="tbl-scroll"><table class="tbl"><tbody>' + low.map(function (p) { return '<tr><td><b>' + A.esc(p.name) + '</b></td><td>' + p.platform + '</td><td><span class="status st-no">' + p.stock + ' u.</span></td></tr>'; }).join('') + '</tbody></table></div>' : '<p>Sin alertas.</p>') + '</div>';
  }

  function pos(el) {
    var cart = [], pay = 'Efectivo', disc = 0, recv = 0;
    function find(q) { q = q.toLowerCase(); return G.products().filter(function (p) { return p.sku.toLowerCase() === q || p.name.toLowerCase().indexOf(q) > -1; }); }
    function tot() { return Math.max(0, cart.reduce(function (s, l) { return s + l.price * l.n; }, 0) - disc); }
    function draw(res) {
      el.innerHTML = '<div style="display:grid;grid-template-columns:1.2fr 1fr;gap:22px" class="posg"><div class="panel"><h3>Buscar producto o escanear código</h3><div class="field"><input id="pq" autofocus placeholder="SKU, código de barras o nombre…" autocomplete="off"></div><div id="pr">' + (res && res.length ? res.slice(0, 8).map(function (p) { return '<div class="line-item"><div><b>' + A.esc(p.name) + '</b><br><small style="color:#8e95a8">' + p.sku + ' · ' + p.platform + ' · stock ' + p.stock + '</small></div><button class="mini" data-a="' + p.id + '" ' + (p.stock <= 0 ? 'disabled' : '') + '>' + A.q(p.price) + ' +</button></div>'; }).join('') : '<p style="color:#8e95a8">Escribe y presiona Enter: si el SKU coincide exacto, se agrega solo.</p>') + '</div></div>' +
        '<div class="panel"><h3>Venta actual</h3>' + (cart.length ? cart.map(function (l, i) { return '<div class="line-item"><div><b>' + A.esc(l.name) + '</b><br><small style="color:#8e95a8">' + A.q(l.price) + '</small></div><b>' + A.q(l.price * l.n) + '</b><div class="qty"><button data-m="' + i + '">−</button><b>' + l.n + '</b><button data-p="' + i + '">+</button></div></div>'; }).join('') : '<p style="color:#8e95a8">Aún no hay productos.</p>') +
        '<div class="adm-form" style="margin-top:14px"><div class="field"><label>Descuento (Q)</label><input id="pd" type="number" min="0" value="' + disc + '"></div><div class="field"><label>Pago</label><select id="pp">' + ['Efectivo', 'Tarjeta', 'Transferencia'].map(function (x) { return '<option' + (pay === x ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></div>' + (pay === 'Efectivo' ? '<div class="field"><label>Recibido (Q)</label><input id="pv" type="number" min="0" value="' + (recv || '') + '"></div>' : '') + '</div>' +
        '<div style="display:flex;justify-content:space-between;font-size:1.5rem;margin:14px 0"><b>Total</b><b style="color:var(--acc)">' + A.q(tot()) + '</b></div>' + (pay === 'Efectivo' && recv ? '<p>Cambio: <b>' + A.q(Math.max(0, recv - tot())) + '</b></p>' : '') + '<button class="btn" id="cobrar" style="width:100%;justify-content:center" ' + (cart.length ? '' : 'disabled') + '>Cobrar ' + A.q(tot()) + '</button></div></div>';
      var q = el.querySelector('#pq');
      q.onkeydown = function (e) { if (e.key === 'Enter') { var r = find(q.value); if (r.length === 1 || (r[0] && r[0].sku.toLowerCase() === q.value.toLowerCase())) { addP(r[0]); } else draw(r); } };
      q.oninput = function () { var v = q.value; if (v.length > 1) { var r = find(v); el.querySelector('#pr').innerHTML = r.slice(0, 8).map(function (p) { return '<div class="line-item"><div><b>' + A.esc(p.name) + '</b><br><small style="color:#8e95a8">' + p.sku + ' · ' + p.platform + ' · stock ' + p.stock + '</small></div><button class="mini" data-a="' + p.id + '" ' + (p.stock <= 0 ? 'disabled' : '') + '>' + A.q(p.price) + ' +</button></div>'; }).join(''); } };
      q.focus();
      el.querySelector('#pd').onchange = function (e) { disc = +e.target.value || 0; draw(); }; el.querySelector('#pp').onchange = function (e) { pay = e.target.value; draw(); }; var pv = el.querySelector('#pv'); if (pv) pv.onchange = function (e) { recv = +e.target.value || 0; draw(); };
    }
    function addP(p) { var l = cart.filter(function (x) { return x.id === p.id; })[0]; if ((l ? l.n : 0) >= p.stock) { A.toast('Sin stock suficiente'); return; } l ? l.n++ : cart.push({ id: p.id, name: p.name, price: p.price, cost: p.cost, n: 1 }); draw(); }
    el.onclick = function (e) {
      var t = e.target;
      if (t.dataset.a) addP(G.products().filter(function (p) { return p.id === t.dataset.a; })[0]);
      if (t.dataset.m) { var l = cart[t.dataset.m]; l.n--; if (l.n < 1) cart.splice(t.dataset.m, 1); draw(); }
      if (t.dataset.p) { var p = G.products().filter(function (x) { return x.id === cart[t.dataset.p].id; })[0]; if (cart[t.dataset.p].n < p.stock) cart[t.dataset.p].n++; else A.toast('Sin stock suficiente'); draw(); }
      if (t.id === 'cobrar') {
        if (pay === 'Efectivo' && recv && recv < tot()) { A.toast('El monto recibido es menor al total'); return; }
        var prods = G.products(); cart.forEach(function (c) { prods.forEach(function (p) { if (p.id === c.id) p.stock -= c.n; }); }); G.saveProducts(prods);
        var sale = { id: A.uid('V').slice(0, 6), at: new Date().toISOString(), source: 'tienda', customer: 'Mostrador', phone: '', pay: pay, lines: cart.map(function (c) { return { id: c.id, name: c.name, n: c.n, price: c.price, cost: c.cost || 0 }; }), total: tot(), discount: disc, status: 'pagada' };
        var all = G.sales(); all.unshift(sale); G.saveSales(all); receipt(sale, recv); cart = []; disc = 0; recv = 0; draw();
      }
    };
    draw();
  }
  function receipt(s, recv) {
    A.openModal('<div class="modal-h"><h3>Venta ' + s.id + ' registrada ✓</h3><button class="modal-x">×</button></div><div class="modal-b" id="rcp" style="font-family:monospace"><p style="text-align:center;color:#fff"><b>' + A.esc(S.name) + '</b><br>' + new Date(s.at).toLocaleString('es-GT') + '</p>' + s.lines.map(function (l) { return '<div style="display:flex;justify-content:space-between"><span>' + l.n + '× ' + A.esc(l.name) + '</span><span>' + A.q(l.price * l.n) + '</span></div>'; }).join('') + (s.discount ? '<div style="display:flex;justify-content:space-between"><span>Descuento</span><span>-' + A.q(s.discount) + '</span></div>' : '') + '<hr><div style="display:flex;justify-content:space-between;color:#fff;font-size:1.2rem"><b>TOTAL</b><b>' + A.q(s.total) + '</b></div><p>Pago: ' + s.pay + (recv ? ' · cambio ' + A.q(Math.max(0, recv - s.total)) : '') + '</p><p style="text-align:center">¡Gracias por tu compra!</p></div><div class="modal-f"><button class="btn alt sm" onclick="window.print()">Imprimir</button><button class="btn sm" onclick="AG.closeModal()">Nueva venta</button></div>');
  }

  function parseCSV(txt) {
    var rows = [], row = [], cur = '', q = false;
    for (var i = 0; i < txt.length; i++) { var c = txt[i]; if (q) { if (c === '"' && txt[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; } else if (c === '"') q = true; else if (c === ',' || c === ';' || c === '\t') { row.push(cur); cur = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && txt[i + 1] === '\n') i++; row.push(cur); cur = ''; if (row.join('').trim()) rows.push(row); row = []; } else cur += c; }
    row.push(cur); if (row.join('').trim()) rows.push(row); return rows;
  }
  function importRows(rows) {
    var h = rows[0].map(function (x) { return String(x).toLowerCase().trim(); }), ix = function (names) { for (var i = 0; i < h.length; i++) if (names.indexOf(h[i]) > -1) return i; return -1; };
    var m = { name: ix(['nombre', 'producto', 'name']), sku: ix(['sku', 'codigo', 'código']), plat: ix(['plataforma', 'platform']), cat: ix(['categoria', 'categoría', 'category']), price: ix(['precio', 'price']), cost: ix(['costo', 'cost']), stock: ix(['stock', 'cantidad', 'existencia']), desc: ix(['descripcion', 'descripción']) };
    if (m.name < 0 || m.price < 0) { A.toast('El archivo necesita al menos las columnas "nombre" y "precio"'); return; }
    var prods = G.products(), added = 0, upd = 0;
    rows.slice(1).forEach(function (r) {
      var sku = m.sku > -1 ? String(r[m.sku]).trim() : A.uid('SKU'), ex = prods.filter(function (p) { return p.sku === sku; })[0];
      var o = { name: String(r[m.name]).trim(), sku: sku, platform: m.plat > -1 ? String(r[m.plat]).trim() || 'Accesorios' : 'Accesorios', category: m.cat > -1 ? String(r[m.cat]).trim() || 'General' : 'General', price: parseFloat(String(r[m.price]).replace(/[^\d.]/g, '')) || 0, cost: m.cost > -1 ? parseFloat(r[m.cost]) || 0 : 0, stock: m.stock > -1 ? parseInt(r[m.stock]) || 0 : 0, desc: m.desc > -1 ? r[m.desc] : '' };
      if (!o.name) return; if (ex) { Object.assign(ex, o); upd++; } else { o.id = A.uid('p'); prods.push(o); added++; }
    });
    G.saveProducts(prods); A.toast(added + ' productos nuevos · ' + upd + ' actualizados'); AD.refresh();
  }
  function inventory(el) {
    var q = '';
    function draw() {
      var pr = G.products().filter(function (p) { return !q || (p.name + p.sku + p.platform).toLowerCase().indexOf(q) > -1; });
      el.innerHTML = '<div class="panel"><h3>Carga de inventario</h3><p>Sube tu Excel o CSV con las columnas: <b>nombre, sku, plataforma, categoria, precio, costo, stock</b>. Si el SKU ya existe, se actualiza; si no, se crea.</p><p><label class="btn sm" style="cursor:pointer">Subir Excel / CSV<input type="file" id="fi" accept=".csv,.xlsx,.xls,.txt" hidden></label> <button class="mini" id="tpl">Descargar plantilla</button> <button class="mini" id="expi">Exportar inventario</button> <button class="btn alt sm" id="addP">+ Producto</button> <button class="mini" id="rs">Restaurar ejemplo</button></p></div>' +
        '<div class="panel"><div class="field" style="max-width:340px"><input id="iq" placeholder="Buscar en inventario…" value="' + A.esc(q) + '"></div><div class="tbl-scroll"><table class="tbl"><thead><tr><th>Producto</th><th>SKU</th><th>Plataforma</th><th>Precio</th><th>Costo</th><th>Stock</th><th></th></tr></thead><tbody>' + pr.map(function (p) {
          return '<tr><td><b>' + A.esc(p.name) + '</b><br><small style="color:#8e95a8">' + A.esc(p.category) + '</small></td><td>' + A.esc(p.sku) + '</td><td>' + p.platform + '</td><td><input type="number" style="width:84px;' + inp + '" value="' + p.price + '" data-f="price" data-id="' + p.id + '" aria-label="Precio"></td><td><input type="number" style="width:84px;' + inp + '" value="' + (p.cost || 0) + '" data-f="cost" data-id="' + p.id + '" aria-label="Costo"></td><td><input type="number" style="width:74px;' + inp + (p.stock <= (S.shop.lowStock || 3) ? ';border-color:#ff7b80' : '') + '" value="' + p.stock + '" data-f="stock" data-id="' + p.id + '" aria-label="Stock"></td><td><button class="mini" data-e="' + p.id + '">Editar</button> <button class="mini danger" data-x="' + p.id + '">×</button></td></tr>';
        }).join('') + '</tbody></table></div></div>';
      var iq = el.querySelector('#iq'); iq.oninput = function () { q = iq.value.toLowerCase(); var p = iq.selectionStart; draw(); var n = el.querySelector('#iq'); n.focus(); n.setSelectionRange(p, p); };
      el.querySelector('#fi').onchange = function (e) {
        var file = e.target.files[0]; if (!file) return;
        if (/\.xlsx?$/i.test(file.name)) {
          var go = function () { var r = new FileReader(); r.onload = function () { var wb = XLSX.read(r.result, { type: 'array' }); importRows(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 })); }; r.readAsArrayBuffer(file); };
          if (window.XLSX) go(); else { var s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; s.onload = go; s.onerror = function () { A.toast('Sin conexión para leer Excel: guarda el archivo como CSV'); }; document.head.appendChild(s); }
        } else { var r = new FileReader(); r.onload = function () { importRows(parseCSV(r.result)); }; r.readAsText(file); }
      };
      el.querySelector('#tpl').onclick = function () { AD.csv('plantilla-inventario.csv', [['nombre', 'sku', 'plataforma', 'categoria', 'precio', 'costo', 'stock'], ['Mario Kart 8 Deluxe', 'NSW-MK8', 'Nintendo', 'Juegos', 449, 330, 5]]); };
      el.querySelector('#expi').onclick = function () { AD.csv('inventario-' + S.slug + '.csv', [['nombre', 'sku', 'plataforma', 'categoria', 'precio', 'costo', 'stock']].concat(G.products().map(function (p) { return [p.name, p.sku, p.platform, p.category, p.price, p.cost, p.stock]; }))); };
      el.querySelector('#rs').onclick = function () { G.saveProducts(S.shop.products); draw(); A.toast('Inventario de ejemplo restaurado'); };
      el.querySelector('#addP').onclick = function () { form(null); };
      el.onchange = function (e) { var t = e.target; if (t.dataset.f) { var pr = G.products(); pr.forEach(function (p) { if (p.id === t.dataset.id) p[t.dataset.f] = +t.value; }); G.saveProducts(pr); A.toast('Guardado'); } };
      el.onclick = function (e) { var t = e.target; if (t.dataset.x) A.confirm('¿Eliminar este producto?', 'Dejará de mostrarse en la tienda.', 'Sí, eliminar', function () { G.saveProducts(G.products().filter(function (p) { return p.id !== t.dataset.x; })); draw(); A.toast('Producto eliminado'); }); if (t.dataset.e) form(t.dataset.e); };
    }
    function form(id) {
      var p = id ? G.products().filter(function (x) { return x.id === id; })[0] : { name: '', sku: '', platform: 'PlayStation', category: 'Juegos', price: '', cost: '', stock: 1, desc: '' };
      A.openModal('<div class="modal-h"><h3>' + (id ? 'Editar' : 'Nuevo') + ' producto</h3><button class="modal-x">×</button></div><form class="modal-b" id="pf"><div class="adm-form"><div class="field wide"><label>Nombre</label><input name="name" required value="' + A.esc(p.name) + '"></div><div class="field"><label>SKU / código</label><input name="sku" required value="' + A.esc(p.sku) + '"></div><div class="field"><label>Plataforma</label><select name="pl">' + ['PlayStation', 'Xbox', 'Nintendo', 'PC', 'Retro', 'Accesorios', 'Coleccionables'].map(function (x) { return '<option' + (p.platform === x ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></div><div class="field"><label>Categoría</label><input name="ca" value="' + A.esc(p.category) + '"></div><div class="field"><label>Precio</label><input name="pr" type="number" required value="' + p.price + '"></div><div class="field"><label>Costo</label><input name="co" type="number" value="' + p.cost + '"></div><div class="field"><label>Stock</label><input name="st" type="number" value="' + p.stock + '"></div></div><p style="margin-top:14px"><button class="btn">Guardar</button></p></form>');
      document.getElementById('pf').onsubmit = function (ev) { ev.preventDefault(); var g = ev.target, pr = G.products(), o = { name: g.name.value, sku: g.sku.value, platform: g.pl.value, category: g.ca.value, price: +g.pr.value, cost: +g.co.value, stock: +g.st.value }; if (id) pr.forEach(function (x) { if (x.id === id) Object.assign(x, o); }); else { o.id = A.uid('p'); pr.push(o); } G.saveProducts(pr); A.closeModal(); draw(); A.toast('Guardado'); };
    }
    draw();
  }
  function ventas(el) {
    var sl = G.sales();
    el.innerHTML = '<div class="panel"><p><button class="mini" id="exp">Exportar ventas a CSV</button></p><div class="tbl-scroll"><table class="tbl"><thead><tr><th>Venta</th><th>Cliente</th><th>Detalle</th><th>Pago</th><th>Total</th><th>Estado</th></tr></thead><tbody>' + sl.map(function (s, i) { return '<tr><td><b>' + s.id + '</b><br><small style="color:#8e95a8">' + new Date(s.at).toLocaleString('es-GT', { dateStyle: 'short', timeStyle: 'short' }) + ' · ' + s.source + '</small></td><td>' + A.esc(s.customer) + '<br><small style="color:#8e95a8">' + A.esc(s.phone || '') + '</small></td><td>' + s.lines.map(function (l) { return l.n + '× ' + A.esc(l.name); }).join('<br>') + '</td><td>' + A.esc(s.pay) + '</td><td>' + A.q(s.total) + '</td><td><select data-s="' + i + '" style="' + inp + '" aria-label="Estado">' + ['pendiente', 'pagada', 'anulada'].map(function (x) { return '<option' + (s.status === x ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></td></tr>'; }).join('') + '</tbody></table></div></div>';
    el.onchange = function (e) {
      var i = e.target.dataset.s; if (i == null) return; var s = sl[i], to = e.target.value;
      if (to === 'anulada' && s.status !== 'anulada') { var pr = G.products(); s.lines.forEach(function (l) { pr.forEach(function (p) { if (p.id === l.id) p.stock += l.n; }); }); G.saveProducts(pr); A.toast('Venta anulada: stock devuelto al inventario'); }
      else if (s.status === 'anulada' && to !== 'anulada') { var pr2 = G.products(); s.lines.forEach(function (l) { pr2.forEach(function (p) { if (p.id === l.id) p.stock -= l.n; }); }); G.saveProducts(pr2); }
      s.status = to; G.saveSales(sl);
    };
    el.querySelector('#exp').onclick = function () { AD.csv('ventas-' + S.slug + '.csv', [['Venta', 'Fecha', 'Origen', 'Cliente', 'Pago', 'Total', 'Estado']].concat(sl.map(function (s) { return [s.id, s.at, s.source, s.customer, s.pay, s.total, s.status]; }))); };
  }
  function reportes(el) {
    var sl = G.sales().filter(function (s) { return s.status !== 'anulada'; }), by = {}, byp = {}, top = {};
    sl.forEach(function (s) { byp[s.pay] = (byp[s.pay] || 0) + s.total; s.lines.forEach(function (l) { var p = G.products().filter(function (x) { return x.id === l.id; })[0], k = p ? p.platform : 'Otros'; by[k] = (by[k] || 0) + l.price * l.n; top[l.name] = (top[l.name] || 0) + l.n; }); });
    var tp = Object.keys(top).sort(function (a, b) { return top[b] - top[a]; }).slice(0, 6);
    el.innerHTML = '<div class="kpis">' + AD.kpi('Ventas totales', A.q(sumSales(sl))) + AD.kpi('Utilidad estimada', A.q(profit(sl)), 'precio − costo') + AD.kpi('Margen', sumSales(sl) ? Math.round(profit(sl) / sumSales(sl) * 100) + '%' : '—') + AD.kpi('Ticket promedio', A.q(sl.length ? Math.round(sumSales(sl) / sl.length) : 0)) + '</div><div class="panel"><h3>Ventas por plataforma</h3>' + AD.bars(Object.keys(by).map(function (k) { return [k.slice(0, 7), by[k], A.q(by[k])]; })) + '</div><div class="panel"><h3>Por método de pago</h3>' + AD.bars(Object.keys(byp).map(function (k) { return [k.slice(0, 8), byp[k], A.q(byp[k])]; })) + '</div><div class="panel"><h3>Más vendidos</h3><ol>' + tp.map(function (t) { return '<li>' + A.esc(t) + ' <b style="color:var(--acc)">× ' + top[t] + '</b></li>'; }).join('') + '</ol></div>';
  }
  AD.start({ tabs: [
    { id: 'resumen', label: 'Resumen', ico: 'chart', render: overview },
    { id: 'pos', label: 'Punto de venta', ico: 'bag', min: 'pro', render: pos, upsell: 'Cobra en el mostrador desde la misma página: busca por SKU, descuenta stock y emite el recibo. Plan Pro.' },
    { id: 'inventario', label: 'Inventario', ico: 'box', render: inventory },
    { id: 'ventas', label: 'Ventas', ico: 'cal', min: 'plus', render: ventas, upsell: 'Todas las ventas web y de tienda en un solo lugar, con anulaciones que devuelven el stock. Plan Plus.' },
    { id: 'reportes', label: 'Reportes', ico: 'star', min: 'pro', render: reportes, upsell: 'Utilidad, márgenes, más vendidos y ventas por plataforma. Plan Pro.' }
  ] });
})();
