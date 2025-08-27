import { useState, useEffect } from 'react';
import { ChromeExtensionService } from '../services/chromeExtensionService';
import { Rule, RuleStats } from '../types';

export function useChromeExtension() {
  const [isExtension, setIsExtension] = useState(false);
  const [rules, setRules] = useState<Rule[]>([]);
  const [stats, setStats] = useState<RuleStats>({
    totalRules: 0,
    activeRules: 0,
    blockedRequests: 0,
    redirectedRequests: 0,
  });
  const [loading, setLoading] = useState(true);

  const extensionService = ChromeExtensionService.getInstance();

  useEffect(() => {
    const checkExtension = async () => {
      const isExt = extensionService.isExtension();
      setIsExtension(isExt);
      
      if (isExt) {
        await loadRules();
      }
      
      setLoading(false);
    };

    checkExtension();
  }, []);

  const loadRules = async () => {
    try {
      const data = await extensionService.getRules();
      if (data) {
        setRules(data.rules || []);
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.error('Failed to load rules:', error);
    }
  };

  const addRule = async (rule: Rule): Promise<boolean> => {
    try {
      const success = await extensionService.addRule(rule);
      if (success) {
        await loadRules();
      }
      return success;
    } catch (error) {
      console.error('Failed to add rule:', error);
      return false;
    }
  };

  const updateRule = async (rule: Rule): Promise<boolean> => {
    try {
      const success = await extensionService.updateRule(rule);
      if (success) {
        await loadRules();
      }
      return success;
    } catch (error) {
      console.error('Failed to update rule:', error);
      return false;
    }
  };

  const deleteRule = async (ruleId: string): Promise<boolean> => {
    try {
      const success = await extensionService.deleteRule(ruleId);
      if (success) {
        await loadRules();
      }
      return success;
    } catch (error) {
      console.error('Failed to delete rule:', error);
      return false;
    }
  };

  const toggleRule = async (ruleId: string): Promise<boolean> => {
    try {
      const success = await extensionService.toggleRule(ruleId);
      if (success) {
        await loadRules();
      }
      return success;
    } catch (error) {
      console.error('Failed to toggle rule:', error);
      return false;
    }
  };

  const injectScript = async (script: string): Promise<boolean> => {
    try {
      return await extensionService.injectScript(script);
    } catch (error) {
      console.error('Failed to inject script:', error);
      return false;
    }
  };

  const exportRules = async (): Promise<void> => {
    try {
      await extensionService.exportRules(rules);
    } catch (error) {
      console.error('Failed to export rules:', error);
    }
  };

  const importRules = async (): Promise<boolean> => {
    try {
      const importedRules = await extensionService.importRules();
      if (importedRules) {
        // Add all imported rules
        for (const rule of importedRules) {
          await extensionService.addRule(rule);
        }
        await loadRules();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import rules:', error);
      return false;
    }
  };

  const openInNewTab = async (): Promise<void> => {
    try {
      await extensionService.openInNewTab();
    } catch (error) {
      console.error('Failed to open in new tab:', error);
    }
  };

  return {
    isExtension,
    rules,
    stats,
    loading,
    addRule,
    updateRule,
    deleteRule,
    toggleRule,
    injectScript,
    exportRules,
    importRules,
    openInNewTab,
    loadRules,
  };
}