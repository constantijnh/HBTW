/* Beheer aanvragen: laat alleen ingelogde gebruikers de offertes en vragen zien en behandelen. */
(function () {
  var meldingPlek = document.getElementById('melding-plek');
  var werkveld = document.getElementById('werkveld');
  var lijstEl = document.getElementById('lijst');
  var detailEl = document.getElementById('detail');
  var tellerEl = document.getElementById('teller-nieuw');
  var wieBenIk = document.getElementById('wie-ben-ik');
  var filterStatus = document.getElementById('filter-status');
  var filterType = document.getElementById('filter-type');

  var statusLabels = {
    nieuw: 'Nieuw',
    in_behandeling: 'In behandeling',
    offerte_verstuurd: 'Offerte verstuurd',
    akkoord: 'Akkoord',
    afgewezen: 'Afgewezen',
    afgerond: 'Afgerond'
  };
  var typeLabels = { offerte: 'Offerte', vraag: 'Vraag' };

  var aanvragen = [];
  var actieveId = null;

  function toonMelding(tekst, soort) {
    meldingPlek.innerHTML = '<p class="melding ' + (soort || 'fout') + '">' + tekst + '</p>';
  }

  function datumTekst(iso) {
    var d = new Date(iso);
    return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' }) +
      ' om ' + d.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  }

  function ontsnap(tekst) {
    var d = document.createElement('div');
    d.textContent = tekst == null ? '' : tekst;
    return d.innerHTML;
  }

  async function checkSessieEnLaad() {
    if (!sb) {
      toonMelding('De verbinding met de database is nog niet ingesteld. Vul config.js in met uw Supabase-gegevens.');
      return;
    }
    var { data } = await sb.auth.getSession();
    if (!data.session) {
      window.location.href = 'login.html';
      return;
    }
    wieBenIk.textContent = data.session.user.email;
    werkveld.hidden = false;
    await laadAanvragen();
  }

  async function laadAanvragen() {
    var { data, error } = await sb.from('aanvragen').select('*').order('aangemaakt', { ascending: false });
    if (error) {
      toonMelding('Aanvragen ophalen is niet gelukt: ' + error.message);
      return;
    }
    aanvragen = data || [];
    tekenLijst();
    var nieuwAantal = aanvragen.filter(function (a) { return a.status === 'nieuw'; }).length;
    tellerEl.hidden = nieuwAantal === 0;
    tellerEl.textContent = nieuwAantal;
  }

  function gefilterdeAanvragen() {
    return aanvragen.filter(function (a) {
      if (filterStatus.value && a.status !== filterStatus.value) return false;
      if (filterType.value && a.type !== filterType.value) return false;
      return true;
    });
  }

  function tekenLijst() {
    var lijst = gefilterdeAanvragen();
    if (lijst.length === 0) {
      lijstEl.innerHTML = '<li class="leeg">Geen aanvragen voor deze filter.</li>';
      return;
    }
    lijstEl.innerHTML = lijst.map(function (a) {
      return '<li>' +
        '<button type="button" class="item" data-id="' + a.id + '" aria-current="' + (a.id === actieveId) + '">' +
          '<span class="item-top">' +
            '<strong>' + ontsnap(a.naam) + '</strong>' +
            '<span class="badge s-' + a.status + '">' + statusLabels[a.status] + '</span>' +
          '</span>' +
          '<span class="item-sub">' + typeLabels[a.type] + (a.soort_werk ? ' · ' + ontsnap(a.soort_werk) : '') + '</span>' +
        '</button>' +
      '</li>';
    }).join('');

    lijstEl.querySelectorAll('.item').forEach(function (knop) {
      knop.addEventListener('click', function () {
        actieveId = knop.dataset.id;
        tekenLijst();
        tekenDetail();
      });
    });
  }

  function tekenDetail() {
    var a = aanvragen.find(function (x) { return x.id === actieveId; });
    if (!a) {
      detailEl.innerHTML = '<p class="leeg">Kies een aanvraag uit de lijst om de gegevens te bekijken.</p>';
      return;
    }

    var rijen = [
      ['E-mail', '<a href="mailto:' + ontsnap(a.email) + '">' + ontsnap(a.email) + '</a>'],
      ['Telefoon', a.telefoon ? '<a href="tel:' + ontsnap(a.telefoon) + '">' + ontsnap(a.telefoon) + '</a>' : '—'],
      ['Plaats', ontsnap(a.plaats) || '—'],
      ['Soort werk', ontsnap(a.soort_werk) || '—'],
      ['Gewenste start', ontsnap(a.gewenste_start) || '—'],
      ['Budget', ontsnap(a.budget) || '—']
    ].map(function (r) { return '<dt>' + r[0] + '</dt><dd>' + r[1] + '</dd>'; }).join('');

    detailEl.innerHTML =
      '<h2>' + ontsnap(a.naam) + '</h2>' +
      '<p class="wanneer">' + typeLabels[a.type] + ' · ontvangen op ' + datumTekst(a.aangemaakt) + '</p>' +
      '<dl>' + rijen + '</dl>' +
      '<p class="omschrijving">' + ontsnap(a.omschrijving) + '</p>' +
      '<form class="behandel" id="behandelformulier">' +
        '<div>' +
          '<label for="status-veld">Status</label>' +
          '<select id="status-veld">' +
            Object.keys(statusLabels).map(function (s) {
              return '<option value="' + s + '"' + (s === a.status ? ' selected' : '') + '>' + statusLabels[s] + '</option>';
            }).join('') +
          '</select>' +
        '</div>' +
        '<div>' +
          '<label for="notities-veld">Interne notities (alleen voor u zichtbaar)</label>' +
          '<textarea id="notities-veld">' + ontsnap(a.notities) + '</textarea>' +
        '</div>' +
        '<div class="acties">' +
          '<button class="knop" type="submit">Opslaan</button>' +
          '<button class="knop knop-gevaar" type="button" id="verwijder-knop">Verwijderen</button>' +
        '</div>' +
      '</form>';

    document.getElementById('behandelformulier').addEventListener('submit', async function (e) {
      e.preventDefault();
      var knop = e.target.querySelector('button[type=submit]');
      knop.disabled = true;
      var { error } = await sb.from('aanvragen').update({
        status: document.getElementById('status-veld').value,
        notities: document.getElementById('notities-veld').value || null
      }).eq('id', a.id);
      knop.disabled = false;
      if (error) { toonMelding('Opslaan is niet gelukt: ' + error.message); return; }
      toonMelding('Opgeslagen.', 'ok');
      await laadAanvragen();
      tekenDetail();
    });

    document.getElementById('verwijder-knop').addEventListener('click', async function () {
      if (!window.confirm('Deze aanvraag verwijderen? Dit kan niet ongedaan worden gemaakt.')) return;
      var { error } = await sb.from('aanvragen').delete().eq('id', a.id);
      if (error) { toonMelding('Verwijderen is niet gelukt: ' + error.message); return; }
      actieveId = null;
      await laadAanvragen();
      tekenDetail();
    });
  }

  filterStatus.addEventListener('change', tekenLijst);
  filterType.addEventListener('change', tekenLijst);

  document.getElementById('uitlog-knop').addEventListener('click', async function () {
    if (sb) await sb.auth.signOut();
    window.location.href = 'login.html';
  });

  checkSessieEnLaad();
})();
