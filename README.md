# ITIS — India Transport Infrastructure Intelligence System

An evidence-first intelligence platform for India's roads, highways, expressways, bridges and tunnels: **who owns it, who awarded it, who is building it (package by package, JV member by JV member), what it costs by each source, where it is, what state it is in — and where every one of those facts came from.**

> **Status:** specification + working prototype over a **sample dataset of 16 real projects and 48 cited sources** (researched 2026-09-28). The sample is not a complete database. Unknowns are shown as unknown.

## Run the prototype

Open `dashboard/index.html` in a browser. It doesn't need a build step, a server or a network connection (web fonts are optional).

Views: A·B map & executive · C state explorer · D corridors · E projects · F contractors · G authorities · H tenders · I opportunity radar · J relationship graph · K timeline · L data quality · M evidence explorer. Clicking any project opens the drawer, which answers "who built it?", shows the contract structure, lists every financial value and the timeline, and links the sources.

## Repository map

| Path | What |
|---|---|
| `docs/PROJECT_OVERVIEW.md` | Product, users, workflows, scope |
| `docs/ARCHITECTURE_CONTEXT.md` | Stack, component boundaries, invariants |
| `docs/CODE_STANDARDS.md` | Conventions for code, SQL and data |
| `docs/AI_WORKFLOW.md` | How coding and research agents work |
| `docs/UI_CONTEXT.md` | Design tokens, status encoding, components |
| `docs/PROJECT_TRACKER.md` | Progress + open verification items |
| `docs/spec/01…15` | Full specification (concept → build spec) |
| `db/schema.sql` | PostgreSQL 16 + PostGIS schema |
| `db/seed_sample.sql` | Generated seed from the sample dataset |
| `dashboard/` | Static prototype (HTML/CSS/vanilla JS, SVG map) |
| `tools/build-seed.js` | Sample data → seed SQL |
| `tools/build-basemap.js` | Boundary GeoJSON → simplified basemap |

## Specification index

1. [Product concept](docs/spec/01-product-concept.md)
2. [Information architecture](docs/spec/02-information-architecture.md)
3. [Database architecture](docs/spec/03-database-architecture.md) · [schema.sql](db/schema.sql)
4. [Data sourcing strategy & ingestion pipeline](docs/spec/04-data-sourcing-strategy.md)
5. [Research agent instructions](docs/spec/05-research-agent-instructions.md)
6. [Data quality framework](docs/spec/06-data-quality-framework.md)
7. [UI/UX design, including map, project detail, contractor, tender and radar views](docs/spec/07-ui-ux-design.md) (covers items 7, 9–13)
8. [Sample data](docs/spec/08-sample-data.md)
14. [Technical implementation](docs/spec/14-technical-implementation.md)
15. [Build specification](docs/spec/15-build-specification.md)

## Rebuild generated files

```bash
node tools/build-seed.js                         # dashboard/data/sample-data.js → db/seed_sample.sql
node tools/build-basemap.js states.geojson 0.02  # DataMeet states → dashboard/data/india-states.js
psql -f db/schema.sql && psql -f db/seed_sample.sql   # needs PostGIS
```

## Attribution

The basemap is simplified from [DataMeet India maps](https://github.com/datameet/maps) (CC BY 4.0). It is for the prototype only. It predates the 2019 J&K/Ladakh reorganisation, and production needs Survey of India–compliant boundaries. Project geometry in the sample is **schematic**: its vertices are approximate town centres, not surveyed alignments.
