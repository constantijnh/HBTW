/* Gedeelde effecten voor alle pagina's: rustig infaden/opschuiven bij scrollen,
   net als op tarqstudio.com. Voeg data-toon toe aan een element om het te laten meedoen;
   data-toon="groep" laat de kinderen ná elkaar verschijnen. */
(function () {
  var prefersRustig = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function zetKlaar() {
    document.querySelectorAll('[data-toon]').forEach(function (el) {
      if (el.dataset.toon === 'groep') {
        Array.from(el.children).forEach(function (kind, i) {
          kind.classList.add('toon-klaar');
          kind.style.transitionDelay = prefersRustig ? '0ms' : (i * 70) + 'ms';
        });
      } else {
        el.classList.add('toon-klaar');
      }
    });
  }

  if (prefersRustig || !('IntersectionObserver' in window)) {
    zetKlaar();
    document.querySelectorAll('[data-toon]').forEach(function (el) {
      el.classList.add('toon-in-beeld');
      Array.from(el.children).forEach(function (k) { k.classList.add('toon-in-beeld'); });
    });
    return;
  }

  zetKlaar();

  var waarnemer = new IntersectionObserver(function (items) {
    items.forEach(function (item) {
      if (!item.isIntersecting) return;
      var el = item.target;
      if (el.dataset.toon === 'groep') {
        Array.from(el.children).forEach(function (kind) { kind.classList.add('toon-in-beeld'); });
      } else {
        el.classList.add('toon-in-beeld');
      }
      waarnemer.unobserve(el);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

  document.querySelectorAll('[data-toon]').forEach(function (el) { waarnemer.observe(el); });
})();
