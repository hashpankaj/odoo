import React from 'react';
import { Plus, X } from 'lucide-react';
import { generateRuleId } from '../../utils/ruleUtils';

interface ConditionsEditorProps {
  conditions: any[];
  onChange: (conditions: any[]) => void;
}

export function ConditionsEditor({ conditions, onChange }: ConditionsEditorProps) {
  const addCondition = () => {
    const newCondition = {
      id: generateRuleId(),
      type: 'url',
      operator: 'contains',
      value: '',
    };
    onChange([...conditions, newCondition]);
  };

  const removeCondition = (id: string) => {
    onChange(conditions.filter(c => c.id !== id));
  };

  const updateCondition = (id: string, field: string, value: string) => {
    onChange(conditions.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Conditions</h2>
        <button
          onClick={addCondition}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Add Condition</span>
        </button>
      </div>

      <div className="space-y-4">
        {conditions.map((condition, index) => (
          <div key={condition.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">
                Condition {index + 1}
              </span>
              {conditions.length > 1 && (
                <button
                  onClick={() => removeCondition(condition.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <select
                value={condition.type}
                onChange={(e) => updateCondition(condition.id, 'type', e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="url">URL</option>
                <option value="host">Host</option>
                <option value="path">Path</option>
              </select>

              <select
                value={condition.operator}
                onChange={(e) => updateCondition(condition.id, 'operator', e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="contains">Contains</option>
                <option value="equals">Equals</option>
                <option value="starts-with">Starts with</option>
                <option value="ends-with">Ends with</option>
                <option value="regex">Regex</option>
              </select>

              <input
                type="text"
                value={condition.value}
                onChange={(e) => updateCondition(condition.id, 'value', e.target.value)}
                placeholder="Enter value..."
                className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}