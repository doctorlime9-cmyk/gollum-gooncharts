let rangliste = [];

const form = document.getElementById('goonForm');
const rangTabelle = document.querySelector('#rangTabelle tbody');

// 🔄 Daten von Firebase laden
window.addEventListener('DOMContentLoaded', () => {
  fetch('https://gooncharts-default-rtdb.europe-west1.firebasedatabase.app/rangliste.json')
    .then(res => res.json())
    .then(data => {
      rangliste = data || [];
      aktualisiereTabelle();
    })
    .catch(err => {
      console.error('Fehler beim Laden der Daten:', err);
    });
});

// 📤 Formular absenden
form.addEventListener('submit', function (e) {
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

  const vorhandener = rangliste.find(p => p.name.toLowerCase() === name.toLowerCase());

  if (vorhandener) {
    vorhandener.anzahl += anzahl;
    vorhandener.tag = tag;
    vorhandener.monat = monat;
    vorhandener.jahr = jahr;
  } else {
    rangliste.push({ name, anzahl, tag, monat, jahr });
  }

  rangliste.sort((a, b) => b.anzahl - a.anzahl);
  aktualisiereTabelle();

  // 🔒 Lokal speichern (optional)
  localStorage.setItem('goonDaten', JSON.stringify(rangliste));

  // ☁️ In Firebase speichern
  fetch('https://gooncharts-default-rtdb.europe-west1.firebasedatabase.app/rangliste.json', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rangliste)
  })
    .then(res => {
      if (res.ok) {
        console.log('Daten erfolgreich gespeichert.');
      } else {
        console.error('Fehler beim Speichern.');
      }
    });

  form.reset();
});

// 🧾 Tabelle aktualisieren
function aktualisiereTabelle() {
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
}
