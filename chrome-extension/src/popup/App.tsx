import React, { useEffect, useState } from "react";
import { getDigiPin, getLatLngFromDigiPin } from "digipinjs";

type HistItem = { type: "encode" | "decode"; input: string; output: string; ts: number };

export function App() {
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [pin, setPin] = useState("");
  const [decodePin, setDecodePin] = useState("");
  const [decodeOut, setDecodeOut] = useState<string>("");
  const [history, setHistory] = useState<HistItem[]>([]);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string>("");
  const [historyLimit, setHistoryLimit] = useState<number>(20);

  useEffect(() => {
    chrome.storage.local.get(["lastResult", "history", "historyLimit"], (res) => {
      const lim = Number(res.historyLimit) > 0 ? Number(res.historyLimit) : 20;
      setHistoryLimit(lim);
      if (res.lastResult) {
        const arr = [res.lastResult as HistItem, ...(res.history || [])] as HistItem[];
        setHistory(arr.slice(0, lim));
      } else if (res.history) {
        setHistory((res.history as HistItem[]).slice(0, lim));
      }
    });
  }, []);

  const saveHistory = async (item: HistItem) => {
    const newHist = [item, ...history].slice(0, historyLimit);
    setHistory(newHist);
    await chrome.storage.local.set({ lastResult: item, history: newHist });
  };

  const updateHistoryLimit = async (lim: number) => {
    const n = Number(lim);
    const final = Number.isFinite(n) && n > 0 ? n : 20;
    setHistoryLimit(final);
    const trimmed = history.slice(0, final);
    setHistory(trimmed);
    await chrome.storage.local.set({ history: trimmed, historyLimit: final });
  };

  const clearHistory = async () => {
    setHistory([]);
    await chrome.storage.local.set({ history: [] });
  };

  const doEncode = async () => {
    const la = Number(lat), lo = Number(lng);
    if (!Number.isFinite(la) || !Number.isFinite(lo)) return;
    const out = getDigiPin(la, lo);
    setPin(out);
    await saveHistory({ type: "encode", input: `${la},${lo}`, output: out, ts: Date.now() });
    try { await navigator.clipboard.writeText(out); } catch {}
  };

  const useCurrentLocation = () => {
    setLocError("");
    if (!("geolocation" in navigator)) {
      setLocError("Geolocation not supported in this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        // Keep a reasonable precision for UI
        const la = Number(latitude.toFixed(6));
        const lo = Number(longitude.toFixed(6));
        setLat(String(la));
        setLng(String(lo));
        setLocating(false);
        // Auto-generate the pin for convenience
        const out = getDigiPin(la, lo);
        setPin(out);
        await saveHistory({ type: "encode", input: `${la},${lo}`, output: out, ts: Date.now() });
        try { await navigator.clipboard.writeText(out); } catch {}
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) setLocError("Location permission denied.");
        else if (err.code === err.POSITION_UNAVAILABLE) setLocError("Location unavailable.");
        else if (err.code === err.TIMEOUT) setLocError("Location request timed out.");
        else setLocError("Failed to get location.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const doDecode = async () => {
    if (!decodePin.trim()) return;
    try {
      const { latitude, longitude } = getLatLngFromDigiPin(decodePin.trim());
      const out = `${latitude},${longitude}`;
      setDecodeOut(out);
      await saveHistory({ type: "decode", input: decodePin.trim(), output: out, ts: Date.now() });
      try { await navigator.clipboard.writeText(out); } catch {}
    } catch {
      setDecodeOut("Invalid DIGIPIN");
    }
  };

  const openMaps = (val: string) => {
    const [a, b] = val.split(",");
    if (!a || !b) return;
    chrome.tabs.create({ url: `https://www.google.com/maps?q=${a},${b}` });
  };

  return (
    <div className="wrap">
      <div className="title">DIGIPIN Tools</div>

      <div className="card">
        <div className="title">Encode (lat → DIGIPIN)</div>
        <div className="grid2">
          <input placeholder="Latitude" value={lat} onChange={(e) => setLat(e.target.value)} />
          <input placeholder="Longitude" value={lng} onChange={(e) => setLng(e.target.value)} />
        </div>
        <div className="row">
          <button onClick={doEncode}>Generate</button>
          <button onClick={useCurrentLocation} disabled={locating} title="Use Current Location">
            {locating ? "Locating..." : "Use Current Location"}
          </button>
          {pin && <span className="chip">{pin}</span>}
        </div>
        {locError && (
          <div className="muted">
            {locError}
            {/permission/i.test(locError) && (
              <div className="row" style={{ marginTop: 6 }}>
                <button
                  onClick={() => chrome.tabs.create({ url: 'chrome://settings/content/location' })}
                  title="Open Chrome Location Settings"
                >
                  Location Settings
                </button>
                <button
                  onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('popup/index.html') })}
                  title="Open popup in a full tab"
                >
                  Open Popup in Tab
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <div className="title">Decode (DIGIPIN → lat,lng)</div>
        <div className="row">
          <input placeholder="e.g. 39J-438-TJC7" value={decodePin} onChange={(e) => setDecodePin(e.target.value)} />
        </div>
        <div className="row">
          <button onClick={doDecode}>Decode</button>
          {decodeOut && (
            <span className="chip" style={{ cursor: "pointer" }} onClick={() => openMaps(decodeOut)}>
              {decodeOut}
            </span>
          )}
        </div>
        {decodeOut && (
          <div className="muted">
            <a className="link" onClick={() => openMaps(decodeOut)} href="#">
              Open in Google Maps
            </a>
          </div>
        )}
      </div>

      <div className="card">
        <div className="title">Recent</div>
        <div className="row" style={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="muted">Showing {history.length} of last {historyLimit}</div>
          <div className="row" style={{ margin: 0 }}>
            <label className="muted" htmlFor="histLimit" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              Keep last
              <select
                id="histLimit"
                value={historyLimit}
                onChange={(e) => updateHistoryLimit(Number(e.target.value))}
                style={{ background: '#181818', color: '#fff', border: '1px solid #333', borderRadius: 6, padding: '4px 6px' }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </label>
            <button onClick={clearHistory} title="Clear recent list">Clear</button>
          </div>
        </div>
        {history.length > 0 ? (
          <div style={{ marginTop: 6 }}>
            {history.map((h, i) => (
              <div key={i} className="row" style={{ justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #1f1f1f", paddingBottom: 6 }}>
                <span style={{ fontSize: 12, color: "#b0b0b0" }}>
                  {h.type === "encode" ? "lat,lng → PIN" : "PIN → lat,lng"} • {new Date(h.ts).toLocaleString()}
                </span>
                <span
                  className="chip"
                  title="Copy"
                  style={{ cursor: "pointer" }}
                  onClick={async () => { await navigator.clipboard.writeText(h.output); }}
                >
                  {h.output}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="muted">No recent items</div>
        )}
      </div>

      <div className="muted">Tip: select coordinates on any page, right-click → "Convert to DIGIPIN".</div>
    </div>
  );
} 
