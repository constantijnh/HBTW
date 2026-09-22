(function () {
  const formulier = document.getElementById("offerte-formulier");
  if (!formulier) return;

  const melding = document.getElementById("melding");

  formulier.addEventListener("submit", async function (e) {
    e.preventDefault();

    const knop = formulier.querySelector("button[type=submit]");
    knop.disabled = true;

    const data = {
      type: "offerte",
      naam: formulier.naam.value,
      email: formulier.email.value,
      telefoon: formulier.telefoon.value || null,
      plaats: formulier.plaats.value || null,
      soort_werk: formulier.soort_werk.value || null,
      gewenste_start: formulier.gewenste_start.value || null,
      budget: formulier.budget.value || null,
      omschrijving: formulier.omschrijving.value,
      status: "nieuw"
    };

    const { error } = await sb.from("aanvragen").insert([data]);

    knop.disabled = false;

    if (error) {
      melding.textContent = "Versturen is niet gelukt: " + error.message;
      melding.style.color = "red";
      return;
    }

    melding.textContent = "Offerte succesvol verstuurd!";
    melding.style.color = "green";
    formulier.reset();
  });
})();
