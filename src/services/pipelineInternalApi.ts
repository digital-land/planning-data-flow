// In dev, requests go via the Vite proxy at /pipeline-api to avoid CORS.
// In production, set VITE_PIPELINE_API_URL to the real API origin.
const BASE_URL = import.meta.env.VITE_PIPELINE_API_URL ?? '/pipeline-api'

// ---- Types ----------------------------------------------------------------

export type PaginatedResponse<T> = {
  items: T[]
  pagination: {
    offset: number
    limit: number
    total: number
  }
}

// /log/issue
export type IssueLog = {
  dataset?: string
  resource?: string
  field?: string
  issue_type?: string
  message?: string
  [key: string]: unknown
}

export type IssueQueryParams = {
  dataset?: string
  resource?: string
  field?: string
  issue_type?: string
  offset?: number
  limit?: number
}

// /performance/provision_summary
export type ProvisionSummary = {
  dataset?: string
  organisation?: string
  [key: string]: unknown
}

export type ProvisionSummaryQueryParams = {
  organisation?: string
  dataset?: string
  offset?: number
  limit?: number
}

// /performance/issue_type_summary
export type IssueTypeSummary = {
  dataset?: string
  organisation?: string
  organisation_name?: string
  issue_type?: string
  field?: string
  severity?: string
  responsibility?: string
  resource?: string
  count_issues?: number
  [key: string]: unknown
}

export type IssueTypeSummaryQueryParams = {
  dataset?: string
  organisation?: string
  issueType?: string
  issueField?: string
  severity?: string
  responsibility?: string
  /** Comma-separated list of resource hashes */
  resource?: string
  offset?: number
  limit?: number
}

// /performance/dataset_resource_mapping
export type DatasetResourceMapping = {
  dataset?: string
  organisation?: string
  endpoint_url?: string
  resource?: string
  [key: string]: unknown
}

export type DatasetResourceMappingQueryParams = {
  dataset?: string
  organisation?: string
  endpoint_url?: string
  offset?: number
  limit?: number
}

// /performance/endpoint_dataset_summary
export type EndpointDatasetSummary = {
  dataset?: string
  organisation?: string
  [key: string]: unknown
}

export type EndpointDatasetSummaryQueryParams = {
  dataset?: string
  organisation?: string
  endpoint_url?: string
  offset?: number
  limit?: number
}

// /specification/specification
export type Specification = {
  dataset?: string
  [key: string]: unknown
}

export type SpecificationQueryParams = {
  dataset?: string
  offset?: number
  limit?: number
}

// ---- Helpers ---------------------------------------------------------------

function buildSearchParams(params: Record<string, unknown>): URLSearchParams {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue
    search.set(key, String(value))
  }
  return search
}

async function get<T>(
  path: string,
  params?: Record<string, unknown>,
): Promise<{ data: T; headers: Headers }> {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin)
  if (params) {
    buildSearchParams(params).forEach((v, k) => url.searchParams.set(k, v))
  }

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Pipeline API error ${response.status}: ${response.statusText}`)
  }

  const data = (await response.json()) as T
  return { data, headers: response.headers }
}

function extractPagination(
  headers: Headers,
  params: { offset?: number; limit?: number },
) {
  return {
    offset: params.offset ?? 0,
    limit: params.limit ?? 10,
    total: Number(headers.get('X-Pagination-Total') ?? 0),
  }
}

// ---- API methods -----------------------------------------------------------

/**
 * GET /log/issue
 * S3: log/issue/**\/*.parquet
 * Paginated issue logs. Filter by dataset, resource, field, or issue_type.
 */
export async function getIssues(
  params: IssueQueryParams = {},
): Promise<PaginatedResponse<IssueLog>> {
  const { data, headers } = await get<IssueLog[]>(
    '/log/issue',
    params as Record<string, unknown>,
  )
  return { items: data, pagination: extractPagination(headers, params) }
}

/**
 * GET /performance/provision_summary
 * S3: data/performance/provision_summary.parquet
 * Provision summary, optionally filtered by organisation and/or dataset.
 */
export async function getProvisionSummary(
  params: ProvisionSummaryQueryParams = {},
): Promise<PaginatedResponse<ProvisionSummary>> {
  const { data, headers } = await get<ProvisionSummary[]>(
    '/performance/provision_summary',
    params as Record<string, unknown>,
  )
  return { items: data, pagination: extractPagination(headers, params) }
}

/**
 * GET /performance/issue_type_summary
 * S3: data/performance/endpoint_dataset_issue_type_summary.parquet
 * Issue counts grouped by type. Filter by severity, responsibility, dataset, etc.
 * resource param accepts a comma-separated list of resource hashes.
 */
export async function getIssueTypeSummary(
  params: IssueTypeSummaryQueryParams = {},
): Promise<PaginatedResponse<IssueTypeSummary>> {
  const { data, headers } = await get<IssueTypeSummary[]>(
    '/performance/issue_type_summary',
    params as Record<string, unknown>,
  )
  return { items: data, pagination: extractPagination(headers, params) }
}

/**
 * GET /performance/dataset_resource_mapping
 * S3: data/performance/endpoint_dataset_resource_summary.parquet
 * Maps endpoints to datasets and resources.
 */
export async function getDatasetResourceMapping(
  params: DatasetResourceMappingQueryParams = {},
): Promise<PaginatedResponse<DatasetResourceMapping>> {
  const { data, headers } = await get<DatasetResourceMapping[]>(
    '/performance/dataset_resource_mapping',
    params as Record<string, unknown>,
  )
  return { items: data, pagination: extractPagination(headers, params) }
}

/**
 * GET /performance/endpoint_dataset_summary
 * S3: data/performance/endpoint_dataset_summary.parquet
 * Summary of endpoint health and dataset status per organisation.
 */
export async function getEndpointDatasetSummary(
  params: EndpointDatasetSummaryQueryParams = {},
): Promise<PaginatedResponse<EndpointDatasetSummary>> {
  const { data, headers } = await get<EndpointDatasetSummary[]>(
    '/performance/endpoint_dataset_summary',
    params as Record<string, unknown>,
  )
  return { items: data, pagination: extractPagination(headers, params) }
}

/**
 * GET /specification/specification
 * S3: data/specification/*.parquet
 * Dataset specifications, optionally filtered by dataset.
 */
export async function getSpecification(
  params: SpecificationQueryParams = {},
): Promise<PaginatedResponse<Specification>> {
  const { data, headers } = await get<Specification[]>(
    '/specification/specification',
    params as Record<string, unknown>,
  )
  return { items: data, pagination: extractPagination(headers, params) }
}
