import React from 'react';
import { Edit, Trash2, Power, Copy } from 'lucide-react';
import { Rule } from '../../types';
import { getRuleTypeLabel, getRuleTypeIcon } from '../../utils/ruleUtils';

interface RuleCardProps {
  rule: Rule;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onDuplicate: () => void;
}

export function RuleCard({ rule, onEdit, onDelete, onToggle, onDuplicate }: RuleCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-200 border-l-4 border-purple-500">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getRuleTypeIcon(rule.type)}</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{rule.name}</h3>
            <p className="text-sm text-gray-600">{getRuleTypeLabel(rule.type)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            rule.status === 'active' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {rule.status}
          </span>
        </div>
      </div>

      <p className="text-gray-700 mb-4 line-clamp-2">
        {rule.description || 'No description provided'}
      </p>

      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          Updated {new Date(rule.updatedAt).toLocaleDateString()}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggle}
            className={`p-2 rounded-lg transition-colors ${
              rule.status === 'active' 
                ? 'text-green-600 hover:bg-green-50' 
                : 'text-gray-400 hover:bg-gray-50'
            }`}
            title={rule.status === 'active' ? 'Deactivate rule' : 'Activate rule'}
          >
            <Power size={18} />
          </button>
          
          <button
            onClick={onDuplicate}
            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            title="Duplicate rule"
          >
            <Copy size={18} />
          </button>
          
          <button
            onClick={onEdit}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit rule"
          >
            <Edit size={18} />
          </button>
          
          <button
            onClick={onDelete}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete rule"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}