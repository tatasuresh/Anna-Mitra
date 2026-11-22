import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="ui-page">
      <div className="ui-page-header">
        <div>
          <h1>Page not found</h1>
          <p className="ui-meta">The page you are looking for does not exist or has moved.</p>
        </div>
        <div className="ui-actions">
          <Link className="ui-btn ui-btn-primary" href="/">
            Back to role entry
          </Link>
        </div>
      </div>
    </div>
  );
}
