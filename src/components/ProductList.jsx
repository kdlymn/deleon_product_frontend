import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getProducts, deleteProduct, errorMessage } from '../api.js';
import ProductForm from './ProductForm.jsx';

const peso = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

export default function ProductList({ user, onLogout }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [formFor, setFormFor] = useState(null); // null = closed, {} = add, product = edit
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const searchRef = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProducts(await getProducts());
      setError('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const focusSearch = (event) => {
      if (event.key !== '/' || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLButtonElement) return;
      event.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);

  const handleDelete = async (p) => {
    if (!window.confirm(`Delete "${p.product_name}"?`)) return;
    try {
      await deleteProduct(p.id);
      setNotice('Product deleted.');
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const handleSaved = (msg) => {
    setFormFor(null);
    setNotice(msg);
    load();
  };

  const lowStock = products.filter((product) => Number(product.quantity) > 0 && Number(product.quantity) <= 5).length;
  const outOfStock = products.filter((product) => Number(product.quantity) === 0).length;
  const inventoryValue = products.reduce((total, product) => total + Number(product.price) * Number(product.quantity), 0);
  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesQuery = !normalizedQuery || `${product.product_name} ${product.description ?? ''} ${product.id}`.toLowerCase().includes(normalizedQuery);
      const quantity = Number(product.quantity);
      const matchesFilter = filter === 'all' || (filter === 'low' && quantity > 0 && quantity <= 5) || (filter === 'out' && quantity === 0);
      return matchesQuery && matchesFilter;
    });
  }, [filter, products, query]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#inventory" aria-label="Silo inventory home">
          <span className="brand-mark">S</span>
          <span className="brand-name">silo<span>.</span><small>STOCKROOM</small></span>
        </a>
        <div className="sidebar-label">Workspace</div>
        <nav className="side-nav" aria-label="Main navigation">
          <a className="nav-link active" href="#inventory"><span className="nav-glyph">▦</span> Inventory <span className="nav-count">{products.length}</span></a>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-status"><span className="status-dot" /> Secure session</div>
          <div className="account-row">
            <span className="avatar">{user.username.slice(0, 1).toUpperCase()}</span>
            <span className="account-name">{user.username}<small>Account</small></span>
            <button className="icon-button logout-button" onClick={onLogout} aria-label="Log out" title="Log out">↗</button>
          </div>
        </div>
      </aside>

      <main className="main-panel" id="inventory">
        <header className="topbar">
          <div className="breadcrumb"><span>Workspace</span><span className="crumb-divider">/</span><strong>Inventory</strong></div>
          <div className="topbar-meta"><span className="today-label">PRODUCT CATALOG</span><span className="topbar-rule" /><span className="user-chip"><span className="status-dot" /> {user.username}</span></div>
        </header>

        <div className="page-content">
          <section className="page-heading">
            <div>
              <p className="eyebrow">OVERVIEW <span>—</span> {new Date().toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}</p>
              <h1>Inventory <span className="heading-period">.</span></h1>
              <p className="page-subtitle">Your products, all in one place.</p>
            </div>
            <button className="button-primary" onClick={() => setFormFor({})}><span className="button-plus">+</span> Add product</button>
          </section>

          {error && <div className="alert error" role="alert">{error}</div>}
          {notice && <button className="alert success" onClick={() => setNotice('')} aria-label="Dismiss notification">{notice}<span>×</span></button>}

          <section className="metrics-grid" aria-label="Inventory summary">
            <article className="metric-card metric-total"><div className="metric-top"><span>Total products</span><span className="metric-icon">▦</span></div><strong>{loading ? '—' : products.length.toString().padStart(2, '0')}</strong><small>ACTIVE SKUs</small></article>
            <article className="metric-card"><div className="metric-top"><span>Units in stock</span><span className="metric-icon mint">↗</span></div><strong>{loading ? '—' : products.reduce((sum, product) => sum + Number(product.quantity), 0).toLocaleString()}</strong><small>ACROSS ALL PRODUCTS</small></article>
            <article className="metric-card"><div className="metric-top"><span>Low stock</span><span className="metric-icon coral">!</span></div><strong>{loading ? '—' : lowStock.toString().padStart(2, '0')}</strong><small>{outOfStock ? `${outOfStock} OUT OF STOCK` : 'NEEDS ATTENTION'}</small></article>
            <article className="metric-card metric-value"><div className="metric-top"><span>Stock value</span><span className="metric-icon gold">₱</span></div><strong>{loading ? '—' : peso.format(inventoryValue)}</strong><small>RETAIL VALUE</small></article>
          </section>

          <section className="catalog-section">
            <div className="catalog-heading">
              <div><p className="eyebrow">STOCKROOM</p><h2>Product catalog <span>{products.length}</span></h2></div>
              <button className="icon-button refresh-button" onClick={load} disabled={loading} aria-label="Refresh products" title="Refresh products">↻</button>
            </div>
            <div className="catalog-tools">
              <div className="filter-tabs" role="group" aria-label="Filter products">
                {[['all', 'All items'], ['low', 'Low stock'], ['out', 'Out of stock']].map(([value, label]) => (
                  <button key={value} className={`filter-tab${filter === value ? ' active' : ''}`} onClick={() => setFilter(value)} aria-pressed={filter === value}>{label}{value === 'low' && lowStock > 0 && <span className="filter-badge">{lowStock}</span>}</button>
                ))}
              </div>
              <label className="search-box"><span aria-hidden="true">⌕</span><input ref={searchRef} type="search" placeholder="Search products..." value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search products" /><kbd>/</kbd></label>
            </div>

            <div className="table-wrap">
              {loading ? <div className="empty-state"><span className="loading-mark">◌</span><p>Loading inventory</p></div> : (
                <table>
                  <thead><tr><th className="id-col">ITEM</th><th>PRODUCT</th><th>STATUS</th><th className="num">PRICE</th><th className="num">IN STOCK</th><th className="date-col">ADDED</th><th><span className="sr-only">Actions</span></th></tr></thead>
                  <tbody>
                    {visibleProducts.length === 0 && <tr><td colSpan="7"><div className="empty-state"><span className="empty-mark">—</span><p>{products.length ? 'No matching products' : 'Your catalog is empty'}</p><small>{products.length ? 'Try another search or filter.' : 'Add a product to get your stockroom started.'}</small></div></td></tr>}
                    {visibleProducts.map((product, index) => {
                      const quantity = Number(product.quantity);
                      const status = quantity === 0 ? 'out' : quantity <= 5 ? 'low' : 'in';
                      return (
                        <tr key={product.id}>
                          <td className="id-col" data-label="Item"><span className="item-id">{String(product.id).padStart(3, '0')}</span></td>
                          <td data-label="Product"><div className="product-cell"><span className={`product-swatch swatch-${index % 5}`}>{product.product_name.slice(0, 1).toUpperCase()}</span><span className="product-copy"><strong>{product.product_name}</strong><small>{product.description || 'No description'}</small></span></div></td>
                          <td data-label="Status"><span className={`stock-status ${status}`}><i />{status === 'out' ? 'Out of stock' : status === 'low' ? 'Low stock' : 'In stock'}</span></td>
                          <td className="num price-cell" data-label="Price">{peso.format(product.price)}</td>
                          <td className="num quantity-cell" data-label="In stock"><strong>{quantity.toLocaleString()}</strong><small> units</small></td>
                          <td className="date-col date-cell" data-label="Added">{product.created_at || '—'}</td>
                          <td className="row-actions"><button className="text-action" onClick={() => setFormFor(product)}>Edit</button><button className="text-action delete-action" onClick={() => handleDelete(product)}>Delete</button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            {!loading && products.length > 0 && <div className="table-footer"><span>Showing <strong>{visibleProducts.length}</strong> of <strong>{products.length}</strong> products</span><span className="footer-note"><span className="status-dot" /> LIVE INVENTORY</span></div>}
          </section>
          <footer className="page-footer"><span>SILO INVENTORY SYSTEM</span><span>Built for the details.</span></footer>
        </div>
      </main>

      {formFor && (
        <ProductForm
          product={formFor.id ? formFor : null}
          onSaved={handleSaved}
          onCancel={() => setFormFor(null)}
        />
      )}
    </div>
  );
}
