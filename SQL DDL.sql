-- SQL DDL for Entry Management System (Improved)

-- 1. Type Table
CREATE TABLE Type (
    Type TEXT PRIMARY KEY,
    Description TEXT NOT NULL,
    Icon TEXT
);

INSERT INTO Type (Type, Description, Icon) VALUES
('Info', 'To be noticed', 'fas fa-info-circle'),
('ToDo', 'To be done', 'fas fa-tasks'),
('Note', 'Additional note', 'fas fa-sticky-note'),
('Option', 'One of several options to be decided', 'fas fa-toggle-on');

-- 2. Status Table
CREATE TABLE Status (
    Status TEXT PRIMARY KEY,
    Description TEXT NOT NULL,
    Color CHAR(7) NOT NULL,
    Icon TEXT
);

INSERT INTO Status (Status, Description, Color, Icon) VALUES
('Open', 'To be done', '#54FF7E', 'fas fa-folder-open'),
('Done', 'Is closed', '#4261FF', 'fas fa-check-circle'),
('Active', 'Currently working on', '#FFAC68', 'fas fa-spinner'),
('Suspend', 'Won’t do', '#686868', 'fas fa-ban');

-- 3. Labels Table
CREATE TABLE Labels (
    Label TEXT PRIMARY KEY,
    Description TEXT NOT NULL,
    Color CHAR(7) NOT NULL,
    Icon TEXT
);

INSERT INTO Labels (Label, Description, Color, Icon) VALUES
('Development', 'Software development', '#FFC138', 'fas fa-code'),
('Management', 'Boss', '#D13438', 'fas fa-briefcase'),
('HR', 'Human resources', '#005FFF', 'fas fa-users'),
('Sales', 'Sales department', '#FD8623', 'fas fa-chart-line'),
('Proc', 'Procurement', '#B6FF00', 'fas fa-shopping-cart');

-- 4. Relation Table
CREATE TABLE Relation (
    Name TEXT PRIMARY KEY,
    Description TEXT NOT NULL,
    Color CHAR(7)
);

-- 5. PermissionGroup Table
CREATE TABLE PermissionGroup (
    id TEXT PRIMARY KEY,
    Name TEXT NOT NULL,
    CanCreate BOOLEAN DEFAULT FALSE,
    CanRead BOOLEAN DEFAULT TRUE,
    CanUpdate BOOLEAN DEFAULT FALSE,
    CanDelete BOOLEAN DEFAULT FALSE
);

-- 6. PermissionGroupMembership Table
CREATE TABLE PermissionGroupMembership (
    GroupId TEXT REFERENCES PermissionGroup(id),
    PrincipalId TEXT NOT NULL,
    Type TEXT CHECK (Type IN ('User', 'Group')),
    PRIMARY KEY (GroupId, PrincipalId)
);

-- 7. Entry Table
CREATE TABLE Entry (
    Key UUID PRIMARY KEY,
    Datetime TIMESTAMP NOT NULL,
    Title TEXT NOT NULL,
    Content TEXT NOT NULL,
    Type TEXT NOT NULL REFERENCES Type(Type),
    Status TEXT NOT NULL REFERENCES Status(Status),
    Stars INT DEFAULT 0,
    Rank FLOAT DEFAULT 0.0,
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UpdatedAt TIMESTAMP DEFAULT NOW(),
    CreatedBy TEXT,
    UpdatedBy TEXT
);

-- Sample entries for software development
INSERT INTO Entry (Key, Datetime, Title, Content, Type, Status, Stars, Rank, CreatedBy, UpdatedBy)
VALUES
('11111111-1111-1111-1111-111111111111', NOW(), 'Implement login feature', 'Create a secure login system using Azure Entra ID.', 'ToDo', 'Open', 0, 0.0, 'user_dev', 'user_dev'),
('22222222-2222-2222-2222-222222222222', NOW(), 'Code review checklist', 'Draft a checklist for consistent code reviews.', 'Note', 'Active', 2, 4.5, 'user_lead', 'user_lead'),
('33333333-3333-3333-3333-333333333333', NOW(), 'OAuth token expiry issue', 'Investigate reported issue with short-lived OAuth tokens.', 'Info', 'Open', 1, 3.2, 'user_dev', 'user_test'),
('44444444-4444-4444-4444-444444444444', NOW(), 'Backend framework options', 'Compare Express, Fastify, and NestJS for backend architecture.', 'Option', 'Suspend', 0, 0.0, 'user_arch', 'user_arch'),
('55555555-5555-5555-5555-555555555555', NOW(), 'CI pipeline setup', 'Configure GitHub Actions to run test and build jobs.', 'ToDo', 'Open', 0, 0.0, 'user_ops', 'user_ops'),
('66666666-6666-6666-6666-666666666666', NOW(), 'Create user personas', 'Define example personas to guide UI/UX development.', 'Note', 'Done', 3, 5.0, 'user_ux', 'user_ux'),
('77777777-7777-7777-7777-777777777777', NOW(), 'Deploy test environment', 'Deploy containerized test environment to staging.', 'ToDo', 'Active', 1, 4.0, 'user_dev', 'user_dev'),
('88888888-8888-8888-8888-888888888888', NOW(), 'Security audit', 'Review code for OWASP Top 10 vulnerabilities.', 'Info', 'Open', 0, 0.0, 'user_sec', 'user_sec'),
('99999999-9999-9999-9999-999999999999', NOW(), 'Evaluate SaaS options', 'Review available SaaS monitoring solutions.', 'Option', 'Active', 2, 3.8, 'user_it', 'user_it'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', NOW(), 'Document REST API', 'Write Swagger documentation for all API endpoints.', 'Note', 'Open', 1, 3.0, 'user_doc', 'user_doc'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', NOW(), 'Sprint retrospective topics', 'Collect feedback and discussion points for sprint retro.', 'Note', 'Open', 0, 0.0, 'user_scrum', 'user_scrum'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', NOW(), 'Error handling strategy', 'Define how errors are managed and logged across the stack.', 'Info', 'Done', 2, 4.2, 'user_dev', 'user_dev');

-- Assigning labels to entries
INSERT INTO EntryLabels (EntryKey, Label) VALUES
('11111111-1111-1111-1111-111111111111', 'Development'),
('22222222-2222-2222-2222-222222222222', 'Development'),
('22222222-2222-2222-2222-222222222222', 'Management'),
('33333333-3333-3333-3333-333333333333', 'Development'),
('44444444-4444-4444-4444-444444444444', 'Development'),
('55555555-5555-5555-5555-555555555555', 'Development'),
('55555555-5555-5555-5555-555555555555', 'Proc'),
('66666666-6666-6666-6666-666666666666', 'HR'),
('66666666-6666-6666-6666-666666666666', 'Management'),
('77777777-7777-7777-7777-777777777777', 'Development'),
('88888888-8888-8888-8888-888888888888', 'Development'),
('88888888-8888-8888-8888-888888888888', 'Management'),
('99999999-9999-9999-9999-999999999999', 'Proc'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Development'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'HR'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Management'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Development');

-- 8. EntryLabels Table (normalized many-to-many)
CREATE TABLE EntryLabels (
    EntryKey UUID REFERENCES Entry(Key),
    Label TEXT REFERENCES Labels(Label),
    PRIMARY KEY (EntryKey, Label)
);

-- 9. EntryPermissions Table (normalized many-to-many)
CREATE TABLE EntryPermissions (
    EntryKey UUID REFERENCES Entry(Key),
    PermissionGroupId TEXT REFERENCES PermissionGroup(id),
    PRIMARY KEY (EntryKey, PermissionGroupId)
);

-- 10. EntryRelations Table (fixed spelling and clear naming)
CREATE TABLE EntryRelations (
    EntryKeyA UUID NOT NULL REFERENCES Entry(Key),
    Relation TEXT NOT NULL REFERENCES Relation(Name),
    EntryKeyB UUID NOT NULL REFERENCES Entry(Key),
    PRIMARY KEY (EntryKeyA, Relation, EntryKeyB)
);

-- 11. Voting Table
CREATE TABLE Voting (
    EntryKey UUID NOT NULL REFERENCES Entry(Key),
    User TEXT NOT NULL,
    Voting INT NOT NULL CHECK (Voting IN (-1, 0, 1)),
    PRIMARY KEY (EntryKey, User)
);

-- 12. EntryUserRelation Table (renamed and purpose clarified)
CREATE TABLE EntryUserRelation (
    EntryKey UUID NOT NULL REFERENCES Entry(Key),
    RelationName TEXT NOT NULL REFERENCES Relation(Name),
    User TEXT NOT NULL,
    PRIMARY KEY (EntryKey, RelationName, User)
);

-- 13. Indexes for performance
CREATE INDEX idx_entry_status ON Entry(Status);
CREATE INDEX idx_entry_type ON Entry(Type);
CREATE INDEX idx_entry_labels ON EntryLabels(Label);
CREATE INDEX idx_voting_entry ON Voting(EntryKey);

-- Assembly Table Definition
CREATE TABLE Assembly (
    Id UUID PRIMARY KEY,
    Name TEXT NOT NULL,
    Description TEXT,
    Owner TEXT NOT NULL,
    CreatedAt TIMESTAMP DEFAULT NOW(),
    UpdatedAt TIMESTAMP DEFAULT NOW(),
    SortOrder TEXT DEFAULT 'Rank', -- e.g., 'Rank', 'Voting', 'Stars', 'Type', 'Status'
    IsDefault BOOLEAN DEFAULT FALSE
);

-- AssemblyIncludes: Entries that must always be shown
CREATE TABLE AssemblyInclude (
    AssemblyId UUID REFERENCES Assembly(Id),
    EntryKey UUID REFERENCES Entry(Key),
    PRIMARY KEY (AssemblyId, EntryKey)
);

-- AssemblyExcludes: Entries that must be hidden
CREATE TABLE AssemblyExclude (
    AssemblyId UUID REFERENCES Assembly(Id),
    EntryKey UUID REFERENCES Entry(Key),
    PRIMARY KEY (AssemblyId, EntryKey)
);

-- AssemblyFilters: AND-combined filters
CREATE TABLE AssemblyFilter (
    AssemblyId UUID REFERENCES Assembly(Id),
    FilterType TEXT CHECK (FilterType IN ('Date', 'Type', 'Label', 'Status', 'Voting', 'Stars', 'Users', 'Permissions')),
    Value TEXT NOT NULL,
    VisibleInView BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (AssemblyId, FilterType, Value)
);

-- AssemblyConfig: Defines which columns are shown in the UI
CREATE TABLE AssemblyConfig (
    AssemblyId UUID REFERENCES Assembly(Id),
    ColumnName TEXT NOT NULL,
    IsVisible BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (AssemblyId, ColumnName)
);

-- Sample Assembly
INSERT INTO Assembly (Id, Name, Description, Owner)
VALUES 
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Weekly Team Meeting', 'Zusammenstellung aller relevanten Themen für das wöchentliche Teammeeting.', 'user_teamlead');

-- Include specific entries in this assembly
INSERT INTO AssemblyInclude (AssemblyId, EntryKey) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222');

-- Exclude an entry explicitly
INSERT INTO AssemblyExclude (AssemblyId, EntryKey) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333');

-- Add filters for Label and Status
INSERT INTO AssemblyFilter (AssemblyId, FilterType, Value, VisibleInView) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Label', 'Development', TRUE),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Status', 'Open', TRUE);

-- Define visible columns for the assembly view
INSERT INTO AssemblyConfig (AssemblyId, ColumnName, IsVisible) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Title', TRUE),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Status', TRUE),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Stars', TRUE),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Voting', TRUE),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Type', FALSE);