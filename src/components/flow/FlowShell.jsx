/*
 * FlowShell — the shared chrome for every purchase step (ported from
 * docs/design2.0/flow.jsx). Back button + wordmark + progress dots +
 * "Paso N de total · kicker" header + a single pinned bottom CTA.
 * Calm, one primary action per screen.
 */
import { Screen } from '../ui/Screen';
import { Ic } from '../ui/Ic';

export function FlowShell({
  step,
  total = 6,
  title,
  kicker,
  children,
  cta,
  ctaIcon,
  ctaClass = 'btn',
  ctaDisabled = false,
  onNext,
  onBack,
  footnote,
  ghost,
}) {
  return (
    <Screen seed={30 + step}>
      <div className="topbar" style={{ paddingBottom: 8 }}>
        <button className="tb-btn icon" onClick={onBack} aria-label="Atrás">
          <Ic n="arrowL" s={20} />
        </button>
        <div className="serif" style={{ fontSize: 18, color: 'var(--cream)' }}>Sígale</div>
        <div style={{ width: 44 }} />
      </div>

      <div className="pad" style={{ position: 'relative', zIndex: 2 }}>
        <div className="steps">
          {Array.from({ length: total }).map((_, i) => (
            <i key={i} className={i + 1 < step ? 'done' : i + 1 === step ? 'on' : ''} />
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, whiteSpace: 'nowrap' }}>
            <span className="serif" style={{ fontSize: 30, color: 'var(--yellow)', lineHeight: 1 }}>Paso {step}</span>
            <span className="label" style={{ color: 'var(--cream-dim)', fontSize: 13 }}>de {total}</span>
            {kicker && <span className="label" style={{ color: 'var(--orange-soft)' }}>· {kicker}</span>}
          </div>
          <div className="serif" style={{ fontSize: 28, color: 'var(--cream)', lineHeight: 1.06, marginTop: 8 }}>{title}</div>
        </div>
      </div>

      <div className="scr-body pad" style={{ zIndex: 1, marginTop: 16, overflowY: 'auto' }}>
        {children}
      </div>

      <div className="pad" style={{ position: 'relative', zIndex: 2, paddingBottom: 18, paddingTop: 8 }}>
        {footnote}
        {ghost && (
          <button className="btn ghost sm" style={{ marginBottom: 10 }} onClick={onBack}>
            {ghost}
          </button>
        )}
        {cta && (
          <button className={ctaClass} onClick={onNext} disabled={ctaDisabled}>
            {ctaIcon}
            {cta}
          </button>
        )}
      </div>
    </Screen>
  );
}

export default FlowShell;
