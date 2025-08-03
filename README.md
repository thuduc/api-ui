## GenAI Proof of Concept: API and UI generation using Claude Code

The purpose of this proof of concept is to find out if an LLM can generate a fully functionaly API and UI by analyzing an OpenAPI specification to come up with an implementation plan for both the API and UI. The example application we will be using based on the OpenAPI spec for the sample Train Travel application (https://bump.sh/blog/modern-openapi-petstore-replacement/). For those who are familiar with the old Java PetStore sample application, this is its modern replacement.

### LLM & AI Tool
* LLM used: Claude Opus 4 (best coding LLM) - https://www.anthropic.com/claude/opus
* AI tool used: Claude Code (best coding CLI due to its integration with Clause 4 LLMs) - https://www.anthropic.com/claude-code

#### Development Process: 
* Step 1 - develop an openapi specification for the Rest API. Either the developer or the LLM can do this. In our PoC, we will be using an existing OpenAPI spec.
* Step 2 - use a coding LLM to analyze an openapi specification, then to generate a comprehensive implementation plan for implementing both the API and UI. We will use Anthropic's Claude Opus 4 LLM for our coding LLM due to its advanced agentic coding ability.
* Step 3 - use this implementation plan (see [API_UI_IMPLEMENTATION_PLAN.md](API_UI_IMPLEMENTATION_PLAN.md)) in Claude Code (and Claude Opus 4 LLM) to implement all tasks in all API phases defined in the plan.
* Step 4 - use this implementation plan (see [API_UI_IMPLEMENTATION_PLAN.md](API_UI_IMPLEMENTATION_PLAN.md)) in Claude Code (and Claude Opus 4 LLM) to implement all tasks in all UI phases defined in the plan.

#### POC Results
* The API & UI implementation effort took Claude Code about 3 hours to complete.
* Claude Code + Opus 4 LLM were able to generate a fully functional API and UI based on just an openapi specification

## Running the app
See CLAUDE.md

## All prompts issued to Claude Code
The complete list of prompts issued to Clause Code is listed below:

> use this openapi spec @openapi.json to come up with an implementation plan for the following: 1) Rest API using this openapi using nextjs framework and sqlite database for data persistence. 2) UI using nextjs and sqlite database for persistence. The UI needs to support all API functionality defined by the openapi spec. The API implementation should go under impl-api. The UI implementation should go under impl-ui. Before doing anything, save this plan to API_IMPLEMENTATION_PLAN.md for review

> go ahead and implement the api with comprehensive test coverage

> I ran 'npm test' but got errors

> for the ui, 'npm run build' failed

> I tried accessing the ui but got this error: [next-auth][error][NO_SECRET]
   https://next-auth.js.org/errors#no_secret
    ○ Compiling /api/auth/[...nextauth] ...
    ✓ Compiled /api/auth/[...nextauth] in 520ms (264 modules)
   [next-auth][warn][NEXTAUTH_URL]
   https://next-auth.js.org/warnings#nextauth_url 
   [next-auth][warn][NO_SECRET]
   https://next-auth.js.org/warnings#no_secret

> This page is not loading correctly: http://localhost:3001/stations

> The Stations page is calling this resource and is causing errors: http://localhost:3000/api/stations?search=&country=&page=1&limit=12
