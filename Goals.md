# plaited.dev

Every frontend dev knows when you pull in a library that does 90% of what you want it's scope creep and the last 10% that bogs you down. I've got know solution for that but it got me thinking. 

If you only defined the basic rules of tic-tac-toe using the idioms of behavioral programming could you create a model that could learn the optimal strategy if you also included formal verification rules for desired outcomes?

What if a developer could define 80% - 90% of a reactive system and allow the system itself to update itself over time, improving as the rules for the system improve? Even more powerfully, it could update itself as rules and requirements change and adjust as the business needs do.

## Research Goals

### Goal 1: convert our bProgram implementation to python

### Goal 1.1: Figure out the algorithm for Cartrie's learning capacity plan

### Goal 1.2: Learning about mimicking/mirroring algorithms

### Goal 2: create tic-tac-toe gym that works with bProgram
We'll probably be using OpenAI's gym as a starter and the goal is to create a model probably using reinforcement learning and PyTorch

### Goal 3: convert a tic-tac-toe PyTorch model to a Tensorflow model
We'll need to do this eventually if we use PyTorch because for production we'll need tensorflow to deliver a solution to the browser

### Goal 4: Take Tensorflow tic-tac-toe model and apply it to TensorflowJS
We'll need to to then use tensorflowJS for node and consume the python model we've created

## POC Goal

### Goal 5: Framework and Interface
A framework that allows us to:
- define tracks
  - set track type universal frontend backend
  - connecting endpoints for triggers preferably webhooks
  - defining mocks and stubs
  - add macros via esm imports to public ones or connected github repo
- run simulations
  - automated
  - manual
- review approve or disapprove see | do branches
- Git integration
  - PR
  - Branch
  - auto-commit when running in cloud and squash upon PR or git commit action
- 

### Goal 6: generative UI model (computational design)
Initially using self reported data and data generated from qualitative interviews to create rule sets.

### Goal 7: POC generates it's own UI