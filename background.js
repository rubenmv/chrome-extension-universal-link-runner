// Tiempo de espera para que Edge procese la navegación al protocolo antes de comprobar
// si la pestaña quedó bloqueada en la página de error.
const RESTORE_DELAY_MS = 2500;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isWebUrl(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url);
}

// Si Edge bloquea el protocolo (o el usuario cancela el diálogo), la pestaña activa
// queda en about:blank#blocked / chrome-error:// y el popup se cerraría al instante la
// próxima vez. Devolvemos la pestaña a la página original que el usuario estaba viendo.
async function restoreTabIfNeeded(tabId, originalUrl) {
  await delay(RESTORE_DELAY_MS);

  try {
    const tab = await chrome.tabs.get(tabId).catch(() => null);
    if (!tab) return;

    const currentUrl = tab.url || tab.pendingUrl || '';
    if (isWebUrl(currentUrl)) return;

    await chrome.tabs.update(tabId, { url: originalUrl });
  } catch (error) {
    console.warn('No se pudo restaurar la pestaña:', error);
  }
}

chrome.runtime.onMessage.addListener((message) => {
  if (!message || message.type !== 'protocolLaunchStarted') return false;
  if (typeof message.tabId !== 'number' || !message.originalUrl) return false;

  restoreTabIfNeeded(message.tabId, message.originalUrl);
  return false;
});
