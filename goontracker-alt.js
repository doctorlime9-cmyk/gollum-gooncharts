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
  const datum = document.getElementById('datum').value; // Flatpickr liefert String "dd.mm.yyyy"

  if (!name || isNaN(anzahl) || !datum) {
    alert('Bitte alle Felder korrekt ausfüllen.');
    return;
  }

  const [tag, monat, jahr] = datum.split('.');

  const vorhandener = rangliste.find(p => p.name.toLowerCase() === name.toLowerCase());

if (vorhandener) {
  vorhandener.anzahl += anzahl;

  const neuesDatum = new Date(`${jahr}-${monat}-${tag}`);
  const altesDatum = new Date(`${vorhandener.jahr}-${vorhandener.monat}-${vorhandener.tag}`);

  if (neuesDatum > altesDatum) {
    vorhandener.tag = tag;
    vorhandener.monat = monat;
    vorhandener.jahr = jahr;
  }
} else {
  // neuer Eintrag
  rangliste.push({ name, anzahl, tag, monat, jahr });
}

  rangliste.sort((a, b) => b.anzahl - a.anzahl);
  aktualisiereTabelle();

  localStorage.setItem('goonDaten', JSON.stringify(rangliste));

  fetch('https://gooncharts-default-rtdb.europe-west1.firebasedatabase.app/rangliste.json', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(rangliste)
  });

  form.reset();
});

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

  
  // Statistiken aktualisieren
  aktualisiereStatistiken();
}


const fp = flatpickr("#datum", {
  dateFormat: "d.m.Y",
  allowInput: false,
  maxDate: "today",
  locale: { firstDayOfWeek: 1 } // Montag
});

document.getElementById('heuteBtn').addEventListener('click', () => {
  const heuteStr = flatpickr.formatDate(new Date(), "d.m.Y");
  fp.setDate(heuteStr, true);
});


  // Gestern-Button
  document.getElementById('gesternBtn').addEventListener('click', () => {
    const gestern = new Date();
    gestern.setDate(gestern.getDate() - 1);
    fp.setDate(gestern, true);
  });

  document.getElementById('scrollBtn').addEventListener('click', () => {
    document.querySelector('.eingabe')
    .scrollIntoView({ behavior: 'smooth', block: 'center' });
  document.getElementById('name').focus({ preventScroll: true });
});

function aktualisiereStatistiken() {
  const statsBox = document.getElementById('statsBox');
  if (!statsBox) {
    console.warn('statsBox nicht gefunden');
    return;
  }

  statsBox.innerHTML = '';

  if (rangliste.length === 0) {
    statsBox.innerHTML = '<p>Noch keine Daten vorhanden.</p>';
    return;
  }

  // helper to add aligned label/value rows
  function addStat(label, value) {
    statsBox.innerHTML += `
      <div class="stat-row">
        <strong>${label}</strong>
        <span>${value}</span>
      </div>
    `;
  }

  // Summe aller Anzahl
  const gesamtAnzahl = rangliste.reduce((sum, p) => sum + p.anzahl, 0);

  // Anzahl verschiedener Personen
  const uniquePersonen = new Set(rangliste.map(p => p.name)).size || 1;

  // ---------- GLOBALER ZEITRAUM ----------

  // kleinstes Jahr in den Daten
  const minYear = Math.min(...rangliste.map(p => parseInt(p.jahr, 10)));

  // Start: 1.1. des ersten Jahres mit Eintrag
  const startDate = new Date(minYear, 0, 1); // Monat 0 = Januar

  // Ende: heute
  const today = new Date();
  const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate()); // ohne Zeitanteil

  // Tage im Zeitraum (inklusive)
  const diffTage = Math.floor((endDate - startDate) / 86400000) + 1;

  // Wochen im Zeitraum
  const diffWochen = Math.ceil(diffTage / 7);

  // ---------- DURCHSCHNITTE GESAMT (pro Person) ----------

  const durchschnittTagGesamtProPerson = (gesamtAnzahl / diffTage / uniquePersonen).toFixed(2);
  const durchschnittWocheGesamtProPerson = (gesamtAnzahl / diffWochen / uniquePersonen).toFixed(2);

  // Liter gesamt
  const literGesamt = (gesamtAnzahl * 0.004).toFixed(2);

  // ---------- AUSGABE ----------

  addStat('Gesamtanzahl Goonings:', gesamtAnzahl);
  statsBox.innerHTML += `<hr class="stat-divider">`;
  addStat('Aktive Gooner:', uniquePersonen);
  statsBox.innerHTML += `<hr class="stat-divider">`;
  addStat('Ø pro Tag (gesamt):', durchschnittTagGesamtProPerson);
  statsBox.innerHTML += `<hr class="stat-divider">`;

  // Durchschnitt pro Tag pro Person (gleicher globaler Zeitraum!)
  statsBox.innerHTML += `<p><strong>Ø pro Tag pro Person:</strong></p>`;
  rangliste.forEach(p => {
    const durchschnittProTagPerson = (p.anzahl / diffTage).toFixed(2); // mehr Nachkommastellen, weil es klein sein kann
    statsBox.innerHTML += `
      <div class="stat-row">
        <span></span>
        <span>${p.name}&nbsp;&nbsp;${durchschnittProTagPerson}</span>
      </div>
    `;
  });

  statsBox.innerHTML += `<hr class="stat-divider">`;
  addStat('Ø pro Woche (gesamt):', durchschnittWocheGesamtProPerson);
  statsBox.innerHTML += `<hr class="stat-divider">`;
  addStat('Insgesamt gegoont:', `${literGesamt} Liter`);
  statsBox.innerHTML += `<hr class="stat-divider">`;

  // Liter pro Person
  statsBox.innerHTML += `<p><strong>Liter pro Person:</strong></p>`;
  rangliste.forEach(p => {
    statsBox.innerHTML += `
      <div class="stat-row">
        <span></span>
        <span>${p.name}&nbsp;&nbsp;${(p.anzahl * 0.004).toFixed(2)} l</span>
      </div>
    `;
  });
}
