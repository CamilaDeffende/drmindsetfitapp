import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/error-boundary'
import { SubscriptionGate } from "@/components/SubscriptionGate";

createRoot(document.getElementById('root')!).render(
<SubscriptionGate>
<StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
</SubscriptionGate>
)

// data-ui="subscription-gate-main"
