/* Agenda de citas: directorio, asistente de reserva y consulta de citas (hospitales y clínicas) */
(function () {
  var S = window.SITE, A = window.AG, d = document, $ = function (s, c) { return (c || d).querySelector(s); }, $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var L = S.med.labels, M = A.med = {};
  M.clinics = function () { return A.store.get('clinics', S.med.clinics); };
  M.appts = function () { return A.store.get('appts', seedAppts()); };
  M.saveAppts = function (a) { A.store.set('appts', a); };
  function seedAppts() {
    var cl = S.med.clinics, out = [], names = ['María López', 'Carlos Pérez', 'Ana Méndez', 'Luis García', 'Sofía Ramírez', 'Jorge Castillo', 'Elena Rodas', 'Pedro Alvarado'], st = ['confirmada', 'pendiente', 'confirmada', 'completada', 'confirmada', 'pendiente'];
    for (var k = 0; k < 16; k++) {
      var c = cl[k % cl.length], dc = c.doctors[k % c.doctors.length], dt = new Date(Date.now() + (k % 5 - 1) * 86400000), ds = dt.toISOString().slice(0, 10), sl = M.baseSlots(c)[(k * 2) % M.baseSlots(c).length];
      if (!sl) continue; if (out.some(function (o) { return o.clinic === c.id && o.doctor === dc.id && o.date === ds && o.time === sl; })) continue;
      out.push({ id: 'C' + (2040 + k), clinic: c.id, doctor: dc.id, date: ds, time: sl, name: names[k % 8], phone: '5' + (3200000 + k * 41377).toString().slice(0, 7), email: '', reason: 'Consulta', status: dt < new Date(new Date().toDateString()) ? 'completada' : st[k % 6], created: new Date().toISOString() });
    }
    return out;
  }
  M.baseSlots = function (c) {
    var f = c.from.split(':'), t = c.to.split(':'), a = +f[0] * 60 + +f[1], b = +t[0] * 60 + +t[1], out = [];
    for (var m = a; m + c.slot <= b; m += c.slot) { if (c.lunch && m >= 12 * 60 + 30 && m < 14 * 60) continue; out.push(String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0')); }
    return out;
  };
  M.slots = function (c, docId, date) {
    var day = new Date(date + 'T12:00:00').getDay(); if (c.days.indexOf(day) < 0 || c.active === false) return [];
    var taken = M.appts().filter(function (o) { return o.clinic === c.id && o.doctor === docId && o.date === date && o.status !== 'cancelada'; }).map(function (o) { return o.time; });
    var now = new Date(), isToday = date === A.today(), cm = now.getHours() * 60 + now.getMinutes();
    return M.baseSlots(c).map(function (t) { var mm = +t.slice(0, 2) * 60 + +t.slice(3); return { t: t, free: taken.indexOf(t) < 0 && !(isToday && mm < cm + 30) }; });
  };
  M.find = function (id) { return M.clinics().filter(function (c) { return c.id === id; })[0]; };
  M.doc = function (c, id) { return c.doctors.filter(function (x) { return x.id === id; })[0] || c.doctors[0]; };
  M.dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  M.daysText = function (c) { return c.days.map(function (x) { return M.dayNames[x]; }).join(' · ') + ' · ' + c.from + '–' + c.to; };
  M.fmtDate = function (s) { return new Date(s + 'T12:00:00').toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long' }); };
  M.cardHTML = function (c, i) {
    return '<article class="card rv" style="--i:' + (i % 3) + '"><div class="ico" data-art-ico>' + A.icon(c.ico || 'heart') + '</div><h3>' + A.esc(c.name) + '</h3><p style="margin-bottom:8px"><span class="tag">' + A.esc(c.specialty) + '</span> ' + (c.place ? '<span class="tag">' + A.esc(c.place) + '</span>' : '') + '</p><p>' + A.esc(c.desc) + '</p><p style="font-size:.88rem"><b style="color:var(--ink)">Horario:</b> ' + M.daysText(c) + '<br><b style="color:var(--ink)">' + L.doctors + ':</b> ' + c.doctors.map(function (x) { return A.esc(x.name); }).join(', ') + (c.price ? '<br><b style="color:var(--ink)">Consulta:</b> ' + A.q(c.price) : '') + '</p><div class="btn-row"><a class="btn sm" href="agendar.html?c=' + c.id + '">Agendar cita</a></div></article>';
  };

  /* ---------- página: directorio ---------- */
  var dir = $('#clinicDir');
  if (dir) {
    var q = '', sp = '';
    var draw = function () {
      var cl = M.clinics().filter(function (c) { return c.active !== false; }), specs = cl.map(function (c) { return c.specialty; }).filter(function (v, i, a) { return a.indexOf(v) === i; });
      var list = cl.filter(function (c) { return (!q || (c.name + c.specialty + c.desc + c.doctors.map(function (x) { return x.name; }).join(' ')).toLowerCase().indexOf(q) > -1) && (!sp || c.specialty === sp); });
      dir.innerHTML = '<div class="menu-tools" style="position:static;margin-bottom:22px"><input type="search" id="dq" placeholder="Buscar ' + L.unit.toLowerCase() + ', especialidad o doctor…" value="' + A.esc(q) + '" aria-label="Buscar"><button class="pill" data-sp="" aria-pressed="' + !sp + '">Todas</button>' + specs.map(function (s) { return '<button class="pill" data-sp="' + A.esc(s) + '" aria-pressed="' + (sp === s) + '">' + A.esc(s) + '</button>'; }).join('') + '</div><p>' + list.length + ' ' + (list.length === 1 ? L.unit.toLowerCase() : L.units.toLowerCase()) + ' disponibles</p><div class="grid g3">' + (list.map(M.cardHTML).join('') || '<div class="empty">Sin resultados.</div>') + '</div>';
      A.observe(dir);
      var i = $('#dq'); i.oninput = function () { q = i.value.toLowerCase(); var p = i.selectionStart; draw(); var n = $('#dq'); n.focus(); n.setSelectionRange(p, p); };
    };
    dir.addEventListener('click', function (e) { var b = e.target.closest('[data-sp]'); if (b) { sp = b.dataset.sp; draw(); } });
    window.addEventListener('ag:store', function (e) { if (e.detail === 'clinics') draw(); }); draw();
  }
  var teaser = $('#clinicTeaser');
  if (teaser) teaser.innerHTML = M.clinics().filter(function (c) { return c.active !== false; }).slice(0, 6).map(M.cardHTML).join('');

  /* ---------- página: agendar ---------- */
  var wiz = $('#wizard');
  if (wiz) {
    var st = { step: 0, c: null, doc: null, date: null, time: null, p: {} }, pre = new URLSearchParams(location.search).get('c');
    if (pre && M.find(pre)) { st.c = pre; st.step = 1; }
    if (S.med.mode === 'single' && !st.c) { /* sigue mostrando servicios */ }
    var labels = [L.unit, L.doctor, 'Fecha y hora', 'Tus datos', 'Listo'];
    var stepper = function () { return '<ol class="steps-bar" style="display:flex;gap:6px;list-style:none;padding:0;margin:0 0 34px;flex-wrap:wrap">' + labels.map(function (l, i) { return '<li style="flex:1;min-width:90px"><div style="height:5px;border-radius:5px;background:' + (i <= st.step ? 'var(--acc)' : 'var(--line)') + ';transition:.4s"></div><small style="font-weight:700;color:' + (i === st.step ? 'var(--ink)' : 'var(--mut)') + '">' + (i + 1) + '. ' + l + '</small></li>'; }).join('') + '</ol>'; };
    var nav = function (back, nextTxt, nextOk) { return '<div class="btn-row" style="margin-top:30px">' + (back ? '<button class="btn alt" data-go="' + (st.step - 1) + '">← Atrás</button>' : '') + (nextTxt ? '<button class="btn" data-next ' + (nextOk ? '' : 'disabled') + '>' + nextTxt + '</button>' : '') + '</div>'; };
    var wdraw = function () {
      var c = st.c && M.find(st.c), h = stepper();
      if (st.step === 0) {
        h += '<h2>¿' + (L.unit === 'Clínica' ? 'Con qué clínica' : 'Qué ' + L.unit.toLowerCase()) + ' necesitas?</h2><div class="grid g2">' + M.clinics().filter(function (x) { return x.active !== false; }).map(function (x) { return '<button class="card" data-pickc="' + x.id + '" style="text-align:left;' + (st.c === x.id ? 'border-color:var(--acc);box-shadow:0 0 0 3px color-mix(in srgb,var(--acc) 30%,transparent)' : '') + '"><b style="font-size:1.1rem">' + A.esc(x.name) + '</b><br><span class="tag">' + A.esc(x.specialty) + '</span><br><small style="color:var(--mut)">' + M.daysText(x) + '</small></button>'; }).join('') + '</div>' + nav(false, 'Continuar →', !!st.c);
      } else if (st.step === 1) {
        h += '<h2>' + L.doctor + '</h2><div class="grid g2">' + c.doctors.map(function (x) { return '<button class="card" data-pickd="' + x.id + '" style="text-align:left;' + (st.doc === x.id ? 'border-color:var(--acc);box-shadow:0 0 0 3px color-mix(in srgb,var(--acc) 30%,transparent)' : '') + '"><b>' + A.esc(x.name) + '</b><br><small style="color:var(--mut)">' + A.esc(x.title || c.specialty) + '</small></button>'; }).join('') + '<button class="card" data-pickd="any" style="text-align:left;' + (st.doc === 'any' ? 'border-color:var(--acc)' : '') + '"><b>Cualquiera disponible</b><br><small style="color:var(--mut)">Te asignamos el primer horario libre.</small></button></div>' + nav(true, 'Continuar →', !!st.doc);
      } else if (st.step === 2) {
        var docId = st.doc === 'any' ? c.doctors[0].id : st.doc, ds = [];
        for (var i = 0; i < 21; i++) { var dt = new Date(Date.now() + i * 86400000), s = dt.toISOString().slice(0, 10), has = M.slots(c, docId, s).some(function (x) { return x.free; }); ds.push({ s: s, dt: dt, has: has }); }
        h += '<h2>Elige fecha y hora</h2><div class="datestrip" style="display:flex;gap:10px;overflow-x:auto;padding:6px 2px 14px;scroll-snap-type:x mandatory">' + ds.map(function (x) { return '<button class="pill" ' + (x.has ? '' : 'disabled style="opacity:.35"') + ' data-date="' + x.s + '" aria-pressed="' + (st.date === x.s) + '" style="min-width:72px;scroll-snap-align:start;display:grid;padding:10px"><small>' + M.dayNames[x.dt.getDay()] + '</small><b style="font-size:1.3rem;font-family:var(--fd)">' + x.dt.getDate() + '</b></button>'; }).join('') + '</div>';
        if (st.date) { var sl = M.slots(c, docId, st.date); h += '<p style="margin-top:12px"><b style="color:var(--ink);text-transform:capitalize">' + M.fmtDate(st.date) + '</b></p><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:10px">' + sl.map(function (x) { return '<button class="pill" data-time="' + x.t + '" ' + (x.free ? '' : 'disabled style="opacity:.3;text-decoration:line-through"') + ' aria-pressed="' + (st.time === x.t) + '">' + x.t + '</button>'; }).join('') + '</div>'; } else h += '<p>Selecciona un día para ver los horarios libres.</p>';
        h += nav(true, 'Continuar →', !!(st.date && st.time));
      } else if (st.step === 3) {
        var p = st.p;
        h += '<h2>Tus datos</h2><p>Solo lo necesario para confirmar tu cita.</p><form id="pf" novalidate style="max-width:620px"><div class="row2"><div class="field"><label for="p1">Nombre del paciente</label><input id="p1" name="n" required autocomplete="name" value="' + A.esc(p.n || '') + '"><span class="err"></span></div><div class="field"><label for="p2">Teléfono / WhatsApp</label><input id="p2" name="t" type="tel" required autocomplete="tel" value="' + A.esc(p.t || '') + '"><span class="err"></span></div></div><div class="field"><label for="p3">Correo (opcional)</label><input id="p3" name="e" type="email" autocomplete="email" value="' + A.esc(p.e || '') + '"></div><div class="field"><label for="p4">Motivo de la consulta</label><select id="p4" name="r">' + ['Primera consulta', 'Control / seguimiento', 'Resultados', 'Procedimiento', 'Otro'].map(function (o) { return '<option' + (p.r === o ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select></div>' + (S.med.mode === 'single' ? '<div class="field"><label for="p5">¿Traes orden médica? (opcional)</label><select id="p5" name="o"><option>Sí, traigo orden</option><option>No, necesito orientación</option></select></div>' : '') + '<label class="agree"><input type="checkbox" name="ok" required> Autorizo el uso de mis datos solo para gestionar mi cita.</label><span class="err" id="okerr"></span><div class="btn-row"><button type="button" class="btn alt" data-go="2">← Atrás</button><button class="btn">Confirmar cita</button></div></form>';
      } else {
        var a = st.done, c2 = M.find(a.clinic), dc = M.doc(c2, a.doctor);
        h += '<div class="center" style="max-width:640px;margin:0 auto"><div style="width:96px;height:96px;margin:0 auto 20px;border-radius:50%;background:var(--acc);color:#14110c;display:grid;place-items:center;animation:pop .7s var(--ease)"><svg viewBox="0 0 24 24" width="50" height="50" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div><h2>¡Tu cita está agendada!</h2><div class="card" style="text-align:left;margin:24px 0"><p style="margin:0">Código de cita</p><b style="font-family:var(--fd);font-size:2.4rem;color:var(--acc)">' + a.id + '</b><hr style="border:0;border-top:1px solid var(--line);margin:16px 0"><p style="margin:0"><b style="color:var(--ink)">' + A.esc(c2.name) + '</b> · ' + A.esc(dc.name) + '</p><p style="margin:0;text-transform:capitalize">' + M.fmtDate(a.date) + ' · ' + a.time + '</p><p style="margin:0">' + A.esc(S.contact.address) + '</p></div><div class="btn-row" style="justify-content:center"><button class="btn" id="ics">Agregar al calendario</button><a class="btn alt" target="_blank" rel="noopener" href="' + A.wa('Hola, agendé la cita ' + a.id + ' (' + c2.name + ', ' + M.fmtDate(a.date) + ' ' + a.time + '). A nombre de ' + a.name + '.') + '">Confirmar por WhatsApp</a><a class="btn alt" href="mis-citas.html">Ver mis citas</a></div><p style="margin-top:24px;font-size:.9rem">Llega 10 minutos antes. Guarda tu código: lo necesitarás para cancelar o reprogramar.</p></div>';
      }
      wiz.innerHTML = h;
      var pf = $('#pf'); if (pf) pf.onsubmit = submit;
    };
    function submit(e) {
      e.preventDefault(); var f = e.target, ok = true, pp = st.p;
      [['n', function (v) { return v.trim().length > 2; }, 'Escribe el nombre completo'], ['t', function (v) { return v.replace(/\D/g, '').length >= 8; }, 'Teléfono de 8 dígitos']].forEach(function (c) { var i = f.elements[c[0]], g = c[1](i.value); i.setAttribute('aria-invalid', !g); i.parentNode.querySelector('.err').textContent = g ? '' : c[2]; if (!g) ok = false; });
      if (!f.elements.ok.checked) { $('#okerr').textContent = 'Necesitamos tu autorización para continuar'; ok = false; } else $('#okerr').textContent = '';
      pp.n = f.n.value; pp.t = f.t.value; pp.e = f.e.value; pp.r = f.r.value; if (!ok) return;
      var c = M.find(st.c), docId = st.doc === 'any' ? c.doctors[0].id : st.doc;
      if (!M.slots(c, docId, st.date).some(function (x) { return x.t === st.time && x.free; })) { A.toast('Ese horario ya fue tomado, elige otro'); st.time = null; st.step = 2; wdraw(); return; }
      var ap = { id: A.uid('C').slice(0, 7), clinic: c.id, doctor: docId, date: st.date, time: st.time, name: pp.n, phone: pp.t, email: pp.e, reason: pp.r + (f.o ? ' · ' + f.o.value : ''), status: 'pendiente', created: new Date().toISOString() };
      var all = M.appts(); all.unshift(ap); M.saveAppts(all); st.done = ap; st.step = 4; wdraw(); window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    wiz.addEventListener('click', function (e) {
      var t = e.target.closest('button'); if (!t) return;
      if (t.dataset.pickc) { st.c = t.dataset.pickc; st.doc = null; st.date = st.time = null; wdraw(); }
      if (t.dataset.pickd) { st.doc = t.dataset.pickd; st.date = st.time = null; wdraw(); }
      if (t.dataset.date) { st.date = t.dataset.date; st.time = null; wdraw(); }
      if (t.dataset.time) { st.time = t.dataset.time; wdraw(); }
      if (t.dataset.go) { st.step = +t.dataset.go; wdraw(); }
      if ('next' in t.dataset) { if (st.step === 0 && S.med.clinics.length === 1) st.step++; st.step++; wdraw(); }
      if (t.id === 'ics') { var a = st.done, c = M.find(a.clinic), z = a.date.replace(/-/g, '') + 'T' + a.time.replace(':', '') + '00', ics = 'BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nUID:' + a.id + '@agetel\nDTSTART:' + z + '\nDURATION:PT' + c.slot + 'M\nSUMMARY:Cita ' + c.name + ' - ' + S.name + '\nLOCATION:' + S.contact.address + '\nEND:VEVENT\nEND:VCALENDAR', l = d.createElement('a'); l.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })); l.download = 'cita-' + a.id + '.ics'; l.click(); A.toast('✓ Evento descargado: ábrelo para agregarlo a tu calendario'); }
    });
    wdraw();
  }

  /* ---------- página: mis citas ---------- */
  var my = $('#myAppts');
  if (my) {
    my.innerHTML = '<form id="lk" class="card" style="max-width:620px"><h3>Encuentra tu cita</h3><p>Escribe tu código (ej. C1A2B3) o tu teléfono.</p><div class="field"><input id="lkv" required placeholder="Código o teléfono" aria-label="Código o teléfono"></div><button class="btn">Buscar</button></form><div id="lkr" style="margin-top:30px"></div>';
    var run = function (v) {
      v = v.trim().toLowerCase(); var dg = v.replace(/\D/g, ''), res = M.appts().filter(function (a) { return a.id.toLowerCase() === v || (dg.length >= 8 && a.phone.replace(/\D/g, '').slice(-8) === dg.slice(-8)); });
      $('#lkr').innerHTML = res.length ? '<div class="grid g2">' + res.map(function (a) { var c = M.find(a.clinic) || { name: 'Clínica', doctors: [{ name: '' }] }, dc = c.doctors ? M.doc(c, a.doctor) : { name: '' }; return '<article class="card"><span class="status ' + ({ pendiente: 'st-pend', confirmada: 'st-ok', cancelada: 'st-no', completada: 'st-done' }[a.status]) + '" style="padding:4px 12px;border-radius:999px;font-size:.75rem;font-weight:800">' + a.status + '</span><h3 style="margin-top:12px">' + A.esc(c.name) + '</h3><p>' + A.esc(dc.name) + '<br><b style="color:var(--ink);text-transform:capitalize">' + M.fmtDate(a.date) + ' · ' + a.time + '</b><br>Paciente: ' + A.esc(a.name) + ' · <b>' + a.id + '</b></p>' + (a.status === 'pendiente' || a.status === 'confirmada' ? '<div class="btn-row"><a class="btn sm" href="agendar.html?c=' + a.clinic + '">Reprogramar</a><button class="btn alt sm" data-cancel="' + a.id + '">Cancelar cita</button></div>' : '') + '</article>'; }).join('') + '</div>' : '<div class="empty">No encontramos citas con esos datos.<br><a class="link" href="agendar.html">Agendar una nueva</a></div>';
    };
    $('#lk').onsubmit = function (e) { e.preventDefault(); run($('#lkv').value); };
    my.addEventListener('click', function (e) { var id = e.target.dataset.cancel; if (!id) return; A.confirm('¿Cancelar la cita ' + id + '?', 'El horario quedará libre para otro paciente.', 'Sí, cancelar cita', function () { var all = M.appts(); all.forEach(function (a) { if (a.id === id) a.status = 'cancelada'; }); M.saveAppts(all); A.toast('Cita cancelada'); run($('#lkv').value); }); });
    var qv = new URLSearchParams(location.search).get('id'); if (qv) { $('#lkv').value = qv; run(qv); }
  }
})();
