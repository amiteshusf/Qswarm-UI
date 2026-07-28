import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'

import { AppProviders } from '@/app/providers'
import { ContractGate } from '@/app/contract-gate'
import { router } from '@/app/router'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <ContractGate>
        <RouterProvider router={router} />
      </ContractGate>
    </AppProviders>
  </StrictMode>,
)
