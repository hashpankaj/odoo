(function() {
  'use strict';

  // Get a clean, un-patched fetch function by creating a new iframe
  const getOriginalFetch = () => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    const originalFetch = iframe.contentWindow.fetch;
    document.body.removeChild(iframe);
    return originalFetch;
  };

  const originalFetch = getOriginalFetch();
  const originalXHR = window.XMLHttpRequest;

  function getModifiedResponse(url) {
    return new Promise((resolve) => {
      if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
        return resolve(null);
      }
      chrome.runtime.sendMessage({
        type: 'GET_MODIFIED_RESPONSE',
        url: url
      }, (response) => {
        if (chrome.runtime.lastError) {
          resolve(null);
        } else {
          resolve(response);
        }
      });
    });
  }

  window.fetch = async function(url, options) {
    const modifiedResponse = await getModifiedResponse(String(url));

    if (modifiedResponse && modifiedResponse.success) {
      console.log(`[RequestPro] Modifying fetch response for ${url}`);
      const response = new Response(modifiedResponse.modifiedData, {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
      return Promise.resolve(response);
    }

    // Use the un-patched fetch
    return originalFetch.apply(window, arguments);
  };

  // For now, we are not overriding XMLHttpRequest to keep the change focused on the fetch issue.
  // If XHR interception is also needed, a similar iframe-based approach could be used.

})();