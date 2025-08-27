export interface Rule {
  id: string;
  name: string;
  description: string;
  type: RuleType;
  status: 'active' | 'inactive';
  conditions: Condition[];
  actions: Action[];
  createdAt: Date;
  updatedAt: Date;
}

export type RuleType = 
  | 'redirect' 
  | 'modify-headers' 
  | 'block' 
  | 'delay' 
  | 'script-injection' 
  | 'query-param' 
  | 'user-agent'
  | 'modify-response';

export interface Condition {
  id: string;
  type: 'url' | 'host' | 'path';
  operator: 'contains' | 'equals' | 'starts-with' | 'ends-with' | 'regex';
  value: string;
}

export interface Action {
  id: string;
  type: string;
  value: string;
  key?: string;
}

export interface RuleStats {
  totalRules: number;
  activeRules: number;
  blockedRequests: number;
  redirectedRequests: number;
}