Prompt Engineering 
Commands & Rules for coding
(Revised for clarity and precision)

## General Coding Guidelines
Use English in all code: variables, file names, classes, methods, and comments.
Write professional, robust, and maintainable code.
Think and act like a senior developer.
Keep code concise. Fewer lines are better.
Avoid technical debt at all costs.
Work until the problem is fully solved or the task is complete. - Default to "INCOMPLETE" unless proven otherwise. Positive evidence of working features, not absence of obvious errors is required before using attempt_completion. When in doubt, ask for user verification. Do NOT use attempt_completion before you can confirm the task is completed as requested.
Provide short and direct answers.
Use an informative, GitHub README-style tone.
If unclear, ask for clarification before proceeding.

## Starting Applications / Services
Provide *.bat or *.sh scripts.
Sequence:
Stop the existing service
Build
Start

## Implementation Commands
Avoid technical debt.
Write clean, simple, and readable code.
Implement features in the simplest way.
Keep files small and focused.
Include only necessary steps.
Prioritize core functionality over optimization.
Use clear, consistent naming.
Think before coding.
Use straightforward language.
Avoid massive refactors. Do not remove functionality outside the current task scope.
Don’t change existing functionality, content or design when it’s not part of the task. 

## Debugging Commands
Ask what debugging info is needed.
Provide debugging instructions.
Use detailed logging typical for the language.
Include timestamp and log file.
All outputs must use logging.
Request context to diagnose the error.
Summarize the project state in 3 paragraphs for another developer.
For decisions, write 2 detailed paragraphs—one for each approach.
Don’t rush. Weigh both sides carefully.
Start reasoning with uncertainty. Build confidence through analysis.
Clearly explain the planned fix before executing.
Never provide test or dummy data that behaves like real data. Ensure that test data clearly will be distinguished without any explanation!

## Error-Fixing Process
Explain errors in plain English.
Don’t jump to conclusions.
Write 3 paragraphs analyzing possible causes.
Clearly describe the planned fix.
Make only minimal, necessary changes.
Avoid large-scale refactors.
Preserve all existing functionality and content exactly as implemented.
For uncommon errors, request more information.
Do not change the content or functionality when fixing a bug

## Code Comments
Always comment your code.
Do not delete relevant comments.
Explain non-obvious logic.
Top of each file:
File purpose
Full file path
Document reasoning and all changes.
Precede each method with a purpose description.
Use decision trees in comments to explain logic.

## Architecture
Separate frontend and backend implementations.
Isolate interface/API in one module.
Prefer REST or GraphQL.
Design APIs first using OpenAPI/Swagger.
Ensure backward compatibility.
Apply Domain-Driven Design (DDD).
Always include:
README.md
.gitignore
.env and example.env
Never put real password into example.env some .md files or any help or manual. Use only placeholders!
Avoid random files for test iterations. Don’t mess with the files and generate temporary files for testing. Behave like a professional developer and test and fix the real code.
Use one prototype and update it.
Prefer external libraries over custom code.
Use standard procedures for installing libraries.
Frontend must include:
robots.txt
sitemap.xml
Meta tags
Schema.org markup (JSON-LD)
Always design with security in mind.

## Backend Development
All functions with branching logic must use try/catch.
Use a unified logging framework.
Redirect stdout and stderr to container logs.
Logs must include:
User info
Timestamp
Frontend/backend requests and responses
System/setting changes for auditing
Store settings in a JSON config file:
Ports, paths, filenames, folders, users
Store secrets in .env securely.
Include an example.env.
Never put real password into example.env some .md files or any help or manual. Use only placeholders!
Structure backend by functionality:
Separate files: DB, settings, logging, frontend integration

## Frontend Development (React)
Use TypeScript and Tailwind CSS.
Build responsive apps.
Organize files by interface/function.
Use custom React hooks for API calls.
Structure app into subpages.
Implement dark/light mode toggle.
Support English & German. Use English as leading language.
Include translation files.
Ensure responsive layout for mobile and desktop.
Top nav should include:
User info
Language switch
Theme toggle
Use icons over text.
Highlight current section in navigation.
Log all frontend/backend communication.

## Frontend Development (HTML)
Same standards as React.
Responsive layout, dark/light toggle, multi-language support.
Top navigation with user info and controls.
Use icons consistently.
Log all backend interaction in console.

## Design Guidelines
Use Tailwind CSS.
Styles:
Rounded elements
Font: Arial
Use icons with tooltips.

## Testing Requirements
Test after every significant change.
Backend: Test each API function.
Frontend: Test each UI function.

## Security Best Practices
Never store secrets in frontend.
Encrypt all passwords in the database.

## Build Process
Use TypeScript.
Compile before deployment.
Use Docker containers.
Mount DB and config files.
Redirect logs to container.
Use environment variables:
Backend: Backend/.env
Frontend: Frontend/.env

## Search Queries
Write concise, one-paragraph queries.
Include all relevant context.
Request code or technical details when needed.
Provide a TL;DR of results.
Be cautious—check source reliability.

## Readme.md
The Readme.md needs to contain the following
Project
Name of the project
Short and memorable headline
What does the project do?
Why does it exist?
Which problems does it solve?
Getting Started	
Prerequisites (tools, versions, services)
Installation steps (with code blocks)
Setup instructions (.env, config files, Docker, etc.
Usage
How to run the application
CLI commands, API calls, or UI usage
Code examples, screenshots, curl commands
Configuration
Description of .env or config files
Default settings and how to override them
Architecture (optional but recommended)
High-level technical structure
Used tools, frameworks, and languages
Folder and module structure
Deployment
Steps for staging or production deployment
CI/CD process, if applicable
Docker/Kubernetes usage
Documentation
Links to external or detailed documentation
Swagger/OpenAPI references
Diagrams (architecture, data flow)
License
Type of license (MIT)
Contact (Patrick Hess, https://github.com/com2u, https://www.linkedin.com/in/patrick-hess-63592568/)





