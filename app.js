// RSVP form + "Who's coming" list, backed by a Google Sheet through Apps Script (see README.md).
(function () {
  var ENDPOINT = (window.RSVP_ENDPOINT || '').trim();
  var STORE_KEY = 'tg-rsvp-mine';
  var SAMBAL = { matah: 'Sambal matah', bawang: 'Sambal bawang', both: 'Both sambals' };
  var DESSERT = { bake: 'Hosts bake, we chip in', bring: 'Guests bring dessert' };
  var GOING = { yes: 'Coming', maybe: 'Maybe', no: "Can't make it" };

  var form = document.getElementById('rsvp');
  var sendBtn = document.getElementById('send');
  var msg = document.getElementById('msg');
  var prev = document.getElementById('prev');
  var repliesEl = document.getElementById('replies');
  var $ = function (id) { return document.getElementById(id); };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function load() { try { return JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) { return null; } }
  function save(r) { try { localStorage.setItem(STORE_KEY, JSON.stringify(r)); } catch (e) {} }
  function getRadio(n) { var el = form.querySelector('input[name="' + n + '"]:checked'); return el ? el.value : ''; }
  function setRadio(n, v) { var el = $(n + '-' + v); if (el) el.checked = true; }
  function show(el, text, kind) { el.textContent = text; el.className = 'msg' + (kind ? ' ' + kind : ''); el.hidden = false; }

  function syncFields() {
    $('attend-fields').hidden = getRadio('going') === 'no';
    $('bring-field').hidden = getRadio('dessert') !== 'bring';
  }

  function fill(r) {
    if (!r) return;
    $('name').value = r.name || '';
    if (r.going) setRadio('going', r.going);
    if (r.sambal) setRadio('sambal', r.sambal);
    if (r.dessert) setRadio('dessert', r.dessert);
    $('bring').value = r.bring || '';
    $('note').value = r.note || '';
  }

  function readForm() {
    var r = {
      name: $('name').value.trim().slice(0, 60),
      going: getRadio('going'),
      party: 1,
      sambal: getRadio('sambal'),
      dessert: getRadio('dessert'),
      bring: $('bring').value.trim().slice(0, 80),
      note: $('note').value.trim().slice(0, 200),
      website: $('website').value
    };
    if (r.going === 'no') { r.party = 0; r.sambal = ''; r.dessert = ''; r.bring = ''; }
    if (r.dessert !== 'bring') r.bring = '';
    return r;
  }

  function bar(parts) {
    var t = parts.reduce(function (a, p) { return a + p[0]; }, 0) || 1;
    return '<div class="bar">' + parts.map(function (p) {
      return '<i style="width:' + (p[0] / t * 100) + '%;background:' + p[1] + '"></i>';
    }).join('') + '</div>';
  }

  function renderReplies(list) {
    var rs = (list || []).slice().sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); });
    if (!rs.length) { repliesEl.innerHTML = '<p class="empty">No replies yet. Yours will show up here first.</p>'; return; }
    var by = function (f, v) { return function (r) { return r[f] === v; }; };
    var yes = rs.filter(by('going', 'yes')), maybe = rs.filter(by('going', 'maybe')), no = rs.filter(by('going', 'no'));
    var heads = yes.length;
    var eaters = yes.concat(maybe);
    var n = function (f, v) { return eaters.filter(by(f, v)).length; };
    var sm = n('sambal', 'matah'), sb = n('sambal', 'bawang'), sx = n('sambal', 'both');
    var db = n('dessert', 'bake'), dr = n('dessert', 'bring');
    var h = '<div class="stats">' +
      '<div class="stat"><b>' + heads + '</b><span>Coming</span></div>' +
      '<div class="stat"><b>' + maybe.length + '</b><span>Maybe</span></div>' +
      '<div class="stat"><b>' + no.length + '</b><span>Can\'t</span></div></div>';
    h += '<div class="tally">' +
      '<div class="tally-row"><div class="tally-head"><span>Dessert vote</span><span>Bake ' + db + ' · Bring ' + dr + '</span></div>' + bar([[db, '#E8A93A'], [dr, '#F4A7B9']]) + '</div>' +
      '<div class="tally-row"><div class="tally-head"><span>Sambal picks</span><span>Matah ' + sm + ' · Bawang ' + sb + ' · Both ' + sx + '</span></div>' + bar([[sm, '#D9412B'], [sb, '#B9A6D3'], [sx, '#E8A93A']]) + '</div>' +
      '</div><ul class="people">';
    rs.forEach(function (r) {
      var det = [];
      if (r.going !== 'no') {
        if (SAMBAL[r.sambal]) det.push(SAMBAL[r.sambal]);
        if (DESSERT[r.dessert]) det.push(r.dessert === 'bring' && r.bring ? 'Bringing ' + r.bring : DESSERT[r.dessert]);
      }
      h += '<li><div class="top"><span class="nm">' + esc(r.name) + '</span><span class="chip ' + esc(r.going) + '">' + esc(GOING[r.going] || '') + '</span></div>' +
        (det.length ? '<div class="det">' + esc(det.join(' · ')) + '</div>' : '') + '</li>';
    });
    repliesEl.innerHTML = h + '</ul>';
  }

  // Start-up
  var mine = load();
  if (mine) {
    fill(mine);
    show(prev, "You've already replied. Change anything below and send again to update it.");
  }
  syncFields();
  form.addEventListener('change', syncFields);

  if (!ENDPOINT) {
    repliesEl.innerHTML = '<p class="empty">Replies will show here once RSVPs are open.</p>';
    show(msg, "RSVPs aren't open yet. Check back soon!", 'err');
    sendBtn.disabled = true;
  } else {
    fetch(ENDPOINT)
      .then(function (r) { return r.json(); })
      .then(function (d) { renderReplies(d && d.rsvps); })
      .catch(function () { repliesEl.innerHTML = '<p class="empty">Couldn\'t load replies right now. Refresh to try again.</p>'; });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var r = readForm();
    if (!r.name) { show(msg, "Add your name so we know who's replying.", 'err'); $('name').focus(); return; }
    if (!r.going) { show(msg, 'Pick whether you can make it.', 'err'); return; }
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending…';
    msg.hidden = true;
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(r)
    })
      .then(function (res) { return res.json(); })
      .then(function (d) {
        if (!d || !d.ok) throw new Error('rejected');
        delete r.website;
        save(r);
        renderReplies(d.rsvps);
        prev.hidden = true;
        show(msg, r.going === 'no' ? "Thanks for letting us know. We'll miss you!" : 'Got it, thank you! See you Monday at 5.', 'ok');
      })
      .catch(function () {
        show(msg, "Your RSVP didn't go through. Check your connection and send it again.", 'err');
      })
      .then(function () {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send RSVP';
      });
  });
})();
