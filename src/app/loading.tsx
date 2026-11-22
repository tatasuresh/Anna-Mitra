// Shown inside the app shell while a route loads. Uses the shared ui-* styles so it
// matches the real pages and never overflows a narrow screen.
export default function Loading() {
  return (
    <div className="ui-page" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading…</span>
      <div className="ui-page-header">
        <div style={{ width: '100%' }}>
          <div className="ui-skeleton" style={{ height: 28, width: '55%', maxWidth: 320 }} />
          <div className="ui-skeleton" style={{ height: 14, width: '80%', maxWidth: 440, marginTop: 12 }} />
        </div>
      </div>
      <div className="ui-grid ui-grid-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="ui-card">
            <div className="ui-card-body">
              <div className="ui-skeleton" style={{ height: 14, width: '50%' }} />
              <div className="ui-skeleton" style={{ height: 28, width: '35%', marginTop: 14 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
