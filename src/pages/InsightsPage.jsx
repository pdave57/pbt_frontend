import { useBudget } from '../context/useBudget';
import { formatCurrency } from '../utils/currency';

const recommendationsFrom = (data) => {
  if (Array.isArray(data?.recommendations)) return data.recommendations;
  if (Array.isArray(data)) return data;
  return [];
};

const alertSummary = (alerts) => {
  if (!alerts.length) return null;
  return {
    over: alerts.filter((alert) => alert.is_over).length,
    monitored: alerts.length,
  };
};

export default function InsightsPage() {
  const {
    mlRecommendations,
    excessSpendingAlerts,
    mlLoading,
    mlError,
    fetchMlRecommendations,
  } = useBudget();
  const recommendations = recommendationsFrom(mlRecommendations);
  const summary = alertSummary(excessSpendingAlerts);

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Patterns and nudges</p>
          <h1>ML insights</h1>
          <p>Recommendations and budget alerts generated from your activity.</p>
        </div>
        <button className="btn-secondary" type="button" onClick={fetchMlRecommendations} disabled={mlLoading}>
          {mlLoading ? 'Refreshing…' : 'Refresh insights'}
        </button>
      </div>

      {mlError && (
        <div className="alert-box alert-error" role="alert">
          Some insights could not be loaded: {mlError}
        </div>
      )}

      <section className="insight-summary-grid">
        <article className="card insight-highlight">
          <span className="insight-symbol">✦</span>
          <div>
            <p className="report-metric-label">Budget recommendations</p>
            <strong>{recommendations.length}</strong>
            <span>personalized suggestions</span>
          </div>
        </article>
        <article className="card insight-highlight">
          <span className="insight-symbol alert-symbol">!</span>
          <div>
            <p className="report-metric-label">Budget alerts</p>
            <strong>{summary?.monitored ?? 0}</strong>
            <span>{summary ? `${summary.over} over budget` : 'categories monitored'}</span>
          </div>
        </article>
      </section>

      <div className="report-columns">
        <section className="card report-panel">
          <div className="section-heading">
            <div>
              <h2>Budget recommendations</h2>
              <p>Suggestions based on your historical spending.</p>
            </div>
            {mlRecommendations?.generated_at && (
              <span className="subtle-text">
                Updated {new Date(mlRecommendations.generated_at).toLocaleDateString()}
              </span>
            )}
          </div>
          {mlLoading && !mlRecommendations ? (
            <p className="empty-state">Analyzing your spending…</p>
          ) : recommendations.length ? (
            <div className="insight-list">
              {recommendations.map((item, index) => (
                <article className="insight-item" key={`${item.category_id || item.category_name || 'suggestion'}-${index}`}>
                  <div className="insight-item-heading">
                    <div className="category-badge">✦</div>
                    <div>
                      <h3>{item.category_name || item.category || 'Budget suggestion'}</h3>
                      <span className={`action-tag action-${String(item.action || 'review').toLowerCase()}`}>
                        {item.action || 'Review'}
                      </span>
                    </div>
                  </div>
                  {item.reason && <p>{item.reason}</p>}
                  <div className="recommendation-values">
                    {item.historical_avg != null && <span>Average: <strong>{formatCurrency(item.historical_avg)}</strong></span>}
                    {item.current_budget != null && <span>Current: <strong>{formatCurrency(item.current_budget)}</strong></span>}
                    {item.recommended_budget != null && <span>Suggested: <strong>{formatCurrency(item.recommended_budget)}</strong></span>}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-state">
              {mlError ? 'Recommendations are unavailable right now.' : 'No recommendations yet. Add transactions to build a useful spending history.'}
            </p>
          )}
        </section>

        <section className="card report-panel">
          <div className="section-heading">
            <div>
              <h2>Overspending alerts</h2>
              <p>Categories approaching or exceeding their budget limit.</p>
            </div>
          </div>
          {excessSpendingAlerts.length ? (
            <div className="insight-list">
              {excessSpendingAlerts.map((alert, index) => (
                <article className={`alert-item ${alert.is_over ? 'is-over' : ''}`} key={`${alert.category_id || alert.category_name || 'alert'}-${index}`}>
                  <div className="insight-item-heading">
                    <div className="category-badge alert-symbol">!</div>
                    <div>
                      <h3>{alert.category_name || `Category ${alert.category_id || ''}`}</h3>
                      <span className="subtle-text">{alert.alert_level || (alert.is_over ? 'Over budget' : 'Watch')}</span>
                    </div>
                    <strong className="alert-percent">{Math.round(Number(alert.percentage_used) || 0)}%</strong>
                  </div>
                  <div className="alert-progress">
                    <span style={{ width: `${Math.min(Number(alert.percentage_used) || 0, 100)}%` }} />
                  </div>
                  <div className="recommendation-values">
                    <span>Spent: <strong>{formatCurrency(alert.spent_amount)}</strong></span>
                    <span>Budget: <strong>{formatCurrency(alert.budget_amount)}</strong></span>
                    <span>Remaining: <strong>{formatCurrency(alert.remaining)}</strong></span>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-state">
              {mlLoading ? 'Checking your budgets…' : 'No active overspending alerts.'}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
