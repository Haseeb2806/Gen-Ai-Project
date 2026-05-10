# ADR 003: SQLite Persistence Strategy

## Status

Accepted

## Context

DataLens is initially a single-user local application. Users upload CSV files, receive profiling results, inspect dashboards, apply filters, and ask chat questions. Uploaded data needs to survive a page refresh so the dashboard, profile, chat tools, and executive summary can reload the active dataset.

For the Hotel Booking Demand dataset, persistence must support metadata, profiling output, cleaning logs, and row-level data needed for analytics such as cancellation rate, top countries, lead-time correlation, monthly ADR, and repeat guest rates. The same persistence strategy must remain generic for any CSV with arbitrary columns.

## Options considered

- **SQLite:** Lightweight local database, no separate server, easy to initialize with FastAPI, and suitable for single-user MVP persistence.
- **In-memory storage only:** Simple, but uploaded data and profiles disappear on refresh or backend restart.
- **Flat files only:** Easy to store raw CSVs, but less convenient for metadata, reloads, filtering, and structured query workflows.
- **PostgreSQL:** Strong production database option, but unnecessary operational overhead for the local MVP.

## Decision

Store uploaded dataset metadata and row data in SQLite so uploaded data survives page refresh and can be reloaded.

DataLens should persist upload metadata, original file references, profiling results, cleaning logs, and a representation of cleaned row data or queryable row storage. The schema must support the Hotel Booking Demand dataset while remaining flexible enough for arbitrary CSV columns.

## Trade-offs

- SQLite keeps setup simple and matches the local single-user scope of the MVP.
- Storing arbitrary CSV row data requires careful schema design, such as JSON row storage, generated table names, or a normalized cell table, each with performance and query trade-offs.
- SQLite is not the right long-term choice for multi-user concurrency or large production datasets, but it is appropriate for CSV files within the project size limits.

## Consequences

- Uploaded datasets can be reloaded after browser refresh without requiring the user to upload the CSV again.
- Profiling and cleaning logs can be tied to an upload ID, making chat answers and executive summaries more reproducible.
- Hotel Booking Demand analytics can query persisted cleaned data while generic CSV dashboards can still use the same persistence layer.
- A future production version can migrate the persistence interface to PostgreSQL or object storage without changing frontend workflows.
