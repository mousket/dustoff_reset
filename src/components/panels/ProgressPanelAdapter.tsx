// src/components/panels/ProgressPanelAdapter.tsx
// Wraps ProgressPanel with PanelContainer, matching the other panel adapters.

import { PanelContainer } from '@/components/PanelContainer'
import { ProgressPanel } from '@/features/desktop/panels/ProgressPanel'

interface ProgressPanelAdapterProps {
  isOpen: boolean
  onClose: () => void
}

export function ProgressPanelAdapter({ isOpen, onClose }: ProgressPanelAdapterProps) {
  return (
    <PanelContainer isOpen={isOpen}>
      <ProgressPanel onClose={onClose} />
    </PanelContainer>
  )
}

export type { ProgressPanelAdapterProps }
