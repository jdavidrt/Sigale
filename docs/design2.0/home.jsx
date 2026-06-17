/* home.jsx — organizer Home (event header + stats), Collage / Astromelias */

const TYPES = [
  { k: 'Taquilla', v: 45000, n: 0 },
  { k: 'Etapa 1', v: 30000, n: 16 },
  { k: 'Etapa 2', v: 35000, n: 10 },
  { k: 'Cortesía', v: 0, n: 18 },
];

function PlusBtn({ color = 'var(--green)' }) {
  return (
    <button style={{ width: 52, height: 52, borderRadius: 'var(--r-md)', background: 'rgba(95,190,123,0.10)', border: '1.5px solid ' + color, color: color, flex: '0 0 52px' }}>
      <Ic n="plus" s={24} />
    </button>
  );
}

function InfoBlock({ ic, label, value, sub, accent = 'var(--lilac)' }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span style={{ color: accent, marginTop: 2 }}><Ic n={ic} s={20} /></span>
      <div>
        <div className="label" style={{ fontSize: 10, marginBottom: 2 }}>{label}</div>
        <div style={{ fontWeight: 600, fontSize: 15, whiteSpace: 'nowrap' }}>{value}</div>
        {sub && <div className="muted" style={{ fontSize: 12 }}>{sub}</div>}
      </div>
    </div>
  );
}

function HomeCollage() {
  return (
    <Screen dir="t3" seed={23}>
      <StatusBar />
      <TopBar />
      <div className="scr-body" style={{ overflow: 'hidden' }}>
        <div className="pad">
          <div className="tile purple" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="chip" style={{ background: 'rgba(255,255,255,0.16)', borderColor: 'rgba(255,255,255,0.24)', color: '#fff', marginBottom: 8 }}>Evento activo</div>
                <Wordmark text="Astromelias" style={{ fontSize: 36, lineHeight: 0.95 }} />
              </div>
              <PlusBtn />
            </div>
            <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
              <InfoBlock ic="pin" label="Ubicación" value="Acá Parchamos" sub="Cl. 49 #9-85" accent="var(--yellow)" />
              <InfoBlock ic="clock" label="Puertas" value="vie 24 · 5:00 PM" accent="var(--yellow)" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <div className="tile yellow"><div className="label">Vendidas</div><div className="serif" style={{ fontSize: 40, lineHeight: 1 }}>69</div></div>
            <div className="tile orange"><div className="label" style={{ color: 'rgba(255,255,255,0.85)' }}>Ingresos</div><div className="serif" style={{ fontSize: 28, color: '#fff', lineHeight: 1.1 }}>$1.625.000</div></div>
          </div>
        </div>

        <div className="pad" style={{ marginTop: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--orange)', display: 'grid', placeItems: 'center', color: '#fff' }}><Ic n="ticket" s={18} /></span>
            <div className="serif" style={{ fontSize: 24 }}>Tipos de Boletas</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {TYPES.map((t, i) => (
              <div key={i} className="trow stub" style={{ background: 'var(--black-2)' }}>
                <span className="tname" style={{ flex: 1 }}>{t.k}</span>
                <span className="serif" style={{ fontSize: 20, color: 'var(--yellow)', marginRight: 12 }}>${t.v.toLocaleString('es-CO')}</span>
                <span className="badge">{t.n}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Screen>
  );
}

Object.assign(window, { HomeCollage });
