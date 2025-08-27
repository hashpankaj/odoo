import React from 'react';
import { Search, Filter, Plus } from 'lucide-react';
import { RuleCard } from './RuleCard';
import { useRules } from '../../context/RulesContext';
import { generateRuleId } from '../../utils/ruleUtils';

export function RulesList() {
  const { state, dispatch } = useRules();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterType, setFilterType] = React.useState<'all' | 'active' | 'inactive'>('all');

  const filteredRules = state.rules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rule.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || rule.status === filterType;
    return matchesSearch && matchesFilter;
  });

  const handleToggleRule = (ruleId: string) => {
    dispatch({ type: 'TOGGLE_RULE', payload: ruleId });
  };

  const handleDeleteRule = (ruleId: string) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      dispatch({ type: 'DELETE_RULE', payload: ruleId });
    }
  };

  const handleDuplicateRule = (rule: any) => {
    const duplicatedRule = {
      ...rule,
      id: generateRuleId(),
      name: `${rule.name} (Copy)`,
      status: 'inactive' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    dispatch({ type: 'ADD_RULE', payload: duplicatedRule });
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Rules</h1>
            <p className="text-gray-600 mt-2">Manage your request modification rules</p>
          </div>
          <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center space-x-2">
            <Plus size={20} />
            <span>New Rule</span>
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search rules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="pl-10 pr-8 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Rules</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {filteredRules.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-gray-400 mb-4">
            <Filter size={64} className="mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No rules found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || filterType !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Get started by creating your first rule'
            }
          </p>
          <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium">
            Create New Rule
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredRules.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onEdit={() => dispatch({ type: 'SELECT_RULE', payload: rule.id })}
              onDelete={() => handleDeleteRule(rule.id)}
              onToggle={() => handleToggleRule(rule.id)}
              onDuplicate={() => handleDuplicateRule(rule)}
            />
          ))}
        </div>
      )}
    </div>
  );
}