export interface AutoCashoutConfig {
  isEnabled: boolean
  multiplier: number
}

export interface UseAutoCashoutProps {
  config: AutoCashoutConfig
  onCashout: () => Promise<void>
  isButtonDisabled: boolean
}