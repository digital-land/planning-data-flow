// In dev, requests are proxied via Vite to avoid CORS.
// In production, set VITE_DATASETTE_URL to the real origin.
const BASE_URL = import.meta.env.VITE_DATASETTE_URL ?? 'https://datasette.planning.data.gov.uk'

// ---- Types ----------------------------------------------------------------

export type DatasetteResponse<T = Record<string, unknown>> = {
  columns: string[]
  rows: unknown[][]
  ok: boolean
  truncated: boolean
  /** Rows mapped to objects using the columns array */
  items: T[]
}

// ---- SQL builder ----------------------------------------------------------

type OrderDirection = 'asc' | 'desc'

type SelectOptions = {
  from: string
  columns?: string[]
  where?: string | string[]
  orderBy?: string | { column: string; direction: OrderDirection }
  limit?: number
  offset?: number
}

/** Builds a simple SELECT statement from structured options. */
export function buildSelect(opts: SelectOptions): string {
  const cols = opts.columns?.length ? opts.columns.join(', ') : '*'

  const parts: string[] = [`select ${cols} from ${opts.from}`]

  if (opts.where) {
    const conditions = Array.isArray(opts.where) ? opts.where : [opts.where]
    parts.push(`where ${conditions.join(' and ')}`)
  }

  if (opts.orderBy) {
    if (typeof opts.orderBy === 'string') {
      parts.push(`order by ${opts.orderBy}`)
    } else {
      parts.push(`order by ${opts.orderBy.column} ${opts.orderBy.direction}`)
    }
  }

  if (opts.limit !== undefined) parts.push(`limit ${opts.limit}`)
  if (opts.offset !== undefined) parts.push(`offset ${opts.offset}`)

  return parts.join(' ')
}

// ---- Core fetch -----------------------------------------------------------

/**
 * Run a SQL query against a Datasette database.
 *
 * @param database  - e.g. "digital-land"
 * @param sql       - raw SQL string (use buildSelect() to construct)
 */
export async function query<T = Record<string, unknown>>(
  database: string,
  sql: string,
): Promise<DatasetteResponse<T>> {
  const url = new URL(`${BASE_URL}/${database}.json`, window.location.origin)
  url.searchParams.set('sql', sql)
  url.searchParams.set('_shape', 'array') // ask datasette for array-of-objects shape

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Datasette error ${response.status}: ${response.statusText}`)
  }

  // Datasette returns either rows+columns or an array depending on _shape
  // With _shape=array it returns an array of objects directly
  const data = (await response.json()) as T[] | { ok: boolean; rows: unknown[][]; columns: string[]; truncated: boolean }

  if (Array.isArray(data)) {
    return {
      ok: true,
      truncated: false,
      columns: data.length > 0 ? Object.keys(data[0] as object) : [],
      rows: (data as Record<string, unknown>[]).map((row) => Object.values(row)),
      items: data as T[],
    }
  }

  // Fallback: default rows+columns shape
  const { rows, columns, ok, truncated } = data
  const items = rows.map((row) =>
    Object.fromEntries(columns.map((col, i) => [col, row[i]])),
  ) as T[]

  return { ok, truncated, columns, rows, items }
}

// ---- Table query (filtered rows) ------------------------------------------

type TableResponse<T> = {
  columns: string[]
  rows: unknown[][]
  items: T[]
  truncated: boolean
  filtered_table_rows_count: number
}

/**
 * Query a Datasette table with simple column filters.
 * Uses the /{database}/{table}.json endpoint rather than SQL.
 */
async function queryTable<T = Record<string, unknown>>(
  database: string,
  table: string,
  filters: Record<string, string> = {},
): Promise<TableResponse<T>> {
  const url = new URL(`${BASE_URL}/${database}/${table}.json`, window.location.origin)
  for (const [col, val] of Object.entries(filters)) {
    url.searchParams.set(col, val)
  }

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Datasette error ${response.status}: ${response.statusText}`)
  }

  const data = (await response.json()) as {
    columns: string[]
    rows: unknown[][]
    truncated: boolean
    filtered_table_rows_count: number
  }

  const items = data.rows.map((row) =>
    Object.fromEntries(data.columns.map((col, i) => [col, row[i]])),
  ) as T[]

  return { ...data, items }
}

// ---- Convenience queries --------------------------------------------------

export type Endpoint = {
  documentation_url: string
  end_date: string
  endpoint: string
  endpoint_url: string
  entry_date: string
  parameters: string
  plugin: string
  start_date: string
}

/** List endpoints from the endpoint table. */
export async function queryEndpoints(
  database = 'digital-land',
  opts: { limit?: number; offset?: number; where?: string } = {},
): Promise<DatasetteResponse<Endpoint>> {
  const sql = buildSelect({
    from: 'endpoint',
    columns: ['documentation_url', 'end_date', 'endpoint', 'endpoint_url', 'entry_date', 'parameters', 'plugin', 'start_date'],
    where: opts.where,
    orderBy: 'endpoint',
    limit: opts.limit ?? 100,
    offset: opts.offset,
  })
  return query<Endpoint>(database, sql)
}

export type Resource = {
  end_date: string
  entry_date: string
  resource: string
  start_date: string
}

/** List resources. */
export async function queryResources(
  database = 'digital-land',
  opts: { limit?: number; offset?: number; where?: string } = {},
): Promise<DatasetteResponse<Resource>> {
  const sql = buildSelect({
    from: 'resource',
    columns: ['resource', 'start_date', 'end_date', 'entry_date'],
    where: opts.where,
    orderBy: 'start_date',
    limit: opts.limit ?? 100,
    offset: opts.offset,
  })
  return query<Resource>(database, sql)
}

export type ResourceEndpoint = {
  rowid: number
  resource: string
  endpoint: string
}

export type LogEntry = {
  rowid: number
  content_type: string
  elapsed: string
  endpoint: string
  entry_date: string
  resource: string
  status: string
  [key: string]: unknown
}

/** Collect log entries for a given resource hash. */
export async function queryCollectLog(
  resourceHash: string,
  database = 'digital-land',
): Promise<LogEntry[]> {
  const result = await queryTable<LogEntry>(database, 'log', {
    resource: resourceHash,
  })
  return result.items
}

export type ConvertedResource = {
  rowid: number
  resource: string
  status: string
  [key: string]: unknown
}

/** Get conversion status for a resource hash. */
export async function queryConvertedResource(
  resourceHash: string,
  database = 'digital-land',
): Promise<ConvertedResource | null> {
  const result = await queryTable<ConvertedResource>(database, 'converted_resource', {
    resource: resourceHash,
  })
  return result.items[0] ?? null
}

/** List all resources associated with an endpoint hash. */
export type FactResource = {
  rowid: number
  end_date: string
  fact: string
  entry_date: string
  entry_number: number
  priority: number
  resource: string
  start_date: string
}

/**
 * Get fact_resource rows for a given resource hash.
 * Uses the dataset slug as the database name (e.g. "article-4-direction-area").
 */
export async function queryFactResource(
  resourceHash: string,
  dataset: string,
): Promise<{ items: FactResource[]; truncated: boolean; total: number }> {
  const result = await queryTable<FactResource>(dataset, 'fact_resource', {
    'resource__exact': resourceHash,
    '_sort': 'rowid',
  })
  return { items: result.items, truncated: result.truncated, total: result.filtered_table_rows_count }
}

export type Issue = {
  rowid?: number
  entity?: number
  field?: string
  'issue-type'?: string
  dataset?: string
  resource?: string
  message?: string
  severity?: string
  [key: string]: unknown
}

/** Get issue rows for a given resource hash within a dataset. */
export async function queryIssues(
  resourceHash: string,
  dataset: string,
): Promise<{ items: Issue[]; truncated: boolean; total: number }> {
  const result = await queryTable<Issue>(dataset, 'issue', {
    'resource__exact': resourceHash,
    '_sort': 'rowid',
  })
  return { items: result.items, truncated: result.truncated, total: result.filtered_table_rows_count }
}

export type ColumnField = {
  rowid?: number
  column?: string
  dataset?: string
  resource?: string
  field?: string
  [key: string]: unknown
}

/** Get column_field rows for a given resource hash within a dataset. */
export async function queryColumnField(
  resourceHash: string,
  dataset: string,
): Promise<{ items: ColumnField[]; truncated: boolean; total: number }> {
  const result = await queryTable<ColumnField>(dataset, 'column_field', {
    'resource__exact': resourceHash,
    '_sort': 'rowid',
  })
  return { items: result.items, truncated: result.truncated, total: result.filtered_table_rows_count }
}

export async function queryResourceEndpoints(
  endpointHash: string,
  database = 'digital-land',
): Promise<ResourceEndpoint[]> {
  const result = await queryTable<ResourceEndpoint>(database, 'resource_endpoint', {
    endpoint: endpointHash,
  })
  return result.items
}
