# Planning Data Flow Map

An interactive visualisation of the [Planning Data](https://www.planning.data.gov.uk) pipeline — showing how a single endpoint URL travels through collection, conversion, and transformation to produce facts and entities.

Built with React Flow, each node in the graph fetches live data from the Planning Data APIs and displays it inline. Enter an endpoint URL and watch the data propagate through the pipeline in real time.

---

## What it shows

```
Endpoint ─┬─► Endpoint Health
          │
          └─► Resources ──► Collect ─┬──► Collect Log ──► Convert Status ──► Transform ──► Facts ──► Fact ──► Entity
                                     │
                                     └──► Issues
```

| Node | What it does |
|---|---|
| **Endpoint** | Input field for an endpoint URL. Looks up the dataset, endpoint hash, and resource hash via the pipeline internal API |
| **Endpoint Health** | Shows the latest collection status for that endpoint |
| **Resources** | Lists all resources associated with the endpoint; highlights the active one |
| **Collect** | Process node — represents the collection stage |
| **Collect Log** | Shows the HTTP log entries for the active resource |
| **Convert Status** | Shows whether the resource converted successfully |
| **Transform** | Process node — represents the transformation stage |
| **Facts** | Lists all facts produced from the resource; click a row to select one |
| **Fact** | Shows the full detail of the selected fact |
| **Entity** | Fetches and displays the entity the fact belongs to |
| **Issues** | Lists all issue types found in the resource, grouped by severity |

---

## Data sources

Each node is backed by one of three APIs:

| API | Used for | Local proxy path |
|---|---|---|
| [Planning Data Platform](https://www.planning.data.gov.uk) | Fact and entity lookups | Direct (CORS enabled) |
| [Pipeline Internal API](https://pipeline-internal-api.development.planning.data.gov.uk) | Endpoint health, resource mapping, issues | `/pipeline-api` |
| [Datasette](https://datasette.planning.data.gov.uk) | Collect logs, convert status, fact resources | `/datasette` |

Nodes with a light red background are Datasette-backed. The `i` badge on each node shows which API it uses and the endpoint template.

---

## How data flows

A `GraphSyncer` component sits inside the React Flow provider and watches the node graph. Whenever a node updates its data (e.g. the Endpoint node resolves a resource hash), the syncer propagates relevant fields one hop downstream through the edges — `resource_hash`, `dataset`, `fact_hashes`, `selected_fact`, and `entity`. Each downstream node reacts to its incoming data and fires its own API call.

This means the entire pipeline updates automatically when you change the endpoint URL.

---

## Running locally

Requires [Bun](https://bun.sh).

```bash
bun install
bun run dev
```

The Vite dev server proxies `/pipeline-api` and `/datasette` to bypass CORS. The Planning Data Platform API is called directly.

---

## Deploying

```bash
bun run deploy
```

This builds the app and pushes the `dist` folder to the `gh-pages` branch, which GitHub Pages serves at:
**https://pooleycodes.github.io/planning-data-flow/**

> **Note:** The pipeline internal API and Datasette do not currently send CORS headers, so those nodes will not load data on the live site. Only the Fact and Entity nodes (which use the public Planning Data Platform API) are fully functional in production. To fix this, the upstream APIs need to add `Access-Control-Allow-Origin` headers, or a deployed proxy is required.

---

## Stack

- [React](https://react.dev) + [TypeScript](https://www.typescriptlang.org)
- [React Flow (@xyflow/react)](https://reactflow.dev)
- [Vite](https://vite.dev)
- [Bun](https://bun.sh)
