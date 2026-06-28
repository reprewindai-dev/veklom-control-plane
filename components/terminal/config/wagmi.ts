import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { base, mainnet } from '@reown/appkit/networks'
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient()

// Get your projectId at https://cloud.reown.com
// For now, using a valid demo project ID
export const projectId = 'b2123ccbf471a2b0c3f09ba9624be206'

const metadata = {
  name: 'Veklom Sovereign Control Plane',
  description: 'Veklom Control Plane with x402 Payments',
  url: 'https://veklom.com', // origin must match your domain & subdomain
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// x402 requires base mainnet
export const networks = [base, mainnet] as any;

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks
})

export const config = wagmiAdapter.wagmiConfig

// Initialize AppKit
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  features: {
    analytics: true
  }
})
