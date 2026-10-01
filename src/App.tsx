import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Camera,
  Heart,
  Image as ImageIcon,
  LoaderCircle,
  LogOut,
  QrCode,
  ScanLine,
  Search,
  Send,
  Store,
  UserCircle,
  X,
} from 'lucide-react';
import QRCode from 'qrcode';
import { Html5Qrcode } from 'html5-qrcode';

type StoreItem = {
  id: string;
  name: string;
  avatar?: string;
  address?: string;
  lastMessage?: string;
  updatedAt?: string;
  qrCode?: string;
};

type Message = {
  id: string;
  text: string;
  createdAt: string;
  photo?: string;
};

const demoStore: StoreItem = {
  id: 'demo-store-001',
  name: 'Магазин у дома',
  address: 'Астана',
  lastMessage: 'Здравствуйте! Чем помочь?',
  updatedAt: new Date().toISOString(),
  qrCode: 'kakasta:store:demo-store-001',
};

function App() {
  const [stores, setStores] = useState<StoreItem[]>([demoStore]);
  const [selected, setSelected] = useState<StoreItem | null>(null);
  const [search, setSearch] = useState('');
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(false);
  const [seller, setSeller] = useState(false);
  const [qr, setQr] = useState(false);
  const [scanner, setScanner] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  const filtered = useMemo(
    () =>
      stores.filter((store) =>
        store.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [stores, search],
  );

  const openStore = (store: StoreItem) => {
    if (loading) return;
    setLoading(true);
    setTimeout(() => {
      setSelected(store);
      setMessages([
        {
          id: '1',
          text: store.lastMessage || 'Новый чат',
          createdAt: new Date().toISOString(),
        },
      ]);
      setLoading(false);
    }, 700);
  };

  const toggleLike = (id: string) => {
    setLiked((value) => ({ ...value, [id]: !value[id] }));
  };

  const send = () => {
    if (!message.trim()) return;
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        text: message.trim(),
        createdAt: new Date().toISOString(),
      },
    ]);
    setMessage('');
  };

  useEffect(() => {
    if (!scanner) return;

    const reader = new Html5Qrcode('qr-reader');

    reader
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decoded) => {
          if (!decoded.startsWith('kakasta:store:')) return;

          const id = decoded.split(':').pop() || '';
          const found =
            stores.find((store) => store.id === id) ||
            ({
              ...demoStore,
              id,
              qrCode: decoded,
            } as StoreItem);

          setStores((current) =>
            current.some((store) => store.id === found.id)
              ? current
              : [found, ...current],
          );
          setScanner(false);
          reader.stop().catch(() => undefined);
        },
        () => undefined,
      )
      .catch(() => undefined);

    return () => {
      reader.stop().catch(() => undefined);
    };
  }, [scanner, stores]);

  if (selected) {
    return (
      <Chat
        store={selected}
        messages={messages}
        message={message}
        setMessage={setMessage}
        send={send}
        back={() => setSelected(null)}
      />
    );
  }

  if (seller) {
    return <Seller onBack={() => setSeller(false)} onQr={() => setQr(true)} />;
  }

  return (
    <main className="app">
      <div className="sun sun1" />
      <div className="sun sun2" />
      <div className="decor">🛒　🧰　📦　🛍️</div>

      <header>
        <button className="icon" onClick={() => setProfile(true)} aria-label="Профиль">
          <UserCircle />
        </button>
        <div>
          <b>Kakasta</b>
          <span>Ваши продавцы и магазины</span>
        </div>
        <button className="icon" onClick={() => setSeller(true)} aria-label="Продавец">
          <Store />
        </button>
      </header>

      <section className="hero">
        <h1>Чаты с магазинами</h1>
        <p>Сканируйте QR-код продавца, чтобы начать общение</p>
      </section>

      <div className="search">
        <Search />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Поиск магазина"
          autoComplete="off"
        />
      </div>

      <div className="actions">
        <button onClick={() => setScanner(true)}>
          <ScanLine /> Сканировать QR
        </button>
        <button onClick={() => setQr(true)}>
          <QrCode /> Мой QR
        </button>
      </div>

      <section className="cards">
        {filtered.map((store) => (
          <article className="card" key={store.id} onClick={() => openStore(store)}>
            <div className="avatar">
              {store.avatar ? <img src={store.avatar} alt="" /> : <Store />}
            </div>

            <div className="cardbody">
              <strong>{store.name}</strong>
              <span>{store.lastMessage}</span>
              <small>
                {store.updatedAt
                  ? new Date(store.updatedAt).toLocaleTimeString('ru-RU', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : ''}
              </small>
            </div>

            <button
              className={liked[store.id] ? 'heart active' : 'heart'}
              onClick={(event) => {
                event.stopPropagation();
                toggleLike(store.id);
              }}
              aria-label="Добавить в избранное"
            >
              <Heart fill={liked[store.id] ? 'currentColor' : 'none'} />
            </button>
          </article>
        ))}
      </section>

      {profile && (
        <Modal onClose={() => setProfile(false)} title="Профиль">
          <p>Покупатель</p>
          <p className="muted">Здесь будет профиль и настройки аккаунта.</p>
        </Modal>
      )}

      {qr && <QrModal onClose={() => setQr(false)} />}

      {scanner && (
        <Modal onClose={() => setScanner(false)} title="Сканировать QR">
          <div id="qr-reader" />
          <p className="muted">Наведите камеру на QR-код магазина.</p>
        </Modal>
      )}

      {loading && (
        <div className="loading">
          <LoaderCircle className="spin" />
          <b>Открываем магазин…</b>
        </div>
      )}
    </main>
  );
}

function Chat({
  store,
  messages,
  message,
  setMessage,
  send,
  back,
}: {
  store: StoreItem;
  messages: Message[];
  message: string;
  setMessage: (value: string) => void;
  send: () => void;
  back: () => void;
}) {
  return (
    <main className="chat">
      <header>
        <button className="icon" onClick={back} aria-label="Назад">
          <ArrowLeft />
        </button>
        <div>
          <b>{store.name}</b>
          <span>{store.address || 'Магазин'}</span>
        </div>
        <Heart />
      </header>

      <div className="messages">
        {messages.map((item) => (
          <div className="bubble" key={item.id}>
            {item.photo && <img src={item.photo} alt="" />}
            <span>{item.text}</span>
            <small>
              {new Date(item.createdAt).toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </small>
          </div>
        ))}
      </div>

      <div className="composer">
        <label>
          <Camera />
        </label>
        <label>
          <ImageIcon />
        </label>
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') send();
          }}
          placeholder="Сообщение…"
        />
        <button onClick={send} aria-label="Отправить">
          <Send />
        </button>
      </div>
    </main>
  );
}

function Seller({ onBack, onQr }: { onBack: () => void; onQr: () => void }) {
  return (
    <main className="seller">
      <header>
        <button className="icon" onClick={onBack} aria-label="Назад">
          <ArrowLeft />
        </button>
        <div>
          <b>Продавец</b>
          <span>Чаты с покупателями</span>
        </div>
        <button className="icon" aria-label="Выйти">
          <LogOut />
        </button>
      </header>

      <div className="sellerEmpty">
        <Store />
        <h2>Чаты с покупателями</h2>
        <p>Новые покупатели появятся после сканирования вашего QR-кода.</p>
        <button onClick={onQr}>
          <QrCode /> Показать QR-код
        </button>
      </div>
    </main>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="overlay">
      <div className="modal">
        <button className="close" onClick={onClose} aria-label="Закрыть">
          <X />
        </button>
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

function QrModal({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (ref.current) {
      QRCode.toCanvas(ref.current, demoStore.qrCode, {
        width: 260,
        margin: 2,
      });
    }
  }, []);

  return (
    <Modal title="QR-код магазина" onClose={onClose}>
      <canvas ref={ref} />
      <strong className="qrname">{demoStore.name}</strong>
      <p className="muted">Уникальный QR-код этого магазина.</p>
    </Modal>
  );
}

export default App;
