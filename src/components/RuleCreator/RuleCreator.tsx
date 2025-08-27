import React, { useState } from 'react';
import { ArrowLeft, Save, Play } from 'lucide-react';
import { RuleType } from '../../types';
import { RuleTypeSelector } from './RuleTypeSelector';
import { ConditionsEditor } from './ConditionsEditor';
import { ActionsEditor } from './ActionsEditor';
import { useRules } from '../../context/RulesContext';
import { generateRuleId, createEmptyRule } from '../../utils/ruleUtils';

interface RuleCreatorProps {
  onBack: () => void;
}

export function RuleCreator({ onBack }: RuleCreatorProps) {
  const { dispatch } = useRules();
  const [selectedType, setSelectedType] = useState<RuleType | null>(null);
  const [ruleName, setRuleName] = useState('');
  const [ruleDescription, setRuleDescription] = useState('');
  const [conditions, setConditions] = useState<any[]>([]);
  const [actions, setActions] = useState<any[]>([]);

  const handleTypeSelect = (type: RuleType) => {
    setSelectedType(type);
    const emptyRule = createEmptyRule(type);
    setRuleName(emptyRule.name);
    setRuleDescription(emptyRule.description);
    setConditions(emptyRule.conditions);
    setActions(emptyRule.actions);
  };

  const handleSave = (activate = false) => {
    if (!selectedType || !ruleName.trim()) {
      alert('Please provide a rule name and select a type');
      return;
    }

    const newRule = {
      id: generateRuleId(),
      name: ruleName.trim(),
      description: ruleDescription.trim(),
      type: selectedType,
      status: activate ? 'active' as const : 'inactive' as const,
      conditions,
      actions,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dispatch({ type: 'ADD_RULE', payload: newRule });
    onBack();
  };

  if (!selectedType) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Create New Rule</h1>
          <p className="text-gray-600 mt-2">Choose a rule type to get started</p>
        </div>

        <RuleTypeSelector onSelect={handleTypeSelect} />
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <button
          onClick={() => setSelectedType(null)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          <span>Back to Rule Types</span>
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Configure Rule</h1>
        <p className="text-gray-600 mt-2">Set up your {selectedType} rule</p>
      </div>

      <div className="max-w-4xl space-y-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rule Name *
              </label>
              <input
                type="text"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter rule name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={ruleDescription}
                onChange={(e) => setRuleDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Describe what this rule does"
              />
            </div>
          </div>
        </div>

        <ConditionsEditor conditions={conditions} onChange={setConditions} />
        <ActionsEditor type={selectedType} actions={actions} onChange={setActions} />

        <div className="flex items-center space-x-4">
          <button
            onClick={() => handleSave(false)}
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium flex items-center space-x-2"
          >
            <Save size={20} />
            <span>Save Draft</span>
          </button>
          <button
            onClick={() => handleSave(true)}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center space-x-2"
          >
            <Play size={20} />
            <span>Save & Activate</span>
          </button>
        </div>
      </div>
    </div>
  );
}