# OrganAIzer Frontend Design System Specification

Based on my analysis of the current OrganAIzer React application, here's a comprehensive design specification for recreating the same look and feel:

## **Typography**

- **Primary Font**: `JetBrains Mono` (monospace)
- **Font Stack**: `'JetBrains Mono', 'ui-sans-serif', 'system-ui'`
- **Usage**: Applied to all text elements throughout the application
- **Character**: Modern, technical, clean monospace aesthetic

## **Color Palette**

### **Pastel Color System**

The application uses a distinctive pastel gradient system:

```css
colors: {
  'pastel-blue': '#A0C4FF',
  'pastel-purple': '#BDB2FF',
  'pastel-pink': '#FFC6FF',
  'pastel-red': '#FFADAD',
  'pastel-orange': '#FFD6A5',
  'pastel-yellow': '#FDFFB6',
  'pastel-green': '#CAFFBF',
  'pastel-cyan': '#9BF6FF'
}
```

### **Base Colors**

- **Primary Background**: White (`#FFFFFF`)
- **Text**: Black (`#000000`) and various gray shades
- **Borders**: Consistent 2px black borders (`border-2 border-black`)
- **Accent**: Blue hover states (`hover:text-blue-600`)

## **Screen Descriptions**

### **Top Navigation Bar**

- Displays the large logo (`logo.png`) and the application title: `organAIzer.app`
- Includes icons for Filter, Settings, and User Profile
- Responsive design with hamburger menu for mobile

### **Main Screen**

- Assembly selection interface
- `Edit Assembly` button to modify the currently selected filter

#### **Toolbar Functions**

- Select All / Unselect All
- Search (opens modal dialog to search and add entries)
- Set Type / Set Status
- Add Label (via Label Picker)
- Add EntryReference (relation dialog)
- Export options: PDF / Web Page
- Edit Permissions for selected entries

#### **Table Header and Entry Table**

- Columns defined by current Assembly filter
- Sortable headers: Drag & Drop handle, Title, Type, Content, Status, Labels, Stars, Votes, Timestamp, Hide, Delete

#### **Table Rendering**

- Type, Status, Labels, and Relations are rendered as rounded buttons
- Clicking Type or Status opens selection dialogs
- Labels and Links open dialogs to manage (add/remove)
- Stars shown in 0.5 increments
- Votes show up/down counts
- Hide: session-only (not persistent)
- Delete: confirmation before deletion

#### **Prompt Input**

- Large text box for sending prompts to backend (to be implemented)

### **Edit Entry Screen**

- Fields: Title, Type, Status, Labels, Stars, Votes, EntryRelations, Users, Permissions
- Markdown Content Editor (switch between preview and edit mode)
- Read-only fields: CreatedAt, UpdatedAt, CreatedBy, UpdatedBy
- File Upload (files embedded/rendered in Markdown)

### **Edit Assembly Screen**

- Define filters for table view
- Always visible: Include List (Entry IDs)
- Always excluded: Exclude List (Entry IDs)
- AND filters (checkbox toggles for column visibility):
  - Timestamp/Date Range
  - Type
  - Label
  - Status
  - Voting (minimum threshold)
  - Stars
  - Users
  - Permissions
- Fields: Name (unique), Description (optional)

### **Edit Types Screen**

- CRUD interface for Type objects
- Fields: Type Name, Description, Icon (FontAwesome Picker)

### **Edit Status Screen**

- CRUD interface for Status entries
- Fields: Status Name, Description, Color (Picker), Icon (Picker)

### **Edit Labels Screen**

- CRUD interface for Labels
- Fields: Label Name, Description, Color (Picker), Icon (Picker)

### **Edit Relations Screen**

- CRUD interface for Entry Relations (e.g. consists of, blocks)
- Fields: Relation Name, Description, Color (Picker)

### **EntryReference Dialog**

- Set a relation between two entries
- Preset EntryKeyA (current entry)
- Select Relation Type and EntryKeyB via search dialog

### **Footer**

- Contains logo with link to [https://organAIzer.app](https://organAIzer.app)
- Text: `© 2025 OrganAIzer.App. All rights reserved.`
- Links: About (version, support), Help (help page)

## **Remaining Sections**

*(Unchanged sections for Typography, Color Palette, Layout, Card, Buttons, Visual Design, Grid, Icons, etc. are kept as defined above.)*

