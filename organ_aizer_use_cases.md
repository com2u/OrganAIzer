# Domain Use Cases – OrganAIzer.App (DDD)

This document describes the core **application-level use cases** for OrganAIzer.App based on the Domain Model and Ubiquitous Language. Each use case defines inputs, actors, triggers, and outcomes.

---

## ✅ Entry Management

### Use Case: Create Entry
- **Actor**: Editor, Admin
- **Input**: title, content, type, status, labels, permissions
- **Trigger**: User clicks “New Entry”
- **Outcome**: New entry is stored and assigned a unique key
- **Invariants**: Type and Status must exist; content must not be empty

### Use Case: Edit Entry
- **Actor**: Editor, Admin
- **Input**: entry ID, updated fields (title, content, etc.)
- **Trigger**: User clicks “Edit”
- **Outcome**: Entry updated

### Use Case: Delete Entry
- **Actor**: Admin
- **Input**: entry ID
- **Trigger**: User clicks “Delete”
- **Outcome**: Entry is removed or flagged (soft delete)

### Use Case: Assign Labels to Entry
- **Actor**: Editor
- **Input**: entry ID, list of label IDs
- **Outcome**: Entry gets tagged

### Use Case: Vote on Entry
- **Actor**: Any authenticated user
- **Input**: entry ID, vote (+1 or -1)
- **Outcome**: Vote is stored or updated

### Use Case: Star Entry
- **Actor**: Any authenticated user
- **Input**: entry ID, star value (0.5 to 5.0)
- **Outcome**: Star rating is applied

---

## 📚 Assembly Management

### Use Case: Create Assembly
- **Actor**: Editor, Admin
- **Input**: name, filters, includes/excludes, config
- **Outcome**: Assembly created for use

### Use Case: Update Assembly Filter
- **Actor**: Editor
- **Input**: Assembly ID, updated filter set
- **Outcome**: Entry list is re-evaluated

### Use Case: Include/Exclude Entry in Assembly
- **Actor**: Editor
- **Input**: Assembly ID, Entry ID, mode (include/exclude)
- **Outcome**: Entry is added to specific override list

### Use Case: Change Assembly Sort/Rank
- **Actor**: Editor
- **Input**: Assembly ID, Entry ID, new Rank
- **Outcome**: Rank is adjusted in Assembly view

### Use Case: Switch Language in Assembly
- **Actor**: Any user
- **Outcome**: UI is updated in selected language

---

## 📄 Report Generation

### Use Case: Generate Meeting Agenda (PDF)
- **Actor**: Editor
- **Input**: Assembly ID, meeting length
- **Outcome**: PDF with timed agenda is generated

### Use Case: Generate Meeting Protocol
- **Actor**: Editor, AI
- **Input**: Assembly ID, meeting content (optionally transcript)
- **Outcome**: PDF with summary and ToDos is created

---

## 🧠 AI Interaction

### Use Case: Prompt AI for Entry Creation
- **Actor**: Editor
- **Input**: Prompt text
- **Outcome**: Suggested Entry (title, content, type, etc.) is returned

### Use Case: Generate Summary of Entry
- **Actor**: Any user
- **Input**: Entry ID
- **Outcome**: Short summary of content is returned

### Use Case: Generate Subtasks from Entry
- **Actor**: Editor
- **Input**: Entry ID
- **Outcome**: List of subtasks generated and suggested

---

## 🔒 Access and Permission Management

### Use Case: Assign Permission Group to Entry
- **Actor**: Admin
- **Input**: Entry ID, group ID
- **Outcome**: Permissions updated

### Use Case: Create/Edit Permission Group
- **Actor**: Admin
- **Input**: group name, user list, rights (CRUD)
- **Outcome**: Group created or modified

---

## 🧱 System Admin Use Cases

### Use Case: Manage Types, Statuses, Labels, Relations
- **Actor**: Admin
- **Input**: Create, update, delete type/label/status definitions
- **Outcome**: Global vocabularies updated

### Use Case: Switch Tenant Context
- **Actor**: System Admin
- **Input**: Tenant ID
- **Outcome**: User is operating in a separate data context

---

These use cases define the basis for services, endpoints, GraphQL mutations, and UI workflows in OrganAIzer.

