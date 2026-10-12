import { useState, useMemo, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- TYPES FOR VERCEL ---
interface Account { id: string; name: string; balance: number; type: string; }
interface Category { id: string; name: string; icon: string; budget: number; subs: string[]; }
interface Transaction { id: string; amount: number; note: string; cat_id: string; cat_name: string; sub_name: string; acc_id: string; date: string; created_at?: string; }

// --- CLOUD CONFIG ---
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ckydqqbsnoafylzurkoi.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Q0chi7DtM53u-Ah4Ddm9nA_ilok1k98'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- STYLING CONSTANTS ---
const fmt = (v: number) => '₹' + Math.round(v || 0).toLocaleString('en-IN');
const PETAL_COLORS = ['bg-indigo-500', 'bg-pink-500', 'bg-amber-500', 'bg-emerald-500', 'bg-sky-500'];
const CHART_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#0ea5e9'];

// --- SVG ICONS ---
const IconPlus = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const IconChevron = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"></path></svg>;
const IconX = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const IconBell = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"></path></svg>;
const IconLogout = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>;
const IconEye = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const IconSearch = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const IconTrash = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EB5757" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;

// --- SHARED ROW COMPONENT ---
function TxRow({ t, catName, i, onClick }: {t: Transaction, catName: string, i: number, onClick: (t: Transaction) => void}) {
  const color = PETAL_COLORS[i % PETAL_COLORS.length];
  return (
    <button onClick={() => onClick(t)} className="w-full bg-[#121212] p-5 rounded-[2rem] border border-white/5 flex justify-between items-center shadow-sm active:scale-[0.98] transition-all">
      <div className="flex items-center gap-4 text-left text-white">
        <div className={`w-11 h-11 ${color} rounded-full flex items-center justify-center font-black text-white/90 text-sm shadow-md`}>
          {catName?.charAt(0).toUpperCase() || '?'}
        </div>
        <div>
          <p className="font-bold text-sm text-white">{catName}</p>
          <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-0.5 truncate max-w-[150px]">
            {t.sub_name ? `${t.sub_name} • ` : ''}{t.note || t.date}
          </p>
        </div>
      </div>
      <p className="font-black text-red-400 text-sm">-{fmt(t.amount)}</p>
    </button>
  );
}

// --- MAIN APP ---
export default function App() {
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState('home');
  const [selId, setSelId] = useState<string | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [data, setData] = useState({ acc: [] as Account[], cat: [] as Category[], tx: [] as Transaction[] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  const fetchAll = async () => {
    if (!session) return;
    setLoading(true);
    const [a, c, t] = await Promise.all([
      supabase.from('accounts').select('*').order('name'),
      supabase.from('categories').select('*').order('name'),
      supabase.from('transactions').select('*').order('date', { ascending: false }).order('created_at', { ascending: false })
    ]);
    setData({ acc: a.data || [], cat: c.data || [], tx: t.data || [] });
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [session]);

  const handleSaveTx = async (tx: any) => {
    if (editingTx) {
      const diff = tx.amount - editingTx.amount;
      await supabase.from('transactions').update(tx).eq('id', editingTx.id);
      const acc = data.acc.find(a => a.id === tx.acc_id);
      if(acc) await supabase.from('accounts').update({ balance: acc.balance - diff }).eq('id', tx.acc_id);
      setEditingTx(null);
    } else {
      await supabase.from('transactions').insert([{ ...tx, user_id: session.user.id }]);
      const acc = data.acc.find(a => a.id === tx.acc_id);
      if(acc) await supabase.from('accounts').update({ balance: acc.balance - tx.amount }).eq('id', tx.acc_id);
    }
    fetchAll(); setView('home');
  };

  const handleDeleteTx = async (tx: Transaction) => {
    if(!confirm("Delete this transaction?")) return;
    await supabase.from('transactions').delete().eq('id', tx.id);
    const acc = data.acc.find(a => a.id === tx.acc_id);
    if(acc) await supabase.from('accounts').update({ balance: acc.balance + tx.amount }).eq('id', tx.acc_id);
    setEditingTx(null); fetchAll(); setView('home');
  };

  const totals = useMemo(() => ({
    budget: data.cat.reduce((s, c) => s + Number(c.budget), 0),
    spent: data.tx.reduce((s, t) => s + Number(t.amount), 0),
    assets: data.acc.reduce((s, a) => s + Number(a.balance), 0)
  }), [data]);

  const onEditTx = (tx: Transaction) => { setEditingTx(tx); setView('new-tx'); };

  if (!session) return <LoginView onLogin={async (email: string, pass: string) => { await supabase.auth.signInWithPassword({ email, password: pass }); }} />;
  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-indigo-400 font-bold uppercase text-[10px] tracking-[0.3em]">Syncing...</div>;

  return (
    <div className="min-h-screen bg-black text-white font-sans flex justify-center selection:bg-indigo-500/20">
      <div className="w-full max-w-lg md:max-w-xl bg-black min-h-screen relative border-x border-white/5 pb-32 shadow-2xl">
        
        {view === 'home' && <HomeView totals={totals} tx={data.tx} onNew={() => { setEditingTx(null); setView('new-tx'); }} onLogout={() => supabase.auth.signOut()} onEditTx={onEditTx} />}
        {view === 'history' && <HistoryView tx={data.tx} onBack={() => setView('home')} onEditTx={onEditTx} />}
        {view === 'categories' && <CategoryListView cats={data.cat} tx={data.tx} onBack={() => setView('home')} onDetail={(id: string)=>{setSelId(id); setView('cat-detail');}} onAdd={async ()=>{const {data:n}=await supabase.from('categories').insert([{name:'New', budget:0, subs:[], user_id:session.user.id}]).select(); if(n) { setSelId(n[0].id); fetchAll(); setView('edit-cat'); }}} />}
        {view === 'cat-detail' && <CategoryDetailView cat={data.cat.find(c=>c.id===selId)} tx={data.tx.filter(t=>t.cat_id===selId)} onBack={()=>setView('categories')} onEdit={()=>setView('edit-cat')} onEditTx={onEditTx} />}
        {view === 'accounts' && <AccountsView accs={data.acc} onBack={()=>setView('home')} onEdit={(id: string)=>{setSelId(id); setView('edit-acc');}} onAdd={async ()=>{await supabase.from('accounts').insert([{name:'New Wallet', balance:0, type:'Bank', user_id:session.user.id}]); fetchAll();}} />}
        
        {view === 'edit-cat' && <EditCategoryView cat={data.cat.find(c=>c.id===selId)} onBack={()=>setView('cat-detail')} onUpdate={async (id: string,p: any)=>{await supabase.from('categories').update(p).eq('id',id); fetchAll();}} onDelete={async (id: string)=>{if(confirm("Delete?")){await supabase.from('categories').delete().eq('id',id); fetchAll(); setView('categories');}}} />}
        {view === 'edit-acc' && <EditAccountView acc={data.acc.find(a=>a.id===selId)} onBack={()=>setView('accounts')} onSave={async (id: string,n: string,b: number)=>{await supabase.from('accounts').update({name:n, balance:b}).eq('id',id); fetchAll(); setView('accounts');}} />}
        {view === 'new-tx' && <NewTransactionView cats={data.cat} accs={data.acc} editingTx={editingTx} onClose={()=>setView('home')} onSave={handleSaveTx} onDelete={handleDeleteTx} />}

        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg md:max-w-xl bg-black/95 border-t border-white/5 py-5 flex justify-around items-center z-50 backdrop-blur-xl">
          <NavBtn label="Home" icon="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" active={view==='home'} onClick={() => setView('home')} />
          <NavBtn label="History" icon="M12 8v4l3 3 M12 2a10 10 0 1 0 10 10" active={view==='history'} onClick={() => setView('history')} />
          <NavBtn label="Categories" icon="M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z" active={view.includes('cat')} onClick={() => setView('categories')} />
          <NavBtn label="Accounts" icon="M2 4h20v16H2z M2 9.5h20" active={view.includes('acc')} onClick={() => setView('accounts')} />
        </nav>
      </div>
    </div>
  );
}

// --- VIEWS ---

function LoginView({ onLogin }: {onLogin: (e: string, p: string) => void}) {
  const [e, setE] = useState(''); const [p, setP] = useState('');
  return (
    <div className="min-h-screen bg-black flex flex-col justify-center p-10 space-y-10">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center text-white text-3xl font-black mb-4">S</div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Welcome back</h1>
        <p className="text-white/30 font-bold text-xs uppercase tracking-[0.25em]">Sign in to sync your build</p>
      </div>
      <div className="space-y-4">
        <input placeholder="Email" value={e} onChange={v => setE(v.target.value)} className="w-full bg-[#1C1C1E] p-5 rounded-2xl outline-none text-white font-bold border border-white/5" />
        <input type="password" placeholder="Password" value={p} onChange={v => setP(v.target.value)} className="w-full bg-[#1C1C1E] p-5 rounded-2xl outline-none text-white font-bold border border-white/5" />
        <button onClick={() => onLogin(e,p)} className="w-full py-5 bg-[#5D5FEF] rounded-2xl font-black text-xl shadow-xl">Login</button>
      </div>
    </div>
  );
}

function HomeView({ totals, tx, onNew, onLogout, onEditTx }: any) {
  return (
    <div className="p-5 space-y-6 h-screen overflow-y-auto no-scrollbar pb-40">
      <div className="flex justify-between items-center py-2 text-left">
        <div className="flex items-center gap-3 text-white">
          <div className="w-11 h-11 rounded-full border border-white/10 bg-gray-900 flex items-center justify-center font-bold text-gray-500">S</div>
          <div><p className="text-[10px] text-white/30 font-bold uppercase tracking-widest leading-none">Assalamualaikum,</p><h2 className="text-lg font-bold text-white mt-1">Shaik</h2></div>
        </div>
        <div className="flex gap-2">
          <div className="p-2 text-white/30"><IconBell /></div>
          <button onClick={onLogout} className="p-2 text-white/30 hover:text-white"><IconLogout /></button>
        </div>
      </div>
      <div className="relative overflow-hidden rounded-[2.5rem] p-8 bg-[#5D5FEF] shadow-2xl shadow-indigo-500/30" style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 15px, rgba(255,255,255,0.04) 15px, rgba(255,255,255,0.04) 16px)' }}>
        <div className="relative z-10 space-y-7 text-left text-white">
          <div className="flex justify-between items-center text-white/80 font-bold text-[11px] uppercase tracking-widest"><span>Overall Budget</span><IconEye /></div>
          <h3 className="text-4xl font-black tracking-tighter text-white">{fmt(totals.budget)}</h3>
          <div className="pt-5 border-t border-white/10 space-y-4">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest"><span className="text-white/60">Spent</span><span>{fmt(totals.spent)}</span></div>
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest"><span className="text-white/60">Amount Left</span><span className="text-emerald-300 font-black">{fmt(totals.budget - totals.spent)}</span></div>
          </div>
        </div>
      </div>
      <div className="space-y-4 px-1 text-left text-white"><h4 className="font-bold text-base">Recent Spends</h4>
        {tx.slice(0, 5).map((t: any, i: number) => <TxRow key={t.id} t={t} catName={t.cat_name} i={i} onClick={onEditTx} />)}
      </div>
      <button onClick={onNew} className="fixed bottom-28 right-6 w-14 h-14 bg-[#5D5FEF] rounded-2xl shadow-2xl flex items-center justify-center z-40 active:scale-95 transition-all"><IconPlus /></button>
    </div>
  );
}

function HistoryView({ tx, onBack, onEditTx }: any) {
  const [q, setQ] = useState('');
  const filtered = tx.filter((t:any) => t.cat_name?.toLowerCase().includes(q.toLowerCase()) || t.sub_name?.toLowerCase().includes(q.toLowerCase()) || t.note?.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="p-5 space-y-6 h-screen overflow-y-auto pb-40 no-scrollbar text-white">
      <div className="flex justify-between items-center px-1 font-bold text-2xl tracking-tight text-left text-white"><h2>History</h2><button onClick={onBack} className="p-2 bg-[#1C1C1E] rounded-full text-white/50"><IconX /></button></div>
      <div className="bg-[#1C1C1E] p-4 rounded-2xl border border-white/5 flex items-center gap-3">
        <div className="text-white/20"><IconSearch /></div>
        <input placeholder="Search transactions..." className="bg-transparent outline-none flex-1 font-bold text-sm text-white placeholder:text-white/20" value={q} onChange={e => setQ(e.target.value)} />
      </div>
      <div className="space-y-4 pt-2">
        {filtered.map((t: any, i: number) => <TxRow key={t.id} t={t} catName={t.cat_name} i={i} onClick={onEditTx} />)}
      </div>
    </div>
  );
}

function CategoryDetailView({ cat, tx, onBack, onEdit, onEditTx }: any) {
  const sorted = [...tx].sort((a:any, b:any) => b.date.localeCompare(a.date));
  return (
    <div className="p-5 space-y-6 h-screen overflow-y-auto pb-40 no-scrollbar text-white">
      <div className="flex justify-between items-center py-2 text-left text-white"><button onClick={onBack} className="p-2 bg-[#1C1C1E] rounded-full text-white/50"><IconChevron /></button><h2 className="text-xl font-bold tracking-tight">{cat?.name}</h2><button onClick={onEdit} className="text-[#5D5FEF] font-bold text-[10px] uppercase tracking-widest">Settings</button></div>
      <div className="bg-[#1C1C1E] p-8 rounded-[2.5rem] border border-white/5 flex justify-between items-end shadow-xl">
        <div className="text-left"><p className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-1 text-left">Spent</p><h3 className="text-3xl font-black text-red-400 tracking-tight text-left">{fmt(tx.reduce((s:any,t:any)=>s+Number(t.amount),0))}</h3></div>
        <div className="text-right"><p className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-1 text-right">Limit</p><p className="text-xl font-bold text-white text-right">{fmt(cat?.budget)}</p></div>
      </div>
      <div className="space-y-3 text-left">{sorted.map((t: any, i: number) => <TxRow key={t.id} t={t} catName={cat?.name} i={i} onClick={onEditTx} />)}</div>
    </div>
  );
}

function CategoryListView({ cats, tx, onBack, onDetail, onAdd }: any) {
  return (
    <div className="p-5 space-y-7 h-screen overflow-y-auto pb-40 no-scrollbar text-white text-left">
      <div className="flex justify-between items-center px-1 font-bold text-2xl tracking-tight text-left text-white"><h2>Categories</h2><button onClick={onBack} className="p-2 bg-[#1C1C1E] rounded-full text-white/50"><IconX /></button></div>
      <div className="space-y-4 text-left">
        {cats.map((c: any) => {
          const s = tx.filter((t:any) => t.cat_id === c.id).reduce((sum:any,t:any) => sum + Number(t.amount), 0);
          return (
            <button key={c.id} onClick={() => onDetail(c.id)} className="w-full bg-[#121212] p-6 rounded-[2.2rem] border border-white/5 space-y-5 text-left shadow-lg active:scale-[0.98] transition-all">
              <div className="flex justify-between items-center"><div className="flex items-center gap-4 text-left"><span className="text-2xl">{c.icon}</span><p className="font-bold text-lg text-white">{c.name}</p></div><div className="flex items-center gap-2 text-white"><span className="w-6 h-6 bg-white/5 rounded-full flex items-center justify-center text-[10px] font-black text-indigo-400">{c.subs?.length || 0}</span><IconChevron /></div></div>
              <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] pt-5 border-t border-white/5">
                <div className="space-y-1"><p className="text-white/30 text-left">Budget</p><p className="text-white text-left">{fmt(c.budget)}</p></div>
                <div className="space-y-1 text-center"><p className="text-white/30 text-center">Spent</p><p className="text-red-400 text-center">{fmt(s)}</p></div>
                <div className="space-y-1 text-right"><p className="text-white/30 text-right">Left</p><p className="text-emerald-400 text-right">{fmt(c.budget-s)}</p></div>
              </div>
            </button>
          );
        })}
        <button onClick={onAdd} className="w-full py-6 border-dashed border-2 border-white/10 rounded-[2.5rem] text-white/30 font-black tracking-widest text-xs uppercase">+ NEW CATEGORY</button>
      </div>
    </div>
  );
}

function NewTransactionView({ cats, accs, editingTx, onClose, onSave, onDelete }: any) {
  const [pk, setPk] = useState(false);
  const [f, setF] = useState({ 
    amount: editingTx?.amount || '', 
    note: editingTx?.note || '', 
    cat_name: editingTx?.cat_name || 'Select Category', 
    cat_id: editingTx?.cat_id || '', 
    sub_name: editingTx?.sub_name || '', 
    acc_id: editingTx?.acc_id || accs[0]?.id || '', 
    date: editingTx?.date || new Date().toISOString().split('T')[0] 
  });

  const handleSave = () => {
     if(!f.amount || f.cat_name === 'Select Category') return;
     onSave({...f, amount: parseFloat(f.amount as any)});
  };

  if (pk) return (
    <div className="p-6 h-screen bg-black overflow-y-auto pb-32 no-scrollbar text-white">
      <div className="flex justify-between items-center mb-10 pt-4"><h3 className="text-xs font-black uppercase text-white/30 tracking-[0.3em] mx-auto text-center">Categorization</h3><button onClick={() => setPk(false)} className="p-2 absolute right-6 text-white"><IconX /></button></div>
      {cats.map((cat: any) => (
        <div key={cat.id} className="mb-8 px-2 text-left">
          <button onClick={() => { setF({...f, cat_name: cat.name, cat_id: cat.id, sub_name: ''}); setPk(false); }} className="w-full text-left font-bold text-lg p-5 bg-[#121212] border border-white/5 rounded-2xl flex items-center justify-between shadow-sm text-white"><span>{cat.icon} {cat.name}</span><span className="text-[10px] font-black bg-indigo-500/20 text-indigo-400 px-4 py-1.5 rounded-full uppercase">Select</span></button>
          <div className="ml-12 mt-5 space-y-6">
            {cat.subs?.map((s: any, i: any) => (<button key={i} onClick={() => { setF({...f, cat_name: cat.name, cat_id: cat.id, sub_name: s}); setPk(false); }} className="w-full text-left text-white/40 font-bold text-base flex items-center gap-3 leading-none"> <div className="w-1.5 h-1.5 bg-white/10 rounded-full"></div> {s}</button>))}
          </div>
        </div>
      ))}
    </div>
  );
  return (
    <div className="flex flex-col h-screen bg-black p-6 relative text-white">
      <div className="flex justify-between items-center mb-6 px-1 text-left text-white"><h3 className="text-2xl font-bold">{editingTx ? 'Edit Payment' : 'New Payment'}</h3><button onClick={onClose} className="p-2 bg-[#1C1C1E] rounded-full text-white/50"><IconX /></button></div>
      <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar pb-32 text-left">
        <div className="bg-[#1C1C1E] p-8 rounded-[2.5rem] border border-white/5 shadow-inner"><p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2 text-left">Value</p><div className="text-4xl font-black flex gap-3 text-white tracking-tighter"><span>₹</span><input type="number" placeholder="0" value={f.amount} onChange={e => setF({...f, amount: e.target.value})} className="bg-transparent w-full outline-none text-white" /></div></div>
        <div className="bg-[#1C1C1E] p-5 rounded-2xl border border-white/5 shadow-sm"><p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 text-left">When?</p><input type="date" value={f.date} onChange={e => setF({...f, date: e.target.value})} className="bg-transparent w-full text-white font-bold outline-none [color-scheme:dark]" /></div>
        <div onClick={() => setPk(true)} className="bg-[#1C1C1E] p-5 rounded-2xl border border-white/5 flex justify-between items-center shadow-sm"><div><p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1 text-left">Target</p><p className="text-base font-bold text-white">{f.cat_name}{f.sub_name && ` • ${f.sub_name}`}</p></div><IconChevron /></div>
        <div className="bg-[#1C1C1E] p-5 rounded-2xl border border-white/5 flex justify-between items-center shadow-sm"><div><p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1 text-left">Source</p><select value={f.acc_id} onChange={e => setF({...f, acc_id: e.target.value})} className="bg-transparent text-base text-white font-bold outline-none w-full appearance-none">{accs.map((a:any) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div><IconChevron /></div>
        <div className="bg-[#1C1C1E] p-5 rounded-2xl border border-white/5 shadow-sm"><p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1.5 text-left">Notes</p><input placeholder="What for?" value={f.note} onChange={e => setF({...f, note: e.target.value})} className="bg-transparent w-full text-white font-medium outline-none" /></div>
        
        {editingTx && (
          <button onClick={() => onDelete(editingTx)} className="w-full py-4 text-red-500 bg-red-500/5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border border-red-500/10"> <IconTrash /> Delete Transaction</button>
        )}
      </div>
      <div className="absolute bottom-10 inset-x-6"><button onClick={handleSave} className="w-full py-5 bg-[#5D5FEF] rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-all text-white">{editingTx ? 'Update Payment' : 'Confirm Payment'}</button></div>
    </div>
  );
}

function AccountsView({ accs, onBack, onEdit, onAdd }: any) {
  const total = accs.reduce((s:number, a:any) => s + Number(a.balance), 0);
  return (
    <div className="p-5 space-y-7 h-screen overflow-y-auto pb-40 no-scrollbar text-white text-left">
      <div className="flex justify-between items-center px-1 font-bold text-2xl tracking-tight text-left text-white"><h2>My Wallets</h2><button onClick={onBack} className="p-2 bg-[#1C1C1E] rounded-full text-white/50"><IconX /></button></div>
      <div className="bg-[#1C1C1E] p-8 rounded-[2.5rem] border border-white/5 text-center shadow-xl">
        <p className="text-[11px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2 text-center">Total Net Balance</p>
        <h3 className="text-4xl font-black text-white tracking-tighter text-center">{fmt(total)}</h3>
        <div className="mt-8 space-y-4 px-2 text-left">
           {accs.map((acc:any, i:number) => (
             <div key={acc.id} className="space-y-1.5 text-left text-white">
                <div className="flex justify-between text-[9px] font-bold uppercase text-white/50 tracking-widest"><span>{acc.name}</span><span>{Math.round((acc.balance/total)*100) || 0}%</span></div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${(acc.balance/total)*100}%`, backgroundColor: CHART_COLORS[i % 5] }}></div>
                </div>
             </div>
           ))}
        </div>
      </div>
      <div className="space-y-3">
        {accs.map((acc:any) => (
          <button key={acc.id} onClick={() => onEdit(acc.id)} className="w-full bg-[#121212] p-6 rounded-[2rem] border border-white/5 flex justify-between items-center shadow-lg active:scale-[0.98] transition-all text-white">
             <div className="flex items-center gap-4 text-left text-white"><div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-xl shadow-inner">🏦</div><div><p className="font-bold text-base text-white leading-none">{acc.name}</p><p className="text-[9px] text-white/40 font-bold uppercase mt-2 tracking-widest text-left">Adjust Source</p></div></div>
             <p className={`text-xl font-black ${acc.type==='Loan'?'text-red-400':'text-white'}`}>{fmt(acc.balance)}</p>
          </button>
        ))}
        <button onClick={onAdd} className="w-full py-6 border-dashed border-2 border-white/10 rounded-[2.5rem] text-white/30 font-black tracking-widest text-xs uppercase">+ NEW WALLET</button>
      </div>
    </div>
  );
}

function EditCategoryView({ cat, onBack, onUpdate, onDelete }: any) {
  const [n, setN] = useState(cat?.name || ''); const [b, setB] = useState(cat?.budget || 0); const [s, setS] = useState('');
  const handleAdd = () => {
     if (!s.trim()) return;
     const el = document.activeElement as HTMLElement;
     if (el) el.blur();
     onUpdate(cat.id, { subs: [...(cat.subs||[]), s] });
     setS(''); 
  };
  return (
    <div className="p-6 space-y-6 h-screen overflow-y-auto pb-40 no-scrollbar text-left text-white">
      <div className="flex justify-between items-center font-bold text-xl px-1 tracking-tight text-white"><h2>Adjust Detail</h2><button onClick={onBack} className="p-2 bg-[#1C1C1E] rounded-full text-white/50"><IconX /></button></div>
      <div className="bg-[#1C1C1E] p-6 rounded-3xl border border-white/5 space-y-1 text-left text-white"><p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-none mb-1 text-left">Label</p><input className="bg-transparent w-full font-bold text-lg outline-none text-white" value={n} onChange={e => setN(e.target.value)} /></div>
      <div className="bg-[#1C1C1E] p-6 rounded-3xl border border-white/5 space-y-1 text-left text-white"><p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-none mb-1 text-left">Limit</p><input type="number" className="bg-transparent w-full font-bold text-lg text-emerald-400 outline-none" value={b} onChange={e => setB(Number(e.target.value))} /></div>
      <div className="space-y-3 px-1 text-left"><p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Subcategories</p>
        <div className="space-y-2 text-left text-white">{cat?.subs?.map((si: any, i: any) => (<div key={i} className="bg-[#121212] p-4 rounded-2xl flex justify-between items-center border border-white/5 text-sm font-bold shadow-sm">{si} <button onClick={() => onUpdate(cat.id, { subs: cat.subs.filter((_:any, idx:any) => idx !== i) })} className="p-1"><IconTrash /></button></div>))}</div>
        <div className="flex gap-2 bg-[#1C1C1E] p-2 rounded-2xl border border-white/5"><input className="flex-1 bg-transparent p-3 outline-none font-bold text-sm text-white" placeholder="Add..." value={s} onChange={e => setS(e.target.value)} /><button onClick={handleAdd} className="w-11 h-11 bg-[#5D5FEF] rounded-xl flex items-center justify-center active:scale-90 transition-all text-white"><IconPlus /></button></div>
      </div>
      <div className="flex flex-col gap-3">
        <button onClick={() => { onUpdate(cat.id, { name: n, budget: Number(b) }); onBack(); }} className="w-full py-5 bg-[#5D5FEF] rounded-[2rem] font-black text-xl shadow-xl text-white">Apply changes</button>
        <button onClick={() => onDelete(cat.id)} className="w-full py-3 text-red-500/40 text-[9px] font-black uppercase tracking-widest bg-red-500/5 rounded-2xl border border-red-500/10 flex items-center justify-center gap-2 text-red-500"> <IconTrash /> Remove Category</button>
      </div>
    </div>
  );
}

function EditAccountView({ acc, onBack, onSave }: any) {
  const [n, setN] = useState(acc?.name || ''); const [b, setB] = useState(acc?.balance || 0);
  return (
    <div className="p-6 space-y-6 text-left text-white">
      <div className="flex justify-between items-center font-bold px-1 tracking-tight text-left text-white"><h2>Source Adjust</h2><button onClick={onBack} className="p-2 bg-[#1C1C1E] rounded-full text-white/50"><IconX /></button></div>
      <div className="bg-[#1C1C1E] p-7 rounded-[2.5rem] border border-white/5 space-y-2 text-left text-white"><p className="text-[10px] font-bold text-white/30 uppercase tracking-widest text-left">Name</p><input className="bg-transparent w-full font-bold text-xl outline-none text-white" value={n} onChange={e => setN(e.target.value)} /></div>
      <div className="bg-[#1C1C1E] p-7 rounded-[2.5rem] border border-white/5 space-y-2 text-left text-white"><p className="text-[10px] font-bold text-white/30 uppercase tracking-widest text-left">Balance</p><input type="number" className="bg-transparent w-full font-bold text-xl outline-none text-emerald-400" value={b} onChange={e => setB(Number(e.target.value))} /></div>
      <button onClick={() => onSave(acc.id, n, b)} className="w-full py-5 bg-[#5D5FEF] rounded-[2.5rem] font-black text-xl shadow-xl active:scale-95 transition-all text-white">Confirm Update</button>
    </div>
  );
}

function NavBtn({ label, icon, active, onClick }: {label: string, icon: string, active: boolean, onClick: () => void}) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-all ${active ? 'text-[#5D5FEF]' : 'text-white/20'}`}>
      <div className={`${active ? 'scale-110 opacity-100' : 'scale-100 opacity-60'} mb-0.5`}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={icon}/></svg></div>
      <span className="text-[9px] font-black uppercase tracking-tight leading-none">{label}</span>
    </button>
  );
}