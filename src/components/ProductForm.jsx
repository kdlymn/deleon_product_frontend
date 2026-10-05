import { useState } from 'react';
import { createProduct, updateProduct, errorMessage } from '../api.js';

const empty = { product_name: '', description: '', price: '', quantity: '' };

export default function ProductForm({ product, onSaved, onCancel }) {
  const editing = !!product;
  const [form, setForm] = useState(editing ? { ...product } : empty);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    const payload = {
      product_name: form.product_name,
      description: form.description,
      price: form.price,
      quantity: form.quantity,
    };
    try {
      editing ? await updateProduct(product.id, payload) : await createProduct(payload);
      onSaved(editing ? 'Product updated.' : 'Product added.');
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="card modal" onClick={(e) => e.stopPropagation()}>
        <h2>{editing ? 'Edit product' : 'Add product'}</h2>
        {error && <div className="alert error">{error}</div>}
        <form onSubmit={submit}>
          <label>Product name
            <input value={form.product_name} onChange={set('product_name')} maxLength={100} required autoFocus />
          </label>
          <label>Description
            <textarea rows={3} value={form.description ?? ''} onChange={set('description')} />
          </label>
          <div className="row">
            <label>Price
              <input type="number" min="0" step="0.01" value={form.price} onChange={set('price')} required />
            </label>
            <label>Quantity
              <input type="number" min="0" step="1" value={form.quantity} onChange={set('quantity')} required />
            </label>
          </div>
          <div className="actions">
            <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
            <button disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
