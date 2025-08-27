import React from 'react';
import { RuleType } from '../../types';
import { getRuleTypeLabel, getRuleTypeIcon } from '../../utils/ruleUtils';

interface RuleTypeSelectorProps {
  onSelect: (type: RuleType) => void;
}

export function RuleTypeSelector({ onSelect }: RuleTypeSelectorProps) {
  const ruleTypes: { type: RuleType; description: string }[] = [
    {
      type: 'redirect',
      description: 'Redirect URLs to different destinations',
    },
    {
      type: 'modify-headers',
      description: 'Add, modify, or remove HTTP headers',
    },
    {
      type: 'block',
      description: 'Block specific requests from loading',
    },
    {
      type: 'delay',
      description: 'Add artificial delays to requests',
    },
    {
      type: 'script-injection',
      description: 'Inject custom JavaScript into pages',
    },
    {
      type: 'query-param',
      description: 'Modify URL query parameters',
    },
    {
      type: 'user-agent',
      description: 'Override browser user agent string',
    },
    {
      type: 'modify-response',
      description: 'Modify the response of an API request',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {ruleTypes.map(({ type, description }) => (
        <button
          key={type}
          onClick={() => onSelect(type)}
          className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-200 text-left border border-transparent hover:border-purple-500"
        >
          <div className="flex items-center space-x-3 mb-3">
            <span className="text-3xl">{getRuleTypeIcon(type)}</span>
            <h3 className="text-lg font-semibold text-gray-900">
              {getRuleTypeLabel(type)}
            </h3>
          </div>
          <p className="text-gray-600 text-sm">{description}</p>
        </button>
      ))}
    </div>
  );
}