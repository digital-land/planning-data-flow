import FlowCanvas from './components/FlowCanvas'
import Toolbar from './components/Toolbar'
import { EndpointUrlProvider } from './context/EndpointUrlContext'

export default function App() {
  return (
    <EndpointUrlProvider>
      <Toolbar />
      <FlowCanvas />
    </EndpointUrlProvider>
  )
}
