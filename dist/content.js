// Content script for RequestPro Chrome Extension
class RequestProContent {
  constructor() {
    this.init();
  }

  init() {
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true;
    });

    // Check for script injection rules
    this.checkScriptInjection();
    
    // Monitor DOM changes for dynamic script injection
    this.observeDOM();
  }

  async handleMessage(message, sender, sendResponse) {
    switch (message.type) {
      case 'INJECT_SCRIPT':
        this.injectScript(message.script);
        sendResponse({ success: true });
        break;
      
      case 'GET_PAGE_INFO':
        sendResponse({
          url: window.location.href,
          title: document.title,
          host: window.location.hostname
        });
        break;
      
      case 'MODIFY_QUERY_PARAMS':
        this.modifyQueryParams(message.params);
        sendResponse({ success: true });
        break;

      case 'SHOW_TOAST':
        this.showToast(message.message);
        sendResponse({ success: true });
        break;
    }
  }

  showToast(message) {
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    toast.style.color = 'white';
    toast.style.padding = '12px 20px';
    toast.style.borderRadius = '8px';
    toast.style.zIndex = '2147483647';
    toast.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    toast.style.fontSize = '14px';
    toast.style.lineHeight = '1.5';
    toast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
    toast.style.transform = 'translateY(20px)';
    toast.textContent = message;

    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    }, 10);

    // Animate out and remove
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }

  checkScriptInjection() {
    if (chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'GET_RULES' }, (response) => {
        if (chrome.runtime.lastError) {
          // Extension context invalidated. This is expected during development when the extension is reloaded.
          // We can safely ignore this error.
          return;
        }

        if (response && response.rules) {
          const activeRules = response.rules.filter(r => r.status === 'active');

          for (const rule of activeRules) {
            if (rule.type === 'script-injection' && this.matchesCurrentPage(rule.conditions)) {
              const scriptAction = rule.actions.find(a => a.type === 'inject-script');
              if (scriptAction && scriptAction.value) {
                this.injectScript(scriptAction.value);
              }
            } else if (rule.type === 'query-param' && this.matchesCurrentPage(rule.conditions)) {
              this.handleQueryParamRule(rule.actions);
            }
          }
        }
      });
    }
  }

  matchesCurrentPage(conditions) {
    return conditions.every(condition => {
      const value = this.getValueForCondition(condition.type);
      return this.testCondition(value, condition.operator, condition.value);
    });
  }

  getValueForCondition(type) {
    switch (type) {
      case 'url': return window.location.href;
      case 'host': return window.location.hostname;
      case 'path': return window.location.pathname;
      default: return '';
    }
  }

  testCondition(value, operator, pattern) {
    switch (operator) {
      case 'contains': return value.includes(pattern);
      case 'equals': return value === pattern;
      case 'starts-with': return value.startsWith(pattern);
      case 'ends-with': return value.endsWith(pattern);
      case 'regex': 
        try {
          return new RegExp(pattern).test(value);
        } catch {
          return false;
        }
      default: return false;
    }
  }

  injectScript(scriptCode) {
    try {
      // Create and inject script element
      const script = document.createElement('script');
      script.textContent = scriptCode;
      
      // Inject into page context
      (document.head || document.documentElement).appendChild(script);
      
      // Clean up
      script.remove();
      
      console.log('RequestPro: Script injected successfully');
    } catch (error) {
      console.error('RequestPro: Failed to inject script:', error);
    }
  }

  handleQueryParamRule(actions) {
    const url = new URL(window.location.href);
    let modified = false;

    for (const action of actions) {
      if (action.type === 'add-param' && action.key && action.value) {
        url.searchParams.set(action.key, action.value);
        modified = true;
      } else if (action.type === 'remove-param' && action.key) {
        url.searchParams.delete(action.key);
        modified = true;
      }
    }

    if (modified) {
      // Update URL without page reload
      window.history.replaceState({}, '', url.toString());
    }
  }

  modifyQueryParams(params) {
    const url = new URL(window.location.href);
    
    for (const [key, value] of Object.entries(params)) {
      if (value === null) {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, value);
      }
    }
    
    window.history.replaceState({}, '', url.toString());
  }

  observeDOM() {
    // Watch for dynamic content changes
    const observer = new MutationObserver((mutations) => {
      // Re-check script injection rules when DOM changes
      // This is useful for SPAs and dynamic content
      this.checkScriptInjection();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
}

// Initialize content script
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new RequestProContent());
} else {
  new RequestProContent();
}