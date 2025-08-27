import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Rule, RuleStats } from '../types';
import { useChromeExtension } from '../hooks/useChromeExtension';

interface RulesState {
  rules: Rule[];
  stats: RuleStats;
  selectedRuleId: string | null;
}

type RulesAction = 
  | { type: 'ADD_RULE'; payload: Rule }
  | { type: 'UPDATE_RULE'; payload: Rule }
  | { type: 'DELETE_RULE'; payload: string }
  | { type: 'TOGGLE_RULE'; payload: string }
  | { type: 'SELECT_RULE'; payload: string | null }
  | { type: 'IMPORT_RULES'; payload: Rule[] }
  | { type: 'UPDATE_STATS'; payload: Partial<RuleStats> };

const initialState: RulesState = {
  rules: [],
  stats: {
    totalRules: 0,
    activeRules: 0,
    blockedRequests: 0,
    redirectedRequests: 0,
  },
  selectedRuleId: null,
};

const RulesContext = createContext<{
  state: RulesState;
  dispatch: React.Dispatch<RulesAction>;
  importRules: () => Promise<boolean>;
  exportRules: () => Promise<void>;
  setCurrentView: (view: string) => void;
} | null>(null);

function rulesReducer(state: RulesState, action: RulesAction): RulesState {
  switch (action.type) {
    case 'ADD_RULE':
      const newRules = [...state.rules, action.payload];
      return {
        ...state,
        rules: newRules,
        stats: {
          ...state.stats,
          totalRules: newRules.length,
          activeRules: newRules.filter(r => r.status === 'active').length,
        },
      };
    
    case 'UPDATE_RULE':
      const updatedRules = state.rules.map(rule => 
        rule.id === action.payload.id ? action.payload : rule
      );
      return {
        ...state,
        rules: updatedRules,
        stats: {
          ...state.stats,
          activeRules: updatedRules.filter(r => r.status === 'active').length,
        },
      };
    
    case 'DELETE_RULE':
      const filteredRules = state.rules.filter(rule => rule.id !== action.payload);
      return {
        ...state,
        rules: filteredRules,
        selectedRuleId: state.selectedRuleId === action.payload ? null : state.selectedRuleId,
        stats: {
          ...state.stats,
          totalRules: filteredRules.length,
          activeRules: filteredRules.filter(r => r.status === 'active').length,
        },
      };
    
    case 'TOGGLE_RULE':
      const toggledRules = state.rules.map(rule => 
        rule.id === action.payload 
          ? { ...rule, status: rule.status === 'active' ? 'inactive' : 'active' as const }
          : rule
      );
      return {
        ...state,
        rules: toggledRules,
        stats: {
          ...state.stats,
          activeRules: toggledRules.filter(r => r.status === 'active').length,
        },
      };
    
    case 'SELECT_RULE':
      return { ...state, selectedRuleId: action.payload };
    
    case 'IMPORT_RULES':
      return {
        ...state,
        rules: action.payload,
        stats: {
          ...state.stats,
          totalRules: action.payload.length,
          activeRules: action.payload.filter(r => r.status === 'active').length,
        },
      };
    
    case 'UPDATE_STATS':
      return {
        ...state,
        stats: { ...state.stats, ...action.payload },
      };
    
    default:
      return state;
  }
}

export function RulesProvider({ children, setCurrentView }: { children: ReactNode, setCurrentView: (view: string) => void }) {
  const [state, dispatch] = useReducer(rulesReducer, initialState);
  const chromeExtension = useChromeExtension();

  // If running as Chrome extension, use extension data
  const effectiveState = chromeExtension.isExtension ? {
    rules: chromeExtension.rules,
    stats: chromeExtension.stats,
    selectedRuleId: state.selectedRuleId,
  } : state;

  // Enhanced dispatch that works with Chrome extension
  const enhancedDispatch = async (action: RulesAction) => {
    if (chromeExtension.isExtension) {
      switch (action.type) {
        case 'ADD_RULE':
          await chromeExtension.addRule(action.payload);
          break;
        case 'UPDATE_RULE':
          await chromeExtension.updateRule(action.payload);
          break;
        case 'DELETE_RULE':
          await chromeExtension.deleteRule(action.payload);
          break;
        case 'TOGGLE_RULE':
          await chromeExtension.toggleRule(action.payload);
          break;
        case 'IMPORT_RULES':
          // Handle import through Chrome extension
          for (const rule of action.payload) {
            await chromeExtension.addRule(rule);
          }
          break;
        default:
          dispatch(action);
      }
    } else {
      dispatch(action);
    }
  };
  return (
    <RulesContext.Provider value={{ 
      state: effectiveState, 
      dispatch: enhancedDispatch,
      importRules: chromeExtension.importRules,
      exportRules: chromeExtension.exportRules,
      setCurrentView,
    }}>
      {children}
    </RulesContext.Provider>
  );
}

export function useRules() {
  const context = useContext(RulesContext);
  if (!context) {
    throw new Error('useRules must be used within a RulesProvider');
  }
  return context;
}