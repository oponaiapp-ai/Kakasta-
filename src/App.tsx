import {useEffect,useMemo,useRef,useState} from 'react';
import {Heart,Search,QrCode,Send,Camera,Image as ImageIcon,UserCircle,Store,Trash2,PenLine,LogOut,X,LoaderCircle,ArrowLeft,ScanLine} from 'lucide-react';
import QRCode from 'qrcode';
import {Html5Qrcode} from 'html5-qrcode';

type StoreItem={id:string;name:string;avatar?:string;address?:string;lastMessage?:string;updatedAt?:string;liked?:boolean;qrCode?:string};
type Message={id:string;text:string;createdAt:string;photo?:string};

const demoStore:StoreItem={id:'demo-store-001',name:'Магазин у дома',address:'Астана',lastMessage:'Здравствуйте! Чем помочь?',updatedAt:new Date().toISOString(),qrCode:'kakasta:store:demo-store-001'};

function App(){
 const [stores,setStores]=useState<StoreItem[]>([demoStore]);
 const [selected,setSelected]=useState<StoreItem|null>(null);
 const [search,setSearch]=useState('');
 const [liked,setLiked]=useState<Record<string,boolean>>({});
 const [loading,setLoading]=useState(false);
 const [profile,setProfile]=useState(false);
 const [seller,setSeller]=useState(false);
 const [qr,setQr]=useState(false);
 const [scanner,setScanner]=useState(false);
 const [message,setMessage]=useState('');
 const [messages,setMessages]=useState<Message[]>([]);
 const filtered=useMemo(()=>stores.filter(s=>s.name.toLowerCase().includes(search.toLowerCase())),[stores,search]);
 const openStore=(s:StoreItem)=>{if(loading)return;setLoading(true);setTimeout(()=>{setSelected(s);setMessages([{id:'1',text:s.lastMessage||'Новый чат',createdAt:new Date().toISOString()}]);setLoading(false)},700)};
 const toggleLike=(id:string)=>setLiked(v=>({...v,[id]:!v[id]}));
 const send=()=>{if(!message.trim())return;setMessages(m=>[...m,{id:crypto.randomUUID(),text:message.trim(),createdAt:new Date().toISOString()}]);setMessage('')};

 useEffect(()=>{if(scanner){const reader=new Html5Qrcode('qr-reader'); reader.start({facingMode:'environment'},{fps:10,qrbox:{width:250,height:250}},decoded=>{if(decoded.startsWith('kakasta:store:')){const id=decoded.split(':').pop()!;const found=stores.find(s=>s.id===id)||{...demoStore,id,name:'Магазин у дома',qrCode:decoded};setStores(v=>v.some(x=>x.id===found.id)?v:[found,...v]);setScanner(false);reader.stop().catch(()=>{})}},()=>{}).catch(()=>{});return()=>{reader.stop().catch(()=>{})}},[scanner]);
 if(selected)return <Chat store={selected} messages={messages} message={message} setMessage={setMessage} send={send} back={()=>setSelected(null)}/>;
 if(seller)return <Seller onBack={()=>setSeller(false)} onQr={()=>setQr(true)}/>;
 return <main className="app">
  <div className="sun sun1"/><div className="sun sun2"/><div className="decor">🛒　🧰　📦　🛍️</div>
  <header><button className="icon" onClick={()=>setProfile(true)}><UserCircle/></button><div><b>Kakasta</b><span>Ваши продавцы и магазины</span></div><button className="icon" onClick={()=>setSeller(true)}><Store/></button></header>
  <section className="hero"><h1>Чаты с магазинами</h1><p>Сканируйте QR-код продавца, чтобы начать общение</p></section>
  <div className="search"><Search/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск магазина" autoComplete="off"/></div>
  <div className="actions"><button onClick={()=>setScanner(true)}><ScanLine/> Сканировать QR</button><button onClick={()=>setQr(true)}><QrCode/> Мой QR</button></div>
  <section className="cards">{filtered.map(s=><article className="card" key={s.id} onClick={()=>openStore(s)}>
   <div className="avatar">{s.avatar?<img src={s.avatar}/>:<Store/>}</div><div className="cardbody"><strong>{s.name}</strong><span>{s.lastMessage}</span><small>{s.updatedAt?new Date(s.updatedAt).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}):''}</small></div>
   <button className={liked[s.id]?'heart active':'heart'} onClick={e=>{e.stopPropagation();toggleLike(s.id)}}><Heart fill={liked[s.id]?'currentColor':'none'}/></button>
  </article>)}</section>
  {profile&&<Modal onClose={()=>setProfile(false)} title="Профиль"><p>Покупатель</p><p className="muted">Здесь будет профиль и настройки аккаунта.</p></Modal>}
  {qr&&<QrModal onClose={()=>setQr(false)}/>}
  {scanner&&<Modal onClose={()=>setScanner(false)} title="Сканировать QR"><div id="qr-reader"/><p className="muted">Наведите камеру на QR-код магазина.</p></Modal>}
  {loading&&<div className="loading"><LoaderCircle className="spin"/><b>Открываем магазин…</b></div>}
 </main>
}
function Chat({store,messages,message,setMessage,send,back}:{store:StoreItem;messages:Message[];message:string;setMessage:(v:string)=>void;send:()=>void;back:()=>void}){return <main className="chat"><header><button className="icon" onClick={back}><ArrowLeft/></button><div><b>{store.name}</b><span>{store.address||'Магазин'}</span></div><Heart/></header><div className="messages">{messages.map(m=><div className="bubble" key={m.id}>{m.photo&&<img src={m.photo}/>}<span>{m.text}</span><small>{new Date(m.createdAt).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}</small></div>)}</div><div className="composer"><label><Camera/></label><label><ImageIcon/></label><input value={message} onChange={e=>setMessage(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Сообщение…"/><button onClick={send}><Send/></button></div></main>}
function Seller({onBack,onQr}:{onBack:()=>void;onQr:()=>void}){return <main className="seller"><header><button className="icon" onClick={onBack}><ArrowLeft/></button><div><b>Продавец</b><span>Чаты с покупателями</span></div><button className="icon"><LogOut/></button></header><div className="sellerEmpty"><Store/><h2>Чаты с покупателями</h2><p>Новые покупатели появятся после сканирования вашего QR-кода.</p><button onClick={onQr}><QrCode/> Показать QR-код</button></div></main>}
function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:any}){return <div className="overlay"><div className="modal"><button className="close" onClick={onClose}><X/></button><h2>{title}</h2>{children}</div></div>}
function QrModal({onClose}:{onClose:()=>void}){const ref=useRef<HTMLCanvasElement>(null);useEffect(()=>{if(ref.current)QRCode.toCanvas(ref.current,demoStore.qrCode,{width:260,margin:2})},[]);return <Modal title="QR-код магазина" onClose={onClose}><canvas ref={ref}/><strong className="qrname">{demoStore.name}</strong><p className="muted">Уникальный QR-код этого магазина.</p></Modal>}
export default App;