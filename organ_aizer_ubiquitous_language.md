# Ubiquitous Language Dictionary – OrganAIzer.App

This dictionary defines the shared domain language used in all parts of the OrganAIzer system (code, UI, documentation, discussions). It helps align developers, designers, testers, and stakeholders under a consistent vocabulary.

---

## Entry
A unit of information created by users. Each entry contains a title, markdown-formatted content, metadata (type, status, labels), and can be voted on or rated.
- **Key**: Unique identifier for the entry.
- **Type**: Describes the nature of the entry (e.g. Info, ToDo, Note).
- **Status**: Indicates progress (e.g. Open, Done, Active).
- **Labels**: Tags that classify entries by category or department.
- **Stars**: A rating from users (0.5 to 5 stars).
- **Voting**: Up/down thumbs indicating user agreement or interest.
- **Rank**: A numeric sort index (used for ordering in assemblies).
- **Permissions**: Defines access rights for users/groups.

## Assembly
A collection of entries selected and filtered for a specific purpose (e.g. team view, meeting preparation).
- **Include List**: Entry IDs that must be shown.
- **Exclude List**: Entry IDs that must be hidden.
- **Filters**: Rules that define which entries are included based on metadata.
- **Config**: UI-level configuration for column visibility, sort order.
- **View Types**: Can be used as a read-only list, interactive interface, or report template.

## Label
A classification used to group entries by topic, department, or workflow.
- **Name**: Short text identifier.
- **Color**: Used for visual grouping.
- **Description**: Optional explanation.

## Status
Describes the lifecycle or progress of an entry.
Examples: Open, Active, Done, Suspended.

## Type
Specifies the kind of information represented by the entry.
Examples: Info, Note, ToDo, Option.

## Relation
A named connection between two entries or between a user and an entry.
Examples: “Part Of”, “Relates To”, “Owner”.

## PermissionGroup
A named access control group that grants CRUD rights to entries for users or teams.
- **Users**: Individuals assigned to the group.
- **Rights**: Create, Read, Update, Delete flags.

## Voting
A system that allows users to express interest or priority.
- **Thumbs Up**: +1
- **Thumbs Down**: -1
- **Net Score**: Sum of all votes

## Stars
A user-based quality indicator (0.5 to 5.0 stars per entry).
Used to evaluate usefulness or importance.

## EntryRelation
A data structure linking two entries via a relation type.

## EntryUserRelation
A data structure linking a user to an entry with a specific relation.

## Prompt
A free text input field used to communicate with the AI backend.
Used to generate, summarize, or update entries.

## Report
A generated PDF output of an assembly, either as:
- **Agenda**: Planned topics and time allocation.
- **Protocol**: Record of discussed items and decisions.

## Tenant
A logical data partition for isolated teams or organizations.
Each tenant has its own entries, assemblies, types, statuses, labels.

## Language Switch
A UI component allowing the user to toggle between German and English views.

## Rank
A long numeric value used to determine sort order across entries. Can be adjusted by users via drag and drop.

## AI Suggestion
Content created or proposed by the AI engine in response to prompts. Can be accepted or edited by the user.

---

This document is subject to expansion as the system grows. It serves as the foundation for clear, domain-aligned communication across development, product, and stakeholder conversations.

