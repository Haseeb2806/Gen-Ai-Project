# ADR 001: LLM Provider Decision

## Status

Accepted

## Context

DataLens includes a conversational analytics interface and an executive summary feature. For the Hotel Booking Demand dataset, the chat interface must answer questions about cancellation rates, source markets, lead time, ADR by month, and repeat guest rates with supporting numbers and reproducible tool calls.

The application must also remain generic for any uploaded CSV. Dataset-specific Hotel Booking tools should be available when the expected hotel columns are present, while generic profiling and summary behavior should still work for other CSV files.

## Options considered

- **Gemini:** Accessible through Google AI Studio, supports tool/function calling, and can handle both chat and narrative summary use cases.
- **Anthropic:** Strong reasoning and chat quality, but should remain an optional provider rather than the initial dependency.
- **OpenAI:** Strong tool-calling ecosystem and broad model availability, but not required as the first implementation target.
- **Groq:** Useful for fast inference and may be a good fallback, but model and tool-calling support can vary by selected model.

## Decision

Use Gemini as the first LLM provider because it is accessible, supports tool/function calling, and can be used for both chat and executive summary generation.

Keep the LLM architecture provider-flexible so Anthropic, OpenAI, or Groq can be added later behind the same provider interface. The backend should expose DataLens analytics functions as tools and keep provider-specific request and response handling inside the LLM provider layer.

## Trade-offs

- Gemini keeps the MVP approachable because it has a readily available free-tier path and supports the tool-calling workflow DataLens needs.
- Provider-specific tool schemas and response formats still require adapter code, so the abstraction must avoid leaking Gemini-only assumptions into chat routes or analytics services.
- A pluggable provider layer adds some upfront complexity, but it reduces the cost of switching providers if pricing, rate limits, model quality, or classroom requirements change.

## Consequences

- The default environment configuration should use Gemini, for example `LLM_PROVIDER=gemini` and `GEMINI_API_KEY`.
- Tests should mock the LLM provider so Hotel Booking analytics calculations can be verified deterministically without live API calls.
- Chat and executive summary features should call backend analytics and profiling tools for grounded answers instead of relying on the model to infer numbers from raw CSV text.
- Future providers must implement the same chat, tool-calling, and summary contract before they can be used interchangeably in DataLens.
