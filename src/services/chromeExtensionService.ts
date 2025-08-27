// Service to communicate with Chrome extension APIs
export class ChromeExtensionService {
  private static instance: ChromeExtensionService;

  static getInstance(): ChromeExtensionService {
    if (!ChromeExtensionService.instance) {
      ChromeExtensionService.instance = new ChromeExtensionService();
    }
    return ChromeExtensionService.instance;
  }

  // Check if running as Chrome extension
  isExtension(): boolean {
    return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
  }

  // Send message to background script
  async sendMessage(message: any): Promise<any> {
    if (!this.isExtension()) {
      console.warn('Not running as Chrome extension');
      return null;
    }

    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
  }

  // Get all rules from background script
  async getRules(): Promise<{ rules: any[], stats: any }> {
    return this.sendMessage({ type: 'GET_RULES' });
  }

  // Add new rule
  async addRule(rule: any): Promise<boolean> {
    const response = await this.sendMessage({ type: 'ADD_RULE', rule });
    return response?.success || false;
  }

  // Update existing rule
  async updateRule(rule: any): Promise<boolean> {
    const response = await this.sendMessage({ type: 'UPDATE_RULE', rule });
    return response?.success || false;
  }

  // Delete rule
  async deleteRule(ruleId: string): Promise<boolean> {
    const response = await this.sendMessage({ type: 'DELETE_RULE', ruleId });
    return response?.success || false;
  }

  // Toggle rule status
  async toggleRule(ruleId: string): Promise<boolean> {
    const response = await this.sendMessage({ type: 'TOGGLE_RULE', ruleId });
    return response?.success || false;
  }

  // Inject script into current tab
  async injectScript(script: string): Promise<boolean> {
    if (!this.isExtension()) return false;
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        const response = await this.sendMessage({ 
          type: 'INJECT_SCRIPT', 
          tabId: tab.id, 
          script 
        });
        return response?.success || false;
      }
    } catch (error) {
      console.error('Failed to inject script:', error);
    }
    
    return false;
  }

  // Get current tab info
  async getCurrentTab(): Promise<any> {
    if (!this.isExtension()) return null;
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      return tab;
    } catch (error) {
      console.error('Failed to get current tab:', error);
      return null;
    }
  }

  // Open extension in new tab
  async openInNewTab(): Promise<void> {
    if (!this.isExtension()) return;
    
    try {
      await chrome.tabs.create({
        url: chrome.runtime.getURL('index.html')
      });
    } catch (error) {
      console.error('Failed to open in new tab:', error);
    }
  }

  // Export rules to file
  async exportRules(rules: any[]): Promise<void> {
    const dataStr = JSON.stringify(rules, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `requestpro-rules-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  }

  // Import rules from file
  async importRules(): Promise<any[] | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const rules = JSON.parse(e.target?.result as string);
            resolve(Array.isArray(rules) ? rules : null);
          } catch (error) {
            console.error('Failed to parse rules file:', error);
            resolve(null);
          }
        };
        reader.readAsText(file);
      };
      
      input.click();
    });
  }
}