**OrganAIzer**
The OrganAIzer app supports the execution of meetings and management tasks. OrganAIzer is more than just a to-do app. It allows users to collect, structure, and organize various types of content for different use cases. It includes an interactive representation called Assemblies, which compile content for various teams or meetings. OrganAIzer is designed for group collaboration. Content can be filtered and combined in different ways. Each Assembly can be presented as a read-only overview, an interactive interface, or a report (e.g., meeting agenda or meeting minutes). OrganAIzer allows you to create tasks, information items, and to-dos. Entries can be interlinked and rated by users. This makes it easier to prepare, conduct, and document meetings. Various permission levels control access to entries. OrganAIzer aims to provide maximum transparency for users.

**How does the AI help?**
The AI can structure entries. Content can be passed to the AI, which then generates entries and links automatically. The AI provides suggestions that can be adjusted or accepted by the user. It can create summaries, split entries, or create subentries. The use of AI enables multiple input channels, which can be adapted to customer tools.

**Description**
OrganAIzer is a React app with light and dark mode.
The app manages entries organized in a hierarchical structure.
Each entry consists of a title and markdown-formatted content.
The order of content can be adjusted.
Participants can rate entries with thumbs up/down and assign stars.
Entries have an assignee, a last updated timestamp, and a status. Status fields can be customized.
All content can be labeled using a predefined set of labels.
The main page is used to edit and manage to-do entries. Interfaces for managing labels and statuses are available.
Users can be assigned to different user groups: Viewers, Editors, and Administrators.
The application is built with Vite, runs in a Docker container, and stores data in a PostgreSQL database via Hasura GraphQL.

**Idea:**
Meetings are often poorly planned. There are recurring meetings with little structure. Agendas are rarely created. OrganAIzer helps plan content for each meeting and define a useful sequence. During preparation, a timeline is suggested to ensure enough time is allocated to each topic. Every participant gets an overview of the current topics and can influence planning via voting, star ratings, and ordering. OrganAIzer is a collaborative tool. Entries can be created directly in the meeting interface. A transcript can be attached as well. After the meeting, OrganAIzer can generate minutes and extract to-dos automatically. Users decide how much the AI handles automatically or whether manual confirmation is required.

**Assembly Filter**
In the main view, an Assembly (filter selection) can be created. It determines which entries are displayed. The filter can be modified at any time. By default, all entries are shown. An Assembly can represent a meeting group, team, or individual. The sorting method is also configurable (e.g., by Rank, Voting, Stars, Type, or Status).

The Assembly filter includes an Include list: a set of Entry.IDs that should always be displayed. A full-text search helps add entries.
There is also an Exclude list, where Entry.IDs that should never be displayed are defined.

Additional filters (AND conditions):
All conditions must be met for an entry to be shown. If nothing is selected, no filtering takes place. Each filter has a checkbox that determines whether the corresponding column appears in the Assembly overview. If unchecked, the filter remains active but the column is hidden. All checkboxes are selected by default.
- [X] Date: From / To
- [X] Type: Select types
- [X] Label: Select labels
- [X] Status: Select statuses
- [X] Voting: Minimum voting value
- [X] Stars: Minimum star count

Types, labels, and statuses can be added or removed freely.

**Assembly Overview:**
An Assembly is a filtered list of entries with configurable visible columns. Descriptions are written in Markdown. Users can vote thumbs up/down; the total vote count is calculated (+1 / -1). Star ratings can be set in 0.5-star increments. Order (Rank) can be changed via drag & drop. Rank values are stored internally in OrganAIzer as numeric keys.

At the bottom of the view is a prompt field for AI queries. Filters can be easily adjusted; sorting changes are temporary.

**Edit Entry:**
When editing an entry, all fields are editable. The description can be previewed in Markdown or edited as plain text. Labels can be added or removed. Type and Status can be selected from a database list. Simple operation is prioritized.

**Editing Type, Status, Label, RelationUser, RelationEntry:**
These values are stored tenant-wide in the database. A management interface allows editing names, descriptions, colors, icons, etc. It is accessible directly from within an entry. Relationships can be created or modified here.

**Reports:**
Each Assembly can generate a PDF report. Reports can serve as meeting agendas or minutes. If a timeline is required, the meeting duration must be specified.
- Meeting agenda (with timeline)
- Meeting minutes (with tasks)

**About the Project:**
The product is currently in development and seeks open-source contributors.
The SaaS service runs on GDPR-compliant European servers. Self-hosting users can meet all GDPR requirements and choose their own hosting solution.

**Architecture:**
Data is stored in a PostgreSQL database. Each tenant has a separate database. Access is exclusively via Hasura and GraphQL. No fixed data structure exists in the frontend—everything is controlled via the database schema, making extensions simple. Backend logic, especially AI interaction, is handled separately. The React frontend (built with Vite) displays data and provides manipulation tools.

OrganAIzer is available as a cloud-based SaaS or as an open-source self-hosted project.
- **SaaS Free**: max. 100 entries, 10 AI queries
- **SaaS Basic**: 1 million entries, 1000 AI queries/month, $19/user
- **SaaS Enterprise**: unlimited entries, Entra ID, MCP server, backups, $49/user
- **Self-Hosted**: free

**Website for OrganAIzer.App** (German/English)
**Menu structure:**
- Products → OrganAIzer SaaS
- Products → OrganAIzer Self-Hosted
- Products → OrganAIzer Custom Solutions (billed per effort)
- Technology → PostgreSQL, Hasura, AI, React, Vite, Docker etc.
- AI → Description of AI features
- Pricing → SaaS & Self-Hosted pricing overview
- About → Contact form

