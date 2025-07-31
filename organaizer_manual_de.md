# Benutzerhandbuch für OrganAIzer.App

## Einleitung
OrganAIzer ist eine moderne, KI-unterstützte Applikation zur kollaborativen Planung, Durchführung und Dokumentation von Meetings und Aufgaben. Dieses Handbuch beschreibt die grundlegenden Funktionen, die Benutzeroberfläche sowie den Arbeitsablauf mit OrganAIzer.

---

## 1. Grundkonzepte

### Eintrag (Entry)
Ein Eintrag stellt die kleinste Informationseinheit dar. Er besteht aus:
- Titel (Überschrift)
- Inhalt (Markdown-formatiert)
- Typ (z. B. Info, ToDo, Note)
- Status (z. B. Offen, Aktiv, Erledigt)
- Labels (z. B. Entwicklung, HR)
- Verantwortlicher
- Änderungsdatum
- Sternebewertung
- Voting (Daumen hoch/runter)

### Assembly
Eine Assembly ist eine filterbare, benutzerdefinierte Sammlung von Einträgen. Sie kann für Teams, Projekte oder Meetings genutzt werden.

### Benutzergruppen
OrganAIzer unterscheidet drei Benutzerrollen:
- **Betrachter**: Nur Lesezugriff
- **Editoren**: Erstellen und bearbeiten Einträge
- **Administratoren**: Vollzugriff auf alle Inhalte und Einstellungen

---

## 2. Benutzeroberfläche

### Hauptansicht
- Listet alle Einträge basierend auf einem Assembly-Filter
- Sortier- und Filterfunktionen nach Typ, Label, Status, Voting, Sterne, Datum
- Buttons zum Voting, Sterne-Bewertung und Bearbeiten
- Promptfeld zur KI-Nutzung

### Eintrag bearbeiten
- Markdown-Editor mit Live-Vorschau
- Auswahlfelder für Typ, Status, Labels
- UI für Verknüpfungen (Relationen)

### Verwaltung
- Pflege der globalen Tabellen: Typen, Status, Labels, Relationen
- Oberfläche zur Bearbeitung von Icons, Farben, Beschreibungen

---

## 3. Funktionen

### Erstellen und Bearbeiten von Einträgen
- Neue Einträge über das Hauptmenü anlegen
- Inhalte über Markdown formatieren
- Labels und Typen zuweisen

### Filter und Assemblies
- Filter nach Include/Exclude von Entry.IDs
- Kombinierbare Zusatzfilter (Datum, Typ, Status, Voting, Sterne)
- Speicherung als Assembly-Ansicht

### KI-Unterstützung
- Inhalte automatisch zusammenfassen
- Vorschläge für Einträge und Verknüpfungen
- Prompt-basierte Generierung und Anpassung

### Reports
- PDF-Export für Agenda oder Meeting-Protokoll
- Zeiteinteilung nach Thema (optional)

---

## 4. Architektur

- **Frontend**: React + Vite
- **Backend**: Docker + Hasura (GraphQL)
- **Datenbank**: PostgreSQL (mandantenspezifisch)
- Keine feste Struktur im Frontend – 100% datengetrieben

---

## 5. Hosting-Optionen

### SaaS-Varianten
| Paket        | Limits                           | Preis        |
|--------------|-----------------------------------|--------------|
| Free         | 100 Einträge, 10 AI-Zugriffe     | kostenlos    |
| Basic        | 1 Mio. Einträge, 1000 AI/Monat   | 19 $/User    |
| Enterprise   | unbegrenzt, inkl. IDP + Backup   | 49 $/User    |

### Self-Hosting
- Volle Kontrolle über Hosting und Datenschutz
- DSGVO-konform
- Open Source, kostenlos

---

## 6. Support & Mitmachen

- Projekt ist Open Source (Mitwirkende willkommen)
- Kontakt und Bug-Reports über die Webseite: **organAIzer.app**

---

## 7. Lizenz
OrganAIzer wird unter einer freien Lizenz veröffentlicht. Details siehe Repository.

---

## 8. FAQ
**F: Was passiert, wenn ich eine Assembly lösche?**
A: Nur der Filter wird gelöscht – die Einträge bleiben erhalten.

**F: Kann ich eigene Labelsets definieren?**
A: Ja, über die Verwaltungsoberfläche für Labels.

**F: Wird Markdown vollständig unterstützt?**
A: Die gängigen Markdown-Elemente wie Überschriften, Listen, Links und Codeblöcke sind verfügbar.

---

_Ende des Handbuchs._

