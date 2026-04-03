let rangliste = [];

const form = document.getElementById('goonForm');
const rangTabelle = document.querySelector('#rangTabelle tbody');

// 🔄 Daten von Firebase laden
window.addEventListener('DOMContentLoaded', () => {
  fetch('https://gooncharts-default-rtdb.europe-west1.firebasedatabase.app/rangliste.json')
    .then(res => res.json())
    .then(data => {
      rangliste = Object.values(data || {}).filter(p =>
        p && p.name && p.anzahl && p.tag && p.monat && p.jahr
      );
      aktualisiereTabelle();
    })
    .catch(err => {
      console.error('Fehler beim Laden der Daten:', err);
    });
});

form.addEventListener('submit', function (e) {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const anzahl = parseInt(document.getElementById('anzahl').value);
  const datum = document.getElementById('datum').value;

  if (!name || isNaN(anzahl) || !datum) {
    alert('Bitte alle Felder korrekt ausfüllen.');
    return;
  }

  // Sofort aktualisieren
  aktualisiereTabelle();

  const [tag, monat, jahr] = datum.split('.');

  fetch('https://gooncharts-default-rtdb.europe-west1.firebasedatabase.app/rangliste.json')
    .then(res => res.json())
    .then(serverData => {
      let aktuelleListe = Object.values(serverData || {}).filter(p =>
        p && p.name && p.anzahl && p.tag && p.monat && p.jahr
      );

      const vorhandener = aktuelleListe.find(p => p.name.toLowerCase() === name.toLowerCase());

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
        aktuelleListe.push({ name, anzahl, tag, monat, jahr });
      }

      aktuelleListe.sort((a, b) => b.anzahl - a.anzahl);

      return fetch('https://gooncharts-default-rtdb.europe-west1.firebasedatabase.app/rangliste.json', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aktuelleListe)
      }).then(() => aktuelleListe); // ← WICHTIG
    })
    .then(aktuelleListe => {
      rangliste = aktuelleListe;  // ← Jetzt funktioniert’s
      aktualisiereTabelle();      // ← Tabelle sofort korrekt
      localStorage.setItem('goonDaten', JSON.stringify(rangliste));
    })
    .catch(err => {
      console.error('Fehler beim Speichern:', err);
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

  function addStat(label, value) {
    statsBox.innerHTML += `
      <div class="stat-row">
        <strong>${label}</strong>
        <span>${value}</span>
      </div>
    `;
  }

  const gesamtAnzahl = rangliste.reduce((sum, p) => sum + p.anzahl, 0);
  const uniquePersonen = new Set(rangliste.map(p => p.name)).size || 1;

  const minYear = Math.min(...rangliste.map(p => parseInt(p.jahr, 10)));
  const startDate = new Date(minYear, 0, 1);
  const today = new Date();
  const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diffTage = Math.floor((endDate - startDate) / 86400000) + 1;
  const diffWochen = Math.ceil(diffTage / 7);

  const durchschnittTagGesamtProPerson = (gesamtAnzahl / diffTage / uniquePersonen).toFixed(2);
  const durchschnittWocheGesamtProPerson = (gesamtAnzahl / diffWochen / uniquePersonen).toFixed(2);
  const literGesamt = (gesamtAnzahl * 0.004).toFixed(2);

  addStat('Gesamtanzahl Goonings:', gesamtAnzahl);
  statsBox.innerHTML += `<hr class="stat-divider">`;
  addStat('Aktive Gooner:', uniquePersonen);
  statsBox.innerHTML += `<hr class="stat-divider">`;
  addStat('Ø pro Tag (gesamt):', durchschnittTagGesamtProPerson);
  statsBox.innerHTML += `<hr class="stat-divider">`;

  statsBox.innerHTML += `<p><strong>Ø pro Tag pro Person:</strong></p>`;
  rangliste.forEach(p => {
    const durchschnittProTagPerson = (p.anzahl / diffTage).toFixed(2);
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
