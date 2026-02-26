/**
 * Semantic Search UI — view switching, search, results, admin upload.
 * Assumes API at same origin: /search, /ingest.
 */

const views = {
  search: document.getElementById('view-search'),
  results: document.getElementById('view-results'),
  admin: document.getElementById('view-admin'),
};

const resultList = document.getElementById('result-list');
const resultsLoading = document.getElementById('results-loading');
const resultsError = document.getElementById('results-error');
const resultsEmpty = document.getElementById('results-empty');
const resultsQueryText = document.getElementById('results-query-text');
const resultsCount = document.getElementById('results-count');

function showView(name) {
  Object.keys(views).forEach((key) => {
    views[key].classList.toggle('active', key === name);
  });
  document.querySelectorAll('.nav a').forEach((a) => {
    a.classList.toggle('active', a.dataset.nav === name);
  });
}

function setResultsState({ loading, error, empty }) {
  resultList.innerHTML = '';
  resultsLoading.hidden = !loading;
  resultsError.hidden = !error;
  resultsEmpty.hidden = !empty;
  if (error) resultsError.textContent = error;
}

function renderResult(doc) {
  const score = doc.similarityScore != null ? (Math.round(doc.similarityScore * 100) + '% match') : '';
  const excerpt = doc.excerpt || doc.content?.slice(0, 200) + (doc.content?.length > 200 ? '…' : '') || '';
  const explanation = doc.explanation ? `<div class="result-explanation">${escapeHtml(doc.explanation)}</div>` : '';
  const meta = doc.metadata && (doc.metadata.title || doc.metadata.source)
    ? `<div class="result-meta">${escapeHtml(doc.metadata.title || '')} ${doc.metadata.source ? ` · ${escapeHtml(doc.metadata.source)}` : ''}</div>`
    : '';

  const card = document.createElement('article');
  card.className = 'result-card';
  card.innerHTML = `
    ${score ? `<span class="result-score">${escapeHtml(score)}</span>` : ''}
    <p class="result-excerpt">${escapeHtml(excerpt)}</p>
    ${explanation}
    ${meta}
  `;
  return card;
}

function escapeHtml(s) {
  if (s == null) return '';
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

async function runSearch(query, explain = false) {
  showView('results');
  resultsQueryText.textContent = query;
  resultsCount.textContent = '';
  setResultsState({ loading: true, error: false, empty: false });

  const params = new URLSearchParams({ q: query, limit: 5 });
  if (explain) params.set('explain', 'true');

  try {
    const res = await fetch(`/search?${params.toString()}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const data = await res.json();

    if (!res.ok) {
      setResultsState({ loading: false, error: data.message || res.statusText, empty: false });
      return;
    }

    const results = data.results || [];
    resultsCount.textContent = results.length ? `${results.length} result${results.length === 1 ? '' : 's'}` : '';

    if (results.length === 0) {
      setResultsState({ loading: false, error: false, empty: true });
      return;
    }

    setResultsState({ loading: false, error: false, empty: false });
    resultList.replaceChildren(...results.map(renderResult));
  } catch (err) {
    setResultsState({ loading: false, error: err.message || 'Search failed', empty: false });
  }
}

async function runUpload(payload) {
  const statusEl = document.getElementById('upload-status');
  statusEl.hidden = false;
  statusEl.className = 'upload-status';
  statusEl.textContent = 'Uploading…';

  try {
    const res = await fetch('/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documents: [payload] }),
    });
    const data = await res.json();

    if (!res.ok) {
      statusEl.classList.add('error');
      statusEl.textContent = data.message || res.statusText || 'Upload failed';
      return;
    }

    statusEl.classList.add('success');
    statusEl.textContent = `Added 1 document. ID: ${data.data?.ids?.[0] ?? '—'}`;
    document.getElementById('form-upload').reset();
  } catch (err) {
    statusEl.classList.add('error');
    statusEl.textContent = err.message || 'Upload failed';
  }
}

// Navigation
document.querySelectorAll('[data-nav]').forEach((el) => {
  el.addEventListener('click', (e) => {
    e.preventDefault();
    const target = el.dataset.nav;
    if (target && views[target]) showView(target);
  });
});

// Search form
document.getElementById('form-search').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = document.getElementById('input-query');
  const query = input.value.trim();
  if (!query) return;
  const explain = document.getElementById('input-explain').checked;
  runSearch(query, explain);
});

// Admin form
document.getElementById('form-upload').addEventListener('submit', (e) => {
  e.preventDefault();
  const content = document.getElementById('upload-content').value.trim();
  if (!content) return;

  const title = document.getElementById('upload-title').value.trim();
  const tagsInput = document.getElementById('upload-tags').value.trim();
  const tags = tagsInput ? tagsInput.split(',').map((t) => t.trim()).filter(Boolean) : undefined;
  const source = document.getElementById('upload-source').value.trim();

  runUpload({
    content,
    metadata: (title || tags?.length || source) ? { title: title || undefined, tags, source: source || undefined } : undefined,
  });
});
