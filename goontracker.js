let rangliste = [];

const gespeicherteDaten = localStorage.getItem('goonDaten');
if (gespeicherteDaten) {
  rangliste = JSON.parse(gespeicherteDaten);
}

const form = document.getElementById('goonForm');
const rangTabelle = document.querySelector('#rangTabelle tbody');

window.addEventListener('DOMContentLoaded', () => {
  rangliste.sort((a, b) => b.anzahl - a.anzahl);
  rangTabelle.innerHTML = '';
  rangliste.forEach((person, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${person.name}</td>
      <td>${person.anzahl}</td>
      <td>${person.tag}.${person.monat}.${person.jahr}</td>
    `;
    rangTabelle.appendChild(row);
  });
});

form.addEventListener('submit', function(e) {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const anzahl = parseInt(document.getElementById('anzahl').value);
  const tag = document.getElementById('tag').value;
  const monat = document.getElementById('monat').value;
  const jahr = document.getElementById('jahr').value;

  if (!name || isNaN(anzahl) || !tag || !monat || !jahr) {
    alert('Bitte alle Felder korrekt ausfüllen.');
    return;
  }

// Prüfen, ob Name schon existiert
const vorhandener = rangliste.find(p => p.name.toLowerCase() === name.toLowerCase());

if (vorhandener) {
  // Sessions addieren, Datum ggf. aktualisieren
  vorhandener.anzahl += anzahl;
  vorhandener.tag = tag;
  vorhandener.monat = monat;
  vorhandener.jahr = jahr;
} else {
  // Neuer Eintrag
  rangliste.push({ name, anzahl, tag, monat, jahr });
}

  rangliste.sort((a, b) => b.anzahl - a.anzahl);

  rangTabelle.innerHTML = '';
  rangliste.forEach((person, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${person.name}</td>
      <td>${person.anzahl}</td>
      <td>${person.tag}.${person.monat}.${person.jahr}</td>
    `;
    rangTabelle.appendChild(row);
  });

  localStorage.setItem('goonDaten', JSON.stringify(rangliste));
  form.reset();
});
