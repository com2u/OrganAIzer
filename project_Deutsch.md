**OrganAIzer**
Die App OrganAIzer unterstützt bei der Durchführung von Meetings und Management-Aufgaben. OrganAIzer ist mehr als nur eine To-Do-App. Mit OrganAIzer lassen sich verschiedene Inhalte sammeln, strukturieren und für unterschiedliche Anwendungsfälle zusammenstellen und darstellen. Es gibt eine interaktive Darstellung, sogenannte Assemblies, die Inhalte für verschiedene Teams oder Meetings zusammenfassen. OrganAIzer ist für die Arbeit in Gruppen konzipiert. Inhalte können nach verschiedenen Filtern zusammengestellt werden. Jede Assembly kann in OrganAIzer als Übersicht (Read-only), interaktive Darstellung oder Report (z. B. Meeting-Agenda, Meeting-Protokoll) verwendet werden. In OrganAIzer lassen sich Aufgaben, Informationen und Tasks anlegen. Die Einträge können beliebig vernetzt und von den Benutzern bewertet werden. So lassen sich Meetings gut vorbereiten, durchführen und dokumentieren. Es gibt verschiedene Berechtigungen, um den Zugriff auf die Einträge zu steuern. OrganAIzer soll den Anwendern maximale Transparenz bieten.


**Wie unterstützt die KI?**
Die KI kann Einträge aufbereiten. Inhalte können an die KI übergeben werden, die daraus automatisch Einträge und Verknüpfungen erstellt. Dabei macht die KI Vorschläge, die vom Benutzer angepasst oder direkt übernommen werden können. Die KI kann Zusammenfassungen generieren, Einträge aufteilen oder Untereinträge erstellen. Durch den KI-Einsatz sind verschiedene Eingabekanäle möglich, die sich auch an Kundentools anpassen lassen.


**Beschreibung**
OrganAIzer ist eine React-App mit hellem und dunklem Modus.
Die App verwaltet Einträge, die hierarchisch organisiert sind.
Ein Eintrag besteht aus einer Überschrift und einem Inhalt im Markdown-Format.
Inhalte können in der Reihenfolge angepasst werden.
Teilnehmer können Einträge per Daumen hoch oder runter bewerten sowie Sterne vergeben.
Einträge besitzen Verantwortliche, ein Änderungsdatum und einen Status. Status-Felder können individuell gepflegt werden.
Alle Inhalte können mit Labels aus einem vorgegebenen Label-Set versehen werden.
Die Hauptseite dient der Bearbeitung und Verwaltung von To-Do-Einträgen. Es werden Oberflächen zur Verwaltung von Labels und Status bereitgestellt.
Für Benutzer sollen verschiedene Benutzergruppen definiert werden können: Betrachter, Editoren und Administratoren.
Die Applikation soll mit Vite erstellt werden, basiert auf einem Docker-Container und verwaltet die Daten in einer PostgreSQL-Datenbank über Hasura GraphQL.


**Idee:**
Meetings werden oft schlecht geplant. Es gibt Regeltermine, in denen man sich trifft, jedoch fehlt oft eine klare Struktur. Niemand erstellt regelmäßig eine Agenda. Hier unterstützt OrganAIzer bei der Planung der Inhalte jedes Meetings und hilft bei der sinnvollen Reihenfolge. Während der Vorbereitung wird ein Zeitplan vorgeschlagen, der sicherstellt, dass für alle Themen genug Zeit bleibt. Jeder Teilnehmer hat eine Übersicht der aktuellen Themen und kann über Voting, Sterne-Bewertung und Reihenfolge Einfluss auf die Planung nehmen. OrganAIzer ist ein kollaboratives Tool. Während des Meetings können Einträge direkt in der Oberfläche erstellt werden. Zusätzlich kann ein Transkript abgelegt werden. Nach dem Meeting erstellt OrganAIzer ein Protokoll mit dokumentierten To-Dos. Der Benutzer entscheidet, wie viel die KI automatisch übernimmt oder ob eine manuelle Bestätigung erforderlich ist.


**Assembly-Filter**
In der Hauptansicht kann zunächst eine Assembly (Filterauswahl) vorgenommen werden. Hier wird festgelegt, welche Einträge angezeigt werden. Die Auswahl kann jederzeit ergänzt werden. Standardmäßig zeigt eine Assembly alle Einträge an. Eine Assembly kann eine Meetinggruppe, ein Team oder ein einzelner Benutzer sein. Dabei wird auch die Sortierreihenfolge festgelegt (z. B. nach Rank, Voting, Sterne, Typ oder Status).

Im Assembly-Filter gibt es einen Include-Filter: Hier werden alle Entry.IDs gelistet, die auf jeden Fall angezeigt werden sollen. Zum Hinzufügen von Einträgen steht eine Volltextsuche zur Verfügung.
Ebenso gibt es eine Exclude-Filter-Liste, die Entry.IDs enthält, die explizit ausgeschlossen werden sollen.

Zusätzliche Filter (AND-Verknüpfung):
Hier müssen alle Bedingungen erfüllt sein, damit ein Eintrag angezeigt wird. Ist nichts ausgewählt wird nicht danach gefiltert. Man kann über eine Checkbox festlegen ob dieser Wert auch in der Assemby Übersicht angezeigt werden soll. Ist die checkbox nicht gesetzt wird diese Spalte in der Assemby Übersicht nicht angezeigt, der Filter beleibt aber weiter aktiv. Standardmäßig sind alle Checkboxen ausgewählt.
- [X] Datum: Von / Bis
- [X] Typ: Auswahl der Typen
- [X] Label: Auswahl der Labels
- [X] Status: Auswahl der Status
- [X] Voting: Mindestbewertung
- [X] Sterne: Minimale Sternanzahl

Bei Typ, Label und Status können neue oder bestehende Elemente hinzugefügt oder entfernt werden. 




**Assembly-Übersicht:**
Eine Assembly ist eine gefilterte Liste von Einträgen mit konfigurierbarer Spaltenanzeige. Die Beschreibung erfolgt im Markdown-Format. Benutzer können Daumen hoch/runter für Einträge abgeben, die Gesamtbewertung wird aufsummiert (+1 / -1). Sterne-Bewertungen sind in 0.5-Schritten veränderbar. Die Reihenfolge (Rank) lässt sich per Drag & Drop anpassen. Der Rank wird intern von OrganAIzer über eine Nummer verwaltet.

Am unteren Rand der Ansicht befindet sich ein Prompt-Feld für KI-Abfragen. Die Filter können in dieser Ansicht einfach angepasst werden, die Sortierung aber nur temporär verändert werden.

**Eintrag bearbeiten:**
Beim Bearbeiten eines Eintrags können alle Felder editiert werden. Die Beschreibung wird entweder als Markdown-Vorschau oder als editierbarer Text angezeigt. Labels können hinzugefügt oder gelöscht werden. Typ und Status können durch Auswahl aus einer Datenbankliste geändert werden. Eine einfache Bedienung ist wichtig.

**Bearbeiten von Typ, Status, Label, RelationUser, RelationEntry:**
Diese Werte sind mandantenweit in der Datenbank gespeichert. Eine Verwaltungsoberfläche erlaubt das Bearbeiten von Namen, Beschreibungen, Farben, Icons etc. Die Oberfläche ist direkt aus dem Eintrag heraus erreichbar. Verknüpfungen können hinzugefügt oder geändert werden.



**Reports:**
Zu jeder Assembly kann ein PDF-Report erstellt werden.  Ein Report kann ein Template für eine Meeting Agenda sein. Dazu muss die Meeting Länge festgelegt werden wenn eine Timeline erstellt werden soll. Ein Weiterer Report kann ein Meeting protokoll sein. Hier werden alle Inhalte noch einmal zusammengefasst und eine Liste an ToDo’s erstelt:
- Meeting-Agenda (mit Zeitplan)
- Meeting-Protokoll (mit Aufgaben)


**Über das Projekt:**
Das Produkt befindet sich in Entwicklung und sucht Open-Source-Entwickler.
Für den SaaS-Service werden europäische Server gemäß DSGVO genutzt. Im Self-Hosting-Betrieb können DSGVO-Anforderungen selbst umgesetzt und das Hosting frei gewählt werden.



**Architektur:**
Die Daten liegen in einer PostgreSQL-Datenbank. Pro Mandant existiert eine eigene Datenbank. Der Zugriff erfolgt ausschließlich über Hasura via GraphQL. Es werden keine Strukturen im Frontend gehalten, die in der Datenbank definiert sind. Das Frontend wird vollständig durch die Daten gesteuert, was Erweiterungen erleichtert. Die Backend-Logik – insbesondere die KI-Interaktion – wird über ein separates Backend umgesetzt. Das React-Frontend mit Vite dient zur Darstellung und Interaktion.

Das Backend Behandelt die Logik und vor allem die AI interaktion von OrganAIzer. Im React Frontent mit Vite werden und die entsprechenden Daten dargestellt und Manipulationsmöglichkeiten zur verfügung gestellt. 

OrganAIzer ist als SaaS in der Cloud oder als Open-Source-Projekt zum Selbst-Hosting verfügbar.
- **SaaS Free**: max. 100 Einträge, 10 AI-Zugriffe
- **SaaS Basic**: 1 Mio. Einträge, 1000 AI-Zugriffe/Monat, 19 $/User
- **SaaS Enterprise**: unbegrenzt, mit Entra ID, MCP Server, Backups etc., 49 $/User
- **Self-Hosted**: kostenlos


**Webseite für OrganAIzer.App** (Deutsch/Englisch)
**Menüstruktur:**
- Produkte → OrganAIzer SaaS
- Produkte → OrganAIzer Self Hosted
- Produkte → OrganAIzer Kundenanpassungen (nach Aufwand)
- Technologie → PostgreSQL, Hasura, AI, React, Vite, Docker etc.
- AI → Beschreibung der KI-Funktionalität
- Preise → Übersicht SaaS & Self Hosted
- Über uns / About → Kontaktformular