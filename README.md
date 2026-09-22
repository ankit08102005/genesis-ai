# Genesis AI

Build a complete production-quality web application called:

GENESIS AI

"AI-Powered Software Development Intelligence Platform"

This is not a simple chatbot or AI code generator.

Genesis AI is an AI-based software development platform that maintains persistent knowledge of a software project throughout its lifecycle.

The core differentiator is:

HPIM — Hybrid Project Intelligence Memory

HPIM maintains and retrieves:

- Requirements

- Architecture

- APIs

- Databases

- Dependencies

- Design decisions

- Project history

- Repository/code structure

- Relationships between components

Multiple specialized AI agents use this shared project knowledge for:

- Requirements analysis

- Architecture

- Coding

- Testing

- Security

- Documentation

The system must perform change-impact analysis BEFORE suggesting or generating software modifications.

The project memory must continuously update when new requirements, decisions, code changes, dependencies, and agent actions occur.

IMPORTANT:

Build this as a serious final-year/production-style software engineering project, not a toy demo.

==================================================

1. PRODUCT VISION

==================================================

Genesis AI should behave like an AI software engineering team that understands the entire project instead of treating every prompt as an isolated conversation.

Example:

User:

"Add refresh token authentication."

Genesis AI should NOT immediately generate code.

It should perform:

User Request

    ↓

HPIM Retrieval

    ↓

Requirement Analysis

    ↓

Architecture Analysis

    ↓

Change Impact Analysis

    ↓

Coding Plan

    ↓

Code Generation

    ↓

Testing

    ↓

Security Review

    ↓

Documentation Update

    ↓

HPIM Update

The system must show this process clearly in the UI.

==================================================

2. CORE ARCHITECTURE

==================================================

Build the application with a clean modular architecture.

Frontend:

- React

- TypeScript

- Vite

- Tailwind CSS

- shadcn/ui

- Lucide icons

- Responsive design

- Dark-first developer dashboard

Backend/API:

- Node.js

- TypeScript

- Express or equivalent server framework

- REST APIs

- Secure authentication

- Environment-based configuration

AI Engine:

- Python

- FastAPI

- Pydantic

- Dedicated AI service layer

AI Provider:

- NVIDIA NIM API

- Model must be configurable using environment variables

- Do NOT hardcode API keys

- Use:

  NVIDIA_API_KEY

  NVIDIA_MODEL

  NVIDIA_BASE_URL

- The exact NVIDIA model name must be configurable rather than hardcoded.

Database:

- MongoDB for application/project state and project history

Vector Memory:

- ChromaDB initially

- Build the code so the vector provider can later be replaced with another vector database

Graph Database:

- Neo4j

Repository:

- GitHub integration

- Repository ingestion

- Repository scanning

- File indexing

==================================================

3. HPIM — HYBRID PROJECT INTELLIGENCE MEMORY

==================================================

HPIM is the central intelligence layer.

Create a dedicated HPIM service.

HPIM must combine:

A. Semantic Memory

- Vector embeddings

- Project documentation

- Requirements

- Decisions

- Architecture descriptions

- Code explanations

- API information

- Relevant project knowledge

- Semantic retrieval

B. Project Graph

- Neo4j

- Components

- Files

- Classes

- Functions

- APIs

- Services

- Databases

- Dependencies

- Relationships

Relationships can include:

- CONTAINS

- CALLS

- USES

- DEPENDS_ON

- IMPLEMENTS

- EXPOSES

- REQUIRES

- IMPORTS

- EXTENDS

C. Project History

- MongoDB

- Requirements added/updated

- Decisions

- Architecture changes

- Code changes

- Dependency changes

- Agent actions

- User actions

- Timestamps

- Actors

HPIM should expose a unified retrieval interface.

Example:

retrieveProjectContext(

    projectId,

    query,

    optionalComponent

)

Return:

{

  semanticContext,

  graphContext,

  historyContext,

  projectContext,

  relevantFiles,

  dependencies

}

==================================================

4. HYBRID RETRIEVAL

==================================================

Implement hybrid retrieval.

The retrieval pipeline should support:

1. Semantic search

2. Lexical/exact search

3. Graph traversal

4. Project history retrieval

Combine the results into a unified context.

Example:

User:

"What could be affected if AuthService changes?"

Semantic:

- Authentication requirements

- JWT documentation

- Previous architecture decisions

Lexical:

- AuthService exact matches

- auth.ts

- authentication references

Graph:

AuthService

    ↓

AuthController

    ↓

LoginAPI

AuthService

    ↓

UserRepository

History:

- JWT decision

- Previous AuthService changes

Then produce:

Unified Project Context

This context is passed to the agents.

==================================================

5. MULTI-AGENT SYSTEM

==================================================

Implement an Agent Orchestrator.

Agents:

1. Requirement Agent

2. Architecture Agent

3. Coding Agent

4. Testing Agent

5. Security Agent

6. Documentation Agent

The orchestrator determines:

- Which agents are required

- Execution order

- Dependencies between agents

- Shared context

- Agent outputs

- Errors

- Retry behavior

- Final synthesis

Typical workflow:

Requirement Agent

       ↓

Architecture Agent

       ↓

Change Impact Analysis

       ↓

Coding Agent

       ↓

Testing Agent

       ↓

Security Agent

       ↓

Documentation Agent

       ↓

HPIM Update

Not every request requires every agent.

For example:

Documentation-only request:

Documentation Agent

Architecture request:

Requirement → Architecture → Impact Analysis

Code modification:

Requirement → Architecture → Impact → Coding → Testing → Security → Documentation

==================================================

6. STRUCTURED AGENT OUTPUTS

==================================================

Do NOT allow agents to communicate only through uncontrolled plain text.

Use structured JSON schemas.

Requirement Agent output:

{

  "requirements": [

    {

      "title": "...",

      "description": "...",

      "type": "functional|non-functional",

      "priority": "low|medium|high|critical"

    }

  ]

}

Architecture Agent:

{

  "changes": [

    {

      "component": "...",

      "change": "...",

      "reason": "..."

    }

  ],

  "risks": [],

  "dependencies": []

}

Impact Analysis:

{

  "directlyAffected": [],

  "indirectlyAffected": [],

  "affectedApis": [],

  "affectedDatabaseModels": [],

  "affectedTests": [],

  "riskLevel": "low|medium|high|critical"

}

Coding Agent:

{

  "filesToCreate": [],

  "filesToModify": [],

  "filesToDelete": [],

  "changes": []

}

Testing Agent:

{

  "testsRequired": [],

  "regressionRisks": [],

  "testPlan": []

}

Security Agent:

{

  "issues": [],

  "severity": [],

  "recommendations": []

}

Documentation Agent:

{

  "documentsToUpdate": [],

  "changes": []

}

Validate all structured outputs.

==================================================

7. CHANGE-IMPACT ANALYSIS

==================================================

This is one of the most important features.

Before generating code, Genesis AI must determine what could be affected.

Example:

User:

"Modify AuthService."

System:

1. Find AuthService in repository

2. Search semantic memory

3. Search exact references

4. Traverse Neo4j dependencies

5. Find callers

6. Find dependent services

7. Find APIs

8. Find tests

9. Find relevant requirements

10. Find previous decisions

11. Calculate impact

Display:

CHANGE IMPACT REPORT

Target:

AuthService

Directly affected:

- AuthController

- UserRepository

Indirectly affected:

- LoginAPI

- Session middleware

Requirements:

- User Authentication

- Secure Login

Tests:

- auth.test.ts

- login.test.ts

Risk:

HIGH

Then ask:

"Proceed with implementation?"

Do not silently modify the project.

==================================================

8. REPOSITORY INTELLIGENCE

==================================================

Implement repository ingestion.

User should be able to:

- Connect GitHub

- Select repository

- Select branch

- Scan repository

- Index repository

The system should identify:

- Files

- Directories

- Programming languages

- Frameworks

- Packages

- Dependencies

- APIs

- Classes

- Functions

- Imports

- Exports

- Database models

- Configuration

- Tests

Ignore:

- node_modules

- .git

- build

- dist

- coverage

- temporary files

- secrets

- .env

Create a repository scanner.

==================================================

9. AST PARSING

==================================================

Implement an AST analysis layer.

Purpose:

Extract code structure and dependencies.

For supported languages initially:

- JavaScript

- TypeScript

- Python

- Java

Extract:

- Classes

- Functions

- Methods

- Imports

- Exports

- Function calls where possible

- API routes

- Dependencies

Convert extracted information into:

1. Semantic memory

2. Neo4j project graph

Example:

File:

src/services/auth.ts

Contains:

AuthService

AuthService:

- login()

- refreshToken()

- logout()

Relationships:

AuthController

    CALLS

AuthService

AuthService

    USES

UserRepository

==================================================

10. PROJECT GRAPH UI

==================================================

Create a visual Project Graph page.

Use an interactive graph visualization.

Features:

- Zoom

- Pan

- Search

- Node selection

- Relationship visualization

- Component filtering

- Highlight dependencies

- Highlight affected components

Clicking a node should show:

Component:

AuthService

Type:

Service

File:

src/services/auth.ts

Methods:

login()

refreshToken()

logout()

Used by:

AuthController

Uses:

UserRepository

Related requirements:

Authentication

Recent changes:

...

==================================================

11. PROJECT DASHBOARD

==================================================

Create a professional developer dashboard.

Sidebar:

- Overview

- AI Workspace

- Projects

- Requirements

- Architecture

- Repository

- Project Graph

- Impact Analysis

- AI Agents

- Memory / HPIM

- Changes

- Testing

- Security

- Documentation

- Activity

- Settings

Top bar:

- Project selector

- Repository status

- AI status

- Notifications

- User profile

==================================================

12. OVERVIEW PAGE

==================================================

Display:

Project name

Repository:

GitHub repository name

Technology:

React / Node / Python etc.

Health:

Good / Warning / Critical

Cards:

Requirements

Architecture

Components

Dependencies

Open Issues

Test Coverage

Security Issues

Recent Activity:

- Requirement added

- Architecture decision made

- Repository indexed

- Agent completed analysis

- Code change proposed

- Security scan completed

AI Project Health:

Architecture consistency

Memory completeness

Dependency risk

Security

Testing

Documentation

==================================================

13. AI WORKSPACE

==================================================

Create the main AI interaction interface.

Layout:

Left:

Conversation/project context

Center:

AI conversation

Right:

Project Intelligence

The right panel should display:

Relevant Requirements

Relevant Files

Dependencies

Architecture

History

Impact

Agent Activity

Example user prompt:

"Add refresh token authentication."

Show:

AI is analyzing...

✓ Retrieving project memory

✓ Searching repository

✓ Traversing project graph

✓ Analyzing requirements

✓ Checking previous decisions

✓ Calculating change impact

Then show:

Impact Analysis

Then:

Architecture Proposal

Then:

Implementation Plan

Then:

Code Changes

Then:

Testing Plan

Then:

Security Review

Allow user to approve/reject each stage.

==================================================

14. AGENT ACTIVITY UI

==================================================

Create a real-time agent execution panel.

Example:

AGENT ORCHESTRATOR

✓ Requirement Agent

  Completed

✓ Architecture Agent

  Completed

● Coding Agent

  Running...

○ Testing Agent

  Waiting

○ Security Agent

  Waiting

○ Documentation Agent

  Waiting

Clicking an agent shows:

- Input

- Project context used

- Reasoning summary

- Output

- Status

- Duration

- Errors/retries

Do NOT expose hidden chain-of-thought.

Only show concise execution summaries and structured outputs.

==================================================

15. REQUIREMENTS PAGE

==================================================

Create a professional requirements management interface.

Columns:

ID

Title

Description

Type

Priority

Status

Source

Created

Updated

Features:

- Add requirement

- Edit

- Delete

- Search

- Filter

- Sort

- Link requirement to architecture components

- Link requirement to files

- Link requirement to decisions

AI button:

"Analyze Requirements"

This launches Requirement Agent.

==================================================

16. ARCHITECTURE PAGE

==================================================

Display:

- System architecture

- Services

- APIs

- Databases

- External services

- Dependencies

Allow users to add architecture decisions.

Each decision:

Title

Decision

Reason

Alternatives

Consequences

Date

Author

AI button:

"Analyze Architecture"

==================================================

17. MEMORY / HPIM PAGE

==================================================

Create a dedicated HPIM dashboard.

Display:

Semantic Memory

- Number of indexed documents

- Last indexing time

- Search

Project Graph

- Nodes

- Relationships

- Last update

Project History

- Number of events

- Recent events

Memory Health:

Semantic Memory: Healthy

Graph Memory: Healthy

History Memory: Healthy

Also show:

"Last HPIM Update"

Example:

Requirement added

→ MongoDB updated

→ ChromaDB updated

→ Neo4j updated

==================================================

18. PROJECT HISTORY

==================================================

Timeline UI.

Examples:

24 Aug

10:30

Coding Agent proposed AuthService changes

24 Aug

10:25

Architecture Agent completed impact analysis

24 Aug

10:20

Requirement updated

23 Aug

16:45

Neo4j dependency graph updated

Every event should contain:

- Actor

- Event type

- Description

- Timestamp

- Related components

- Related files

==================================================

19. CHANGE MANAGEMENT

==================================================

Create a Changes page.

Every AI-generated modification should have:

Change ID

Description

Affected files

Affected components

Risk

Agent

Status

Statuses:

Proposed

Approved

Rejected

Applied

Testing

Failed

Rolled Back

Never automatically apply destructive changes.

Require explicit user approval before applying generated modifications.

==================================================

20. CODE CHANGE REVIEW

==================================================

Create a code review interface similar to GitHub pull request review.

Display:

File

Before

After

Use syntax highlighting.

Show:

- Added lines

- Removed lines

- Modified lines

AI explanation:

"Why is this change required?"

"Which requirement caused this change?"

"What components are affected?"

"What tests are required?"

Allow:

Approve

Reject

Request Revision

==================================================

21. TESTING AGENT

==================================================

Testing Agent should analyze proposed modifications.

Generate:

- Unit tests

- Integration tests

- Regression tests

- Edge cases

Display:

Test Plan

Example:

AuthService:

✓ login success

✓ invalid token

✓ expired token

✓ refresh token

✓ revoked token

Do not claim tests passed unless they were actually executed.

==================================================

22. SECURITY AGENT

==================================================

Security Agent should inspect proposed changes for:

- Authentication problems

- Authorization problems

- Secrets

- Injection

- Unsafe dependencies

- API exposure

- Input validation

- Sensitive data exposure

Display:

Security Score

Critical

High

Medium

Low

Each issue should include:

- Description

- Location

- Risk

- Recommendation

==================================================

23. DOCUMENTATION AGENT

==================================================

Documentation Agent should identify documentation affected by changes.

Possible documents:

- README

- API documentation

- Architecture documentation

- Setup instructions

- Changelog

Show proposed documentation changes before applying them.

==================================================

24. DATABASE DESIGN

==================================================

Create appropriate MongoDB models/collections for:

users

projects

requirements

architecture_decisions

project_history

repositories

agent_runs

changes

test_runs

security_findings

documents

notifications

Every project-specific entity must contain projectId.

Use timestamps.

Add indexes where appropriate.

==================================================

25. SECURITY

==================================================

Implement:

- Authentication

- Authorization

- Project-level access control

- Secure API routes

- Server-side API keys

- Input validation

- Rate limiting

- Error handling

- No secrets in frontend

- No API keys in Git

- No API keys in client-side JavaScript

- Secure environment variables

Never expose:

NVIDIA API key

MongoDB credentials

Neo4j password

GitHub tokens

to the browser.

==================================================

26. NVIDIA LLM INTEGRATION

==================================================

Create a dedicated server-side NVIDIA provider.

Environment variables:

NVIDIA_API_KEY=

NVIDIA_MODEL=

NVIDIA_BASE_URL=

The frontend must NEVER directly call the NVIDIA API.

Architecture:

Browser

 ↓

Genesis Backend

 ↓

AI Engine / AI Service

 ↓

NVIDIA API

Create an abstraction:

LLMProvider

Methods:

generate()

generateStructured()

stream()

The provider must be replaceable.

Do not hardcode the model name.

Do not hardcode the API key.

==================================================

27. STREAMING AI RESPONSES

==================================================

Support streaming responses for the AI workspace.

Display:

AI is analyzing project...

Then stream status updates such as:

Retrieving project context...

Searching repository...

Analyzing graph dependencies...

Running Requirement Agent...

Running Architecture Agent...

Do not expose internal chain-of-thought.

Only show safe execution status.

==================================================

28. GITHUB INTEGRATION

==================================================

Create GitHub integration.

Users should be able to:

- Connect GitHub

- Select repository

- Select branch

- Import repository

- Re-index repository

- View commit history

- View changed files

Eventually support:

- Creating branches

- Creating commits

- Creating pull requests

But generated code must require user approval before committing or opening a PR.

==================================================

29. API DESIGN

==================================================

Create clean APIs such as:

POST /api/projects

GET /api/projects

GET /api/projects/:id

POST /api/projects/:id/requirements

GET /api/projects/:id/requirements

POST /api/projects/:id/decisions

GET /api/projects/:id/decisions

GET /api/projects/:id/history

POST /api/projects/:id/repository/connect

POST /api/projects/:id/repository/index

GET /api/projects/:id/graph

GET /api/projects/:id/impact

POST /api/ai/query

POST /api/agents/execute

GET /api/agents/runs/:id

POST /api/changes/:id/approve

POST /api/changes/:id/reject

POST /api/changes/:id/apply

GET /api/projects/:id/memory

==================================================

30. AI QUERY PIPELINE

==================================================

For every serious software-development request:

1. Receive user request

2. Identify project

3. Retrieve HPIM context

4. Identify relevant repository components

5. Perform semantic retrieval

6. Perform lexical retrieval

7. Perform graph traversal

8. Retrieve relevant history

9. Build unified context

10. Determine required agents

11. Decompose task

12. Execute agents

13. Perform change-impact analysis

14. Generate implementation plan

15. Ask for user approval

16. Generate code changes

17. Run tests

18. Run security analysis

19. Update documentation

20. Update HPIM

21. Record history

22. Show final result

==================================================

31. HPIM UPDATE MECHANISM

==================================================

Every important project change should update relevant memory.

Example:

Requirement added:

MongoDB

 ↓

Requirement stored

Semantic Memory

 ↓

Requirement embedded/indexed

Project Graph

 ↓

Relevant requirement relationships updated

History

 ↓

Event recorded

Similarly for:

- Architecture decisions

- Code changes

- Dependencies

- Agent actions

- Repository indexing

==================================================

32. DESIGN SYSTEM

==================================================

Use a premium developer-tool aesthetic.

Style:

- Dark background

- Black/charcoal surfaces

- Subtle borders

- Blue/purple accent

- Green success

- Amber warning

- Red critical

- Monospace code

- Professional typography

- Dense but readable information

- Smooth transitions

Avoid:

- Excessive gradients

- Huge marketing text

- Generic SaaS landing page look

- Excessive rounded cards

- Cartoonish AI imagery

The application should feel like:

GitHub

+

Linear

+

Cursor

+

Modern AI developer tooling

but with its own Genesis AI identity.

==================================================

33. RESPONSIVE DESIGN

==================================================

Desktop-first because this is a developer platform.

Also support:

- Tablet

- Mobile

On mobile:

- Collapse sidebar

- Stack project intelligence panels

- Preserve code readability

- Maintain agent status visibility

==================================================

34. DASHBOARD NAVIGATION

==================================================

Sidebar:

GENESIS AI

Workspace

Overview

PROJECT

Requirements

Architecture

Repository

Project Graph

Impact Analysis

Changes

AI

AI Workspace

Agents

HPIM Memory

QUALITY

Testing

Security

Documentation

SYSTEM

Activity

Settings

==================================================

35. EMPTY STATES

==================================================

Every page must have useful empty states.

Example:

No repository connected.

"Connect a GitHub repository to let Genesis AI understand your codebase."

Button:

Connect Repository

No project graph.

"Index your repository to build the project dependency graph."

Button:

Index Repository

No requirements.

"Add your first requirement or ask the Requirement Agent to extract requirements."

==================================================

36. ERROR HANDLING

==================================================

Never display raw stack traces to users.

Display useful errors.

Example:

"AI provider unavailable"

"Repository indexing failed"

"Neo4j connection unavailable"

"Project memory update failed"

Provide:

Retry

View details

Log technical details server-side.

==================================================

37. OBSERVABILITY

==================================================

Track:

Agent execution time

LLM request count

Token usage if available

Retrieval latency

Repository indexing time

Graph query latency

Errors

Retries

Create an Activity page.

==================================================

38. DEMO MODE

==================================================

The application MUST work even before external integrations are configured.

Create a demo project with:

Project:

Genesis AI Demo

Components:

Frontend

Backend

AuthService

UserRepository

API Gateway

MongoDB

Requirements:

- User authentication

- Project management

- AI-assisted code modification

Architecture decisions:

- JWT authentication

- MongoDB

- React frontend

- Node backend

Graph:

LoginAPI

 → AuthController

 → AuthService

 → UserRepository

 → MongoDB

This allows the entire UI and AI workflow to be demonstrated.

Clearly label demo/mock data.

Do not fake real test execution or repository operations.

==================================================

39. DEMO SCENARIO

==================================================

The application must support this complete demo:

User enters:

"Add refresh token authentication."

System displays:

STEP 1

Retrieving project intelligence

STEP 2

Requirement Agent

STEP 3

Architecture Agent

STEP 4

Change Impact Analysis

Affected:

AuthService

AuthController

LoginAPI

User model

Authentication middleware

STEP 5

Implementation Plan

STEP 6

Coding Agent

Proposed changes:

auth.ts

authController.ts

user.ts

STEP 7

Testing Agent

STEP 8

Security Agent

STEP 9

Documentation Agent

STEP 10

HPIM Update

Then show:

"Implementation ready for approval."

Buttons:

Approve Changes

Reject

Request Revision

==================================================

40. IMPORTANT IMPLEMENTATION RULES

==================================================

Do not build everything as mock UI.

Implement real:

- Database models

- API routes

- Authentication

- HPIM service abstraction

- Semantic memory abstraction

- Graph memory abstraction

- History memory

- Agent orchestration

- LLM provider abstraction

- Structured agent outputs

- Repository indexing architecture

Where an external service is not configured, provide a clean adapter and demo mode.

Never fake:

- AI responses as if they came from NVIDIA

- Test execution

- GitHub operations

- Security scan results

- Repository indexing

Clearly distinguish:

REAL

MOCK

DEMO

==================================================

41. CODE QUALITY

==================================================

Use:

- TypeScript strict mode

- Strong typing

- Pydantic models

- Modular services

- Repository/service/controller separation

- Reusable components

- Error boundaries

- Input validation

- Centralized error handling

- Environment configuration

- Logging

Avoid:

- giant files

- duplicated logic

- hardcoded IDs

- hardcoded credentials

- hardcoded API keys

- direct database calls from UI

- tightly coupled agents

==================================================

42. FOLDER STRUCTURE

==================================================

Create a clean monorepo-style structure:

genesis-ai/

frontend/

  src/

    components/

    pages/

    layouts/

    hooks/

    services/

    types/

backend/

  src/

    controllers/

    services/

    models/

    routes/

    middleware/

    integrations/

    utils/

ai-engine/

  app/

    agents/

      requirement/

      architecture/

      coding/

      testing/

      security/

      documentation/

    orchestrator/

    memory/

      semantic/

      graph/

      history/

    retrieval/

    repository/

    ast/

    impact/

    llm/

    schemas/

graph/

  cypher/

  schemas/

docs/

==================================================

43. FINAL ARCHITECTURE

==================================================

The final system should conceptually look like:

                         GENESIS AI

                              │

                              ↓

                         FRONTEND

                              │

                              ↓

                         BACKEND API

                              │

              ┌───────────────┼────────────────┐

              ↓               ↓                ↓

           MongoDB        AI ENGINE         GitHub

                              │

                              ↓

                             HPIM

                              │

             ┌────────────────┼────────────────┐

             ↓                ↓                ↓

       Semantic Memory    Project Graph    Project History

             ↓                ↓                ↓

         ChromaDB           Neo4j          MongoDB

                              │

                              ↓

                     Hybrid Retrieval

                              │

                              ↓

                       Unified Context

                              │

                              ↓

                    Agent Orchestrator

                              │

          ┌─────────┬─────────┼─────────┬─────────┐

          ↓         ↓         ↓         ↓         ↓

     Requirement Architecture Coding Testing Security

          │         │         │         │         │

          └─────────┴─────────┼─────────┴─────────┘

                              ↓

                       Documentation

                              ↓

                    Change Impact Analysis

                              ↓

                        User Approval

                              ↓

                      Code Modification

                              ↓

                         Test + Security

                              ↓

                         HPIM Update

                              ↓

                       Project History

==================================================

44. BUILD STRATEGY

==================================================

Do not attempt to implement everything in one huge file.

Build incrementally.

Phase 1:

- Application shell

- Authentication

- Project management

- Dashboard

Phase 2:

- Requirements

- Architecture decisions

- Project history

Phase 3:

- HPIM

- Semantic memory

- Vector storage

- Project graph

- Neo4j

Phase 4:

- Hybrid retrieval

- Context fusion

Phase 5:

- Agent framework

- Agent orchestrator

- Structured outputs

Phase 6:

- NVIDIA LLM integration

- Requirement Agent

- Architecture Agent

- Coding Agent

Phase 7:

- Repository integration

- AST parsing

- Dependency graph

Phase 8:

- Change-impact analysis

Phase 9:

- Testing Agent

- Security Agent

- Documentation Agent

Phase 10:

- Code review

- Approval workflow

- HPIM automatic updates

- Observability

- Production polish

After each phase:

- Make the application runnable

- Fix TypeScript/Python errors

- Test APIs

- Test UI

- Do not leave broken placeholder imports

==================================================

45. MOST IMPORTANT USER EXPERIENCE

==================================================

The user should feel:

"I have an AI software engineering team that understands my entire project."

Not:

"I am chatting with a generic AI."

Every AI interaction should therefore show relevant project context.

For example:

"Based on 12 requirements, 37 graph relationships, 18 relevant files, and 6 historical decisions..."

Then explain the proposed action.

==================================================

46. START NOW

==================================================

Start by implementing the application shell and core architecture.

Do not ask me to manually create dozens of files.

Create the necessary files and components yourself.

First ensure the application runs.

Then implement:

1. Dashboard

2. Project system

3. Requirements

4. Architecture

5. History

6. HPIM

7. AI Workspace

8. Agent Orchestrator

9. NVIDIA LLM adapter

10. Repository intelligence

11. Impact analysis

12. Testing/security/documentation agents

Keep the code modular and production-oriented.

Use demo data where external services are unavailable, but clearly label demo data.

Do not expose secrets.

Do not hardcode API keys.

The final result should be a polished, functional Genesis AI prototype suitable for a final-year computer engineering project demonstration. api key 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

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d078ef1d-fe24-4948-afa5-882cc4d4b3d7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
