(function () {
  var S = window.SITE, A = window.AG, AD = window.AGADMIN, M = A.med, L = S.med.labels;
  var sel = 'background:#0c0d10;color:#fff;border:1px solid #333;border-radius:10px;padding:8px';
  function cname(id) { var c = M.find(id); return c ? c.name : '—'; }
  function dname(a) { var c = M.find(a.clinic); return c ? M.doc(c, a.doctor).name : ''; }

  function overview(el) {
    var ap = M.appts(), t = A.today(), today = ap.filter(function (a) { return a.date === t && a.status !== 'cancelada'; }), pend = ap.filter(function (a) { return a.status === 'pendiente'; });
    var by = {}; ap.filter(function (a) { return a.status !== 'cancelada'; }).forEach(function (a) { by[a.clinic] = (by[a.clinic] || 0) + 1; });
    var rows = M.clinics().map(function (c) { return [c.name.split(' ').slice(0, 2).join(' ').slice(0, 11), by[c.id] || 0]; });
    el.innerHTML = '<div class="kpis">' + AD.kpi('Citas hoy', today.length) + AD.kpi('Por confirmar', pend.length, pend.length ? 'Requieren atención' : 'Todo al día') + AD.kpi(L.units + ' activas', M.clinics().filter(function (c) { return c.active !== false; }).length) + AD.kpi('Citas totales', ap.length) + '</div>' +
      '<div class="panel"><h3>Agenda de hoy</h3>' + (today.length ? '<div class="tbl-scroll"><table class="tbl"><tbody>' + today.sort(function (a, b) { return a.time < b.time ? -1 : 1; }).map(function (a) { return '<tr><td><b>' + a.time + '</b></td><td>' + A.esc(a.name) + '</td><td>' + A.esc(cname(a.clinic)) + '</td><td>' + A.esc(dname(a)) + '</td><td>' + AD.status(a.status) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p>No hay citas para hoy.</p>') + '</div>' +
      '<div class="panel"><h3>Demanda por ' + L.unit.toLowerCase() + '</h3>' + AD.bars(rows) + '</div>';
  }
  function citas(el) {
    var f = { st: '', c: '', date: '' };
    function draw() {
      var ap = M.appts().filter(function (a) { return (!f.st || a.status === f.st) && (!f.c || a.clinic === f.c) && (!f.date || a.date === f.date); }).sort(function (a, b) { return (a.date + a.time) < (b.date + b.time) ? -1 : 1; });
      el.innerHTML = '<div class="panel"><div class="adm-form"><div class="field"><label>Estado</label><select id="fs">' + ['', 'pendiente', 'confirmada', 'completada', 'cancelada'].map(function (s) { return '<option value="' + s + '"' + (f.st === s ? ' selected' : '') + '>' + (s || 'Todos') + '</option>'; }).join('') + '</select></div><div class="field"><label>' + L.unit + '</label><select id="fc"><option value="">Todas</option>' + M.clinics().map(function (c) { return '<option value="' + c.id + '"' + (f.c === c.id ? ' selected' : '') + '>' + A.esc(c.name) + '</option>'; }).join('') + '</select></div><div class="field"><label>Fecha</label><input type="date" id="fd" value="' + f.date + '"></div></div><p><button class="btn sm" id="newA">+ Cita manual</button> <button class="mini" id="exp">Exportar CSV</button></p></div>' +
        '<div class="panel"><div class="tbl-scroll"><table class="tbl"><thead><tr><th>Código</th><th>Fecha</th><th>Paciente</th><th>' + L.unit + ' / ' + L.doctor + '</th><th>Estado</th><th></th></tr></thead><tbody>' + (ap.map(function (a) {
          return '<tr><td><b>' + a.id + '</b></td><td>' + a.date + '<br><b>' + a.time + '</b></td><td>' + A.esc(a.name) + '<br><small style="color:#8e95a8">' + A.esc(a.phone) + '</small></td><td>' + A.esc(cname(a.clinic)) + '<br><small style="color:#8e95a8">' + A.esc(dname(a)) + '</small></td><td><select data-s="' + a.id + '" style="' + sel + '" aria-label="Estado">' + ['pendiente', 'confirmada', 'completada', 'cancelada'].map(function (s) { return '<option' + (a.status === s ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></td><td>' + (A.can('pro') ? '<a class="mini" target="_blank" rel="noopener" href="' + A.wa('') .replace(S.contact.whatsapp, a.phone.replace(/\D/g, '').replace(/^(\d{8})$/, '502$1')).replace(/text=.*/, 'text=' + encodeURIComponent('Hola ' + a.name + ', le recordamos su cita en ' + S.name + ' (' + cname(a.clinic) + ') el ' + a.date + ' a las ' + a.time + '. Responda 1 para confirmar o 2 para reprogramar.')) + '">Recordar</a>' : '<small style="opacity:.5">Recordatorio · Pro</small>') + '</td></tr>';
        }).join('') || '<tr><td colspan="6">Sin citas con esos filtros.</td></tr>') + '</tbody></table></div></div>';
      el.querySelector('#fs').onchange = function (e) { f.st = e.target.value; draw(); }; el.querySelector('#fc').onchange = function (e) { f.c = e.target.value; draw(); }; el.querySelector('#fd').onchange = function (e) { f.date = e.target.value; draw(); };
      el.onchange = function (e) { var id = e.target.dataset.s; if (id) { var all = M.appts(); all.forEach(function (a) { if (a.id === id) a.status = e.target.value; }); M.saveAppts(all); A.toast('Estado actualizado'); } else if (e.target.closest('#fs,#fc,#fd')) { } };
      el.querySelector('#exp').onclick = function () { AD.csv('citas-' + S.slug + '.csv', [['Código', 'Fecha', 'Hora', 'Paciente', 'Teléfono', L.unit, L.doctor, 'Motivo', 'Estado']].concat(M.appts().map(function (a) { return [a.id, a.date, a.time, a.name, a.phone, cname(a.clinic), dname(a), a.reason, a.status]; }))); };
      el.querySelector('#newA').onclick = function () {
        A.openModal('<div class="modal-h"><h3>Cita manual (por teléfono / presencial)</h3><button class="modal-x">×</button></div><form class="modal-b" id="naf"><div class="adm-form"><div class="field"><label>' + L.unit + '</label><select name="c">' + M.clinics().map(function (c) { return '<option value="' + c.id + '">' + A.esc(c.name) + '</option>'; }).join('') + '</select></div><div class="field"><label>Fecha</label><input type="date" name="d" required value="' + A.today() + '"></div><div class="field"><label>Hora</label><input type="time" name="h" required value="09:00"></div><div class="field"><label>Paciente</label><input name="n" required></div><div class="field"><label>Teléfono</label><input name="t" required></div></div><p style="margin-top:14px"><button class="btn">Crear cita</button></p></form>');
        document.getElementById('naf').onsubmit = function (ev) { ev.preventDefault(); var g = ev.target, c = M.find(g.c.value), all = M.appts(); all.unshift({ id: A.uid('C').slice(0, 7), clinic: c.id, doctor: c.doctors[0].id, date: g.d.value, time: g.h.value, name: g.n.value, phone: g.t.value, email: '', reason: 'Manual', status: 'confirmada', created: new Date().toISOString() }); M.saveAppts(all); A.closeModal(); draw(); A.toast('Cita creada'); };
      };
    }
    draw();
  }
  function clinicas(el) {
    function draw() {
      var cl = M.clinics();
      el.innerHTML = '<p>' + (S.med.mode === 'hub' ? 'Crea, edita o pausa cada clínica del hospital. Los cambios aparecen de inmediato en el directorio público y en el agendador.' : 'Administra los servicios, estudios y especialistas que se muestran al público.') + '</p><p><button class="btn sm" id="addC">+ Nueva ' + L.unit.toLowerCase() + '</button> <button class="mini" id="rs">Restaurar datos de ejemplo</button></p><div class="panel"><div class="tbl-scroll"><table class="tbl"><thead><tr><th>' + L.unit + '</th><th>Especialidad</th><th>Horario</th><th>' + L.doctors + '</th><th>Estado</th><th></th></tr></thead><tbody>' + cl.map(function (c) {
        return '<tr><td><b>' + A.esc(c.name) + '</b><br><small style="color:#8e95a8">' + A.esc(c.place || '') + '</small></td><td>' + A.esc(c.specialty) + '</td><td>' + M.daysText(c) + '<br><small style="color:#8e95a8">Citas de ' + c.slot + ' min</small></td><td>' + c.doctors.length + '</td><td>' + (c.active === false ? '<span class="status st-no">Pausada</span>' : '<span class="status st-ok">Activa</span>') + '</td><td style="white-space:nowrap"><button class="mini" data-e="' + c.id + '">Editar</button> <button class="mini" data-t="' + c.id + '">' + (c.active === false ? 'Activar' : 'Pausar') + '</button> <button class="mini danger" data-x="' + c.id + '">Borrar</button></td></tr>';
      }).join('') + '</tbody></table></div></div>';
      el.onclick = function (e) {
        var b = e.target, all = M.clinics();
        if (b.dataset.t) { all.forEach(function (c) { if (c.id === b.dataset.t) c.active = c.active === false; }); A.store.set('clinics', all); draw(); }
        if (b.dataset.x) A.confirm('¿Borrar esta ' + L.unit.toLowerCase() + '?', 'Las citas existentes se conservan en el historial.', 'Sí, borrar', function () { A.store.set('clinics', all.filter(function (c) { return c.id !== b.dataset.x; })); draw(); A.toast('Eliminada'); });
        if (b.dataset.e) form(b.dataset.e);
        if (b.id === 'addC') form(null);
        if (b.id === 'rs') { A.store.set('clinics', S.med.clinics); draw(); A.toast('Datos restaurados'); }
      };
    }
    function form(id) {
      var c = id ? M.find(id) : { name: '', specialty: '', desc: '', place: '', days: [1, 2, 3, 4, 5], from: '08:00', to: '16:00', slot: 30, price: 0, doctors: [{ id: A.uid('d'), name: '', title: '' }], ico: 'heart' };
      A.openModal('<div class="modal-h"><h3>' + (id ? 'Editar ' : 'Nueva ') + L.unit.toLowerCase() + '</h3><button class="modal-x">×</button></div><form class="modal-b" id="cf"><div class="adm-form"><div class="field wide"><label>Nombre</label><input name="name" required value="' + A.esc(c.name) + '"></div><div class="field"><label>Especialidad</label><input name="sp" required value="' + A.esc(c.specialty) + '"></div><div class="field"><label>Ubicación (nivel, módulo)</label><input name="pl" value="' + A.esc(c.place || '') + '"></div><div class="field wide"><label>Descripción para el público</label><textarea name="ds" rows="2">' + A.esc(c.desc) + '</textarea></div><div class="field wide"><label>Días de atención</label><div style="display:flex;gap:6px;flex-wrap:wrap">' + [1, 2, 3, 4, 5, 6, 0].map(function (n) { return '<label class="pill" style="display:flex;gap:6px;align-items:center"><input type="checkbox" name="dy" value="' + n + '"' + (c.days.indexOf(n) > -1 ? ' checked' : '') + '>' + M.dayNames[n] + '</label>'; }).join('') + '</div></div><div class="field"><label>Desde</label><input type="time" name="fr" value="' + c.from + '"></div><div class="field"><label>Hasta</label><input type="time" name="to" value="' + c.to + '"></div><div class="field"><label>Duración de cita (min)</label><input type="number" name="sl" min="10" step="5" value="' + c.slot + '"></div><div class="field"><label>Precio de consulta (Q)</label><input type="number" name="pr" min="0" value="' + (c.price || 0) + '"></div><div class="field wide"><label>' + L.doctors + ' (uno por línea: Nombre | Título)</label><textarea name="dc" rows="3">' + A.esc(c.doctors.map(function (x) { return x.name + (x.title ? ' | ' + x.title : ''); }).join('\n')) + '</textarea></div></div><p style="margin-top:16px"><button class="btn">Guardar</button></p></form>');
      document.getElementById('cf').onsubmit = function (ev) {
        ev.preventDefault(); var g = ev.target, all = M.clinics(), days = Array.prototype.slice.call(g.querySelectorAll('[name=dy]:checked')).map(function (x) { return +x.value; });
        var docs = g.dc.value.split('\n').filter(function (x) { return x.trim(); }).map(function (x, i) { var p = x.split('|'); return { id: (c.doctors[i] && c.doctors[i].id) || A.uid('d'), name: p[0].trim(), title: (p[1] || '').trim() }; });
        if (!docs.length) { A.toast('Agrega al menos un ' + L.doctor.toLowerCase()); return; }
        var o = { id: c.id || A.uid('c'), name: g.name.value, specialty: g.sp.value, place: g.pl.value, desc: g.ds.value, days: days, from: g.fr.value, to: g.to.value, slot: +g.sl.value || 30, price: +g.pr.value, doctors: docs, ico: c.ico || 'heart', active: c.active };
        if (id) all = all.map(function (x) { return x.id === id ? o : x; }); else all.push(o);
        A.store.set('clinics', all); A.closeModal(); draw(); A.toast('Guardado');
      };
    }
    draw();
  }
  function pacientes(el) {
    var by = {}; M.appts().forEach(function (a) { var k = a.phone.replace(/\D/g, ''); (by[k] = by[k] || { n: a.name, t: a.phone, v: [] }).v.push(a); });
    var ls = Object.keys(by).map(function (k) { return by[k]; });
    el.innerHTML = '<div class="panel"><div class="tbl-scroll"><table class="tbl"><thead><tr><th>Paciente</th><th>Contacto</th><th>Visitas</th><th>Última cita</th></tr></thead><tbody>' + ls.map(function (p) { var u = p.v.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; })[0]; return '<tr><td><b>' + A.esc(p.n) + '</b></td><td>' + A.esc(p.t) + '</td><td>' + p.v.length + '</td><td>' + u.date + ' · ' + A.esc(cname(u.clinic)) + '</td></tr>'; }).join('') + '</tbody></table></div></div>';
  }
  function equipo(el) {
    var roles = [['Administración general', 'Todo el sistema, usuarios y reportes'], ['Recepción central', 'Citas de todas las ' + L.units.toLowerCase() + ', pacientes'], ['Encargado de ' + L.unit.toLowerCase(), 'Solo su agenda y sus horarios'], ['' + L.doctor + '', 'Ver su agenda del día']];
    el.innerHTML = '<div class="panel"><h3>Roles y permisos</h3><div class="grid g2">' + roles.map(function (r) { return '<div class="kpi"><b style="font-size:1.2rem">' + r[0] + '</b><small>' + r[1] + '</small></div>'; }).join('') + '</div><p style="margin-top:16px">Cada persona entra con su propio usuario y solo ve lo que le corresponde. Todo cambio queda registrado con fecha y autor.</p></div>';
  }
  AD.start({ tabs: [
    { id: 'resumen', label: 'Resumen', ico: 'chart', render: overview },
    { id: 'clinicas', label: L.units, ico: 'building' in window.AG_ICONS ? 'building' : 'heart', render: clinicas },
    { id: 'citas', label: 'Citas', ico: 'cal', min: 'plus', render: citas, upsell: 'La agenda online de citas, su gestión y el calendario están en el plan Plus.' },
    { id: 'pacientes', label: 'Pacientes', ico: 'users', min: 'pro', render: pacientes, upsell: 'Historial de visitas por paciente y recordatorios por WhatsApp: plan Pro.' },
    { id: 'equipo', label: 'Equipo y roles', ico: 'shield', min: 'pro', render: equipo, upsell: 'Cuentas por rol (administración, recepción, encargados de clínica): plan Pro.' }
  ] });
})();
