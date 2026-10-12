import React, { useState, useMemo, useEffect } from 'react';

// --- THEME CONSTANTS ---
const PETAL_COLORS = ['bg-indigo-500', 'bg-pink-500', 'bg-amber-500', 'bg-emerald-500', 'bg-sky-500'];
const CHART_COLORS = ['#5D5FEF', '#EC4899', '#F59E0B', '#10B981', '#0EA5E9'];

// --- STABLE ICONS (SVG) ---
const IconPlus = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const IconChevron = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"></path></svg>;
const IconX = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const IconBell = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>;
const IconEye = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const IconHome = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
const IconHistory = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8v4l3 3"></path><circle cx="12" cy="12" r="9"></circle></svg>;
const IconCategory = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
const IconWallet = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M12 11h0M2 9.5h20"></path></svg>;
const IconTrash = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EB5757" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;

// --- CURRENCY FORMATTER (Indian Style) ---
const formatINR = (v) => '₹' + Math.round(v || 0).toLocaleString('en-IN');

export default function App() {
  const [view, setView] = useState('home');
  const [selId, setSelId] = useState(null);

  // --- DATA ENGINE ---
  const load = (k, d) => { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : d; } catch { return d; } };
  const [accounts, setAccounts] = useState(() => load('pk_acc', [
    { id: '1', name: 'Cash', balance: 0, type: 'Cash' },
    { id: '2', name: 'Bank', balance: 0, type: 'Bank' },
    { id: '3', name: 'Loan', balance: 0, type: 'Loan' }
  ]));
  const [categories, setCategories] = useState(() => load('pk_cat', [
    { id: 'c1', name: 'Cement', icon: '🧱', budget: 0, subs: [] },
    { id: 'c2', name: 'Labour', icon: '🏠', budget: 0, subs: [] }
  ]));
  const [transactions, setTransactions] = useState(() => load('pk_tx', []));

  useEffect(() => {
    localStorage.setItem('pk_acc', JSON.stringify(accounts));
    localStorage.setItem('pk_cat', JSON.stringify(categories));
    localStorage.setItem('pk_tx', JSON.stringify(transactions));
  }, [accounts, categories, transactions]);

  // --- ACTIONS ---
  const saveTx = (tx) => {
    setTransactions([{ ...tx, id: Date.now().toString() }, ...transactions]);
    setAccounts(accounts.map(a => a.id === tx.accId ? { ...a, balance: a.balance - tx.amount } : a));
    setView('home');
  };

  const overallBudget = useMemo(() => categories.reduce((s, c) => s + (Number(c.budget) || 0), 0), [categories]);
  const totalSpent = useMemo(() => transactions.reduce((s, t) => s + t.amount, 0), [transactions]);

  return (
    <div className="min-h-screen bg-black text-white font-sans flex justify-center selection:bg-indigo-500/20">
      <div className="w-full max-w-lg md:max-w-xl bg-black min-h-screen relative border-x border-white/5 pb-32">
        
        {view === 'home' && <HomeView total={overallBudget} spent={totalSpent} transactions={transactions} cats={categories} onNew={() => setView('new-tx')} />}
        
        {view === 'history' && <HistoryListView transactions={transactions} cats={categories} onBack={() => setView('home')} />}

        {view === 'categories' && <CategoryListView categories={categories} transactions={transactions} onBack={() => setView('home')} 
          onDetail={(id) => { setSelId(id); setView('cat-detail'); }}
          onAdd={() => { const id = Date.now().toString(); setCategories([...categories, { id, name: 'New Item', icon: '📁', budget: 0, subs: [] }]); setSelId(id); setView('edit-cat'); }} />}

        {view === 'cat-detail' && <CategoryDetailView cat={categories.find(c => c.id === selId)} transactions={transactions.filter(t => t.catId === selId)} onBack={() => setView('categories')} onEdit={() => setView('edit-cat')} />}

        {view === 'accounts' && <AccountsView accounts={accounts} onBack={() => setView('home')} onEdit={(id) => { setSelId(id); setView('edit-acc'); }} />}

        {view === 'edit-cat' && <EditCategoryView cat={categories.find(c => c.id === selId)} onBack={() => setView('cat-detail')} onUpdate={(id, d) => setCategories(categories.map(c => c.id === id ? {...c,...d} : c))} onDelete={(id) => {setCategories(categories.filter(c=>c.id!==id)); setView('categories');}} />}

        {view === 'edit-acc' && <EditAccountView acc={accounts.find(a => a.id === selId)} onBack={() => setView('accounts')} onSave={(id, n, b) => { setAccounts(accounts.map(a => a.id === id ? { ...a, name: n, balance: Number(b) } : a)); setView('accounts'); }} />}

        {view === 'new-tx' && <NewTransactionView categories={categories} accounts={accounts} onClose={() => setView('home')} onSave={saveTx} />}

        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg md:max-w-xl bg-black/95 border-t border-white/5 py-4 flex justify-around items-center z-50 backdrop-blur-xl">
          <NavBtn label="Home" icon={<IconHome />} active={view==='home'} onClick={() => setView('home')} />
          <NavBtn label="History" icon={<IconHistory />} active={view==='history'} onClick={() => setView('history')} />
          <NavBtn label="Categories" icon={<IconCategory />} active={view.includes('cat')} onClick={() => setView('categories')} />
          <NavBtn label="Accounts" icon={<IconWallet />} active={view.includes('acc')} onClick={() => setView('accounts')} />
        </nav>
      </div>
    </div>
  );
}

// --- ROW COMPONENT WITH PETAL IDENTITY ---
function TransactionRow({ t, catName, index }) {
  const firstLetter = catName ? catName.charAt(0).toUpperCase() : '?';
  const petalColor = PETAL_COLORS[index % PETAL_COLORS.length];
  
  return (
    <div className="bg-[#121212] p-5 rounded-[2rem] border border-white/5 flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`w-11 h-11 ${petalColor} rounded-full flex items-center justify-center font-black text-white/90 text-lg shadow-lg`}>
          {firstLetter}
        </div>
        <div>
          <p className="font-bold text-sm text-white leading-tight">{catName}</p>
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-0.5">
            {t.subName ? `${t.subName} • ` : ''}{t.note || t.date}
          </p>
        </div>
      </div>
      <p className="font-extrabold text-red-400 text-sm">-{formatINR(t.amount)}</p>
    </div>
  );
}

// --- HOME VIEW ---
function HomeView({ total, spent, transactions, cats, onNew }) {
  return (
    <div className="p-5 space-y-6 h-screen overflow-y-auto no-scrollbar pb-40">
      <div className="flex justify-between items-center py-2">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full border border-white/10 bg-gray-900 flex items-center justify-center font-bold text-gray-500">S</div>
          <div><p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-none">Assalamualaikum,</p><h2 className="text-xl font-bold text-white mt-1">Shaik</h2></div>
        </div>
        <div className="p-2.5 text-gray-400 bg-white/5 rounded-full border border-white/5"><IconBell /></div>
      </div>

      <div className="relative overflow-hidden rounded-[2.5rem] p-8 bg-[#5D5FEF] shadow-2xl shadow-indigo-500/20" 
           style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 15px, rgba(255,255,255,0.04) 15px, rgba(255,255,255,0.04) 16px)' }}>
        <div className="relative z-10 space-y-7">
          <div className="flex justify-between items-center text-white/80 font-bold text-[11px] uppercase tracking-[0.15em]">
            <span className="flex items-center gap-2"><div className="w-4 h-3 border-2 border-white rounded-[3px]"></div> Overall Budget</span><IconEye />
          </div>
          <h3 className="text-4xl font-black tracking-tighter text-white">{formatINR(total)}</h3>
          <div className="pt-5 border-t border-white/10 space-y-4">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
              <span className="text-white/60">Spent</span><span className="text-white">{formatINR(spent)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
              <span className="text-white/60">Amount Left</span><span className="text-emerald-300 font-black">{formatINR(total - spent)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-bold text-base px-2">Recent Spends</h4>
        <div className="space-y-3">
          {transactions.length === 0 ? <p className="text-center py-12 text-gray-700 font-bold text-[11px] uppercase tracking-widest">No history recorded</p> : 
            transactions.slice(0, 5).map((t, i) => (
              <TransactionRow key={t.id} t={t} catName={t.catName} index={i} />
            ))
          }
        </div>
      </div>
      <button onClick={onNew} className="fixed bottom-28 right-6 w-16 h-16 bg-[#5D5FEF] rounded-2xl shadow-2xl flex items-center justify-center z-40 active:scale-90 transition-transform"><IconPlus /></button>
    </div>
  );
}

// --- ACCOUNTS VIEW (WITH ANALYTICS) ---
function AccountsView({ accounts, onBack, onEdit }) {
  const total = accounts.reduce((s, a) => s + a.balance, 0);
  const max = Math.max(...accounts.map(a => a.balance), 1);

  return (
    <div className="p-5 space-y-7 h-screen overflow-y-auto no-scrollbar pb-40">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">My Wallets</h2>
        <button onClick={onBack} className="p-2 bg-[#1C1C1E] rounded-full"><IconX /></button>
      </div>

      <div className="bg-[#1C1C1E] p-8 rounded-[2.5rem] border border-white/5 text-center shadow-xl">
        <p className="text-[11px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2">Total Net Assets</p>
        <h3 className="text-4xl font-black text-white tracking-tighter">{formatINR(total)}</h3>
        
        {/* CUSTOM CSS CHART: DISTRIBUTION */}
        <div className="mt-8 space-y-4 px-2">
           {accounts.map((acc, i) => (
             <div key={acc.id} className="space-y-1.5">
                <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest text-white/50"><span>{acc.name}</span><span>{Math.round((acc.balance/total)*100) || 0}%</span></div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${(acc.balance/total)*100}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}></div>
                </div>
             </div>
           ))}
        </div>
      </div>

      <div className="space-y-3">
        {accounts.map(acc => (
          <button key={acc.id} onClick={() => onEdit(acc.id)} className="w-full bg-[#121212] p-6 rounded-[2rem] border border-white/5 flex justify-between items-center active:bg-white/5 transition-colors">
             <div className="flex items-center gap-4 text-left">
               <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-lg shadow-inner">🏦</div>
               <div><p className="font-bold text-base text-white">{acc.name}</p><p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Tap to Adjust</p></div>
             </div>
             <p className={`text-xl font-black ${acc.type==='Loan'?'text-red-400':'text-white'}`}>{formatINR(acc.balance)}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// --- CATEGORY DETAIL (CHRONOLOGICAL) ---
function CategoryDetailView({ cat, transactions, onBack, onEdit }) {
  const sorted = [...transactions].sort((a,b) => b.date.localeCompare(a.date));
  const spent = transactions.reduce((s,t) => s + t.amount, 0);
  return (
    <div className="p-5 space-y-6 h-screen overflow-y-auto no-scrollbar pb-40">
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="p-2 bg-[#1C1C1E] rounded-full text-gray-500"><IconChevron /></button>
        <h2 className="text-xl font-bold tracking-tight">{cat.name} History</h2>
        <button onClick={onEdit} className="text-[#5D5FEF] font-bold text-[10px] uppercase tracking-[0.2em]">Settings</button>
      </div>
      <div className="bg-[#1C1C1E] p-7 rounded-[2.5rem] border border-white/5 flex justify-between items-end shadow-2xl">
        <div><p className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-1">Spent</p><h3 className="text-3xl font-black text-red-400 tracking-tight">{formatINR(spent)}</h3></div>
        <div className="text-right"><p className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-1">Budget</p><p className="text-xl font-bold text-white">{formatINR(cat.budget)}</p></div>
      </div>
      <div className="space-y-3">
        {sorted.map((t, i) => (
          <TransactionRow key={t.id} t={t} catName={cat.name} index={i} />
        ))}
      </div>
    </div>
  );
}

// --- NEW TRANSACTION FORM (FROZEN & POLISHED) ---
function NewTransactionView({ categories, accounts, onClose, onSave }) {
  const [showPicker, setShowPicker] = useState(false);
  const [f, setF] = useState({ amount: '', note: '', catName: 'Select Category', catId: '', subName: '', accId: accounts[0]?.id || '', date: new Date().toISOString().split('T')[0] });
  if (showPicker) return (
    <div className="p-6 h-screen bg-black overflow-y-auto no-scrollbar pb-32">
      <div className="flex justify-between items-center mb-10 pt-4"><h3 className="text-xs font-black uppercase text-white/30 tracking-[0.3em] mx-auto">Categorization</h3><button onClick={() => setShowPicker(false)} className="p-2 absolute right-6"><IconX /></button></div>
      {categories.map(cat => (
        <div key={cat.id} className="mb-8">
          <button onClick={() => { setF({...f, catName: cat.name, catId: cat.id, subName: ''}); setShowPicker(false); }} className="w-full text-left font-bold text-lg p-5 bg-[#121212] border border-white/5 rounded-[2rem] flex items-center justify-between"><span>{cat.icon} {cat.name}</span><span className="text-[10px] font-black bg-indigo-500/20 text-indigo-400 px-4 py-1.5 rounded-full uppercase">Pick</span></button>
          <div className="ml-12 mt-5 space-y-6">
            {cat.subs.map((s, i) => (<button key={i} onClick={() => { setF({...f, catName: cat.name, catId: cat.id, subName: s}); setShowPicker(false); }} className="w-full text-left text-white/40 font-bold text-base flex items-center gap-3"> <div className="w-1.5 h-1.5 bg-white/10 rounded-full"></div> {s}</button>))}
          </div>
        </div>
      ))}
    </div>
  );
  return (
    <div className="flex flex-col h-screen bg-black p-6 relative">
      <div className="flex justify-between items-center mb-6 px-1"><h3 className="text-2xl font-bold">New Payment</h3><button onClick={onClose} className="p-2 bg-[#1C1C1E] rounded-full"><IconX /></button></div>
      <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar">
        <div className="bg-[#1C1C1E] p-7 rounded-[2.5rem] border border-white/5 shadow-inner"><p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2">Transaction Value</p><div className="text-4xl font-black flex gap-3 text-white tracking-tighter"><span>₹</span><input type="number" placeholder="0" value={f.amount} onChange={e => setF({...f, amount: e.target.value})} className="bg-transparent w-full outline-none" /></div></div>
        <div className="bg-[#1C1C1E] p-5 rounded-2xl border border-white/5"><p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5">When?</p><input type="date" value={f.date} onChange={e => setF({...f, date: e.target.value})} className="bg-transparent w-full text-white font-bold outline-none [color-scheme:dark]" /></div>
        <div onClick={() => setShowPicker(true)} className="bg-[#1C1C1E] p-5 rounded-2xl border border-white/5 flex justify-between items-center"><div><p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Target Category</p><p className="text-base font-bold text-white">{f.catName}{f.subName && ` • ${f.subName}`}</p></div><IconChevron /></div>
        <div className="bg-[#1C1C1E] p-5 rounded-2xl border border-white/5 flex justify-between items-center"><div><p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Payment Source</p><select value={f.accId} onChange={e => setF({...f, accId: e.target.value})} className="bg-transparent text-base text-white font-bold outline-none w-full appearance-none">{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div><IconChevron /></div>
        <div className="bg-[#1C1C1E] p-5 rounded-2xl border border-white/5"><p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5">Description (Optional)</p><input placeholder="What was this for?" value={f.note} onChange={e => setF({...f, note: e.target.value})} className="bg-transparent w-full text-white font-medium outline-none" /></div>
      </div>
      <div className="pb-8 pt-4"><button onClick={() => onSave({ ...f, amount: parseFloat(f.amount)||0 })} className="w-full py-5 bg-[#5D5FEF] rounded-2xl font-black text-xl shadow-2xl active:scale-95 transition-all">Confirm Payment</button></div>
    </div>
  );
}

// --- REMAINING FROZEN VIEWS (History, Lists, Edit) ---
function NavBtn({ label, icon, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-[#5D5FEF]' : 'text-white/20'}`}>
      <div className={`${active ? 'scale-110 opacity-100' : 'scale-100 opacity-60'} transition-all mb-0.5`}>{icon}</div>
      <span className="text-[9px] font-black uppercase tracking-tight leading-none">{label}</span>
    </button>
  );
}

function HistoryListView({ transactions, cats, onBack }) {
  return (
    <div className="p-5 pt-10 space-y-5 h-screen overflow-y-auto pb-40 no-scrollbar">
      <div className="flex justify-between items-center px-1"><h3 className="text-2xl font-bold tracking-tight">Full History</h3><button onClick={onBack} className="p-2 bg-[#1C1C1E] rounded-full"><IconX /></button></div>
      {transactions.map((t, i) => (
        <TransactionRow key={t.id} t={t} catName={t.catName} index={i} />
      ))}
    </div>
  );
}

function CategoryListView({ categories, transactions, onBack, onDetail, onAdd }) {
  return (
    <div className="p-5 space-y-7 pb-32 h-screen overflow-y-auto no-scrollbar">
      <div className="flex justify-between items-center px-1"><h2 className="text-2xl font-bold tracking-tight">Categories</h2><button onClick={onBack} className="p-2 bg-[#1C1C1E] rounded-full"><IconX /></button></div>
      <div className="space-y-4">
        {categories.map(c => {
          const s = transactions.filter(t => t.catId === c.id).reduce((sum,t) => sum + t.amount, 0);
          return (
            <button key={c.id} onClick={() => onDetail(c.id)} className="w-full bg-[#121212] p-6 rounded-[2.2rem] border border-white/5 space-y-5 text-left shadow-lg">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4"><span className="text-2xl">{c.icon}</span><p className="font-bold text-lg text-white">{c.name}</p></div>
                <div className="flex items-center gap-2"><span className="w-6 h-6 bg-white/5 rounded-full flex items-center justify-center text-[10px] font-black text-indigo-400">{c.subs.length}</span><IconChevron /></div>
              </div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] pt-5 border-t border-white/5">
                <div className="space-y-1"><p className="text-white/30">Budget</p><p className="text-white">{formatINR(c.budget)}</p></div>
                <div className="space-y-1 text-center"><p className="text-white/30">Spent</p><p className="text-red-400">{formatINR(s)}</p></div>
                <div className="space-y-1 text-right"><p className="text-white/30">Left</p><p className="text-emerald-400">{formatINR(c.budget-s)}</p></div>
              </div>
            </button>
          );
        })}
        <button onClick={onAdd} className="w-full py-6 border-dashed border-2 border-white/10 rounded-[2.5rem] text-white/30 font-black tracking-widest text-xs">+ NEW CATEGORY</button>
      </div>
    </div>
  );
}

function EditCategoryView({ cat, onBack, onUpdate, onDelete }) {
  const [n, setN] = useState(cat.name); const [b, setB] = useState(cat.budget); const [s, setS] = useState('');
  const handleAdd = () => { if (!s.trim()) return; onUpdate(cat.id, { subs: [...cat.subs, s] }); setS(''); document.activeElement.blur(); };
  return (
    <div className="p-6 space-y-7 h-screen overflow-y-auto no-scrollbar pb-40">
      <div className="flex justify-between items-center font-bold text-xl px-1"><h2>Category Adjust</h2><button onClick={onBack} className="p-2 bg-[#1C1C1E] rounded-full"><IconX /></button></div>
      <div className="bg-[#1C1C1E] p-6 rounded-3xl border border-white/5 space-y-2"><p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Label</p><input className="bg-transparent w-full font-bold text-lg outline-none" value={n} onChange={e => setN(e.target.value)} /></div>
      <div className="bg-[#1C1C1E] p-6 rounded-3xl border border-white/5 space-y-2"><p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Limit</p><input type="number" className="bg-transparent w-full font-bold text-lg text-emerald-400 outline-none" value={b} onChange={e => setB(e.target.value)} /></div>
      <div className="space-y-3 px-1"><p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Sub-items</p>
        <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">{cat.subs.map((si, i) => (<div key={i} className="bg-[#121212] p-5 rounded-2xl flex justify-between items-center border border-white/5 text-sm font-bold">{si} <button onClick={() => onUpdate(cat.id, { subs: cat.subs.filter((_, idx) => idx !== i) })}><IconTrash /></button></div>))}</div>
        <div className="flex gap-2 bg-[#1C1C1E] p-2 rounded-2xl border border-white/5"><input className="flex-1 bg-transparent p-3 outline-none font-bold text-sm" placeholder="Add..." value={s} onChange={e => setS(e.target.value)} /><button onClick={handleAdd} className="w-11 h-11 bg-[#5D5FEF] rounded-xl flex items-center justify-center active:scale-90 transition-all"><IconPlus /></button></div>
      </div>
      <div className="flex flex-col gap-3">
        <button onClick={() => { onUpdate(cat.id, { name: n, budget: Number(b) }); onBack(); }} className="w-full py-5 bg-[#5D5FEF] rounded-3xl font-black text-xl shadow-xl">Apply Changes</button>
        <button onClick={() => { if(confirm('Discard?')) onDelete(cat.id); }} className="w-full py-3 bg-red-500/5 text-red-500 rounded-2xl font-black text-[11px] uppercase tracking-widest border border-red-500/10">Delete Category</button>
      </div>
    </div>
  );
}

function EditAccountView({ acc, onBack, onSave }) {
  const [n, setN] = useState(acc.name); const [b, setB] = useState(acc.balance);
  return (
    <div className="p-6 space-y-7">
      <div className="flex justify-between items-center font-bold px-1"><h2>Source Adjust</h2><button onClick={onBack} className="p-2 bg-[#1C1C1E] rounded-full text-gray-500"><IconX /></button></div>
      <div className="bg-[#1C1C1E] p-7 rounded-3xl border border-white/5 space-y-2"><p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Name</p><input className="bg-transparent w-full font-bold text-lg outline-none" value={n} onChange={e => setN(e.target.value)} /></div>
      <div className="bg-[#1C1C1E] p-7 rounded-3xl border border-white/5 space-y-2"><p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">Balance</p><input type="number" className="bg-transparent w-full font-bold text-lg outline-none text-emerald-400" value={b} onChange={e => setB(e.target.value)} /></div>
      <button onClick={() => onSave(acc.id, n, b)} className="w-full py-5 bg-[#5D5FEF] rounded-[2rem] font-black text-xl shadow-xl active:scale-95 transition-all">Update Balance</button>
    </div>
  );
}