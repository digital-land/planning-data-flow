import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'

type EndpointUrlContextValue = {
  endpointUrl: string
  setEndpointUrl: (url: string) => void
}

const EndpointUrlContext = createContext<EndpointUrlContextValue | null>(null)

export function EndpointUrlProvider({ children }: { children: ReactNode }) {
  const [endpointUrl, setEndpointUrl] = useState('')
  return (
    <EndpointUrlContext.Provider value={{ endpointUrl, setEndpointUrl }}>
      {children}
    </EndpointUrlContext.Provider>
  )
}

export function useEndpointUrl() {
  const ctx = useContext(EndpointUrlContext)
  if (!ctx) throw new Error('useEndpointUrl must be used within EndpointUrlProvider')
  return ctx
}
