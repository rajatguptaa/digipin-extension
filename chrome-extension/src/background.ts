import { getDigiPin } from "digipinjs";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "digipin-convert",
    title: "Convert to DIGIPIN",
    contexts: ["selection"]
  });
});

function parseLatLng(sel?: string): { lat: number; lng: number } | null {
  if (!sel) return null;
  const m = sel.trim().match(/(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[3]);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== "digipin-convert") return;

  const parsed = parseLatLng(info.selectionText || "");
  if (!parsed) {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "DIGIPIN",
      message: "Select coordinates like: 28.6139,77.2090"
    });
    return;
  }

  try {
    const pin = getDigiPin(parsed.lat, parsed.lng);
    await chrome.storage.local.set({
      lastResult: { type: "encode", input: `${parsed.lat},${parsed.lng}`, output: pin, ts: Date.now() }
    });

    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "DIGIPIN",
      message: `Converted: ${pin}`
    });

    // copy to clipboard via page context (avoids service worker clipboard limitations)
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab?.id) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (text: string) => {
            try {
              if (navigator.clipboard && navigator.clipboard.writeText) {
                return navigator.clipboard.writeText(text);
              } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
              }
            } catch (e) {
              console.log('Clipboard copy failed:', e);
            }
          },
          args: [pin]
        });
      }
    } catch (e) {
      console.log('Script execution failed:', e);
    }
  } catch {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "DIGIPIN",
      message: "Failed to convert selection."
    });
  }
}); 