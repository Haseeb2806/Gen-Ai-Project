# ADR 002: Chart Library Decision

## Status

Accepted

## Context

DataLens needs to render automatically recommended visualizations after a user uploads a CSV. For the Hotel Booking Demand dataset, expected charts include cancellation breakdowns, top source markets, lead-time relationships, monthly ADR trends, and repeat-guest rates by market segment.

The same dashboard must remain generic for any CSV. Chart recommendations should be driven by detected column types and cardinality, then rendered through reusable React components for common business dashboard patterns.

## Options considered

- **Recharts:** React-native chart components, good support for bar, line, scatter, and composed charts, and a straightforward fit for dashboard UI.
- **Plotly:** Powerful and highly interactive, with broad chart coverage, but heavier and more complex than needed for the MVP dashboard.
- **Chart.js:** Mature and widely used, but its imperative canvas model is less aligned with React component composition than Recharts.
- **Custom SVG or Canvas charts:** Maximum control, but too much implementation and testing cost for standard dashboard visualizations.

## Decision

Use Recharts because it integrates well with React, supports common dashboard charts, and is suitable for business dashboards.

The frontend should build reusable chart components around Recharts for bar charts, line charts, scatter plots, histograms or histogram-like distributions, and other MVP dashboard views. Backend chart recommendations should stay library-agnostic enough that DataLens can change rendering libraries later if needed.

## Trade-offs

- Recharts is a strong fit for React and Tailwind-based dashboards, especially for the common chart types DataLens needs in the MVP.
- Recharts may require custom work for advanced charts such as dense correlation heatmaps or highly specialized interactions.
- Plotly offers richer built-in interactivity, but it would add weight and complexity before DataLens has proven a need for those capabilities.

## Consequences

- Frontend chart components should use Recharts primitives and accept generic chart configuration objects from the backend.
- Hotel Booking Demand charts should be implemented as reusable dashboard charts, not one-off dataset-only views.
- The chart recommendation service should describe intent, fields, aggregation, and chart type rather than returning Recharts-specific implementation details.
- If future CSV use cases require advanced visual analytics beyond Recharts, Plotly can be introduced for specific chart types without replacing the whole dashboard.
