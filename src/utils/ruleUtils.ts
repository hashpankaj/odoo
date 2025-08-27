import { Rule, RuleType } from '../types';

export function generateRuleId(): string {
  return `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function createEmptyRule(type: RuleType): Omit<Rule, 'id' | 'createdAt' | 'updatedAt'> {
  const now = new Date();
  
  return {
    name: `New ${type.replace('-', ' ')} rule`,
    description: '',
    type,
    status: 'inactive',
    conditions: [{
      id: generateRuleId(),
      type: 'url',
      operator: 'contains',
      value: '',
    }],
    actions: getDefaultActions(type),
  };
}

function getDefaultActions(type: RuleType) {
  switch (type) {
    case 'redirect':
      return [{ id: generateRuleId(), type: 'redirect', value: '' }];
    case 'modify-headers':
      return [{ id: generateRuleId(), type: 'add-header', key: '', value: '' }];
    case 'block':
      return [{ id: generateRuleId(), type: 'block', value: 'true' }];
    case 'delay':
      return [{ id: generateRuleId(), type: 'delay', value: '1000' }];
    case 'script-injection':
      return [{ id: generateRuleId(), type: 'inject-script', value: '' }];
    case 'query-param':
      return [{ id: generateRuleId(), type: 'add-param', key: '', value: '' }];
    case 'user-agent':
      return [{ id: generateRuleId(), type: 'user-agent', value: '' }];
    case 'modify-response':
      return [{ id: generateRuleId(), type: 'modify-response', value: '' }];
    default:
      return [];
  }
}

export function exportRules(rules: Rule[]): string {
  return JSON.stringify(rules, null, 2);
}

export function importRules(jsonString: string): Rule[] {
  try {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed)) {
      return parsed.map(rule => ({
        ...rule,
        createdAt: new Date(rule.createdAt),
        updatedAt: new Date(rule.updatedAt),
      }));
    }
    throw new Error('Invalid format');
  } catch (error) {
    throw new Error('Invalid JSON format');
  }
}

export function getRuleTypeLabel(type: RuleType): string {
  switch (type) {
    case 'redirect': return 'URL Redirect';
    case 'modify-headers': return 'Modify Headers';
    case 'block': return 'Block Request';
    case 'delay': return 'Delay Request';
    case 'script-injection': return 'Script Injection';
    case 'query-param': return 'Query Parameters';
    case 'user-agent': return 'User Agent';
    case 'modify-response': return 'Modify API Response';
    default: return type;
  }
}

export function getRuleTypeIcon(type: RuleType): string {
  switch (type) {
    case 'redirect': return '🔀';
    case 'modify-headers': return '📝';
    case 'block': return '🚫';
    case 'delay': return '⏱️';
    case 'script-injection': return '💉';
    case 'query-param': return '🔍';
    case 'user-agent': return '🤖';
    case 'modify-response': return '🔄';
    default: return '⚙️';
  }
}