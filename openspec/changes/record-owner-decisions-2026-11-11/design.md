## Context

The owner gave the answers in Bulgarian on 2026-11-11, paraphrased here:
D2 "instantly", D4 "no", D5 "yes" to both parts, D9 "cloud in TypeSafe" with
https://docs.typesafe.ai as the reference, and "JEV selects only one". Asked
about the fallback, the owner answered that the consul selected by JEV answers,
with no rounds and no voting.

## Decisions

- D4 narrows D1: people administer rooms but do not post.
- The owner then added that the questions in the chat form a queue: 400 ms
  is a target, JEV may take up to 3 seconds, and a question without a
  selection by then is skipped for the next one. A late selection within
  3 seconds stands, and the overrun is audited.
- On 2026-11-12 the owner added that consuls answer only questions about
  software and its implementation; JEV answers any other question with the
  fixed reply "This is not a question for a consul." and selects no one.
- A revocation of the selected consul before it answers was not answered. It
  becomes open decision D11, with skipping as the assumption.
- The estimate figures are kept and marked as predating the D8 amendment;
  re-estimating is not part of this change.

- On 2026-11-12 the owner chose `@typesafe-ai/sdk` behind the port for D10
  and asked to sync every document with the intent.
- The routing limits run from sending `routing.requested`, when the question
  reaches the head of the queue; measured from acceptance, a queued question
  could time out before JEV sees it.
- No answer deadline for the selected consul is decided; the deliberation
  stays `answering` until the consul answers or is revoked (D11).
- AC-06 keeps its change name `implement-consensus-deliberation` and now
  depends on AC-07, because the fixed reply is a room message.

## Not changed

- AC-02 and AC-13 are completed and keep their text and hashes, so their
  criteria still describe the earlier model as history.
- AC-03 has an unpushed claim from 2026-11-10. On 2026-11-12 the owner
  confirmed that it is not running, so its D3 and D7 labels are updated and
  its hash changes; a new run uses the new hash.
- The estimate figures in the intent are kept and marked as predating the
  D8 amendment.
