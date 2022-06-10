import { useQuery, UseQueryOptions } from 'react-query'
import { z } from 'zod'
import axios from './axios'

type ApplicationStatus = JobApplication['status']

const paginationSchema = z.object({
  count: z.number(),
  next: z.nullable(z.string()),
  previous: z.nullable(z.string()),
  results: z.array(
    z.object({
      // !impotant
      CHANGE_ME: z.string(),
    })
  ),
})

type WithPagination<T> = Pick<
  z.infer<typeof paginationSchema>,
  'count' | 'next' | 'previous'
> & {
  results: T[]
}

const companySchema = z.object({ id: z.number(), name: z.string() })
export type Company = z.infer<typeof companySchema>

const eventsSchema = z.object({
  id: z.number(),
  title: z.string(),
  date: z.string(),
  remarks: z.nullable(z.string().default('')),
  tags: z.nullable(z.string().default('')),
  job_application: z.number(),
  user: z.number(),
})
export type Event = z.infer<typeof eventsSchema>

const jobApplicationSchema = z.object({
  id: z.number(),
  applying_date: z.string(),
  status: z.union([z.literal('P'), z.literal('A'), z.literal('R')]),
  company: companySchema,
  user: z.number(),
})
export type JobApplication = z.infer<typeof jobApplicationSchema>

export const getCompanies = () =>
  axios
    .get<Company[]>('/api/companies/')
    .then((res) => res.data)
    .then((data) => data.map((company) => companySchema.parse(company)))

export const createCompanySchema = z.object({
  name: z.string().min(1, 'Name is required'),
})
export type CreateCompanyRequestBody = z.infer<typeof createCompanySchema>
export const createCompany = (values: CreateCompanyRequestBody) =>
  axios.post<Company>('/api/companies/', values).then((res) => res.data)

export const createEventSchema = z.object({
  title: z.string().min(1, 'Enter a title'),
  user: z.number(),
  job_application: z.number(),
  tags: z.string(),
  remarks: z.optional(z.string()),
  date: z.optional(z.string().default('2022-01-01')),
})
export type CreateEventRequestBody = z.infer<typeof createEventSchema>
export const createEvent = (values: CreateEventRequestBody) =>
  axios.post('/api/events/', values).then((res) => res.data)
export const getEvents = () =>
  axios
    .get<Event[]>('/api/events/')
    .then((res) => res.data)
    .then((data) => data.map((event) => eventsSchema.parse(event)))

export const getJobApplications = (page = 1) =>
  axios
    .get<WithPagination<JobApplication>>('/api/applications/', {
      params: { page },
    })
    .then((res) => res.data)
    .then((data) => ({
      ...data,
      results: data.results.map((app) => jobApplicationSchema.parse(app)),
    }))

export const retrieveJobApplication = (id: JobApplication['id']) =>
  axios
    .get<JobApplication>(`/api/applications/${id}`)
    .then((res) => res.data)
    .then((data) => jobApplicationSchema.parse(data))

const createJobAppSchema = z.object({
  status: z.string().default('P'),
  company_id: z.number(),
  user: z.number(),

  // wa ni gamit
  applying_date: z.string().default('2022-01-01'),
})
export type CreateJobAppRequestBody = z.infer<typeof createJobAppSchema>
export const createJobApplication = (values: CreateJobAppRequestBody) =>
  axios
    .post<JobApplication>('/api/applications/', values)
    .then((res) => res.data)

const obtainTokenSchema = z.object({
  email: z.string(),
  password: z.string(),
})
export const obtainToken = (values: z.infer<typeof obtainTokenSchema>) =>
  axios
    .post<{ refresh: string; access: string }>('/api/token/', values)
    .then((res) => res.data)

//
// companies api-related hooks
//
export const COMPANIES_QUERY_KEY = 'companies'

export function useCompanies({
  options,
}: {
  options?: UseQueryOptions<Company[]>
} = {}) {
  return useQuery<Company[]>(COMPANIES_QUERY_KEY, getCompanies, options)
}

//
// events api-related hooks
//
export const EVENTS_QUERY_KEY = 'events'

export function useEvents({
  options,
}: {
  options?: UseQueryOptions<Event[]>
} = {}) {
  return useQuery<Event[]>(EVENTS_QUERY_KEY, getEvents, options)
}

//
// job app api-related hooks
//
export const JOB_APP_QUERY_KEY = 'applications'

export function useJobApplications({
  page = 1,
  options,
}: {
  page?: number
  options?: UseQueryOptions<WithPagination<JobApplication>>
} = {}) {
  return useQuery<WithPagination<JobApplication>>(
    [JOB_APP_QUERY_KEY, page],
    () => getJobApplications(page),
    { ...options, keepPreviousData: true }
  )
}

export function useJobApplication(
  id: JobApplication['id'],
  {
    options,
  }: {
    options?: UseQueryOptions<JobApplication>
  } = {}
) {
  return useQuery<JobApplication>(
    [JOB_APP_QUERY_KEY, { id }],
    () => retrieveJobApplication(id),
    options
  )
}
