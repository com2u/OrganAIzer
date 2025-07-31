# Domain Model – OrganAIzer.App

This document defines the domain model of OrganAIzer.App using core DDD building blocks: Entities, Value Objects, Aggregates, Domain Services, and Events.

---

## 📦 Aggregates

### EntryAggregate
**Aggregate Root:** `Entry`

**Entities:**
- `Entry`
- `EntryLabel`
- `EntryPermission`
- `EntryRelation`
- `EntryUserRelation`
- `Voting`
- `Stars`

**Value Objects:**
- `Type` (includes name, description, icon)
- `Status` (includes name, description, icon)
- `Label` (includes name, description, color, icon)
- `PermissionGroup` (with [CRUD] access flags and user/group assignments)

**Invariants:**
- An `Entry` must always have a `Type`, `Status`, and `Key`.
- Relations must always point to a valid `Entry`.
- PermissionGroups must be defined before assignment.

---

### AssemblyAggregate
**Aggregate Root:** `Assembly`

**Entities:**
- `Assembly`
- `AssemblyInclude`
- `AssemblyExclude`
- `AssemblyFilter`
- `AssemblyConfig`

**Value Objects:**
- `AssemblyFilterRule` (type, label, status, voting, stars, date from/to)
- `ViewType` (Enum: ReadOnly, Interactive, Report)
- `LanguageSetting`

**Invariants:**
- Each Assembly must have a unique name per tenant.
- At least one display mode or filter must be configured.

---

## 👤 Entities

### Entry
Represents a structured item in the system (task, note, idea). Identified by `Key`.
- title: string
- content: markdown
- type: Type
- status: Status
- labels: [Label]
- voting: [Voting]
- stars: float
- permissions: [EntryPermission]
- rank: numeric

### Assembly
Represents a filtered and formatted view of entries for a purpose (meeting, dashboard).
- name: string
- filters: [AssemblyFilter]
- includes: [Entry.id]
- excludes: [Entry.id]
- config: AssemblyConfig
- language: EN | DE

### Voting
User interaction object, captures feedback on entries.
- entryKey: Entry.id
- userId: string
- value: +1 | -1

### PermissionGroup
Group for assigning access rights to multiple users.
- name: string
- access: [C, R, U, D]
- members: [userId]

---

## 📦 Value Objects

### Type
- type: string
- description: string
- icon: string (FontAwesome class)

### Status
- status: string
- description: string
- icon: string (FontAwesome class)

### Label
- label: string
- description: string
- color: HEX
- icon: string (FontAwesome class)

### EntryRelation
- sourceEntry: Entry.id
- targetEntry: Entry.id
- relationType: string

### EntryUserRelation
- entry: Entry.id
- user: string
- relationType: string

---

## ⚙️ Domain Services

### EntryRankService
Calculates or adjusts the rank (order) of an entry within an Assembly.

### EntryScoringService
Aggregates stars, votes, and other user metrics into a unified score.

### AIEntryService
Takes user prompt and returns a generated entry or suggestions (e.g. title, content, label).

### ReportGeneratorService
Converts Assembly + Entries into a structured PDF file.

---

## 📣 Domain Events (Future)
- `EntryCreated`
- `EntryUpdated`
- `EntryVoted`
- `AssemblyGenerated`
- `ReportCreated`
- `AIEntrySuggestionMade`

---

This model will evolve as features are added or restructured. All naming should stay aligned with the [Ubiquitous Language Dictionary](./organAIzer_ubiquitous_language.md).

