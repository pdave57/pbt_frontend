import { useEffect, useState } from 'react';
import { api } from '../api';
import { formatCurrency } from '../utils/currency';

const today = new Date();
const localIso = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const firstOfMonth = localIso(new Date(today.getFullYear(), today.getMonth(), 1));
const todayString = localIso(today);

const toRows = (data, keys) => {
  if (Array.isArray(data)) return data;
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  if (data && typeof data === 'object') {
    const entries = Object.entries(data).filter(([, value]) =>
      (typeof value === 'number' || typeof value === 'string') &&
      String(value).trim() !== '' && Number.isFinite(Number(value)),
    );
    if (entries.length) return entries.map(([name, value]) => ({ name, value: Number(value) }));
  }
  return [];
};

const pickMetric = (source, aliases) => {
  const record = source?.summary && typeof source.summary === 'object'
    ? { ...source, ...source.summary }
    : source;
  if (!record || typeof record !== 'object') return undefined;
  const normalized = Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key.toLowerCase().replace(/[^a-z]/g, ''), value]),
  );
  const key = aliases.map((alias) => alias.toLowerCase().replace(/[^a-z]/g, ''))
    .find((alias) => {
      const value = normalized[alias];
      return (typeof value === 'number' || typeof value === 'string') &&
        String(value).trim() !== '' && Number.isFinite(Number(value));
    });
  const value = key ? Number(normalized[key]) : NaN;
  return Number.isFinite(value) ? value : undefined;
};

const rowName = (row, index) =>
  row?.category_name || row?.category?.name ||
  (typeof row?.category === 'string' ? row.category : null) ||
  row?.name || row?.month_name || row?.month || row?.label || `Item ${index + 1}`;

const rowAmount = (row) => {
  if (typeof row === 'number') return row;
  for (const key of ['total', 'amount', 'value', 'income', 'expenses', 'total_amount', 'spent_amount', 'total_spent', 'spending', 'total_expenses']) {
    if (row?.[key] !== undefined && Number.isFinite(Number(row[key]))) return Number(row[key]);
  }
  return 0;
};

function MetricCard({ label, value, tone = '' }) {
  return (
    <article className="card report-metric">
      <span className="report-metric-label">{label}</span>
      <strong className={tone}>
        {value === undefined ? '—' : label === 'Transactions' ? value.toLocaleString() : formatCurrency(value)}
      </strong>
    </article>
  );
}

function ReportList({ title, data, keys, empty }) {
  const rows = toRows(data, keys);
  const maxValue = Math.max(...rows.map(rowAmount), 0);
  return (
    <section className="card report-panel">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          <p>For the selected reporting period</p>
        </div>
      </div>
      {rows.length ? (
        <div className="report-list">
          {rows.slice(0, 10).map((row, index) => {
            const amount = rowAmount(row);
            return (
              <div className="report-list-item" key={`${rowName(row, index)}-${index}`}>
                <div className="report-list-label">
                  <span>{rowName(row, index)}</span>
                  <strong>{formatCurrency(amount)}</strong>
                </div>
                <div className="report-bar-track">
                  <span style={{ width: `${maxValue ? Math.max(amount / maxValue * 100, 2) : 0}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="empty-state">{empty}</p>
      )}
    </section>
  );
}

export default function ReportsPage() {
  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(todayString);
  const [year, setYear] = useState(String(today.getFullYear()));
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const params = { start_date: startDate, end_date: endDate };
    Promise.allSettled([
      api.getReportSummary(params),
      api.getIncomeByCategory(params),
      api.getExpensesByCategory(params),
      api.getMonthlySummary(year),
      api.getTopSpendingCategories({ ...params, limit: 8 }),
    ]).then((results) => {
      if (!active) return;
      const failures = results.flatMap((result) =>
        result.status === 'rejected' ? [result.reason.message] : [],
      );
      setReports({
        summary: results[0].status === 'fulfilled' ? results[0].value : null,
        income: results[1].status === 'fulfilled' ? results[1].value : null,
        expenses: results[2].status === 'fulfilled' ? results[2].value : null,
        monthly: results[3].status === 'fulfilled' ? results[3].value : null,
        top: results[4].status === 'fulfilled' ? results[4].value : null,
      });
      setError(failures.join(' '));
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [startDate, endDate, year]);

  const updateDateRange = (setter, value) => {
    setError('');
    setLoading(true);
    setter(value);
  };

  const summary = reports?.summary;
  const monthlyRows = toRows(reports?.monthly, ['months', 'monthly_summary', 'monthly_data', 'data', 'results']);
  const incomeMetric = pickMetric(summary, ['total_income', 'income', 'totalIncome']);
  const expenseMetric = pickMetric(summary, ['total_expenses', 'total_expense', 'expenses', 'expense']);
  const savingsMetric = pickMetric(summary, ['net_savings', 'savings', 'balance', 'net_income']) ??
    (incomeMetric !== undefined && expenseMetric !== undefined ? incomeMetric - expenseMetric : undefined);

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Your money, in perspective</p>
          <h1>Reports</h1>
          <p>Understand income, spending, and monthly patterns.</p>
        </div>
        <div className="report-filters">
          <label>
            <span>From</span>
            <input className="form-control" type="date" value={startDate} max={endDate} onChange={(event) => updateDateRange(setStartDate, event.target.value)} />
          </label>
          <label>
            <span>To</span>
            <input className="form-control" type="date" min={startDate} value={endDate} onChange={(event) => updateDateRange(setEndDate, event.target.value)} />
          </label>
        </div>
      </div>

      {error && <div className="alert-box alert-error" role="alert">{error}</div>}
      {loading && <div className="card loading-card" role="status">Loading reports…</div>}

      <div className="report-metrics-grid">
        <MetricCard label="Income" value={incomeMetric} tone="positive" />
        <MetricCard label="Expenses" value={expenseMetric} tone="negative" />
        <MetricCard label="Net savings" value={savingsMetric} />
        <MetricCard label="Transactions" value={pickMetric(summary, ['transaction_count', 'transactions_count', 'total_transactions', 'count'])} />
      </div>

      <div className="report-columns">
        <ReportList title="Income by category" data={reports?.income} keys={['categories', 'income_by_category', 'data', 'results']} empty="No income recorded for these dates." />
        <ReportList title="Expenses by category" data={reports?.expenses} keys={['categories', 'expenses_by_category', 'data', 'results']} empty="No expenses recorded for these dates." />
      </div>
      <div className="report-columns">
        <ReportList title="Top spending categories" data={reports?.top} keys={['categories', 'top_categories', 'data', 'results']} empty="No category spending to show." />
        <section className="card report-panel">
          <div className="section-heading">
            <div>
              <h2>Monthly trend</h2>
              <p>Income and spending throughout {year}</p>
            </div>
            <input
              aria-label="Report year"
              className="form-control year-input"
              type="number"
              min="2000"
              max="2100"
              value={year}
              onChange={(event) => updateDateRange(setYear, event.target.value)}
            />
          </div>
          {monthlyRows.length ? (
            <div className="report-list">
              {monthlyRows.slice(0, 12).map((row, index) => {
                const amount = rowAmount(row);
                const monthlyIncome = Number(row?.income || row?.total_income || 0);
                const monthlyExpense = Number(row?.expenses || row?.total_expenses || row?.total_expense || amount);
                const peak = Math.max(monthlyIncome, monthlyExpense, 1);
                return (
                  <div className="monthly-report-row" key={`${rowName(row, index)}-${index}`}>
                    <span>{rowName(row, index)}</span>
                    <div className="monthly-bars">
                      <span className="income-bar" style={{ width: `${monthlyIncome / peak * 100}%` }} />
                      <span className="expense-bar" style={{ width: `${monthlyExpense / peak * 100}%` }} />
                    </div>
                    <strong>{formatCurrency(monthlyIncome - monthlyExpense)}</strong>
                  </div>
                );
              })}
              <div className="chart-legend"><span>Income</span><span>Expenses</span></div>
            </div>
          ) : (
            <p className="empty-state">{loading ? 'Loading…' : 'No monthly data available for this year.'}</p>
          )}
        </section>
      </div>
    </div>
  );
}
