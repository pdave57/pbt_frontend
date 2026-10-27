import { useBudget } from '../context/useBudget';

export default function BackendStatus() {
  const { dataError, loading, refresh } = useBudget();
  if (!dataError && !loading) return null;

  return (
    <div className={`backend-status ${dataError ? 'has-error' : ''}`} role={dataError ? 'alert' : 'status'}>
      <span>{dataError || 'Syncing your account data…'}</span>
      {dataError && (
        <button type="button" className="btn-secondary btn-sm" onClick={refresh}>
          Retry
        </button>
      )}
    </div>
  );
}
