(function () {
  'use strict';
  var API = 'https://script.google.com/macros/s/AKfycbxx-CPc-yuSRJ-j9lKQIGJrmXgbI6EUJX5R2YP4jiSUZJ9_DTyLZgAWWcR4q5blEche/exec';
  var app = document.getElementById('app');
  var id = '', sess = '', until = 0, tmr = null;

  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) { if (k === 'text') e.textContent = attrs[k]; else if (k === 'cls') e.className = attrs[k]; else e.setAttribute(k, attrs[k]); }
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return e;
  }
  function msg(text, cls) { stop(); app.textContent = ''; app.appendChild(el('p', { cls: 'm ' + (cls || ''), text: text })); }
  function stop() { if (tmr) { clearInterval(tmr); tmr = null; } }
  function call(params) {
    var q = Object.keys(params).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); }).join('&');
    return fetch(API + '?' + q, { method: 'GET', credentials: 'omit', cache: 'no-store', redirect: 'follow', referrerPolicy: 'no-referrer' })
      .then(function (r) { return r.json(); });
  }
  function num(v) { return parseFloat(String(v).replace(/,/g, '')); }

  function render(d) {
    until = d.until;
    app.textContent = '';
    app.appendChild(el('div', { cls: 'sub', text: d.id + ' · จาก ' + d.by + ' · ' + d.at }));
    var tb = el('table', null, [el('tr', null, [el('th', { text: 'รายการ' }), el('th', { text: 'เดิม' }), el('th', { text: 'ขอเปลี่ยนเป็น' })])]);
    d.items.forEach(function (i) {
      var df = num(i.to) - num(i.from);
      tb.appendChild(el('tr', null, [
        el('td', null, [i.name, i.now ? el('div', { cls: 'w', text: 'ตอนนี้เปลี่ยนเป็น ' + i.now + ' แล้ว' }) : null]),
        el('td', { cls: 'n', text: i.from }),
        el('td', { cls: 'n' }, [el('b', { text: i.to }), isNaN(df) ? null : el('div', { cls: df > 0 ? 'up' : 'dn', text: (df > 0 ? '▲ ' : '▼ ') + Math.abs(df).toFixed(2) })])
      ]));
    });
    app.appendChild(tb);
    if (d.reason) app.appendChild(el('p', null, [el('b', { text: 'เหตุผล: ' }), d.reason]));
    app.appendChild(el('p', null, [el('b', { text: 'ครั้งนี้เสนอราคาด้วยตั๋ว' })]));
    var tk = el('div', { cls: 'tk' });
    d.tickets.forEach(function (o) {
      var inp = el('input', { type: 'radio', name: 'tk', value: o.t });
      if (o.suggest) inp.checked = true;
      var tags = [o.changed ? 'ราคาใหม่' : '', o.current ? 'ใช้อยู่ตอนนี้' : '', o.suggest ? 'ผู้ขอแนะนำ' : ''].filter(Boolean).join(' · ');
      tk.appendChild(el('label', null, [inp, el('span', null, [el('b', { text: o.t }), ' FOA ' + o.foa, el('small', { text: tags })])]));
    });
    app.appendChild(tk);
    app.appendChild(el('p', null, [el('b', { text: 'หมายเหตุ ' }), el('span', { cls: 'sub', text: '(ไม่บังคับ)' })]));
    var note = el('textarea', { id: 'note', rows: '2', maxlength: '200', placeholder: 'เช่น ยืนยันตามใบแจ้งราคา' });
    app.appendChild(note);
    app.appendChild(el('p', { cls: 'sub', text: 'ตัดสินในนาม ' + d.who + ' (' + d.email + ')' }));
    var no = el('button', { cls: 'no', text: 'ไม่อนุมัติ' }), ok = el('button', { cls: 'ok', text: 'อนุมัติ และแก้ต้นทุนทันที' });
    app.appendChild(el('div', { cls: 'b' }, [no, ok]));
    var st = el('p', { cls: 'm' }); app.appendChild(st);
    var tm = el('div', { cls: 'timer' }); app.appendChild(tm);
    function tick() {
      var left = Math.max(0, until - Date.now()), m = Math.floor(left / 60000), s = Math.floor(left / 1000) % 60;
      tm.textContent = 'ต้องตัดสินภายใน ' + m + ':' + (s < 10 ? '0' : '') + s + ' นาที · ลิงก์ในอีเมลใช้ไม่ได้แล้ว';
      if (!left) { forget(); msg('หมดเวลาแล้ว — ให้ผู้ขอกด "ส่งอีเมลอีกครั้ง"'); }
    }
    stop(); tick(); tmr = setInterval(tick, 1000);
    function go(a) {
      var sel = document.querySelector('input[name=tk]:checked');
      no.disabled = ok.disabled = true; st.textContent = 'กำลังบันทึก…';
      call({ capi: 'decide', id: id, s: sess, a: a ? '1' : '0', tk: sel ? sel.value : '', n: note.value })
        .then(function (r) {
          if (!r.ok) { st.textContent = r.msg; no.disabled = ok.disabled = false; return; }
          forget();
          msg(a ? 'อนุมัติแล้ว — ต้นทุนถูกแก้ เสนอราคาตั๋ว ' + r.ticket + ' ราคาลูกค้าคำนวณใหม่แล้ว' : 'บันทึกว่าไม่อนุมัติแล้ว', 'big ' + (a ? 'g' : ''));
        })
        .catch(function () { st.textContent = 'เชื่อมต่อไม่ได้ — ตรวจอินเทอร์เน็ตแล้วกดใหม่'; no.disabled = ok.disabled = false; });
    }
    no.onclick = function () { go(false); };
    ok.onclick = function () { go(true); };
  }

  function forget() { try { sessionStorage.removeItem('cs_' + id); } catch (e) {} }

  // อ่านรหัสจากหลัง # แล้วลบออกจากแถบที่อยู่ทันที (ไม่ค้างในประวัติ/ไม่ถูกแชร์ต่อ)
  var h = (location.hash || '').replace(/^#/, '');
  try { history.replaceState(null, '', location.pathname); } catch (e) {}
  var m = /^([0-9A-Za-z-]{6,30})\.([0-9a-f]{64})$/.exec(h);
  var saved = null;
  try { saved = JSON.parse(sessionStorage.getItem('cs_last') || 'null'); } catch (e) {}

  if (m) {
    id = m[1];
    call({ capi: 'open', id: id, t: m[2] }).then(function (r) {
      if (!r.ok) return msg(r.msg);
      sess = r.s;
      try { sessionStorage.setItem('cs_' + id, sess); sessionStorage.setItem('cs_last', JSON.stringify({ id: id })); } catch (e) {}
      render(r);
    }).catch(function () { msg('เชื่อมต่อระบบไม่ได้ — ลองใหม่อีกครั้ง'); });
  } else if (saved && saved.id) {
    id = saved.id;
    try { sess = sessionStorage.getItem('cs_' + id) || ''; } catch (e) {}
    if (!sess) msg('ลิงก์ไม่ถูกต้อง');
    else call({ capi: 'view', id: id, s: sess }).then(function (r) { r.ok ? render(r) : (forget(), msg(r.msg)); })
      .catch(function () { msg('เชื่อมต่อระบบไม่ได้ — ลองใหม่อีกครั้ง'); });
  } else msg('ลิงก์ไม่ถูกต้อง — เปิดจากปุ่มในอีเมลเท่านั้น');
})();
