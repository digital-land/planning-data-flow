const BASE_URL = 'https://www.planning.data.gov.uk'

// ---- Types ----------------------------------------------------------------

export type Extension = 'json' | 'geojson'

export type Dataset = {
  dataset: string
  name: string
  description?: string
  entity_count?: number
  start_date?: string
  end_date?: string
}

export type Entity = {
  entity: number
  name?: string
  reference?: string
  dataset: string
  organisation_entity?: number
  geometry?: string
  point?: string
  start_date?: string
  end_date?: string
  entry_date?: string
  [key: string]: unknown
}

export type EntityResponse = {
  count: number
  entities: Entity[]
}

export type EntityQueryParams = {
  dataset?: string | string[]
  q?: string               // postcode or UPRN
  latitude?: number
  longitude?: number
  geometry?: string        // WKT polygon
  geometry_entity?: number
  geometry_relation?: 'within' | 'intersects' | 'contains' | 'overlaps' | 'touches' | 'crosses' | 'equals'
  organisation_entity?: number
  reference?: string
  quality?: string
  limit?: number
  offset?: number
  field?: string | string[]
  exclude_field?: string | string[]
  start_date_year?: number
  start_date_month?: number
  start_date_day?: number
  end_date_year?: number
  end_date_month?: number
  end_date_day?: number
}

// ---- Helpers ---------------------------------------------------------------

function buildSearchParams(params: Record<string, unknown>): URLSearchParams {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    if (Array.isArray(value)) {
      value.forEach((v) => search.append(key, String(v)))
    } else {
      search.set(key, String(value))
    }
  }
  return search
}

async function get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  const url = new URL(path, BASE_URL)
  if (params) {
    const search = buildSearchParams(params)
    search.forEach((value, key) => url.searchParams.append(key, value))
  }

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Planning Data API error ${response.status}: ${response.statusText}`)
  }

  return response.json() as Promise<T>
}

// ---- API methods -----------------------------------------------------------

/** List all available datasets */
export async function listDatasets(): Promise<Dataset[]> {
  return get<Dataset[]>('/dataset.json')
}

/** Get a specific dataset by slug */
export async function getDataset(dataset: string): Promise<Dataset> {
  return get<Dataset>(`/dataset/${dataset}.json`)
}

/** Search entities across datasets */
export async function searchEntities(params: EntityQueryParams): Promise<EntityResponse> {
  return get<EntityResponse>('/entity.json', params as Record<string, unknown>)
}

/** Get a specific entity by ID */
export async function getEntity(entityId: number, extension: Extension = 'json'): Promise<Entity> {
  return get<Entity>(`/entity/${entityId}.${extension}`)
}

export type FactResource = {
  resource: string
  entry_date: string
}

export type Fact = {
  fact: string
  entity: number
  'reference-entity': string
  field: string
  value: string
  'entity-name': string
  'entity-prefix': string
  'entity-reference': string
  'earliest-entry-date': string
  'latest-entry-date': string
  'latest-resource': string
  resources: string // JSON-encoded array of FactResource
}

/** Get a single fact by hash. Requires the dataset slug. */
export async function getFact(factHash: string, dataset: string): Promise<Fact> {
  return get<Fact>(`/fact/${factHash}.json`, { dataset })
}
