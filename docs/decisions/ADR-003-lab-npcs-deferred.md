# ADR-003: Frontier-lab NPCs deferred

Status: **ACCEPTED 2026-07-06** by the maintainer.

Founding decision #8 in [ADR-001](ADR-001-founding-decisions.md) promised frontier
labs as semi-autonomous NPCs inside each bloc, because the principal-agent friction
between governments and labs is itself a lesson. ADR-002 amended the seat half of
that decision and left the labs clause hanging without a record, which broke our own
rule that changing a founding decision takes a written argument. This is that record.

The labs clause is deferred, not dropped. In the shipped game, labs exist as event
actors (mergers, leaks, whistleblowers, capability gifts) but not as agents with
their own allocation behavior. The reason is scope honesty: a lab layer that acts
autonomously needs its own balance campaign, and bolting a shallow version onto the
alpha would teach the principal-agent lesson badly, which is worse than not teaching
it yet. The pressure the clause was meant to model reaches the player today through
the event deck and the incident system instead.

Standing review: after the alpha's human-playtest phase, alongside the sixth ending.
If the lab layer ships, it gets its own ADR with the balance evidence attached.
