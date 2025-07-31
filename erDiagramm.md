erDiagram

%% Core Tables
Entry ||--o{ EntryLabels : has
Entry ||--o{ EntryPermissions : has
Entry ||--o{ EntryRelations : references
Entry ||--o{ EntryUserRelation : created_by
Entry ||--o{ Voting : receives

EntryLabels }o--|| Labels : uses
EntryPermissions }o--|| PermissionGroup : enforces

Entry ||--|| Type : typed_as
Entry ||--|| Status : has_status

%% Permission Group Membership
PermissionGroup ||--o{ PermissionGroupMembership : contains
PermissionGroupMembership }o--|| Users : includes (abstract)

%% Assembly Tables
Assembly ||--o{ AssemblyInclude : includes
Assembly ||--o{ AssemblyExclude : excludes
Assembly ||--o{ AssemblyFilter : filters
Assembly ||--o{ AssemblyConfig : configures

AssemblyInclude }o--|| Entry : includes_entry
AssemblyExclude }o--|| Entry : excludes_entry
AssemblyFilter }o--|| Entry : filters_entry (abstract)

%% Relations Table
EntryRelations }o--|| Relation : relation_type
EntryUserRelation }o--|| Relation : relation_type

%% Supporting Tables
Type ||--|| Icon : optional (abstract)
Status ||--|| Icon : optional (abstract)
Labels ||--|| Icon : optional (abstract)

%% Legend:
%% Users table is not implemented but referenced logically in permissions