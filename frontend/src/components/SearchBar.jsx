import { useEffect, useRef, useState } from "react";
import { geocode } from "../api/geocode";

export default function SearchBar({ onPick }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const rootRef = useRef(null);
  const blurTimerRef = useRef(null);

  // Debounced search
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    debounceRef.current = setTimeout(runSearch, 300);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function runSearch() {
    if (!q.trim()) return;
    try {
      setLoading(true);
      const r = await geocode(q, 6);
      setResults(r);
      setOpen(r.length > 0);
    } catch {
      setResults([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  function pick(item) {
    setQ(item.label);
    setOpen(false);
    setResults([]);                // ensure it disappears
    onPick?.([item.lat, item.lon], item);
  }

  // Close on outside click
  useEffect(() => {
    function onDocMouseDown(e) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  // Close on Esc
  function onKeyDown(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      clearTimeout(debounceRef.current);
      runSearch();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  // Close on blur (after a tick so clicks on items still register)
  function onBlur() {
    clearTimeout(blurTimerRef.current);
    blurTimerRef.current = setTimeout(() => setOpen(false), 120);
  }

  return (
    <div
      ref={rootRef}
      style={{
        position: "relative",
        width: "min(560px, 90%)",
        zIndex: 3000
      }}
    >
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          placeholder="Search address or place (e.g., 1200 McKinney St, Houston)"
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #ddd",
            fontSize: 14,
            background: "#fff"
          }}
          onFocus={() => results.length && setOpen(true)}
        />
        <button
          onClick={runSearch}
          className="button"
          disabled={loading || !q.trim()}
          style={{ whiteSpace: "nowrap" }}
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </div>

      {open && results.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "110%",
            left: 0,
            right: 0,
            background: "#fff",
            border: "1px solid #eee",
            borderRadius: 8,
            boxShadow: "0 8px 24px rgba(0,0,0,.12)",
            zIndex: 4000,
            maxHeight: 260,
            overflowY: "auto"
          }}
        >
          <div style={{ padding: "6px 10px", fontSize: 12, color: "#666" }}>
            {results.length} result{results.length !== 1 ? "s" : ""}
          </div>
          {results.map((r, idx) => (
            <div
              key={idx}
              onMouseDown={(e) => e.preventDefault()} // keep focus until click handled
              onClick={() => pick(r)}
              style={{ padding: "10px 12px", cursor: "pointer" }}
            >
              <div style={{ fontSize: 13, lineHeight: 1.3 }}>{r.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
