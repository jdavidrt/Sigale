import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLocationDot,
  faCalendarDays,
  faClock,
  faTicket,
  faPenToSquare,
  faCircleCheck,
  faChartLine,
} from "@fortawesome/free-solid-svg-icons";

export const StylePreviewNew = () => {
  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <>
      <style>{`
        /* Clean Modern Design System - iOS & Material Design Inspired */

        /* Glass Effects - Subtle */
        .glass-clean {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .glass-elevated {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        /* Modern Shadows - Soft iOS Style */
        .shadow-soft {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
        }

        .shadow-elevated {
          box-shadow:
            0 8px 24px rgba(0, 0, 0, 0.15),
            0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .shadow-floating {
          box-shadow:
            0 12px 32px rgba(0, 0, 0, 0.18),
            0 4px 12px rgba(0, 0, 0, 0.10);
        }

        /* Hover Effects */
        .hover-scale {
          transition: transform 250ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .hover-scale:hover {
          transform: scale(1.02);
        }

        .hover-lift {
          transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .hover-lift:hover {
          transform: translateY(-4px);
          box-shadow:
            0 16px 40px rgba(0, 0, 0, 0.2),
            0 4px 16px rgba(0, 0, 0, 0.12);
        }

        /* Card Styles */
        .card-clean {
          border-radius: 24px;
          padding: 4px;
          margin-bottom: 24px;
        }

        .card-section {
          border-radius: 20px;
          padding: 8px 12px;
        }

        .card-compact {
          border-radius: 16px;
          padding: 20px;
        }

        /* Spacing System */
        .space-section {
          margin-bottom: 48px;
        }

        .space-group {
          margin-bottom: 24px;
        }

        .space-item {
          margin-bottom: 16px;
        }

        /* Typography */
        .text-display {
          font-size: 48px;
          font-weight: 700;
          line-height: 1.1;
          color: #FFEDD8;
        }

        .text-title {
          font-size: 32px;
          font-weight: 700;
          line-height: 1.2;
          color: #FFEDD8;
        }

        .text-heading {
          font-size: 24px;
          font-weight: 600;
          line-height: 1.3;
          color: #FFEDD8;
        }

        .text-body {
          font-size: 16px;
          font-weight: 400;
          line-height: 1.5;
          color: #BEADFF;
        }

        .text-caption {
          font-size: 14px;
          font-weight: 400;
          line-height: 1.4;
          color: #BEADFF;
          opacity: 0.7;
        }

        .text-label {
          font-size: 12px;
          font-weight: 600;
          line-height: 1.3;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #BEADFF;
          opacity: 0.8;
        }

        /* Dividers */
        .divider-light {
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
          margin: 24px 0;
        }

        /* Badge */
        .badge-primary {
          background: linear-gradient(135deg, #758BFD, #BEADFF);
          color: rgba(0, 0, 0, 0.7);
          padding: 8px 16px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
        }

        /* Accent Colors */
        .color-primary { color: #758BFD; }
        .color-success { color: #4ade80; }
        .color-warning { color: #FF8C00; }
        .color-info { color: #60a5fa; }

        .bg-primary { background: #758BFD; }
        .bg-success { background: #4ade80; }
        .bg-warning { background: #FF8C00; }
        .bg-info { background: #60a5fa; }
      `}</style>

      <div style={{
        minHeight: '100vh',
        padding: '48px 32px',
        background: 'linear-gradient(180deg, #27187E 0%, #030312 100%)',
        backgroundAttachment: 'fixed'
      }}>
        {/* Ambient Background */}
        <div style={{
          position: 'fixed',
          top: '20%',
          right: '10%',
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          background: '#758BFD',
          opacity: '0.08',
          filter: 'blur(100px)',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* Page Header */}
          <div style={{ marginBottom: '64px', textAlign: 'center' }}>
            <div style={{ marginBottom: '16px' }}>
              <span className="badge-primary">Modern Design System</span>
            </div>
            <h1 className="text-display" style={{ marginBottom: '16px' }}>
              Sígale Redesign
            </h1>
            <p className="text-body" style={{ maxWidth: '600px', margin: '0 auto' }}>
              Clean, minimal, professional UI with iOS and Material Design inspiration
            </p>
          </div>

          {/* Section 1: Event Hero Card */}
          <div className="space-section">
            {/* Section Header */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #FF8C00, #ff9f33)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '20px'
                }}>
                  🎪
                </div>
                <div>
                  <h2 className="text-heading" style={{ color: '#FF8C00', marginBottom: '4px' }}>
                    Event Hero Card
                  </h2>
                  <p className="text-caption">
                    Clean event display with proper spacing
                  </p>
                </div>
              </div>
            </div>

            {/* Event Hero Card */}
            <div className="glass-elevated shadow-floating card-clean hover-lift" style={{ marginBottom: '32px' }}>
              {/* Event Title */}
              <h1 className="text-title" style={{ margin: '8px', fontSize: '36px' }}>
                Ruido en el Callejón
              </h1>

              {/* Event Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                {/* Location */}
                <div>
                  <p className="text-label" style={{ margin: '8px', fontSize: '14px' }}>Ubicación</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FontAwesomeIcon icon={faLocationDot} className="color-primary" style={{ fontSize: '18px' }} />
                    <div>
                      <p className="text-heading" style={{ margin: '8px', fontSize: '18px', lineHeight: '1.2' }}>
                        El Pepino
                      </p>
                      <p className="text-body" style={{ margin: '8px', fontSize: '13px', opacity: '0.8', lineHeight: '1.2' }}>
                        Calle 85 #11-53
                      </p>
                    </div>
                  </div>
                </div>

                {/* Date & Time */}
                <div>
                  <p className="text-label" style={{ margin: '8px', fontSize: '14px' }}>Fecha y Hora</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <FontAwesomeIcon icon={faCalendarDays} className="color-primary" style={{ fontSize: '18px' }} />
                    <p className="text-heading" style={{ margin: '8px', fontSize: '18px', lineHeight: '1.2' }}>
                      Saturday, Feb 7, 2026
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FontAwesomeIcon icon={faClock} className="color-primary" style={{ fontSize: '18px' }} />
                    <p className="text-heading" style={{ margin: '8px', fontSize: '18px', lineHeight: '1.2' }}>
                      8:00 PM
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="glass-clean card-section" style={{ background: 'rgba(117, 139, 253, 0.08)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', textAlign: 'center' }}>
                  <div>
                    <p className="text-label" style={{ margin: '8px', fontSize: '14px' }}>Total Vendidos</p>
                    <p className="text-title color-primary" style={{ margin: '8px', fontSize: '24px', lineHeight: '1.2' }}>1</p>
                  </div>
                  <div>
                    <p className="text-label" style={{ margin: '8px', fontSize: '14px' }}>Ingresos</p>
                    <p className="text-title color-primary" style={{ margin: '8px', fontSize: '24px', lineHeight: '1.2' }}>$20,000</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Ticket Cards - Clean Table Style */}
          <div className="space-section">
            {/* Section Header */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #758BFD, #BEADFF)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '20px'
                }}>
                  <FontAwesomeIcon icon={faTicket} />
                </div>
                <div>
                  <h2 className="text-heading" style={{ color: '#758BFD', marginBottom: '4px' }}>
                    Tipos de Boletas
                  </h2>
                  <p className="text-caption">
                    Minimal, information-dense table
                  </p>
                </div>
              </div>
            </div>

            {/* Tickets Table */}
            <div className="glass-elevated shadow-elevated card-clean">
              {/* Table Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 100px',
                gap: '8px',
                padding: '0 0 8px 0',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                marginBottom: '8px',
                alignItems: 'center'
              }}>
                <p className="text-label" style={{ margin: '8px' }}>Tipo</p>
                <p className="text-label" style={{ margin: '8px', textAlign: 'right' }}>Precio</p>
                <p className="text-label" style={{ margin: '8px', textAlign: 'right' }}>Vendidos</p>
                <p className="text-label" style={{ margin: '8px', textAlign: 'center' }}>Total</p>
              </div>

              {/* Ticket Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Preventa */}
                <div
                  className="glass-clean hover-scale"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 100px',
                    gap: '8px',
                    padding: '8px',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    border: '1px solid rgba(117, 139, 253, 0.15)',
                    alignItems: 'center'
                  }}
                  onMouseEnter={() => setHoveredCard('preventa')}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <p className="text-label" style={{ margin: '8px' }}>PREVENTA</p>
                  <p className="text-heading" style={{ margin: '8px', fontSize: '18px', color: '#758BFD', textAlign: 'right' }}>
                    $20,000
                  </p>
                  <p className="text-body" style={{ margin: '8px', textAlign: 'right' }}>1 / 50</p>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #758BFD, #BEADFF)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    color: 'white'
                  }}>
                    1
                  </div>
                </div>

                {/* Taquilla */}
                <div
                  className="glass-clean hover-scale"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 100px',
                    gap: '8px',
                    padding: '8px',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    border: '1px solid rgba(117, 139, 253, 0.15)',
                    alignItems: 'center'
                  }}
                >
                  <p className="text-label" style={{ margin: '8px' }}>TAQUILLA</p>
                  <p className="text-heading" style={{ margin: '8px', fontSize: '18px', color: '#758BFD', textAlign: 'right' }}>
                    $25,000
                  </p>
                  <p className="text-body" style={{ margin: '8px', textAlign: 'right' }}>0 / 100</p>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #758BFD, #BEADFF)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    color: 'white'
                  }}>
                    0
                  </div>
                </div>

                {/* Artista */}
                <div
                  className="glass-clean hover-scale"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 100px',
                    gap: '8px',
                    padding: '8px',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    border: '1px solid rgba(74, 222, 128, 0.15)',
                    alignItems: 'center'
                  }}
                >
                  <p className="text-label" style={{ margin: '8px' }}>ARTISTA</p>
                  <p className="text-heading" style={{ margin: '8px', fontSize: '18px', color: '#4ade80', textAlign: 'right' }}>
                    Cortesía
                  </p>
                  <p className="text-body" style={{ margin: '8px', textAlign: 'right' }}>0 / 20</p>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #4ade80, #22c55e)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    color: 'white'
                  }}>
                    0
                  </div>
                </div>
              </div>

              {/* Edit Button */}
              <div className="divider-light" />
              <button
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'none',
                  border: 'none',
                  color: '#758BFD',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  padding: '8px 0'
                }}
                className="hover-scale"
              >
                <FontAwesomeIcon icon={faPenToSquare} />
                <span>Editar Tipos de Boletas</span>
              </button>
            </div>
          </div>

          {/* Section 3: Stats Cards */}
          <div className="space-section">
            <div style={{ marginBottom: '32px' }}>
              <h2 className="text-heading" style={{ color: '#60a5fa', marginBottom: '8px' }}>
                <FontAwesomeIcon icon={faChartLine} style={{ marginRight: '12px' }} />
                Quick Stats
              </h2>
              <p className="text-caption">
                At-a-glance metrics with color coding
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '8px' }}>
              {/* Total Boletas */}
              <div className="glass-elevated shadow-soft card-section hover-lift" style={{ borderLeft: '4px solid #758BFD', padding: '4px 8px' }}>
                <p className="text-label" style={{ margin: '8px' }}>Total Boletas</p>
                <p className="text-title" style={{ margin: '8px' }}>180</p>
                <p className="text-caption" style={{ margin: '8px' }}>50 preventa + 100 taquilla + 30 cortesía</p>
              </div>

              {/* Vendidas */}
              <div className="glass-elevated shadow-soft card-section hover-lift" style={{ borderLeft: '4px solid #4ade80', padding: '4px 8px' }}>
                <p className="text-label" style={{ margin: '8px' }}>Vendidas</p>
                <p className="text-title" style={{ margin: '8px', color: '#4ade80' }}>1</p>
                <p className="text-caption" style={{ margin: '8px' }}>0.6% del total • $20,000 generados</p>
              </div>

              {/* Disponibles */}
              <div className="glass-elevated shadow-soft card-section hover-lift" style={{ borderLeft: '4px solid #60a5fa', padding: '4px 8px' }}>
                <p className="text-label" style={{ margin: '8px' }}>Disponibles</p>
                <p className="text-title" style={{ margin: '8px', color: '#60a5fa' }}>179</p>
                <p className="text-caption" style={{ margin: '8px' }}>99.4% restantes</p>
              </div>
            </div>
          </div>

          {/* Section 4: Action Buttons */}
          <div className="space-section">
            <div style={{ marginBottom: '32px' }}>
              <h2 className="text-heading" style={{ marginBottom: '8px' }}>
                Action Buttons
              </h2>
              <p className="text-caption">
                Clear, purposeful buttons with proper states
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
              {/* Primary */}
              <button className="hover-scale" style={{
                padding: '16px 24px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #758BFD, #BEADFF)',
                border: 'none',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(117, 139, 253, 0.3)'
              }}>
                Crear Evento
              </button>

              {/* Success */}
              <button className="hover-scale" style={{
                padding: '16px 24px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #4ade80, #22c55e)',
                border: 'none',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(74, 222, 128, 0.3)'
              }}>
                <FontAwesomeIcon icon={faCircleCheck} style={{ marginRight: '8px' }} />
                Confirmar
              </button>

              {/* Secondary */}
              <button className="hover-scale glass-clean" style={{
                padding: '16px 24px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(117, 139, 253, 0.3)',
                color: '#758BFD',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}>
                Cancelar
              </button>

              {/* Danger */}
              <button className="hover-scale" style={{
                padding: '16px 24px',
                borderRadius: '16px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}>
                Eliminar
              </button>
            </div>
          </div>

          {/* Final Note */}
          <div className="glass-elevated shadow-floating card-clean" style={{
            borderRadius: '24px',
            padding: '4px',
            textAlign: 'center',
            marginTop: '32px'
          }}>
            <div style={{ marginBottom: '8px' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #758BFD, #BEADFF)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                marginBottom: '8px'
              }}>
                ✨
              </div>
            </div>
            <h2 className="text-title" style={{ margin: '8px' }}>
              Clean, Minimal, Professional
            </h2>
            <p className="text-body" style={{ maxWidth: '600px', margin: '8px auto', fontSize: '18px' }}>
              Proper spacing, clear hierarchy, and purposeful design for a modern event management platform.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
              <button className="hover-scale" style={{
                padding: '12px 24px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #758BFD, #BEADFF)',
                border: 'none',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}>
                Apply to Project
              </button>
              <button className="hover-scale glass-clean" style={{
                padding: '12px 24px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(117, 139, 253, 0.3)',
                color: '#758BFD',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}>
                Documentation
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};
