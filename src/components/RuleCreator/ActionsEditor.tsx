import React from 'react';
import { Plus, X } from 'lucide-react';
import { RuleType } from '../../types';
import { generateRuleId } from '../../utils/ruleUtils';

interface ActionsEditorProps {
  type: RuleType;
  actions: any[];
  onChange: (actions: any[]) => void;
}

export function ActionsEditor({ type, actions, onChange }: ActionsEditorProps) {
  const addAction = () => {
    const newAction = getDefaultActionForType(type);
    onChange([...actions, newAction]);
  };

  const removeAction = (id: string) => {
    onChange(actions.filter(a => a.id !== id));
  };

  const updateAction = (id: string, field: string, value: string) => {
    onChange(actions.map(a => 
      a.id === id ? { ...a, [field]: value } : a
    ));
  };

  const getDefaultActionForType = (type: RuleType) => {
    switch (type) {
      case 'redirect':
        return { id: generateRuleId(), type: 'redirect', value: '' };
      case 'modify-headers':
        return { id: generateRuleId(), type: 'add-header', key: '', value: '' };
      case 'delay':
        return { id: generateRuleId(), type: 'delay', value: '1000' };
      case 'modify-response':
        return { id: generateRuleId(), type: 'modify-response', value: '' };
      default:
        return { id: generateRuleId(), type: type, value: '' };
    }
  };

  const renderActionFields = (action: any) => {
    switch (type) {
      case 'redirect':
        return (
          <input
            type="url"
            value={action.value}
            onChange={(e) => updateAction(action.id, 'value', e.target.value)}
            placeholder="https://example.com/redirect-to"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        );

      case 'modify-headers':
        return (
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={action.key || ''}
              onChange={(e) => updateAction(action.id, 'key', e.target.value)}
              placeholder="Header name"
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <input
              type="text"
              value={action.value}
              onChange={(e) => updateAction(action.id, 'value', e.target.value)}
              placeholder="Header value"
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        );

      case 'delay':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={action.value}
              onChange={(e) => updateAction(action.id, 'value', e.target.value)}
              placeholder="1000"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <span className="text-gray-600">ms</span>
          </div>
        );

      case 'script-injection':
        return (
          <textarea
            value={action.value}
            onChange={(e) => updateAction(action.id, 'value', e.target.value)}
            placeholder="console.log('Custom script injected');"
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
          />
        );

      case 'modify-response':
        return (
          <textarea
            value={action.value}
            onChange={(e) => updateAction(action.id, 'value', e.target.value)}
            placeholder='Enter JSON response, e.g., { "key": "value" }'
            rows={5}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
          />
        );

      default:
        return (
          <input
            type="text"
            value={action.value}
            onChange={(e) => updateAction(action.id, 'value', e.target.value)}
            placeholder="Enter value..."
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        );
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Actions</h2>
        <button
          onClick={addAction}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center space-x-2"
        >
          <Plus size={16} />
          <span>Add Action</span>
        </button>
      </div>

      <div className="space-y-4">
        {actions.map((action, index) => (
          <div key={action.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">
                Action {index + 1}
              </span>
              {actions.length > 1 && (
                <button
                  onClick={() => removeAction(action.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {renderActionFields(action)}
          </div>
        ))}
      </div>
    </div>
  );
}