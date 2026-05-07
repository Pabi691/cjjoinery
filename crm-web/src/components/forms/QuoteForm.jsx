import { useState, useEffect } from 'react';
import axios from '../../utils/axiosConfig';
import { Plus, Trash2 } from 'lucide-react';

const emptyItem = () => ({ description: '', quantity: 1, price: 0 });

const QuoteForm = ({ quote, onSuccess, onCancel }) => {
    const [customers, setCustomers] = useState([]);
    const [enquiries, setEnquiries] = useState([]);
    const [enquiryId, setEnquiryId] = useState('');
    const [customerId, setCustomerId] = useState('');
    const [items, setItems] = useState([emptyItem()]);
    const [vatRate, setVatRate] = useState(20);
    const [validUntil, setValidUntil] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        Promise.all([
            axios.get('/customers'),
            axios.get('/enquiries'),
        ]).then(([cRes, eRes]) => {
            setCustomers(cRes.data);
            // Only show New or Quoted enquiries for new quotes; all for editing
            setEnquiries(eRes.data.filter(e => e.status === 'New' || e.status === 'Quoted'));
        }).catch(() => {});

        if (quote) {
            setEnquiryId(quote.enquiryId?._id || quote.enquiryId || '');
            setCustomerId(quote.customerId?._id || quote.customerId || '');
            setItems(quote.items?.length ? quote.items : [emptyItem()]);
            const sub = quote.subtotal || 0;
            setVatRate(sub > 0 ? Math.round((quote.vat / sub) * 100) : 20);
            setValidUntil(quote.validUntil ? quote.validUntil.split('T')[0] : '');
        }
    }, [quote]);

    // When an enquiry is selected, auto-fill the customer
    const handleEnquiryChange = (e) => {
        const id = e.target.value;
        setEnquiryId(id);
        if (id) {
            const enq = enquiries.find(en => en._id === id);
            if (enq?.customerId) {
                setCustomerId(enq.customerId._id || enq.customerId);
            }
        }
    };

    const updateItem = (index, field, value) => {
        setItems(prev => prev.map((item, i) =>
            i === index ? { ...item, [field]: field === 'description' ? value : Number(value) } : item
        ));
    };

    const addItem    = () => setItems(prev => [...prev, emptyItem()]);
    const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));

    const subtotal = items.reduce((sum, it) => sum + (it.quantity * it.price), 0);
    const vat      = subtotal * (vatRate / 100);
    const total    = subtotal + vat;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!customerId) { setError('Please select a customer.'); return; }
        if (items.some(it => !it.description.trim())) { setError('All items need a description.'); return; }

        setLoading(true);
        setError('');
        const payload = {
            customerId,
            enquiryId: enquiryId || undefined,
            items,
            subtotal,
            vat,
            total,
            validUntil: validUntil || undefined,
        };
        try {
            if (quote) {
                await axios.put(`/quotes/${quote._id}`, payload);
            } else {
                await axios.post('/quotes', payload);
            }
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save quote');
        } finally {
            setLoading(false);
        }
    };

    const inputCls = "w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm p-2.5 focus:outline-none focus:ring-2 focus:ring-violet-400";
    const labelCls = "block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5";

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-4 py-2.5 rounded-xl">{error}</div>}

            {/* Enquiry link */}
            <div>
                <label className={labelCls}>Link to Enquiry <span className="text-gray-400 font-normal normal-case">(optional)</span></label>
                <select value={enquiryId} onChange={handleEnquiryChange} className={inputCls}>
                    <option value="">No linked enquiry</option>
                    {enquiries.map(e => (
                        <option key={e._id} value={e._id}>
                            {e.title} — {e.customerId?.name}
                        </option>
                    ))}
                </select>
                {enquiryId && (
                    <p className="text-xs text-sky-500 mt-1">Customer auto-filled from enquiry</p>
                )}
            </div>

            {/* Customer */}
            <div>
                <label className={labelCls}>Customer</label>
                <select value={customerId} onChange={e => setCustomerId(e.target.value)} className={inputCls} required>
                    <option value="">Select customer…</option>
                    {customers.map(c => (
                        <option key={c._id} value={c._id}>{c.name} ({c.email})</option>
                    ))}
                </select>
            </div>

            {/* Valid Until */}
            <div>
                <label className={labelCls}>Valid Until</label>
                <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} className={inputCls} />
            </div>

            {/* Line Items */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className={labelCls}>Line Items</label>
                    <button type="button" onClick={addItem} className="flex items-center gap-1 text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-800 transition-colors">
                        <Plus size={14} /> Add Item
                    </button>
                </div>

                <div className="grid grid-cols-12 gap-2 mb-1.5 px-1">
                    <span className="col-span-6 text-[11px] font-semibold text-gray-400 uppercase">Description</span>
                    <span className="col-span-2 text-[11px] font-semibold text-gray-400 uppercase">Qty</span>
                    <span className="col-span-2 text-[11px] font-semibold text-gray-400 uppercase">Price £</span>
                    <span className="col-span-1 text-[11px] font-semibold text-gray-400 uppercase text-right">Total</span>
                    <span className="col-span-1"></span>
                </div>

                <div className="space-y-2">
                    {items.map((item, i) => (
                        <div key={i} className="grid grid-cols-12 gap-2 items-center bg-white/50 dark:bg-white/5 border border-white/60 dark:border-white/10 rounded-xl p-2">
                            <input
                                className="col-span-6 rounded-lg border border-gray-200 dark:border-gray-600 bg-transparent text-sm p-1.5 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-400"
                                placeholder="Description"
                                value={item.description}
                                onChange={e => updateItem(i, 'description', e.target.value)}
                            />
                            <input
                                type="number" min="1"
                                className="col-span-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-transparent text-sm p-1.5 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-400"
                                value={item.quantity}
                                onChange={e => updateItem(i, 'quantity', e.target.value)}
                            />
                            <input
                                type="number" min="0" step="0.01"
                                className="col-span-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-transparent text-sm p-1.5 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-violet-400"
                                value={item.price}
                                onChange={e => updateItem(i, 'price', e.target.value)}
                            />
                            <span className="col-span-1 text-sm font-bold text-gray-700 dark:text-gray-300 text-right">
                                £{(item.quantity * item.price).toFixed(2)}
                            </span>
                            <button type="button" onClick={() => removeItem(i)} disabled={items.length === 1} className="col-span-1 flex justify-center text-red-400 hover:text-red-600 disabled:opacity-20 transition-colors">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* VAT */}
            <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">VAT %</label>
                <input
                    type="number" min="0" max="100"
                    value={vatRate}
                    onChange={e => setVatRate(Number(e.target.value))}
                    className="w-24 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm p-2 focus:outline-none focus:ring-2 focus:ring-violet-400 text-gray-900 dark:text-white"
                />
            </div>

            {/* Totals */}
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-2xl p-4 space-y-2 border border-violet-100 dark:border-violet-800/30">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                    <span>Subtotal</span><span className="font-semibold">£{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
                    <span>VAT ({vatRate}%)</span><span className="font-semibold">£{vat.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-black text-gray-900 dark:text-white border-t border-violet-200 dark:border-violet-700 pt-2 mt-1">
                    <span>Total</span><span className="text-violet-700 dark:text-violet-400">£{total.toFixed(2)}</span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={onCancel} className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    Cancel
                </button>
                <button type="submit" disabled={loading} className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-700 hover:to-purple-600 shadow-lg shadow-violet-200 dark:shadow-violet-900/30 disabled:opacity-50 transition-all">
                    {loading ? 'Saving…' : (quote ? 'Update Quote' : 'Create Quote')}
                </button>
            </div>
        </form>
    );
};

export default QuoteForm;
