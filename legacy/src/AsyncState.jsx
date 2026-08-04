/*
 * ============================================================
 * RETIRED — NOT PART OF THE RUNNING SYSTEM.
 * This file has zero importers and is never executed. Do not
 * import it, run it, or copy patterns from it. See
 * legacy/README.md for why it was retired and what replaced it.
 * ============================================================
 */
/*
 * AsyncState — one first-class home for the loading / error / empty states
 * of any data fetch in the 2.0 skin (Phase 5, Guide §7 step 10). Instead of
 * each page hand-rolling a "Cargando…" div and an ad-hoc error block, they
 * describe their state once and AsyncState renders it in the Astromelias
 * language:
 *
 *   - loading -> the shared `.spinner` ring (already gated behind
 *                prefers-reduced-motion, so it holds still when the user asks
 *                for less motion) under an aria-live status label.
 *   - error   -> a glassy card with role="alert" and an optional Retry.
 *   - empty   -> the existing <EmptyStateCard/>.
 *   - ready   -> just renders children.
 *
 * Accessibility: the loading region is role="status" aria-live="polite"
 * aria-busy; the error region is role="alert". The spinner art is
 * aria-hidden — the text label carries the meaning, never colour alone.
 */
import { Ic } from './Ic';
import { EmptyStateCard } from './EmptyStateCard';
import s from './AsyncState.module.css';

/**
 * @param {object}   props
 * @param {'loading'|'error'|'empty'|'ready'} props.status
 * @param {React.ReactNode} [props.children]      rendered when status==='ready'
 * @param {string}   [props.loadingLabel]         text under the spinner
 * @param {string}   [props.errorTitle]
 * @param {string}   [props.errorMessage]
 * @param {() => void} [props.onRetry]            shows a Retry button when set
 * @param {object}   [props.empty]                { icon, title, description } for EmptyStateCard
 * @param {string}   [props.className]            extra class on the wrapper
 */
export function AsyncState({
  status,
  children = null,
  loadingLabel = 'Cargando…',
  errorTitle = 'Algo salió mal',
  errorMessage = 'No pudimos cargar esta información. Intenta de nuevo.',
  onRetry,
  empty,
  className = '',
}) {
  if (status === 'loading') {
    return (
      <div
        className={`${s.center} ${className}`}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="spinner" aria-hidden="true">
          <span className="spinner-ring" />
          <span className="spinner-core">
            <Ic n="ticket" />
          </span>
        </div>
        <p className={`muted ${s.label}`}>{loadingLabel}</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={`${s.center} ${className}`} role="alert">
        <div className={`glass-elevated shadow-floating ${s.errorCard}`}>
          <span className={s.errorIcon} aria-hidden="true">
            <Ic n="warn" s={28} />
          </span>
          <h2 className={`text-heading ${s.errorTitle}`}>{errorTitle}</h2>
          <p className={`text-body muted ${s.errorMessage}`}>{errorMessage}</p>
          {onRetry && (
            <button type="button" className="btn" onClick={onRetry}>
              Reintentar
            </button>
          )}
        </div>
      </div>
    );
  }

  if (status === 'empty') {
    return (
      <EmptyStateCard
        icon={empty?.icon}
        title={empty?.title ?? 'Nada por aquí'}
        description={empty?.description ?? ''}
      />
    );
  }

  return children;
}

export default AsyncState;
