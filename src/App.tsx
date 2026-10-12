import React, { useState, useMemo, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- TYPES FOR VERCEL (Fixes TS Errors) ---
interface Account {
  id: string;
  name: string;
  balance: number;
  type: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  budget: number;
  subs: string[];
}

interface Transaction {
  id: string;
  amount: number;
  note: string;
  cat_id: string;
  cat_name: string;
  sub_name: string;
  acc_id: string;
  date: string;
  user_id?: string;
}

// --- CLOUD CONFIG ---
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ckydqqbsnoafylzurkoi.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- INDIAN CURRENCY FORMATTER ---
const fmt = (v: number) => '₹' + Math.round(v || 0).toLocaleString('en-IN');

// --- ICONS ---
const IconPlus = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const IconChevron = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"></path></svg>;
const IconX = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const IconBell = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"></path></svg>;
const IconEye = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const IconHome = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
const IconHistory = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>;
const IconCategory = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
const IconWallet = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M2 9.5h20"></path></svg>;
const IconTrash = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EB5757" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState('home');
  const [selId, setSelId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  const fetchAll = async () => {
    if (!session) return;
    setLoading(true);
    const [a, c, t] = await Promise.all([
      supabase.from('accounts').select('*').order('name'),
      supabase.from('categories').select('*').order('name'),
      supabase.from('transactions').select('*').order('date', { ascending: false })
    ]);
    if (a.data) setAccounts(a.data);
    if (c.data) setCategories(c.data);
    if (t.data) setTransactions(t.data);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [session]);

  const handleSaveTx = async (tx: any) => {
    await supabase.from('transactions').insert([{ ...tx, user_id: session.user.id }]);
    const acc = accounts.find(a => a.id === tx.acc_id);
    if (acc) {
      await supabase.from('accounts').update({ balance: acc.balance - tx.amount }).eq('id', tx.acc_id);
    }
    fetchAll(); setView('home');
  };

  const overallBudget = useMemo(() => categories.reduce((s, c) => s + Number(c.budget), 0), [categories]);
  const totalSpent = useMemo(() => transactions.reduce((s, t) => s + Number(t.amount), 0), [transactions]);

  if (!session) return <LoginView onLogin={async (e,p) => { await supabase.auth.signInWithPassword({email:e, password:p}); }} />;
  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-indigo-400 font-bold uppercase text-[10px] tracking-widest">Syncing...</div>;

  return (
    <div className="min-h-screen bg-black text-white font-sans flex justify-center">
      <div className="w-full max-w-lg md:max-w-xl bg-black min-h-screen relative border-x border-white/5 pb-32 shadow-2xl">
        {view === 'home' && <HomeView total={overallBudget} spent={totalSpent} tx={transactions} cats={categories} onNew={() => setView('new-tx')} />}
        {view === 'transactions' && <HistoryView tx={transactions} cats={categories} onBack={() => setView('home')} />}
        {view === 'categories' && <CategoryListView cats={categories} tx={transactions} onBack={() => setView('home')} onDetail={(id)=>{setSelId(id); setView('cat-detail');}} onAdd={async ()=>{const {data:n}=await supabase.from('categories').insert([{name:'New', budget:0, subs:[], user_id:session.user.id}]).select(); if(n) { setSelId(n[0].id); fetchAll(); setView('edit-cat'); }}} />}
        {view === 'cat-detail' && <CategoryDetailView cat={categories.find(c=>c.id===selId)} tx={transactions.filter(t=>t.cat_id===selId)} onBack={()=>setView('categories')} onEdit={()=>setView('edit-cat')} />}
        {view === 'accounts' && <AccountsView accs={accounts} onBack={()=>setView('home')} onEdit={(id)=>{setSelId(id); setView('edit-acc');}} onAdd={async ()=>{await supabase.from('accounts').insert([{name:'New', balance:0, type:'Bank', user_id:session.user.id}]); fetchAll();}} />}
        {view === 'edit-cat' && <EditCategoryView cat={categories.find(c=>c.id===selId)} onBack={()=>setView('cat-detail')} onUpdate={async (id,p)=>{await supabase.from('categories').update(p).eq('id',id); fetchAll();}} onDelete={async (id)=>{if(confirm("Delete?")){await supabase.from('categories').delete().eq('id',id); fetchAll(); setView('categories');}}} />}
        {view === 'edit-acc' && <EditAccountView acc={accounts.find(a=>a.id===selId)} onBack={()=>setView('accounts')} onSave={async (id,n,b)=>{await supabase.from('accounts').update({name:n, balance:b}).eq('id',id); fetchAll(); setView('accounts');}} />}
        {view === 'new-tx' && <NewTransactionView cats={categories} accs={accounts} onClose={()=>setView('home')} onSave={handleSaveTx} />}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg md:max-w-xl bg-black/95 border-t border-white/5 py-4 flex justify-around items-center z-50 backdrop-blur-xl">
          <NavBtn label="Home" icon={<IconHome />} active={view==='home'} onClick={() => setView('home')} />
          <NavBtn label="History" icon={<IconHistory />} active={view==='transactions'} onClick={() => setView('transactions')} />
          <NavBtn label="Categories" icon={<IconCategory />} active={view.includes('cat')} onClick={() => setView('categories')} />
          <NavBtn label="Accounts" icon={<IconWallet />} active={view.includes('acc')} onClick={() => setView('accounts')} />
        </nav>
      </div>
    </div>
  );
}

function LoginView({ onLogin }: {onLogin: any}) {
  const [e, setE] = useState(''); const [p, setP] = useState('');
  return (
    <div className="min-h-screen bg-black flex flex-col justify-center p-8 space-y-8">
      <div className="text-center space-y-2"><h1 className="text-3xl font-black text-white">Smart Manager</h1><p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Sign in to sync your build</p></div>
      <div className="space-y-4">
        <input placeholder="Email" value={e} onChange={val => setE(val.target.value)} className="w-full bg-[#1C1C1E] p-5 rounded-2xl outline-none text-white font-bold" />
        <input type="password" placeholder="Password" value={p} onChange={val => setP(val.target.value)} className="w-full bg-[#1C1C1E] p-5 rounded-2xl outline-none text-white font-bold" />
        <button onClick={() => onLogin(e,p)} className="w-full py-5 bg-[#5D5FEF] rounded-2xl font-black text-xl">Login</button>
      </div>
    </div>
  );
}

function HomeView({ total, spent, tx, cats, onNew }: any) {
  return (
    <div className="p-4 space-y-6 h-screen overflow-y-auto no-scrollbar pb-40">
      <div className="flex justify-between items-center py-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-900 border border-white/10 flex items-center justify-center font-bold text-gray-500">S</div>
          <div><p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none">Assalamualaikum,</p><h2 className="text-lg font-bold">Shaik</h2></div>
        </div>
        <div className="p-2 text-gray-400 bg-white/5 rounded-full"><IconBell /></div>
      </div>
      <div className="relative overflow-hidden rounded-[2.5rem] p-8 bg-[#5D5FEF] shadow-2xl" style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 15px, rgba(255,255,255,0.05) 15px, rgba(255,255,255,0.05) 16px)' }}>
        <div className="relative z-10 space-y-6">
          <div className="flex justify-between items-center text-white font-bold text-[10px] uppercase tracking-widest"><span>Overall Budget</span><IconEye /></div>
          <h3 className="text-4xl font-black tracking-tighter">{fmt(total)}</h3>
          <div className="pt-4 border-t border-white/10 space-y-3">
            <div className="flex justify-between text-xs font-bold"><span className="opacity-70">Spent</span><span>{fmt(spent)}</span></div>
            <div className="flex justify-between text-xs font-bold"><span className="opacity-70">Amount Left</span><span className="text-emerald-300 font-black">{fmt(total - spent)}</span></div>
          </div>
        </div>
      </div>
      <div className="space-y-3"><h4 className="font-bold text-base px-1">Recent Activity</h4>
        {tx.slice(0, 5).map((t: any) => (
          <div key={t.id} className="bg-[#121212] p-4 rounded-[1.5rem] border border-white/5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center text-lg">{cats.find((c:any)=>c.id===t.cat_id)?.icon || '🧱'}</div>
              <div><p className="font-bold text-sm leading-none">{t.cat_name}</p><p className="text-[9px] text-gray-500 font-bold uppercase mt-1">{t.sub_name || t.date}</p></div>
            </div>
            <p className="font-bold text-red-400 text-sm">-{fmt(t.amount)}</p>
          </div>
        ))}
      </div>
      <button onClick={onNew} className="fixed bottom-28 right-6 w-14 h-14 bg-[#5D5FEF] rounded-2xl shadow-2xl flex items-center justify-center z-40 active:scale-90"><IconPlus /></button>
    </div>
  );
}

function CategoryDetailView({ cat, tx, onBack, onEdit }: any) {
  const sorted = [...tx].sort((a,b) => b.date.localeCompare(a.date));
  return (
    <div className="p-4 space-y-6 h-screen overflow-y-auto pb-40">
      <div className="flex justify-between items-center py-2"><button onClick={onBack} className="p-2 bg-[#1C1C1E] rounded-full text-gray-500"><IconChevron /></button><h2 className="text-xl font-bold">{cat?.name}</h2><button onClick={onEdit} className="text-[#5D5FEF] font-bold text-xs uppercase">Edit</button></div>
      <div className="bg-[#1C1C1E] p-6 rounded-[2rem] border border-white/5 flex justify-between items-end">
        <div><p className="text-[10px] font-bold text-gray-500 uppercase">Spent</p><h3 className="text-3xl font-black text-red-400">{fmt(tx.reduce((s:any,t:any)=>s+Number(t.amount),0))}</h3></div>
        <div className="text-right"><p className="text-[10px] font-bold text-gray-500 uppercase">Limit</p><p className="text-lg font-bold">{fmt(cat?.budget)}</p></div>
      </div>
      <div className="space-y-3">{sorted.map((t: any) => (<div key={t.id} className="bg-[#121212] p-4 rounded-2xl flex justify-between items-center border border-white/5 shadow-sm"><div className="flex items-center gap-4"><div className="text-center bg-white/5 p-2 rounded-xl min-w-[55px]"><p className="text-[11px] font-black text-indigo-400">{t.date.split('-')[2]}</p><p className="text-[8px] font-bold text-gray-500 uppercase">{new Date(t.date).toLocaleString('default', {month:'short'})}</p></div><div><p className="font-bold text-sm leading-tight">{t.sub_name || 'General'}</p><p className="text-[9px] text-gray-500 font-bold uppercase">{t.note}</p></div></div><p className="font-bold text-red-400 text-sm">-{fmt(t.amount)}</p></div>))}</div>
    </div>
  );
}

function CategoryListView({ cats, tx, onBack, onDetail, onAdd }: any) {
  return (
    <div className="p-4 space-y-6 h-screen overflow-y-auto pb-40 no-scrollbar">
      <div className="flex justify-between items-center font-bold text-2xl px-1"><h2>Categories</h2><button onClick={onBack} className="p-2 bg-[#1C1C1E] rounded-full text-gray-500"><IconX /></button></div>
      <div className="space-y-3">
        {cats.map((c: any) => {
          const s = tx.filter((t:any) => t.cat_id === c.id).reduce((sum:any,t:any) => sum + Number(t.amount), 0);
          return (
            <button key={c.id} onClick={() => onDetail(c.id)} className="w-full bg-[#121212] p-5 rounded-[2.2rem] border border-white/5 space-y-4 text-left shadow-lg">
              <div className="flex justify-between items-center"><div className="flex items-center gap-3"><span className="text-2xl">{c.icon}</span><p className="font-bold text-base">{c.name}</p></div><IconChevron /></div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest pt-4 border-t border-white/5">
                <div><p className="text-gray-500 mb-1">Budget</p><p>{fmt(c.budget)}</p></div>
                <div><p className="text-gray-500 mb-1">Spent</p><p className="text-red-400">{fmt(s)}</p></div>
                <div><p className="text-gray-500 mb-1">Left</p><p className="text-emerald-400">{fmt(c.budget-s)}</p></div>
              </div>
            </button>
          );
        })}
        <button onClick={onAdd} className="w-full py-5 border-dashed border-2 border-white/10 rounded-[2.2rem] text-gray-700 font-bold uppercase text-[9px] tracking-widest">+ New Category</button>
      </div>
    </div>
  );
}

function NewTransactionView({ cats, accs, onClose, onSave }: any) {
  const [pk, setPk] = useState(false);
  const [f, setF] = useState({ amount: '', note: '', cat_name: 'Select Category', cat_id: '', sub_name: '', acc_id: accs[0]?.id || '', date: new Date().toISOString().split('T')[0] });
  if (pk) return (
    <div className="p-6 h-screen bg-black overflow-y-auto pb-32">
      <h3 className="text-center font-bold text-gray-500 uppercase text-xs mb-10">Choose Item</h3>
      {cats.map((cat: any) => (
        <div key={cat.id} className="mb-8">
          <button onClick={() => { setF({...f, cat_name: cat.name, cat_id: cat.id, sub_name: ''}); setPk(false); }} className="w-full text-left font-bold text-lg p-5 bg-[#121212] border border-white/5 rounded-2xl flex items-center justify-between"><span>{cat.icon} {cat.name}</span><span className="text-[10px] font-black bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full uppercase">Select</span></button>
          <div className="ml-12 mt-4 space-y-5">
            {cat.subs?.map((s: any, i: any) => (<button key={i} onClick={() => { setF({...f, cat_name: cat.name, cat_id: cat.id, sub_name: s}); setPk(false); }} className="w-full text-left text-gray-400 font-bold text-base flex items-center gap-3"> <div className="w-1 h-1 bg-gray-700 rounded-full"></div> {s}</button>))}
          </div>
        </div>
      ))}
    </div>
  );
  return (
    <div className="flex flex-col h-screen bg-black p-6">
      <div className="flex justify-between items-center mb-6 font-bold text-2xl"><h3>New Spend</h3><button onClick={onClose} className="p-2 bg-[#1C1C1E] rounded-full text-gray-500"><IconX /></button></div>
      <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar">
        <div className="bg-[#1C1C1E] p-6 rounded-[2rem] border border-white/5"><p className="text-[9px] font-bold text-gray-500 uppercase mb-1">Total</p><div className="text-3xl font-black flex gap-3"><span>₹</span><input type="number" placeholder="0" value={f.amount} onChange={e => setF({...f, amount: e.target.value})} className="bg-transparent w-full outline-none" /></div></div>
        <div className="bg-[#1C1C1E] p-5 rounded-2xl border border-white/5"><p className="text-[9px] font-bold text-gray-500 uppercase mb-1">Date</p><input type="date" value={f.date} onChange={e => setF({...f, date: e.target.value})} className="bg-transparent w-full text-white font-bold outline-none [color-scheme:dark]" /></div>
        <div onClick={() => setPk(true)} className="bg-[#1C1C1E] p-5 rounded-2xl border border-white/5 flex justify-between items-center"><div><p className="text-[9px] font-bold text-gray-500 uppercase mb-1">Target</p><p className="text-base font-bold">{f.cat_name}{f.sub_name && ` • ${f.sub_name}`}</p></div><IconChevron /></div>
        <div className="bg-[#1C1C1E] p-5 rounded-2xl border border-white/5 flex justify-between items-center"><div><p className="text-[9px] font-bold text-gray-500 uppercase mb-1">Wallet</p><select value={f.acc_id} onChange={e => setF({...f, acc_id: e.target.value})} className="bg-transparent text-base text-white font-bold outline-none w-full appearance-none">{accs.map((a:any) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div><IconChevron /></div>
        <div className="bg-[#1C1C1E] p-5 rounded-2xl border border-white/5"><p className="text-[9px] font-bold text-gray-500 uppercase mb-1">Note</p><input placeholder="Notes..." value={f.note} onChange={e => setF({...f, note: e.target.value})} className="bg-transparent w-full text-white font-medium outline-none" /></div>
      </div>
      <div className="pb-6 pt-4"><button onClick={() => onSave({ ...f, amount: parseFloat(f.amount)||0 })} className="w-full py-5 bg-[#5D5FEF] rounded-2xl font-bold text-xl shadow-2xl active:scale-95 transition-all">Confirm Payment</button></div>
    </div>
  );
}

function HistoryView({ tx, cats, onBack }: any) {
  return (
    <div className="p-4 pt-10 space-y-4 h-screen overflow-y-auto pb-40 no-scrollbar">
      <div className="flex justify-between items-center font-bold text-2xl px-1"><h3>History</h3><button onClick={onBack} className="p-2 bg-[#1C1C1E] rounded-full text-gray-500"><IconX /></button></div>
      {tx.map((t: any) => (
        <div key={t.id} className="bg-[#121212] p-5 rounded-[2rem] border border-white/5 flex justify-between items-center shadow-md">
           <div><p className="font-bold text-sm leading-tight">{t.cat_name}</p><p className="text-[9px] text-gray-500 font-bold uppercase mt-1">{t.sub_name} • {t.date}</p></div>
           <p className="font-bold text-red-400 text-sm">-{fmt(t.amount)}</p>
        </div>
      ))}
    </div>
  );
}

function AccountsView({ accs, onBack, onEdit, onAdd }: any) {
  return (
    <div className="p-4 space-y-6 h-screen overflow-y-auto pb-40 no-scrollbar">
      <div className="flex justify-between items-center font-bold text-2xl px-1"><h3>Wallets</h3><button onClick={onBack} className="p-2 bg-[#1C1C1E] rounded-full text-gray-500"><IconX /></button></div>
      <div className="space-y-3">
        {accs.map((acc: any) => (
          <button key={acc.id} onClick={() => onEdit(acc.id)} className="w-full bg-[#121212] p-5 rounded-[2rem] border border-white/5 flex justify-between items-center shadow-lg active:bg-white/5 transition-colors">
             <div className="flex items-center gap-4 text-left"><div className="w-11 h-11 bg-white/5 rounded-xl flex items-center justify-center text-lg shadow-inner">🏦</div><div><p className="font-bold text-base leading-none">{acc.name}</p><p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1.5">Balance</p></div></div>
             <p className={`text-lg font-bold ${acc.type==='Loan'?'text-red-400':'text-white'}`}>{fmt(acc.balance)}</p>
          </button>
        ))}
        <button onClick={onAdd} className="w-full py-5 border-dashed border-2 border-white/10 rounded-[2.2rem] text-gray-700 font-bold uppercase text-[9px] tracking-widest">+ NEW WALLET</button>
      </div>
    </div>
  );
}

function EditCategoryView({ cat, onBack, onUpdate, onDelete }: any) {
  const [n, setN] = useState(cat?.name || ''); const [b, setB] = useState(cat?.budget || 0); const [s, setS] = useState('');
  const handleAdd = () => { if (!s.trim()) return; (document.activeElement as HTMLElement)?.blur(); onUpdate(cat.id, { subs: [...(cat.subs||[]), s] }); setS(''); };
  return (
    <div className="p-6 space-y-6 h-screen overflow-y-auto pb-40">
      <div className="flex justify-between items-center font-bold text-xl px-1"><h2>Category Adjust</h2><button onClick={onBack} className="p-2 bg-[#1C1C1E] rounded-full text-gray-500"><IconX /></button></div>
      <div className="bg-[#1C1C1E] p-6 rounded-3xl border border-white/5 space-y-1"><p className="text-[9px] font-bold text-gray-500 uppercase">Label</p><input className="bg-transparent w-full font-bold text-lg outline-none" value={n} onChange={e => setN(e.target.value)} /></div>
      <div className="bg-[#1C1C1E] p-6 rounded-3xl border border-white/5 space-y-1"><p className="text-[9px] font-bold text-gray-500 uppercase">Limit</p><input type="number" className="bg-transparent w-full font-bold text-lg text-emerald-400 outline-none" value={b} onChange={e => setB(Number(e.target.value))} /></div>
      <div className="space-y-3"><p className="text-[9px] font-bold text-gray-500 uppercase px-1">Subcategories</p>
        <div className="space-y-2">{cat?.subs?.map((si: any, i: any) => (<div key={i} className="bg-[#121212] p-4 rounded-2xl flex justify-between items-center border border-white/5 text-sm font-bold shadow-sm">{si} <button onClick={() => onUpdate(cat.id, { subs: cat.subs.filter((_:any, idx:any) => idx !== i) })}><IconTrash /></button></div>))}</div>
        <div className="flex gap-2 bg-[#1C1C1E] p-2 rounded-2xl"><input className="flex-1 bg-transparent p-3 outline-none font-bold text-sm" placeholder="Add..." value={s} onChange={e => setS(e.target.value)} /><button onClick={handleAdd} className="w-10 h-10 bg-[#5D5FEF] rounded-xl flex items-center justify-center active:scale-90 transition-all"><IconPlus /></button></div>
      </div>
      <div className="flex flex-col gap-3">
        <button onClick={() => { onUpdate(cat.id, { name: n, budget: Number(b) }); onBack(); }} className="w-full py-5 bg-[#5D5FEF] rounded-3xl font-black text-xl shadow-xl">Apply Changes</button>
        <button onClick={() => onDelete(cat.id)} className="w-full py-3 text-red-500/40 text-[9px] font-black uppercase tracking-widest bg-red-500/5 rounded-xl border border-red-500/10">Remove Category</button>
      </div>
    </div>
  );
}

function EditAccountView({ acc, onBack, onSave }: any) {
  const [n, setN] = useState(acc?.name || ''); const [b, setB] = useState(acc?.balance || 0);
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center font-bold px-1"><h2>Source Adjust</h2><button onClick={onBack} className="p-2 bg-[#1C1C1E] rounded-full text-gray-500"><IconX /></button></div>
      <div className="bg-[#1C1C1E] p-6 rounded-3xl border border-white/5 space-y-2"><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Name</p><input className="bg-transparent w-full font-bold text-xl outline-none" value={n} onChange={e => setN(e.target.value)} /></div>
      <div className="bg-[#1C1C1E] p-6 rounded-3xl border border-white/5 space-y-2"><p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Balance</p><input type="number" className="bg-transparent w-full font-bold text-xl outline-none text-emerald-400" value={b} onChange={e => setB(Number(e.target.value))} /></div>
      <button onClick={() => onSave(acc.id, n, b)} className="w-full py-5 bg-[#5D5FEF] rounded-3xl font-black text-xl shadow-xl active:scale-95 transition-all">Update Balance</button>
    </div>
  );
}

function NavBtn({ label, icon, active, onClick }: any) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-[#5D5FEF]' : 'text-gray-600'}`}>
      <div className={`${active ? 'scale-110 opacity-100' : 'scale-100 opacity-60'} mb-0.5`}>{icon}</div>
      <span className="text-[8px] font-black uppercase tracking-tight leading-none">{label}</span>
    </button>
  );
}