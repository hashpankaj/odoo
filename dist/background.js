// Background service worker for Chrome extension
class RequestProBackground {
  constructor() {
    this.rules = [];
    this.stats = {
      totalRules: 0,
      activeRules: 0,
      blockedRequests: 0,
      redirectedRequests: 0
    };
    this.init();
  }

  async init() {
    // Load rules from storage
    await this.loadRules();
    
    // Set up request listeners
    this.setupRequestListeners();
    
    // Set up message listeners
    this.setupMessageListeners();
    
    // Update declarative net request rules
    await this.updateDeclarativeRules();
  }

  async loadRules() {
    try {
      const result = await chrome.storage.local.get(['rules', 'stats']);
      this.rules = result.rules || [];
      this.stats = result.stats || this.stats;
    } catch (error) {
      console.error('Failed to load rules:', error);
    }
  }

  async saveRules() {
    try {
      await chrome.storage.local.set({
        rules: this.rules,
        stats: this.stats
      });
    } catch (error) {
      console.error('Failed to save rules:', error);
    }
  }

  setupRequestListeners() {
    // Handle header modifications
    chrome.webRequest.onBeforeSendHeaders.addListener(
      (details) => this.handleBeforeSendHeaders(details),
      { urls: ['<all_urls>'] },
      ['requestHeaders']
    );

    // Handle response header modifications
    chrome.webRequest.onHeadersReceived.addListener(
      (details) => this.handleHeadersReceived(details),
      { urls: ['<all_urls>'] },
      ['responseHeaders']
    );

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'loading' && tab.url) {
        this.handleTabUpdate(tabId, tab.url);
      }
    });

    chrome.tabs.onActivated.addListener((activeInfo) => {
      chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (tab.url) {
          this.handleTabUpdate(tab.id, tab.url);
        }
      });
    });
  }

  async handleTabUpdate(tabId, url) {
    const hasActiveModifyResponseRules = this.rules.some(r => r.status === 'active' && r.type === 'modify-response');
    if (hasActiveModifyResponseRules) {
      if (url && (url.startsWith('http:') || url.startsWith('https:'))) {
        await this.injectResponseModifierScript(tabId);
      }
    }
  }

  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // Keep message channel open for async response
    });
  }

  async handleMessage(message, sender, sendResponse) {
    switch (message.type) {
      case 'GET_RULES':
        sendResponse({ rules: this.rules, stats: this.stats });
        break;
      
      case 'ADD_RULE':
        this.rules.push(message.rule);
        await this.saveRules();
        await this.updateDeclarativeRules();
        this.updateStats();
        sendResponse({ success: true });
        break;
      
      case 'UPDATE_RULE':
        const index = this.rules.findIndex(r => r.id === message.rule.id);
        if (index !== -1) {
          this.rules[index] = message.rule;
          await this.saveRules();
          await this.updateDeclarativeRules();
          this.updateStats();
        }
        sendResponse({ success: true });
        break;
      
      case 'DELETE_RULE':
        this.rules = this.rules.filter(r => r.id !== message.ruleId);
        await this.saveRules();
        await this.updateDeclarativeRules();
        this.updateStats();
        sendResponse({ success: true });
        break;
      
      case 'TOGGLE_RULE':
        const rule = this.rules.find(r => r.id === message.ruleId);
        if (rule) {
          const oldStatus = rule.status;
          rule.status = oldStatus === 'active' ? 'inactive' : 'active';
          await this.saveRules();
          await this.updateDeclarativeRules();
          this.updateStats();

          if (rule.type === 'modify-response') {
            const isActive = rule.status === 'active';
            const otherActiveRules = this.rules.some(r => r.id !== rule.id && r.status === 'active' && r.type === 'modify-response');

            if (isActive && !otherActiveRules) {
              // First modify-response rule is activated. Inject script in all tabs.
              const tabs = await chrome.tabs.query({});
              for (const tab of tabs) {
                if (tab.id && tab.url && (tab.url.startsWith('http:') || tab.url.startsWith('https:'))) {
                  await this.injectResponseModifierScript(tab.id);
                }
              }
            } else if (!isActive && !otherActiveRules) {
              // Last modify-response rule is deactivated. Reload all tabs.
              const tabs = await chrome.tabs.query({});
              for (const tab of tabs) {
                if (tab.id && tab.url && (tab.url.startsWith('http:') || tab.url.startsWith('https:'))) {
                  try {
                    await chrome.tabs.reload(tab.id);
                  } catch (error) {
                    console.error(`Failed to reload tab ${tab.id}:`, error);
                  }
                }
              }
            }
          }
        }
        sendResponse({ success: true });
        break;
      
      case 'INJECT_SCRIPT':
        await this.injectScript(message.tabId, message.script);
        sendResponse({ success: true });
        break;

      case 'GET_MODIFIED_RESPONSE':
        const url = message.url;
        const matchingRule = this.rules.find(rule =>
          rule.type === 'modify-response' &&
          rule.status === 'active' &&
          this.matchesConditions({ url }, rule.conditions)
        );

        if (matchingRule) {
          const action = matchingRule.actions.find(a => a.type === 'modify-response');
          if (action) {
            if (sender.tab && sender.tab.id) {
              chrome.tabs.sendMessage(sender.tab.id, {
                type: 'SHOW_TOAST',
                message: `Rule "${matchingRule.name}" applied.`
              });
            }
            sendResponse({ success: true, modifiedData: action.value });
            return;
          }
        }
        sendResponse({ success: false });
        break;
    }
  }

  handleBeforeRequest(details) {
    const activeRules = this.rules.filter(r => r.status === 'active');
    
    for (const rule of activeRules) {
      if (this.matchesConditions(details, rule.conditions)) {
        switch (rule.type) {
          case 'block':
            this.stats.blockedRequests++;
            this.saveRules();
            return { cancel: true };
          
          case 'redirect':
            const redirectAction = rule.actions.find(a => a.type === 'redirect');
            if (redirectAction && redirectAction.value) {
              this.stats.redirectedRequests++;
              this.saveRules();
              return { redirectUrl: redirectAction.value };
            }
            break;
          
          case 'delay':
            const delay = this.getDelayValue(rule.actions);
            if (delay > 0) {
              // Note: Chrome extensions can't directly delay requests
              // This would need to be handled differently
              console.log(`Would delay request by ${delay}ms`);
            }
            break;
        }
      }
    }
    
    return {};
  }

  handleBeforeSendHeaders(details) {
    const activeRules = this.rules.filter(r => r.status === 'active');
    let headers = details.requestHeaders;
    let modified = false;

    for (const rule of activeRules) {
      if (rule.type === 'modify-headers' && this.matchesConditions(details, rule.conditions)) {
        headers = this.modifyHeaders(headers, rule.actions);
        modified = true;
      } else if (rule.type === 'user-agent' && this.matchesConditions(details, rule.conditions)) {
        const userAgent = this.getUserAgent(rule.actions);
        if (userAgent) {
          headers = headers.filter(h => h.name.toLowerCase() !== 'user-agent');
          headers.push({ name: 'User-Agent', value: userAgent });
          modified = true;
        }
      }
    }

    return modified ? { requestHeaders: headers } : {};
  }

  handleHeadersReceived(details) {
    const activeRules = this.rules.filter(r => r.status === 'active');
    let headers = details.responseHeaders;
    let modified = false;

    for (const rule of activeRules) {
      if (rule.type === 'modify-headers' && this.matchesConditions(details, rule.conditions)) {
        headers = this.modifyResponseHeaders(headers, rule.actions);
        modified = true;
      }
    }

    return modified ? { responseHeaders: headers } : {};
  }

  matchesConditions(details, conditions) {
    return conditions.every(condition => {
      const value = this.getValueForCondition(details, condition.type);
      return this.testCondition(value, condition.operator, condition.value);
    });
  }

  getValueForCondition(details, type) {
    switch (type) {
      case 'url': return details.url;
      case 'host': return new URL(details.url).hostname;
      case 'path': return new URL(details.url).pathname;
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

  getDelayValue(actions) {
    const delayAction = actions.find(a => a.type === 'delay');
    return delayAction ? parseInt(delayAction.value) || 0 : 0;
  }

  getUserAgent(actions) {
    const uaAction = actions.find(a => a.type === 'user-agent');
    return uaAction ? uaAction.value : null;
  }

  modifyHeaders(headers, actions) {
    let result = [...headers];
    
    for (const action of actions) {
      if (action.type === 'add-header' && action.key && action.value) {
        // Remove existing header with same name
        result = result.filter(h => h.name.toLowerCase() !== action.key.toLowerCase());
        // Add new header
        result.push({ name: action.key, value: action.value });
      } else if (action.type === 'remove-header' && action.key) {
        result = result.filter(h => h.name.toLowerCase() !== action.key.toLowerCase());
      }
    }
    
    return result;
  }

  modifyResponseHeaders(headers, actions) {
    return this.modifyHeaders(headers, actions);
  }

  async updateDeclarativeRules() {
    try {
      // Clear existing rules
      const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
      const ruleIds = existingRules.map(rule => rule.id);
      
      if (ruleIds.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: ruleIds
        });
      }

      // Add new rules
      const declarativeRules = this.convertToDeclarativeRules();
      if (declarativeRules.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({
          addRules: declarativeRules
        });
      }
    } catch (error) {
      console.error('Failed to update declarative rules:', error);
    }
  }

  convertToDeclarativeRules() {
    const declarativeRules = [];
    let ruleId = 1;

    for (const rule of this.rules) {
      if (rule.status !== 'active') continue;

      try {
        const condition = this.buildDeclarativeCondition(rule.conditions);
        const action = this.buildDeclarativeAction(rule);

        if (condition && action) {
          declarativeRules.push({
            id: ruleId++,
            priority: 1,
            condition,
            action
          });
        }
      } catch (error) {
        console.error('Failed to convert rule to declarative:', rule, error);
      }
    }

    return declarativeRules;
  }

  buildDeclarativeCondition(conditions) {
    const condition = {};
    
    for (const cond of conditions) {
      switch (cond.operator) {
        case 'contains':
          condition.urlFilter = `*${cond.value}*`;
          break;
        case 'equals':
          condition.urlFilter = cond.value;
          break;
        case 'starts-with':
          condition.urlFilter = `${cond.value}*`;
          break;
        case 'ends-with':
          condition.urlFilter = `*${cond.value}`;
          break;
        case 'regex':
          condition.regexFilter = cond.value;
          break;
      }

      if (cond.type === 'host') {
        condition.domains = [cond.value];
        delete condition.urlFilter; // domain and urlFilter are mutually exclusive
      }
    }

    return Object.keys(condition).length > 0 ? condition : null;
  }

  buildDeclarativeAction(rule) {
    switch (rule.type) {
      case 'block':
        return { type: 'block' };
      
      case 'redirect':
        const redirectAction = rule.actions.find(a => a.type === 'redirect');
        if (redirectAction && redirectAction.value) {
          return {
            type: 'redirect',
            redirect: { url: redirectAction.value }
          };
        }
        break;
    }
    
    return null;
  }

  async injectScript(tabId, script) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: (code) => {
          const script = document.createElement('script');
          script.textContent = code;
          (document.head || document.documentElement).appendChild(script);
          script.remove();
        },
        args: [script]
      });
    } catch (error) {
      console.error('Failed to inject script:', error);
    }
  }

  async injectResponseModifierScript(tabId) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['injected.js'],
      });
    } catch (error) {
      console.error('Failed to inject response modifier script:', error);
    }
  }

  updateStats() {
    this.stats.totalRules = this.rules.length;
    this.stats.activeRules = this.rules.filter(r => r.status === 'active').length;
  }
}

// Initialize the background service
new RequestProBackground();