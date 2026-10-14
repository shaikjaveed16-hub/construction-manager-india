import { useState, useMemo, useEffect, Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- INTERFACES (Vercel Build Safety) ---
interface Account { id: string; name: string; balance: number; type: string; }
interface Category { id: string; name: string; icon: string; budget: number; subs: string[]; }
interface Transaction { id: string; amount: number; note: string; cat_id: string; cat_name: string; sub_name: string; acc_id: string; date: string; created_at?: string; }

// --- CLOUD CONFIG ---
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ckydqqbsnoafylzurkoi.supabase.co';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Q0chi7DtM53u-Ah4Ddm9nA_ilok1k98'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- CONSTANTS ---
const fmt = (v: number) => '₹' + Math.round(v || 0).toLocaleString('en-IN');
const PETAL_COLORS = ['bg-indigo-500', 'bg-pink-500', 'bg-amber-500', 'bg-emerald-500', 'bg-sky-500'];

// --- SVG ICONS ---
const IconPlus = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const IconChevron = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"></path></svg>;
const IconX = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
const IconBell = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"></path></svg>;
const IconLogout = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>;
const IconSun = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>;
const IconMoon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>;
const IconSearch = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const IconEye = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
const IconTrash = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EB5757" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;

// --- SHARED COMPONENT: TRANSACTION ROW ---
function TxRow({ t, catName, i, onClick, isDark }: {t: Transaction, catName: string, i: number, onClick: (t: Transaction) => void, isDark: boolean}) {
  const color = PETAL_COLORS[i % PETAL_COLORS.length];
  return (
    <button onClick={() => onClick(t)} className={`w-full ${isDark ? 'bg-[#121212] border-white/5 shadow-black' : 'bg-white border-gray-100 shadow-sm'} p-4 rounded-[1.5rem] border flex justify-between items-center active:scale-[0.98] transition-all`}>
      <div className="flex items-center gap-4 text-left">
        <div className={`w-10 h-10 ${color} rounded-full flex items-center justify-center font-black text-white text-sm shadow-md`}>
          {catName?.charAt(0).toUpperCase() || '?'}
        </div>
        <div className="text-left">
          <p className={`font-bold text-sm leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{catName}</p>
          <p className={`text-xs font-bold uppercase tracking-widest mt-1 truncate max-w-[150px] ${isDark ? 'text-white/30' : 'text-gray-400'}`}>
            {t.sub_name ? `${t.sub_name} • ` : ''}{t.note || t.date}
          </p>
        </div>
      </div>
      <p className="font-extrabold text-red-500 text-sm">-{fmt(t.amount)}</p>
    </button>
  );
}

// --- MAIN APP COMPONENT ---
export default function App() {
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState('home');
  const [selId, setSelId] = useState<string | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [data, setData] = useState({ acc: [] as Account[], cat: [] as Category[], tx: [] as Transaction[] });
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('sh_theme') !== 'light');

  useEffect(() => { localStorage.setItem('sh_theme', isDark ? 'dark' : 'light'); }, [isDark]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => { setSession(s); if(!s) setLoading(false); });
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
    setData({ acc: (a.data as Account[]) || [], cat: (c.data as Category[]) || [], tx: (t.data as Transaction[]) || [] });
    setLoading(false);
  };

  useEffect(() => { if(session) fetchAll(); }, [session]);

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

  const totals = useMemo(() => ({
    budget: data.cat.reduce((s, c) => s + Number(c.budget), 0),
    spent: data.tx.reduce((s, t) => s + Number(t.amount), 0),
    assets: data.acc.reduce((s, a) => s + Number(a.balance), 0)
  }), [data]);

  if (!session) return <LoginView onLogin={async (e: string, p: string) => { 
    const res = await supabase.auth.signInWithPassword({ email: e, password: p });
    if(res.error) alert(res.error.message);
  }} isDark={isDark} />;

  if (loading) return <div className={`min-h-screen ${isDark ? 'bg-black text-indigo-400' : 'bg-gray-50 text-indigo-600'} flex items-center justify-center font-black uppercase text-xs tracking-[0.4em]`}>Syncing Build...</div>;

  return (
    <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-[#F2F4F7]'} font-sans flex justify-center transition-colors duration-300`}>
      <div className={`w-full max-w-lg md:max-w-xl ${isDark ? 'bg-black border-white/5' : 'bg-[#F9FAFB] border-gray-100'} min-h-screen relative border-x pb-32 shadow-2xl overflow-x-hidden`}>
        <Suspense fallback={null}>
          {view === 'home' && <HomeView totals={totals} tx={data.tx} isDark={isDark} onLogout={() => supabase.auth.signOut()} onToggleTheme={() => setIsDark(!isDark)} onNew={() => { setEditingTx(null); setView('new-tx'); }} onEditTx={(t: Transaction) => {setEditingTx(t); setView('new-tx');}} />}
          {view === 'history' && <HistoryView tx={data.tx} isDark={isDark} onBack={() => setView('home')} onEditTx={(t: Transaction) => {setEditingTx(t); setView('new-tx');}} />}
          {view === 'categories' && <CategoryListView cats={data.cat} tx={data.tx} isDark={isDark} onBack={() => setView('home')} onDetail={(id: string)=>{setSelId(id); setView('cat-detail');}} onAdd={async ()=>{const {data:n}=await supabase.from('categories').insert([{name:'New', budget:0, subs:[], user_id:session.user.id}]).select(); if(n) { setSelId((n[0] as Category).id); fetchAll(); setView('edit-cat'); }}} />}
          {view === 'cat-detail' && <CategoryDetailView cat={data.cat.find(c=>c.id===selId)} tx={data.tx.filter(t=>t.cat_id===selId)} isDark={isDark} onBack={()=>setView('categories')} onEdit={()=>setView('edit-cat')} onEditTx={(t: Transaction) => {setEditingTx(t); setView('new-tx');}} />}
          {view === 'accounts' && <AccountsView accs={data.acc} isDark={isDark} onBack={()=>setView('home')} onEdit={(id: string)=>{setSelId(id); setView('edit-acc');}} onAdd={async ()=>{await supabase.from('accounts').insert([{name:'New Wallet', balance:0, type:'Bank', user_id:session.user.id}]); fetchAll();}} />}
          {view === 'edit-cat' && <EditCategoryView cat={data.cat.find(c=>c.id===selId)} isDark={isDark} onBack={()=>setView('cat-detail')} onUpdate={async (id: string,p: any)=>{await supabase.from('categories').update(p).eq('id',id); fetchAll();}} onDelete={async (id: string)=>{if(confirm("Delete Category?")){await supabase.from('categories').delete().eq(id); fetchAll(); setView('categories');}}} />}
          {view === 'edit-acc' && <EditAccountView acc={data.acc.find(a=>a.id===selId)} isDark={isDark} onBack={()=>setView('accounts')} onSave={async (id: string,n: string,b: number)=>{await supabase.from('accounts').update({name:n, balance:b}).eq('id',id); fetchAll(); setView('accounts');}} />}
          {view === 'new-tx' && <NewTransactionView cats={data.cat} accs={data.acc} isDark={isDark} editingTx={editingTx} onClose={()=>setView('home')} onSave={handleSaveTx} onDelete={async (t: Transaction)=>{if(confirm("Delete Spend?")){await supabase.from('transactions').delete().eq(t.id); const a = data.acc.find(x=>x.id===t.acc_id); if(a) await supabase.from('accounts').update({balance: a.balance+t.amount}).eq('id',t.acc_id); fetchAll(); setView('home');}}} />}
        </Suspense>

        <nav className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg md:max-w-xl ${isDark ? 'bg-black/95 border-white/10' : 'bg-white/95 border-gray-200 shadow-xl'} border-t py-4 flex justify-around items-center z-50 backdrop-blur-xl`}>
          <NavBtn label="Home" icon="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10" active={view==='home'} isDark={isDark} onClick={() => setView('home')} />
          <NavBtn label="History" icon="M12 8v4l3 3 M12 2a10 10 0 1 0 10 10" active={view==='history'} isDark={isDark} onClick={() => setView('history')} />
          <NavBtn label="Categories" icon="M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z" active={view.includes('cat')} isDark={isDark} onClick={() => setView('categories')} />
          <NavBtn label="Accounts" icon="M2 4h20v16H2z M2 9.5h20" active={view.includes('acc')} isDark={isDark} onClick={() => setView('accounts')} />
        </nav>
      </div>
    </div>
  );
}

// --- SUB-VIEWS ---

function LoginView({ onLogin, isDark }: { onLogin: (e: string, p: string) => void, isDark: boolean }) {
  const [e, setE] = useState(''); const [p, setP] = useState('');
  return (
    <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-gray-50'} flex flex-col justify-center p-10 space-y-10`}>
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center text-white text-3xl font-black shadow-xl">S</div>
        <h1 className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Welcome back</h1>
        <p className={`${isDark ? 'text-white/30' : 'text-gray-400'} font-bold text-xs uppercase tracking-widest`}>Sign in to sync your build</p>
      </div>
      <div className="space-y-4">
        <input placeholder="Email" value={e} onChange={v => setE(v.target.value)} className={`w-full ${isDark ? 'bg-[#1C1C1E] text-white border-white/5' : 'bg-white text-gray-900 border-gray-200'} p-5 rounded-2xl outline-none font-bold border`} />
        <input type="password" placeholder="Password" value={p} onChange={v => setP(v.target.value)} className={`w-full ${isDark ? 'bg-[#1C1C1E] text-white border-white/5' : 'bg-white text-gray-900 border-gray-200'} p-5 rounded-2xl outline-none font-bold border`} />
        <button onClick={() => onLogin(e, p)} className="w-full py-5 bg-[#5D5FEF] text-white rounded-2xl font-black text-xl active:scale-95 transition-all">Login</button>
      </div>
    </div>
  );
}

function HomeView({ totals, tx, cats, onNew, onLogout, onToggleTheme, isDark, onEditTx }: any) {
  return (
    <div className="p-4 space-y-6 h-screen overflow-y-auto no-scrollbar pb-40 text-left">
      <div className="flex justify-between items-center py-2 text-left">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-full border ${isDark ? 'border-white/10 bg-gray-900' : 'border-gray-200 bg-gray-100 shadow-inner'} flex items-center justify-center font-bold text-gray-400`}>S</div>
          <div><p className={`text-xs font-bold uppercase tracking-widest leading-none ${isDark ? 'text-white/30' : 'text-gray-400'}`}>Assalamualaikum,</p><h2 className={`text-lg font-bold mt-1.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>Shaik</h2></div>
        </div>
        <div className="flex gap-2">
          <button onClick={onToggleTheme} className={`p-2 rounded-full border ${isDark ? 'text-white/30 border-white/5' : 'text-gray-400 border-gray-100 bg-white shadow-sm'}`}>{isDark ? <IconSun /> : <IconMoon />}</button>
          <div className={`p-2 rounded-full border ${isDark ? 'text-white/30 border-white/5' : 'text-gray-400 border-gray-100 bg-white shadow-sm'}`}><IconBell /></div>
          <button onClick={onLogout} className={`p-2 rounded-full border ${isDark ? 'text-white/30 border-white/5' : 'text-gray-400 border-gray-100 bg-white shadow-sm'}`}><IconLogout /></button>
        </div>
      </div>
      <div className="relative overflow-hidden rounded-[2.2rem] p-7 bg-[#5D5FEF] shadow-2xl" style={{ backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 15px, rgba(255,255,255,0.04) 15px, rgba(255,255,255,0.04) 16px)' }}>
        <div className="relative z-10 space-y-6 text-left text-white">
          <div className="flex justify-between items-center text-white/80 font-bold text-xs uppercase tracking-widest"><span>Overall Budget</span><IconEye /></div>
          <h3 className="text-4xl font-black tracking-tighter text-white text-left">{fmt(totals.budget)}</h3>
          <div className="pt-5 border-t border-white/10 space-y-4">
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest"><span className="text-white/60">Spent</span><span>{fmt(totals.spent)}</span></div>
            <div className="flex justify-between text-xs font-bold uppercase tracking-widest"><span className="text-white/60">Amount Left</span><span className="text-emerald-300 font-black">{fmt(totals.budget - totals.spent)}</span></div>
          </div>
        </div>
      </div>
      <div className="space-y-4 px-1 text-left"><h4 className={`font-bold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>Recent Spends</h4>
        {tx.slice(0, 5).map((t: any, i: number) => <TxRow key={t.id} t={t} catName={t.cat_name} i={i} onClick={onEditTx} isDark={isDark} />)}
      </div>
      <button onClick={onNew} className="fixed bottom-28 right-6 w-15 h-15 bg-[#5D5FEF] text-white rounded-2xl shadow-2xl flex items-center justify-center z-40 active:scale-90 transition-all shadow-indigo-500/30"><IconPlus /></button>
    </div>
  );
}

function HistoryView({ tx, isDark, onBack, onEditTx }: any) {
  const [q, setQ] = useState('');
  const filtered = tx.filter((t: any) => t.cat_name?.toLowerCase().includes(q.toLowerCase()) || t.sub_name?.toLowerCase().includes(q.toLowerCase()) || t.note?.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="p-4 space-y-6 h-screen overflow-y-auto pb-40 no-scrollbar">
      <div className="flex justify-between items-center px-1 font-bold text-2xl tracking-tight text-left"><h2 className={isDark ? 'text-white' : 'text-gray-900'}>History</h2><button onClick={onBack} className={`p-2 rounded-full ${isDark ? 'bg-[#1C1C1E] text-white/50' : 'bg-white border-gray-100 text-gray-400 border shadow-sm'}`}><IconX /></button></div>
      <div className={`${isDark ? 'bg-[#1C1C1E] border-white/5' : 'bg-white border-gray-200 shadow-sm'} p-4 rounded-2xl border flex items-center gap-3`}>
        <div className="text-gray-400"><IconSearch /></div>
        <input placeholder="Search..." className={`bg-transparent outline-none flex-1 font-bold text-sm ${isDark ? 'text-white placeholder:text-white/20' : 'text-gray-900 placeholder:text-gray-300'}`} value={q} onChange={e => setQ(e.target.value)} />
      </div>
      <div className="space-y-4 pt-2 text-left">
        {filtered.map((t: any, i: number) => <TxRow key={t.id} t={t} catName={t.cat_name} i={i} isDark={isDark} onClick={onEditTx} />)}
      </div>
    </div>
  );
}

function CategoryDetailView({ cat, tx, isDark, onBack, onEdit, onEditTx }: any) {
  const sorted = [...tx].sort((a: any, b: any) => b.date.localeCompare(a.date));
  return (
    <div className="p-4 space-y-6 h-screen overflow-y-auto pb-40 no-scrollbar text-white">
      <div className="flex justify-between items-center py-2 text-left text-white"><button onClick={onBack} className={`p-2 rounded-full ${isDark ? 'bg-[#1C1C1E] text-white/50' : 'bg-white border-gray-100 text-gray-400 border shadow-sm'}`}><IconChevron /></button><h2 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{cat?.name} History</h2><button onClick={onEdit} className="text-indigo-500 font-bold text-xs uppercase tracking-widest">Settings</button></div>
      <div className={`${isDark ? 'bg-[#1C1C1E] border-white/5' : 'bg-white border-gray-200 shadow-lg'} p-7 rounded-[2.5rem] border flex justify-between items-end shadow-xl text-left`}>
        <div className="text-left"><p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 text-left">Spent</p><h3 className="text-3xl font-black text-red-500 tracking-tight text-left">{fmt(tx.reduce((s: any, t: any) => s + Number(t.amount), 0))}</h3></div>
        <div className="text-right"><p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 text-right">Limit</p><p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{fmt(cat?.budget)}</p></div>
      </div>
      <div className="space-y-3 text-left">{sorted.map((t: any, i: number) => <TxRow key={t.id} t={t} catName={cat?.name} i={i} isDark={isDark} onClick={onEditTx} />)}</div>
    </div>
  );
}

function CategoryListView({ cats, tx, isDark, onBack, onDetail, onAdd }: any) {
  const [filterRisk, setFilterRisk] = useState(false);
  const filtered = useMemo(() => {
    if (!filterRisk) return cats;
    return cats.filter((c: any) => {
      const s = tx.filter((t: any) => t.cat_id === c.id).reduce((sum: any, t: any) => sum + Number(t.amount), 0);
      return c.budget > 0 && (s / c.budget) >= 0.9;
    });
  }, [cats, tx, filterRisk]);

  return (
    <div className="p-4 space-y-7 h-screen overflow-y-auto pb-40 no-scrollbar text-white text-left">
      <div className="flex justify-between items-center px-1 font-bold text-2xl tracking-tight text-left text-white text-left"><h2 className={isDark ? 'text-white' : 'text-gray-900'}>Categories</h2><button onClick={onBack} className={`p-2 rounded-full ${isDark ? 'bg-[#1C1C1E] text-white/50' : 'bg-white border-gray-100 text-gray-400 border shadow-sm'}`}><IconX /></button></div>
      <div className="flex justify-end px-1"><button onClick={() => setFilterRisk(!filterRisk)} className={`text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border transition-all ${filterRisk ? 'bg-red-500/10 border-red-500 text-red-500 shadow-sm' : isDark ? 'bg-white/5 border-white/10 text-white/30' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>{filterRisk ? 'Show All' : 'Show Over-Utilized'}</button></div>
      <div className="space-y-4">
        {filtered.map((c: any) => {
          const s = tx.filter((t: any) => t.cat_id === c.id).reduce((sum: any, t: any) => sum + Number(t.amount), 0);
          const ratio = c.budget > 0 ? (s / c.budget) : 0;
          const pct = Math.min(Math.round(ratio * 100), 100);
          const left = c.budget - s;
          const isRisk = ratio >= 0.9;
          return (
            <button key={c.id} onClick={() => onDetail(c.id)} className={`w-full ${isDark ? 'bg-[#121212] border-white/5 shadow-black' : 'bg-white border-gray-100 shadow-md'} p-4 rounded-[1.8rem] border space-y-4 text-left active:scale-[0.98] transition-all`}>
              <div className="flex justify-between items-center text-left text-white">
                <div className="flex items-center gap-3 text-left text-white"><span className="text-xl">{c.icon}</span><p className={`font-bold text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>{c.name}</p></div>
                <div className="flex items-center gap-2 text-white">
                   <span className={`text-xs font-black px-3 py-1 rounded-full uppercase ${isRisk ? 'bg-red-500 text-white shadow-sm' : 'bg-indigo-500/10 text-indigo-500'}`}>{pct}%</span>
                   <IconChevron />
                </div>
              </div>
              <div className="w-full h-1.5 bg-gray-200/20 rounded-full overflow-hidden shadow-inner"><div className={`h-full transition-all duration-1000 ${isRisk ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }}></div></div>
              <div className="flex justify-between text-xs font-black uppercase tracking-widest pt-1"><div className="space-y-1"><p className="text-gray-400">Budget</p><p className={isDark ? 'text-white' : 'text-gray-900'}>{fmt(s)} / {fmt(c.budget)}</p></div><div className="space-y-1 text-right"><p className="text-gray-400">Left</p><p className={`${left < 0 ? 'text-red-500' : 'text-emerald-500'}`}>{fmt(left)} left</p></div></div>
            </button>
          );
        })}
        <button onClick={onAdd} className={`w-full py-6 border-dashed border-2 ${isDark ? 'border-white/10 text-white/30' : 'border-gray-200 text-gray-400'} rounded-[2.5rem] font-black tracking-widest text-xs uppercase shadow-inner`}>+ NEW CATEGORY</button>
      </div>
    </div>
  );
}

function NewTransactionView({ cats, accs, editingTx, isDark, onClose, onSave, onDelete }: any) {
  const [pk, setPk] = useState(false);
  const [f, setF] = useState({ 
    amount: editingTx?.amount || '', note: editingTx?.note || '', cat_name: editingTx?.cat_name || 'Select Category', 
    cat_id: editingTx?.cat_id || '', sub_name: editingTx?.sub_name || '', acc_id: editingTx?.acc_id || accs[0]?.id || '', 
    date: editingTx?.date || new Date().toISOString().split('T')[0] 
  });
  const handleSave = () => { if(!f.amount || f.cat_name === 'Select Category') return; onSave({...f, amount: Number(f.amount)}); };
  if (pk) return (
    <div className={`p-6 h-screen ${isDark ? 'bg-black' : 'bg-gray-50'} overflow-y-auto pb-32 no-scrollbar text-white text-left`}>
      <div className="flex justify-between items-center mb-10 pt-4 text-white text-center"><h3 className="text-xs font-black uppercase text-gray-400 tracking-[0.3em] mx-auto text-center">Categorization</h3><button onClick={() => setPk(false)} className="p-2 absolute right-6 text-white text-white"><IconX /></button></div>
      {cats.map((cat: any) => (
        <div key={cat.id} className="mb-8 px-2 text-left">
          <button onClick={() => { setF({...f, cat_name: cat.name, cat_id: cat.id, sub_name: ''}); setPk(false); }} className={`w-full text-left font-bold text-lg p-5 ${isDark ? 'bg-[#121212] border-white/5 text-white' : 'bg-white border-gray-200 text-gray-900'} border rounded-2xl flex items-center justify-between shadow-sm text-white`}><span>{cat.icon} {cat.name}</span><span className="text-xs font-black bg-indigo-500/20 text-indigo-500 px-4 py-1.5 rounded-full uppercase text-center text-indigo-500">Select</span></button>
          <div className="ml-12 mt-6 space-y-6">
            {cat.subs?.map((s: any, i: any) => (<button key={i} onClick={() => { setF({...f, cat_name: cat.name, cat_id: cat.id, sub_name: s}); setPk(false); }} className={`w-full text-left font-bold text-base flex items-center gap-3 leading-none ${isDark ? 'text-white/40' : 'text-gray-400'}`}> <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div> {s}</button>))}
          </div>
        </div>
      ))}
    </div>
  );
  return (
    <div className={`flex flex-col h-screen ${isDark ? 'bg-black' : 'bg-gray-50'} p-6 relative text-white text-left`}>
      <div className="flex justify-between items-center mb-4 px-1 text-left text-white"><h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{editingTx ? 'Edit Payment' : 'New Payment'}</h3><button onClick={onClose} className={`p-2 rounded-full ${isDark ? 'bg-[#1C1C1E] text-white/50' : 'bg-white border-gray-100 text-gray-400 border shadow-sm'}`}><IconX /></button></div>
      <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar pb-32 text-left">
        <div className={`${isDark ? 'bg-[#1C1C1E] border-white/5 shadow-black' : 'bg-white border-gray-200 shadow-sm'} p-6 rounded-[2.5rem] border shadow-inner`}><p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 text-left text-left text-white">Value</p><div className="text-4xl font-black flex gap-3 text-indigo-500 tracking-tighter text-left text-left text-white"><span>₹</span><input type="number" placeholder="0" value={f.amount} onChange={e => setF({...f, amount: e.target.value})} className="bg-transparent w-full outline-none text-white" /></div></div>
        <div className={`${isDark ? 'bg-[#1C1C1E] border-white/5 shadow-black' : 'bg-white border-gray-200 shadow-sm'} p-4 rounded-2xl border text-left text-white`}><p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 text-left text-left text-left text-white">Date</p><input type="date" value={f.date} onChange={e => setF({...f, date: e.target.value})} className={`bg-transparent w-full font-bold outline-none ${isDark ? 'text-white [color-scheme:dark]' : 'text-gray-900'}`} /></div>
        <div onClick={() => setPk(true)} className={`${isDark ? 'bg-[#1C1C1E] border-white/5 shadow-black' : 'bg-white border-gray-200 shadow-sm'} p-4 rounded-2xl border flex justify-between items-center shadow-sm text-white text-left`}><div><p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 text-left text-left text-left text-white">Target</p><p className={`text-base font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{f.cat_name}{f.sub_name && ` • ${f.sub_name}`}</p></div><IconChevron /></div>
        <div className={`${isDark ? 'bg-[#1C1C1E] border-white/5 shadow-black' : 'bg-white border-gray-200 shadow-sm'} p-4 rounded-2xl border flex justify-between items-center shadow-sm text-left text-white text-white`}><div className="text-left text-white text-white"><p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 text-left text-left text-left text-white text-left">Source</p><select value={f.acc_id} onChange={e => setF({...f, acc_id: e.target.value})} className={`bg-transparent text-base text-white font-bold outline-none w-full appearance-none ${isDark ? 'text-white' : 'text-gray-900'}`}>{accs.map((a:any) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div><IconChevron /></div>
        <div className={`${isDark ? 'bg-[#1C1C1E] border-white/5 shadow-black' : 'bg-white border-gray-200 shadow-sm'} p-4 rounded-2xl border shadow-sm text-left text-white`}><p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 text-left text-white text-left text-left text-white">Note</p><input placeholder="..." value={f.note} onChange={e => setF({...f, note: e.target.value})} className={`bg-transparent w-full font-medium outline-none ${isDark ? 'text-white' : 'text-gray-900'}`} /></div>
        {editingTx && <button onClick={() => onDelete(editingTx)} className="w-full py-4 text-red-500 bg-red-500/5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border border-red-500/10 shadow-sm text-red-500"> <IconTrash /> Delete Transaction</button>}
      </div>
      <div className="absolute bottom-10 inset-x-6"><button onClick={handleSave} className="w-full py-5 bg-[#5D5FEF] text-white rounded-[2rem] font-black text-xl shadow-xl active:scale-95 transition-all text-white text-white">Confirm</button></div>
    </div>
  );
}

function AccountsView({ accs, isDark, onBack, onEdit, onAdd }: any) {
  const total = accs.reduce((s:number, a:any) => s + (Number(a.balance) || 0), 0);
  const CHART_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#0ea5e9'];
  return (
    <div className="p-5 space-y-7 h-screen overflow-y-auto pb-40 no-scrollbar text-white text-left">
      <div className="flex justify-between items-center px-1 font-bold text-2xl tracking-tight text-left text-white"><h2 className={isDark ? 'text-white' : 'text-gray-900'}>My Wallets</h2><button onClick={onBack} className={`p-2 rounded-full ${isDark ? 'bg-[#1C1C1E] text-white/50' : 'bg-white border-gray-100 text-gray-400 border shadow-sm'}`}><IconX /></button></div>
      <div className={`${isDark ? 'bg-[#1C1C1E] border-white/5' : 'bg-white border-gray-200 shadow-xl'} p-8 rounded-[2.5rem] border text-center shadow-indigo-500/10`}>
        <p className="text-xs font-bold text-indigo-500 uppercase tracking-[0.2em] mb-2 text-center">Total Net Balance</p>
        <h3 className={`text-4xl font-black tracking-tighter text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>{fmt(total)}</h3>
        <div className="mt-8 space-y-4 px-2 text-left text-white text-white">
           {accs.map((acc:any, i:number) => (
             <div key={acc.id} className="space-y-1.5 text-left text-white text-white">
                <div className="flex justify-between text-xs font-bold uppercase text-gray-500 tracking-widest text-gray-500 text-gray-500"><span>{acc.name}</span><span>{total > 0 ? Math.round((acc.balance/total)*100) : 0}%</span></div>
                <div className="w-full h-2 bg-gray-200/30 rounded-full overflow-hidden shadow-sm shadow-inner">
                  <div className="h-full rounded-full transition-all duration-1000 shadow-sm shadow-inner" style={{ width: `${total > 0 ? (acc.balance/total)*100 : 0}%`, backgroundColor: CHART_COLORS[i % 5] }}></div>
                </div>
             </div>
           ))}
        </div>
      </div>
      <div className="space-y-3">
        {accs.map((acc:any) => (
          <button key={acc.id} onClick={() => onEdit(acc.id)} className={`w-full ${isDark ? 'bg-[#121212] border-white/5 shadow-black' : 'bg-white border-gray-100 shadow-sm'} p-6 rounded-[2rem] border flex justify-between items-center active:scale-[0.98] transition-all text-white text-white shadow-lg`}>
             <div className="flex items-center gap-4 text-left text-white text-white text-left"><div className={`w-12 h-12 ${isDark ? 'bg-white/5' : 'bg-gray-50'} rounded-xl flex items-center justify-center text-xl shadow-inner shadow-inner`}>🏦</div><div><p className={`font-bold text-base leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>{acc.name}</p><p className="text-xs text-gray-400 font-bold uppercase mt-2 tracking-widest text-left text-left text-gray-400">Adjust Source</p></div></div>
             <p className={`text-xl font-black ${acc.type==='Loan'?'text-red-400' : isDark ? 'text-white' : 'text-gray-900'}`}>{fmt(acc.balance)}</p>
          </button>
        ))}
        <button onClick={onAdd} className={`w-full py-6 border-dashed border-2 ${isDark ? 'border-white/10 text-white/30' : 'border-gray-200 text-gray-400'} rounded-[2.5rem] font-black tracking-widest text-xs uppercase shadow-inner`}>+ NEW WALLET</button>
      </div>
    </div>
  );
}

function EditCategoryView({ cat, isDark, onBack, onUpdate, onDelete }: any) {
  const [n, setN] = useState(cat?.name || ''); const [b, setB] = useState(cat?.budget || 0); const [s, setS] = useState('');
  const handleAdd = () => {
     if (!s.trim()) return;
     const el = document.activeElement as HTMLElement;
     if (el) el.blur();
     onUpdate(cat.id, { subs: [...(cat.subs||[]), s] });
     setS(''); 
  };
  return (
    <div className="p-6 space-y-6 h-screen overflow-y-auto pb-40 no-scrollbar text-left text-white text-left text-white text-left text-white">
      <div className="flex justify-between items-center font-bold text-xl px-1 tracking-tight text-white text-white text-white text-white"><h2>Adjust Detail</h2><button onClick={onBack} className={`p-2 rounded-full ${isDark ? 'bg-[#1C1C1E] text-white/50' : 'bg-white border-gray-100 text-gray-400 border shadow-sm'}`}><IconX /></button></div>
      <div className={`${isDark ? 'bg-[#1C1C1E] border-white/5' : 'bg-white border-gray-200 shadow-sm'} p-6 rounded-2xl border space-y-1 text-left text-white text-white shadow-md text-left text-left text-white text-left`}><p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1 text-left text-left text-white text-left text-white">Label</p><input className={`bg-transparent w-full font-bold text-lg outline-none ${isDark ? 'text-white' : 'text-gray-900'}`} value={n} onChange={e => setN(e.target.value)} /></div>
      <div className={`${isDark ? 'bg-[#1C1C1E] border-white/5' : 'bg-white border-gray-200 shadow-sm'} p-6 rounded-2xl border space-y-1 text-left text-white text-white shadow-md text-left text-left text-white text-left`}><p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1 text-left text-left text-white text-left text-white text-left">Limit</p><input type="number" className={`bg-transparent w-full font-bold text-lg text-emerald-500 outline-none`} value={b} onChange={e => setB(Number(e.target.value))} /></div>
      <div className="space-y-3 px-1 text-left text-white text-white text-white text-left text-left text-white text-left text-left text-white text-left text-left text-white text-left text-left"><p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-left text-left text-left text-left text-white">Subcategories</p>
        <div className="space-y-2 text-left text-white text-white text-white text-left text-white text-left text-left text-white text-left text-left text-white text-left text-left">{cat?.subs?.map((si: any, i: any) => (<div key={i} className={`${isDark ? 'bg-[#121212] border-white/5' : 'bg-white border-gray-100 shadow-sm'} p-4 rounded-2xl border flex justify-between items-center text-sm font-bold shadow-sm text-left text-left text-left text-left text-white`}><span className={isDark ? 'text-white' : 'text-gray-900'}>{si}</span> <button onClick={() => onUpdate(cat.id, { subs: cat.subs.filter((_:any, idx:any) => idx !== i) })} className="p-1"><IconTrash /></button></div>))}</div>
        <div className={`${isDark ? 'bg-[#1C1C1E] border-white/5' : 'bg-white border-gray-200 shadow-sm'} border flex gap-2 p-2 rounded-2xl shadow-inner text-left text-left text-left text-left text-white`}><input className={`flex-1 bg-transparent p-3 outline-none font-bold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`} placeholder="Add..." value={s} onChange={e => setS(e.target.value)} /><button onClick={handleAdd} className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center active:scale-90 transition-all text-white shadow-lg text-white shadow-indigo-500/20 text-white leading-none text-white"> <IconPlus /> </button></div>
      </div>
      <div className="flex flex-col gap-3 text-white text-white">
        <button onClick={() => { onUpdate(cat.id, { name: n, budget: Number(b) }); onBack(); }} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xl shadow-xl text-white text-white text-white text-white">Apply changes</button>
        <button onClick={() => onDelete(cat.id)} className="w-full py-3 text-red-500 bg-red-500/5 rounded-2xl font-black text-xs uppercase tracking-widest border border-red-500/10 flex items-center justify-center gap-2 text-red-500 shadow-sm text-red-500 shadow-sm text-red-500 text-red-500"> <IconTrash /> Remove Category</button>
      </div>
    </div>
  );
}

function EditAccountView({ acc, isDark, onBack, onSave }: any) {
  const [n, setN] = useState(acc?.name || ''); const [b, setB] = useState(acc?.balance || 0);
  return (
    <div className="p-6 space-y-6 text-left text-white text-left text-white text-left text-white text-left text-white text-left text-white text-left text-white">
      <div className="flex justify-between items-center font-bold px-1 tracking-tight text-left text-white text-left text-white text-left text-white text-left text-white text-left text-white text-left text-white"><h2>Source Adjust</h2><button onClick={onBack} className={`p-2 rounded-full ${isDark ? 'bg-[#1C1C1E] text-white/50' : 'bg-white border-gray-100 text-gray-400 border shadow-sm'}`}><IconX /></button></div>
      <div className={`${isDark ? 'bg-[#1C1C1E] border-white/5' : 'bg-white border-gray-200 shadow-sm'} p-7 rounded-[2.5rem] border space-y-2 text-left text-white shadow-md text-left text-left text-white text-left text-left text-white text-left text-left text-white text-left`}><p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-left text-left leading-none mb-1 text-white text-left text-left text-white text-left text-left text-white text-left text-left text-white text-left">Name</p><input className={`bg-transparent w-full font-bold text-xl outline-none ${isDark ? 'text-white' : 'text-gray-900'}`} value={n} onChange={e => setN(e.target.value)} /></div>
      <div className={`${isDark ? 'bg-[#1C1C1E] border-white/5' : 'bg-white border-gray-200 shadow-sm'} p-7 rounded-[2.5rem] border space-y-2 text-left text-white shadow-md text-left text-left text-white text-left text-left text-white text-left text-left text-white text-left`}><p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-left text-left leading-none mb-1 text-white text-left text-left text-white text-left text-left text-white text-left text-left text-white text-left">Balance</p><input type="number" className="bg-transparent w-full font-bold text-xl outline-none text-emerald-400" value={b} onChange={e => setB(Number(e.target.value))} /></div>
      <button onClick={() => onSave(acc.id, n, b)} className="w-full py-5 bg-[#5D5FEF] text-white rounded-[2.5rem] font-black text-xl shadow-xl active:scale-95 transition-all text-white text-white text-white shadow-indigo-500/20 text-white text-white text-white">Confirm Update</button>
    </div>
  );
}

function NavBtn({ label, icon, active, onClick }: NavBtnProps) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1.5 transition-all ${active ? 'text-[#5D5FEF]' : 'text-gray-400'}`}>
      <div className={`${active ? 'scale-110 opacity-100' : 'scale-100 opacity-60'} mb-0.5 transition-all transition-all`}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={icon}/></svg></div>
      <span className="text-[10px] font-black uppercase tracking-tight leading-none tracking-tight">{label}</span>
    </button>
  );
}