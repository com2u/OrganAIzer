# User Manual for OrganAIzer.App

## Introduction
OrganAIzer is a modern, AI-powered application designed for collaborative planning, execution, and documentation of meetings and tasks. This manual outlines the core features, user interface, and workflows in OrganAIzer.

---

## 1. Core Concepts

### Entry
An entry represents the smallest unit of information. It consists of:
- Title (heading)
- Content (Markdown-formatted)
- Type (e.g. Info, ToDo, Note)
- Status (e.g. Open, Active, Done)
- Labels (e.g. Development, HR)
- Responsible person
- Last modified date
- Star rating
- Voting (thumbs up/down)

### Assembly
An Assembly is a user-defined, filterable collection of entries. It can be used for teams, projects, or meetings.

### User Roles
OrganAIzer defines three user roles:
- **Viewer**: Read-only access
- **Editor**: Create and edit entries
- **Administrator**: Full access to all data and configuration

---

## 2. User Interface

### Main View
- Displays entries based on an Assembly filter
- Sorting and filtering by type, label, status, voting, stars, date
- Buttons for voting, star rating, editing
- Prompt field for AI interaction

### Edit Entry
- Markdown editor with live preview
- Selection fields for type, status, labels
- UI for relations between entries

### Administration
- Manage global tables: Types, Statuses, Labels, Relations
- Interface to edit icons, colors, descriptions

---

## 3. Features

### Create and Edit Entries
- Create new entries via main menu
- Format content with Markdown
- Assign labels and types

### Filters and Assemblies
- Include/Exclude specific Entry.IDs
- Combine additional filters (date, type, status, voting, stars)
- Save as reusable Assembly views

### AI Support
- Summarize content automatically
- Generate suggestions for entries and relationships
- Generate and adapt entries using prompts

### Reports
- Export PDF for meeting agenda or protocol
- Optional: Allocate time per topic

---

## 4. Architecture

- **Frontend**: React + Vite
- **Backend**: Docker + Hasura (GraphQL)
- **Database**: PostgreSQL (multi-tenant support)
- No hardcoded frontend structures – fully data-driven

---

## 5. Hosting Options

### SaaS Plans
| Plan        | Limits                          | Price        |
|-------------|----------------------------------|--------------|
| Free        | 100 entries, 10 AI interactions | free         |
| Basic       | 1M entries, 1000 AI/month       | $19/User     |
| Enterprise  | unlimited + IDP + backup        | $49/User     |

### Self-Hosting
- Full control over hosting and data
- GDPR compliant
- Open Source, free

---

## 6. Support & Contribution

- Project is open source (contributors welcome)
- Contact and bug reports via: **organAIzer.app**

---

## 7. License
OrganAIzer is published under an open-source license. See repository for details.

---

## 8. FAQ
**Q: What happens if I delete an Assembly?**
A: Only the filter is deleted – entries remain untouched.

**Q: Can I define my own label sets?**
A: Yes, via the label management interface.

**Q: Is Markdown fully supported?**
A: Common Markdown elements like headers, lists, links, and code blocks are supported.

---

_End of manual._

