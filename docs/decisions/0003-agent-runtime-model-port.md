# ADR 0003: A model port instead of an agent framework

Date: 2026-10-26
Status: Decided by the owner on 2026-10-26 ("добави решението за стека"), from
the research recorded in the notes behind
[the intent](../intent/agent-chat.md). Recorded; nothing is installed yet.

## Context

The intent fixes three hard requirements: JEV returns a schema-validated
selection within 400 ms p95 with no tool access; every vote and routing decision
is audited; an administrator can revoke access immediately, including
mid-deliberation. The product code must be TypeScript
([ADR 0002](0002-first-class-engineering-principles.md)), the service is
self-hosted, and every direct dependency must pass the register in
[docs/dependencies.md](../dependencies.md).

Four research lines compared TypeScript-native frameworks, Python frameworks and
the cost of a sidecar, the thin-SDK path, and framework behavior under
determinism, audit, and revocation. Their conclusion is that a framework solves
none of the three hard requirements and duplicates the state machine the product
must own.

## Decision

1. **No agent framework.** The agent runtime is one model port, not a loop.
2. **Stack:** `ai` 7.0.153 with `@ai-sdk/openai-compatible` 3.0.78 and `zod`,
   behind a `ModelPort` interface with two adapters: an OpenAI-compatible
   adapter and a fake adapter for tests. Versions are the ones observed on
   2026-10-25 and are pinned when the dependency is added.
3. **Tests:** `ai/test` `MockLanguageModelV4` for deterministic tests, plus a
   fake adapter that can return refusals, timeouts, invalid JSON, and duplicate
   deliveries.
4. **Consensus, audit, and revocation are application code.** They are an
   explicit transition table over PostgreSQL tables (`deliberations`, `votes`,
   `routing_decisions`, `revocations`) with a unique constraint on
   `(deliberation_id, round, agent_id)` and an epoch column that the service edge
   checks on every request. The audit insert is synchronous and stays inside the
   400 ms budget. OpenTelemetry spans are emitted by the application, not by a
   vendor exporter.
5. **XState is optional and deferred.** Its model matches a deterministic state
   machine, but the truth of this machine is rows in PostgreSQL, and an in-memory
   statechart would be a second representation of the same state. Adopt it only
   if the transitions outgrow the table.
6. **No dependency is added by this ADR.** `ai`, `@ai-sdk/openai-compatible`, and
   `zod` enter `package.json` and the register in the change that implements JEV.

## Alternatives rejected

| Option | Why not |
| --- | --- |
| `@langchain/langgraph` 1.5.2 | Checkpoints are a second source of truth; `durability="sync"` writes before the next step, inside the budget, while `async` has a crash window; the audit is keyed by node, not by agent; a resumed node re-executes, including its model calls. |
| `@mastra/core` 1.79.0 | Blocked by the license gate before the technical review: npm declares Apache-2.0, but `LICENSE.md` splits `ee/` directories under another license and GitHub reports `NOASSERTION`. Also 30 runtime dependencies, 82.8 MB unpacked, and a prompt-injection fallback that adds a model round trip. |
| `@openai/agents` 0.21.0 | Pre-1.0 with no API stability commitment; validates `outputType` after parsing rather than at decode time; tracing is on by default and exports to OpenAI every few seconds. |
| `@voltagent/core` 2.11.0 | 44 runtime dependencies and its own agent loop, supervisor, and REST server. |
| `@google/adk` 2.3.0 | 24 dependencies plus heavy peers (Express, five MikroORM drivers, four `@google-cloud/*` packages) and a Google Cloud gravity well. |
| CrewAI, Microsoft Agent Framework | Python-only, with no TypeScript surface. |
| AutoGen | Archived; its own README advises against production use, and the final release is from 2025-09-30. |
| A Python sidecar | Two runtimes, two toolchains, two CVE streams, two test suites, an extra network hop inside 400 ms, and a split audit and revocation path, for no capability gain: LangGraph, OpenAI Agents, and ADK already ship first-party TypeScript ports. |

## Evidence

Retrieved 2026-10-25 and 2026-10-26. Unversioned pages are labeled as such.

- Versions, licenses, and dependency counts: [npm @mastra/core](https://www.npmjs.com/package/@mastra/core),
  [npm @openai/agents](https://www.npmjs.com/package/@openai/agents),
  [npm @google/adk](https://www.npmjs.com/package/@google/adk),
  [npm xstate](https://www.npmjs.com/package/xstate).
- Mastra license split: [LICENSE.md](https://github.com/mastra-ai/mastra/blob/main/LICENSE.md).
- AutoGen archive notice: [README](https://github.com/microsoft/autogen/blob/main/README.md).
- CrewAI has no TypeScript port: [PyPI crewai](https://pypi.org/pypi/crewai/json);
  Microsoft Agent Framework covers .NET, Python, and Go:
  [README](https://github.com/microsoft/agent-framework/blob/main/README.md).
- Decode-time schema constraint: [OpenAI structured outputs](https://platform.openai.com/docs/guides/structured-outputs),
  [Anthropic strict tool use](https://platform.claude.com/docs/en/agents-and-tools/tool-use/strict-tool-use),
  [vLLM structured outputs](https://docs.vllm.ai/en/latest/features/structured_outputs.html),
  [Ollama structured outputs](https://docs.ollama.com/capabilities/structured-outputs).
- AI SDK keeps the switch explicit: `strictJsonSchema` defaults to `true`
  ([OpenAI-compatible providers](https://ai-sdk.dev/providers/openai-compatible-providers)).
- Mastra falls back to prompt injection and can return a fallback value
  ([Mastra structured output](https://mastra.ai/docs/agents/structured-output));
  LangChain's `createAgent` defaults to tool calling
  ([LangChain structured output](https://docs.langchain.com/oss/javascript/langchain/structured-output));
  OpenAI Agents returns `unknown` for raw JSON Schema
  ([results guide](https://openai.github.io/openai-agents-js/guides/results/)).
- Local engines can disable the constraint silently: vLLM for reasoning models,
  llama.cpp for unsupported keywords
  ([grammars](https://github.com/ggml-org/llama.cpp/blob/master/grammars/README.md)),
  and Ollama Cloud does not support structured outputs at all.
- Latency arithmetic: at 25.85 ms per output token and 127.10 ms mean time to
  first token, ten output tokens are about 386 ms and twenty about 644 ms
  ([vLLM Ascend benchmark](https://docs.vllm.ai/projects/ascend/en/latest/developer_guide/performance_and_debug/performance_benchmark.html));
  a Groq-class endpoint at 642 tokens per second makes forty tokens about 172 ms
  ([Artificial Analysis, Llama 3.1 8B](https://artificialanalysis.ai/models/llama-3-1-instruct-8b/providers)).
- Checkpointing and durability: [LangGraph checkpointers](https://docs.langchain.com/oss/python/langgraph/checkpointers),
  [Mastra snapshots](https://mastra.ai/docs/workflows/snapshots) (the lease is
  advisory and does not fence writes).
- Cancellation is cooperative and run-scoped: [Mastra `Run.cancel()`](https://mastra.ai/reference/workflows/run-methods/cancel),
  [LangChain cancel](https://docs.langchain.com/langsmith/cancel-run),
  [OpenAI Agents human-in-the-loop](https://openai.github.io/openai-agents-python/human_in_the_loop/).
- Tracing on by default with background export: [OpenAI Agents tracing](https://openai.github.io/openai-agents-python/tracing/).
- Resuming a LangGraph node restarts it from the beginning, side effects included
  ([interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts)).
- Vendor guidance to start from the raw API: [Anthropic, Building effective agents](https://www.anthropic.com/engineering/building-effective-agents).
- Cold start: 91 s in the tuned case and 317 to 324 s baseline, with a warm
  restart of 29 to 35 s ([Runpod](https://www.runpod.io/blog/cut-vllm-cold-starts-runpod-serverless),
  [vLLM issue 48193](https://github.com/vllm-project/vllm/issues/48193)).

## Conditions that change this decision

- Open-ended agents with tools, an unpredictable number of steps, and durable
  human approval make LangGraph with `PostgresSaver` defensible, because durable
  execution and interrupts become real value.
- If a benchmark shows the `ai` provider-spec layer consumes the budget, the
  adapter drops to the `openai` client with `baseURL`; the port and everything
  above it stay.
- A mandatory Python-only capability becomes a separate service with an HTTP
  boundary and a generated TypeScript client, never a subprocess, and it re-reads
  the epoch on every call so revocation stays synchronous.
- If the owner accepts the mixed Mastra license, the technical objections remain:
  size, dependency count, and the prompt-injection path.

## Evidence gaps

These cannot be closed by reading, only by a local benchmark: end-to-end p95 from
question acceptance to the audit write on the chosen model, server, schema, and
hardware; the p95 difference between `ai` and a raw `openai` client on an
identical prompt; cold start and import time of the chosen stack; schema
violation rate and silent constraint disabling; routing accuracy on a labeled
set; and cancellation latency from epoch bump to connection close, against the
bound in D2.

## Consequences

- The research notes and the Bulgarian report stay outside the repository,
  because repository content is English; this record carries the load-bearing
  links instead.
- The three packages must be added to the register with pinned versions in the
  change that implements JEV, and the register check will fail until they are.
- `ModelPort` needs a conformance suite and a fake adapter, so the consensus and
  routing tests run without a live model.
- This ADR does not claim that 400 ms is achieved. It claims that a framework
  cannot meet the three hard requirements and that the port is the right boundary.
