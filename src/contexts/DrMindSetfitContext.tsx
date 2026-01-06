import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import type { DrMindSetfitState } from '@/types'

interface DrMindSetfitContextType {
  state: DrMindSetfitState
  updateState: (updates: Partial<DrMindSetfitState>) => void
  nextStep: () => void
  prevStep: () => void
  resetApp: () => void
}

const DrMindSetfitContext = createContext<DrMindSetfitContextType | undefined>(undefined)

const STORAGE_KEY = 'drmindsetfit_state'

const initialState: DrMindSetfitState = {
  etapaAtual: 1,
  concluido: false,
  passosDiarios: [],
  consumoCalorias: [],
  corridas: []
}

// Função para carregar estado do localStorage
const loadStateFromStorage = (): DrMindSetfitState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Erro ao carregar estado:', error)
  }
  return initialState
}

// Função para salvar estado no localStorage
const saveStateToStorage = (state: DrMindSetfitState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('Erro ao salvar estado:', error)
  }
}

export function DrMindSetfitProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DrMindSetfitState>(loadStateFromStorage)

  // Salvar no localStorage sempre que o estado mudar
  useEffect(() => {
    saveStateToStorage(state)
  }, [state])

  const updateState = (updates: Partial<DrMindSetfitState>) => {
    setState(prev => {
      const newState = { ...prev, ...updates }
      return newState
    })
  }

  const nextStep = () => {
    setState(prev => {
      const newState = {
        ...prev,
        etapaAtual: Math.min(prev.etapaAtual + 1, 8)
      }
      return newState
    })
  }

  const prevStep = () => {
    setState(prev => {
      const newState = {
        ...prev,
        etapaAtual: Math.max(prev.etapaAtual - 1, 1)
      }
      return newState
    })
  }

  const resetApp = () => {
    setState(initialState)
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <DrMindSetfitContext.Provider value={{ state, updateState, nextStep, prevStep, resetApp }}>
      {children}
    </DrMindSetfitContext.Provider>
  )
}

export function useDrMindSetfit() {
  const context = useContext(DrMindSetfitContext)
  if (!context) {
    throw new Error('useDrMindSetfit deve ser usado dentro de DrMindSetfitProvider')
  }
  return context
}
