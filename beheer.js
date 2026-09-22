/* Beheer van offerteaanvragen en vragen */

(function () {
  'use strict';

  var meldingPlek = document.getElementById('melding-plek');
  var werkveld = document.getElementById('werkveld');
  var lijstEl = document.getElementById('lijst');
  var detailEl = document.getElementById('detail');
  var tellerEl = document.getElementById('teller-nieuw');
  var wieBenIk = document.getElementById('wie-ben-ik');
  var filterStatus = document.getElementById('filter-status');
  var filterType = document.getElementById('filter-type');
  var uitlogKnop = document.getElementById('uitlog-knop');

  var statusLabels = {
    nieuw: 'Nieuw',
    in_behandeling: 'In behandeling',
    offerte_verstuurd: 'Offerte verstuurd',
    akkoord: 'Akkoord',
    afgewezen: 'Afgewezen',
    afgerond: 'Afgerond'
  };

  var typeLabels = {
    offerte: 'Offerte',
    vraag: 'Vraag'
  };

  var aanvragen = [];
  var actieveId = null;

  function toonMelding(tekst, soort) {
    if (!meldingPlek) return;

    meldingPlek.innerHTML =
      '<p class="melding ' +
      (soort || 'fout') +
      '">' +
      ontsnap(tekst) +
      '</p>';
  }

  function ontsnap(tekst) {
    var d = document.createElement('div');
    d.textContent = tekst == null ? '' : tekst;
    return d.innerHTML;
  }

  function datumTekst(iso) {
    if (!iso) return 'Onbekend';

    var d = new Date(iso);

    if (isNaN(d.getTime())) {
      return 'Onbekend';
    }

    return (
      d.toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }) +
      ' om ' +
      d.toLocaleTimeString('nl-NL', {
        hour: '2-digit',
        minute: '2-digit'
      })
    );
  }

  async function checkSessieEnLaad() {
    if (!sb) {
      toonMelding('Supabase is niet goed ingesteld.');
      return;
    }

    try {
      var resultaat = await sb.auth.getSession();
      var session = resultaat.data.session;

      if (!session) {
        window.location.href = 'login.html';
        return;
      }

      if (wieBenIk) {
        wieBenIk.textContent = session.user.email || '';
      }

      if (werkveld) {
        werkveld.hidden = false;
      }

      await laadAanvragen();

    } catch (fout) {
      console.error(fout);
      toonMelding('Er ging iets mis bij het controleren van de login.');
    }
  }

  async function laadAanvragen() {
    var resultaat = await sb
      .from('aanvragen')
      .select('*')
      .order('aangemaakt', { ascending: false });

    if (resultaat.error) {
      console.error(resultaat.error);
      toonMelding(
        'Aanvragen ophalen is niet gelukt: ' +
        resultaat.error.message
      );
      return;
    }

    aanvragen = resultaat.data || [];

    tekenLijst();
    updateTeller();

    if (actieveId) {
      var bestaat = aanvragen.some(function (a) {
        return a.id === actieveId;
      });

      if (!bestaat) {
        actieveId = null;
      }
    }

    tekenDetail();
  }

  function updateTeller() {
    if (!tellerEl) return;

    var aantalNieuw = aanvragen.filter(function (a) {
      return a.status === 'nieuw';
    }).length;

    tellerEl.hidden = aantalNieuw === 0;
    tellerEl.textContent = aantalNieuw;
  }

  function gefilterdeAanvragen() {
    return aanvragen.filter(function (a) {
      if (
        filterStatus &&
        filterStatus.value &&
        a.status !== filterStatus.value
      ) {
        return false;
      }

      if (
        filterType &&
        filterType.value &&
        a.type !== filterType.value
      ) {
        return false;
      }

      return true;
    });
  }

  function tekenLijst() {
    if (!lijstEl) return;

    var lijst = gefilterdeAanvragen();

    if (lijst.length === 0) {
      lijstEl.innerHTML =
        '<li class="leeg">Geen aanvragen voor deze filter.</li>';
      return;
    }

    lijstEl.innerHTML = lijst
      .map(function (a) {
        var status =
          statusLabels[a.status] || a.status || 'Onbekend';

        var type =
          typeLabels[a.type] || a.type || 'Onbekend';

        return (
          '<li>' +
          '<button type="button" class="item" data-id="' +
          ontsnap(a.id) +
          '" aria-current="' +
          (a.id === actieveId) +
          '">' +
          '<span class="item-top">' +
          '<strong>' +
          ontsnap(a.naam) +
          '</strong>' +
          '<span class="badge s-' +
          ontsnap(a.status) +
          '">' +
          ontsnap(status) +
          '</span>' +
          '</span>' +
          '<span class="item-sub">' +
          ontsnap(type) +
          (a.soort_werk
            ? ' · ' + ontsnap(a.soort_werk)
            : '') +
          '</span>' +
          '</button>' +
          '</li>'
        );
      })
      .join('');

    lijstEl.querySelectorAll('.item').forEach(function (knop) {
      knop.addEventListener('click', function () {
        actieveId = knop.dataset.id;
        tekenLijst();
        tekenDetail();
      });
    });
  }

  function tekenDetail() {
    if (!detailEl) return;

    var a = aanvragen.find(function (x) {
      return x.id === actieveId;
    });

    if (!a) {
      detailEl.innerHTML =
        '<p class="leeg">' +
        'Kies een aanvraag uit de lijst om de gegevens te bekijken.' +
        '</p>';
      return;
    }

    var email = ontsnap(a.email);
    var telefoon = ontsnap(a.telefoon);

    var rijen = [
      [
        'E-mail',
        a.email
          ? '<a href="mailto:' +
            email +
            '">' +
            email +
            '</a>'
          : '—'
      ],
      [
        'Telefoon',
        a.telefoon
          ? '<a href="tel:' +
            telefoon +
            '">' +
            telefoon +
            '</a>'
          : '—'
      ],
      ['Plaats', ontsnap(a.plaats) || '—'],
      ['Soort werk', ontsnap(a.soort_werk) || '—'],
      ['Gewenste start', ontsnap(a.gewenste_start) || '—'],
      ['Budget', ontsnap(a.budget) || '—']
    ]
      .map(function (r) {
        return (
          '<dt>' +
          r[0] +
          '</dt><dd>' +
          r[1] +
          '</dd>'
        );
      })
      .join('');

    var opties = Object.keys(statusLabels)
      .map(function (status) {
        return (
          '<option value="' +
          status +
          '"' +
          (status === a.status ? ' selected' : '') +
          '>' +
          statusLabels[status] +
          '</option>'
        );
      })
      .join('');

    detailEl.innerHTML =
      '<h2>' +
      ontsnap(a.naam) +
      '</h2>' +
      '<p class="wanneer">' +
      (typeLabels[a.type] || a.type) +
      ' · ontvangen op ' +
      datumTekst(a.aangemaakt) +
      '</p>' +
      '<dl>' +
      rijen +
      '</dl>' +
      '<p class="omschrijving">' +
      ontsnap(a.omschrijving) +
      '</p>' +
      '<form class="behandel" id="behandelformulier">' +
      '<div>' +
      '<label for="status-veld">Status</label>' +
      '<select id="status-veld">' +
      opties +
      '</select>' +
      '</div>' +
      '<div>' +
      '<label for="notities-veld">' +
      'Interne notities (alleen voor u zichtbaar)' +
      '</label>' +
      '<textarea id="notities-veld">' +
      ontsnap(a.notities) +
      '</textarea>' +
      '</div>' +
      '<div class="acties">' +
      '<button class="knop" type="submit">Opslaan</button>' +
      '<button class="knop knop-gevaar" type="button" id="verwijder-knop">' +
      'Verwijderen' +
      '</button>' +
      '</div>' +
      '</form>';

    var formulier =
      document.getElementById('behandelformulier');

    var verwijderKnop =
      document.getElementById('verwijder-knop');

    formulier.addEventListener(
      'submit',
      async function (e) {
        e.preventDefault();

        var knop = formulier.querySelector(
          'button[type="submit"]'
        );

        knop.disabled = true;

        var resultaat = await sb
          .from('aanvragen')
          .update({
            status:
              document.getElementById('status-veld').value,
            notities:
              document.getElementById('notities-veld').value ||
              null
          })
          .eq('id', a.id);

        knop.disabled = false;

        if (resultaat.error) {
          console.error(resultaat.error);
          toonMelding(
            'Opslaan is niet gelukt: ' +
            resultaat.error.message
          );
          return;
        }

        toonMelding('Aanvraag opgeslagen.', 'ok');

        await laadAanvragen();
      }
    );

    verwijderKnop.addEventListener(
      'click',
      async function () {
        if (
          !window.confirm(
            'Deze aanvraag verwijderen? Dit kan niet ongedaan worden gemaakt.'
          )
        ) {
          return;
        }

        verwijderKnop.disabled = true;

        var resultaat = await sb
          .from('aanvragen')
          .delete()
          .eq('id', a.id);

        if (resultaat.error) {
          verwijderKnop.disabled = false;
          console.error(resultaat.error);
          toonMelding(
            'Verwijderen is niet gelukt: ' +
            resultaat.error.message
          );
          return;
        }

        actieveId = null;

        toonMelding('Aanvraag verwijderd.', 'ok');

        await laadAanvragen();
      }
    );
  }

  if (filterStatus) {
    filterStatus.addEventListener('change', tekenLijst);
  }

  if (filterType) {
    filterType.addEventListener('change', tekenLijst);
  }

  if (uitlogKnop) {
    uitlogKnop.addEventListener('click', async function () {
      uitlogKnop.disabled = true;

      await sb.auth.signOut();

      window.location.href = 'login.html';
    });
  }

  checkSessieEnLaad();
})();
