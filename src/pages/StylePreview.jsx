import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLocationDot,
  faCalendarDays,
  faClock,
  faTicket,
  faPenToSquare,
  faWandMagicSparkles,
  faFloppyDisk,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";

export const StylePreview = () => {
  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <>
      {/* Enhanced Global Styles */}
      <style>{`
        /* Glassmorphism Base Classes - Ultra Rounded */
        .glass-light {
          background: rgba(26, 17, 82, 0.3);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.18);
        }

        .glass-medium {
          background: rgba(26, 17, 82, 0.5);
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.18);
        }

        .glass-heavy {
          background: rgba(26, 17, 82, 0.7);
          backdrop-filter: blur(28px) saturate(180%);
          -webkit-backdrop-filter: blur(28px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.18);
        }

        .glass-card-gradient {
          background: linear-gradient(135deg,
            rgba(26, 17, 82, 0.6) 0%,
            rgba(10, 6, 32, 0.5) 100%);
          backdrop-filter: blur(28px) saturate(180%);
          -webkit-backdrop-filter: blur(28px) saturate(180%);
          border: 1px solid rgba(117, 139, 253, 0.2);
        }

        /* Custom Padding Classes - Explicit Control */
        .content-padding {
          padding: 32px !important;
        }

        .content-padding-compact {
          padding: 24px !important;
        }

        .content-padding-small {
          padding: 20px !important;
        }

        .glass-card-container {
          border-radius: 32px;
        }

        .glass-card-container .content-wrapper {
          padding-left: 32px;
          padding-right: 32px;
          padding-top: 32px;
          padding-bottom: 32px;
        }

        /* Modern Shadow System */
        .shadow-elevated {
          box-shadow:
            0 8px 24px rgba(0, 0, 0, 0.18),
            0 2px 8px rgba(0, 0, 0, 0.12),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.05);
        }

        .shadow-floating {
          box-shadow:
            0 20px 60px rgba(0, 0, 0, 0.3),
            0 4px 12px rgba(0, 0, 0, 0.16),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.08);
        }

        .shadow-glow-primary {
          box-shadow:
            0 8px 32px rgba(117, 139, 253, 0.35),
            0 0 0 1px rgba(117, 139, 253, 0.2),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
        }

        .shadow-glow-success {
          box-shadow:
            0 8px 32px rgba(74, 222, 128, 0.35),
            0 0 0 1px rgba(74, 222, 128, 0.2);
        }

        .shadow-glow-orange {
          box-shadow:
            0 8px 32px rgba(255, 140, 0, 0.35),
            0 0 0 1px rgba(255, 140, 0, 0.2);
        }

        /* Hover Effects */
        .hover-lift {
          transition: all 350ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .hover-lift:hover {
          transform: translateY(-6px) scale(1.01);
          box-shadow:
            0 24px 72px rgba(0, 0, 0, 0.35),
            0 0 0 1px rgba(117, 139, 253, 0.3),
            0 0 40px rgba(117, 139, 253, 0.25),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.15);
        }

        .hover-glow {
          transition: all 350ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .hover-glow:hover {
          box-shadow:
            0 12px 40px rgba(117, 139, 253, 0.45),
            0 0 0 1px rgba(117, 139, 253, 0.4),
            inset 0 1px 0 0 rgba(255, 255, 255, 0.2);
          background: rgba(26, 17, 82, 0.75);
          border-color: rgba(117, 139, 253, 0.4);
        }

        /* Interactive Press Effect */
        .active-press:active {
          transform: scale(0.97);
        }

        /* Smooth transitions */
        .transition-smooth {
          transition: all 350ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .transition-bounce {
          transition: transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        /* Text with glow */
        .text-glow {
          text-shadow: 0 0 30px rgba(117, 139, 253, 0.4);
        }

        .text-glow-orange {
          text-shadow: 0 0 30px rgba(255, 140, 0, 0.4);
        }

        /* Ambient background effects */
        .bg-ambient-glow {
          position: relative;
          overflow: hidden;
        }

        .bg-ambient-glow::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(117, 139, 253, 0.15) 0%, transparent 70%);
          animation: ambient-pulse 10s ease-in-out infinite;
          pointer-events: none;
        }

        @keyframes ambient-pulse {
          0%, 100% { opacity: 0.3; transform: scale(1) rotate(0deg); }
          50% { opacity: 0.6; transform: scale(1.2) rotate(180deg); }
        }

        /* Floating animation for decorative elements */
        .float-animation {
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        /* Scrollbar styling */
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          margin: 8px 0;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(117, 139, 253, 0.4), rgba(190, 173, 255, 0.4));
          border-radius: 10px;
          border: 2px solid rgba(255, 255, 255, 0.05);
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, rgba(117, 139, 253, 0.6), rgba(190, 173, 255, 0.6));
        }
      `}</style>

      <div className="min-h-screen px-6 md:px-8 py-12 custom-scrollbar bg-ambient-glow">
        {/* Enhanced Ambient Decorations */}
        <div className="fixed top-32 right-16 w-[500px] h-[500px] rounded-full bg-[#758BFD] opacity-[0.12] blur-[120px] pointer-events-none float-animation" />
        <div className="fixed bottom-32 left-16 w-[400px] h-[400px] rounded-full bg-[#BEADFF] opacity-[0.10] blur-[100px] pointer-events-none" style={{ animationDelay: '3s' }} className="float-animation" />
        <div className="fixed top-1/2 left-1/2 w-[300px] h-[300px] rounded-full bg-[#FF8C00] opacity-[0.08] blur-[90px] pointer-events-none transform -translate-x-1/2 -translate-y-1/2" style={{ animationDelay: '6s' }} className="float-animation" />

        <div className="max-w-7xl mx-auto space-y-16">

          {/* Enhanced Header */}
          <div className="text-center space-y-8">
            <div className="inline-block glass-light px-8 py-3 rounded-full shadow-glow-primary">
              <p className="text-sm font-bold text-[#BEADFF] tracking-wide uppercase">
                ✨ Modern Design System Preview
              </p>
            </div>
            <h1 className="text-6xl md:text-7xl font-bold text-[#FFEDD8] text-glow leading-tight">
              Sígale Redesign
            </h1>
            <p className="text-xl text-[#BEADFF] opacity-90 max-w-3xl mx-auto leading-relaxed">
              iOS-inspired glassmorphism with Material Design depth. Experience premium, modern UI components.
            </p>
          </div>

          {/* Section 1: Glassmorphism Cards */}
          <section className="space-y-8">
            {/* Section Header with better spacing */}
            <div className="glass-medium rounded-[32px] p-8 shadow-elevated">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-[#758BFD] to-[#BEADFF] shadow-glow-primary flex items-center justify-center">
                  <span className="text-4xl">🔮</span>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-[#FF8C00] text-glow-orange">
                    Glassmorphism Cards
                  </h2>
                  <p className="text-base text-[#BEADFF] opacity-80 mt-1">
                    Frosted glass effects with varying opacity levels
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Light Glass */}
              <div className="glass-light glass-card-container shadow-elevated hover-glow">
                <div className="content-padding" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '28px', background: 'linear-gradient(to bottom right, #758BFD, #BEADFF)', opacity: '0.3' }} className="shadow-glow-primary" />
                  <div>
                    <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFEDD8', marginBottom: '12px', lineHeight: '1.2' }}>
                      Light Glass
                    </h3>
                    <p style={{ fontSize: '14px', color: '#BEADFF', opacity: '0.8', lineHeight: '1.6' }}>
                      30% opacity with 20px blur for subtle transparency
                    </p>
                  </div>
                </div>
              </div>

              {/* Medium Glass */}
              <div className="glass-medium glass-card-container shadow-elevated hover-glow">
                <div className="content-padding" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '28px', background: 'linear-gradient(to bottom right, #758BFD, #BEADFF)', opacity: '0.4' }} className="shadow-glow-primary" />
                  <div>
                    <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFEDD8', marginBottom: '12px', lineHeight: '1.2' }}>
                      Medium Glass
                    </h3>
                    <p style={{ fontSize: '14px', color: '#BEADFF', opacity: '0.8', lineHeight: '1.6' }}>
                      50% opacity with 24px blur for balanced depth
                    </p>
                  </div>
                </div>
              </div>

              {/* Heavy Glass */}
              <div className="glass-heavy glass-card-container shadow-elevated hover-glow">
                <div className="content-padding" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '28px', background: 'linear-gradient(to bottom right, #758BFD, #BEADFF)', opacity: '0.5' }} className="shadow-glow-primary" />
                  <div>
                    <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFEDD8', marginBottom: '12px', lineHeight: '1.2' }}>
                      Heavy Glass
                    </h3>
                    <p style={{ fontSize: '14px', color: '#BEADFF', opacity: '0.8', lineHeight: '1.6' }}>
                      70% opacity with 28px blur for strong presence
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Event Hero Card */}
          <section className="space-y-8">
            <div className="glass-medium rounded-[32px] p-8 shadow-elevated">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-[#FF8C00] to-[#ff9f33] shadow-glow-orange flex items-center justify-center">
                  <span className="text-4xl">🎪</span>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-[#FF8C00] text-glow-orange">
                    Event Hero Card
                  </h2>
                  <p className="text-base text-[#BEADFF] opacity-80 mt-1">
                    Main event information with clear visual hierarchy
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card-gradient rounded-[36px] p-12 md:p-14 shadow-floating hover-lift">
              <h1 className="text-5xl md:text-6xl font-bold text-[#FFEDD8] mb-10 leading-tight">
                Ruido en el Callejón
              </h1>

              <div className="space-y-6 mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-[20px] bg-[#758BFD] bg-opacity-20 flex items-center justify-center">
                    <FontAwesomeIcon icon={faLocationDot} className="text-[#758BFD] text-xl" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#FFEDD8]">El Pepino</p>
                    <p className="text-base text-[#BEADFF] opacity-90 mt-1">
                      Calle 85 #11-53
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass-light rounded-[28px] p-8 border-2 border-[#758BFD] border-opacity-30 shadow-glow-primary inline-block">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[20px] bg-[#758BFD] bg-opacity-20 flex items-center justify-center">
                      <FontAwesomeIcon icon={faCalendarDays} className="text-[#758BFD] text-xl" />
                    </div>
                    <p className="text-lg font-semibold text-[#FFEDD8]">
                      Saturday, February 7, 2026
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-[20px] bg-[#758BFD] bg-opacity-20 flex items-center justify-center">
                      <FontAwesomeIcon icon={faClock} className="text-[#758BFD] text-xl" />
                    </div>
                    <p className="text-lg font-semibold text-[#FFEDD8]">
                      8:00 PM
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Ticket Cards - COMPACT REDESIGN */}
          <section className="space-y-8">
            <div className="glass-medium rounded-[32px] p-8 shadow-elevated">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-[#758BFD] to-[#BEADFF] shadow-glow-primary flex items-center justify-center">
                  <FontAwesomeIcon icon={faTicket} className="text-white text-2xl" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-[#FF8C00] text-glow-orange">
                    Ticket Type Cards - Compact
                  </h2>
                  <p className="text-base text-[#BEADFF] opacity-80 mt-1">
                    Information-dense layout with multi-column design
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-medium rounded-[32px] p-6 shadow-elevated">
              <div className="flex items-center gap-3 mb-6 px-2">
                <div className="w-10 h-10 rounded-[18px] bg-[#758BFD] bg-opacity-20 flex items-center justify-center">
                  <FontAwesomeIcon icon={faTicket} className="text-[#758BFD] text-lg" />
                </div>
                <h3 className="text-2xl font-bold text-[#FFEDD8]">Tipos de Boletas</h3>
              </div>

              <div className="space-y-3">
                {/* Preventa Ticket - Compact */}
                <div
                  className="glass-light rounded-[20px] px-5 py-4 border border-[#758BFD] border-opacity-20 hover-glow active-press cursor-pointer"
                  onMouseEnter={() => setHoveredCard('preventa')}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div className="grid grid-cols-[1fr_auto_auto] gap-4 items-center">
                    {/* Column 1: Type & Price */}
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-[#BEADFF] uppercase tracking-wide">
                        Preventa
                      </p>
                      <p className="text-xl font-bold text-[#758BFD]">
                        $20,000
                      </p>
                    </div>

                    {/* Column 2: Stats */}
                    <div className="text-right space-y-1">
                      <p className="text-xs text-[#BEADFF] opacity-70">Vendidos</p>
                      <p className="text-base font-bold text-[#FFEDD8]">1 / 50</p>
                    </div>

                    {/* Column 3: Count Badge */}
                    <div className="w-14 h-14 rounded-[18px] bg-gradient-to-br from-[#758BFD] to-[#BEADFF] shadow-glow-primary flex items-center justify-center">
                      <span className="text-xl font-bold text-white">1</span>
                    </div>
                  </div>
                </div>

                {/* Taquilla Ticket - Compact */}
                <div
                  className="glass-light rounded-[20px] px-5 py-4 border border-[#758BFD] border-opacity-20 hover-glow active-press cursor-pointer"
                  onMouseEnter={() => setHoveredCard('taquilla')}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div className="grid grid-cols-[1fr_auto_auto] gap-4 items-center">
                    {/* Column 1: Type & Price */}
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-[#BEADFF] uppercase tracking-wide">
                        Taquilla
                      </p>
                      <p className="text-xl font-bold text-[#758BFD]">
                        $25,000
                      </p>
                    </div>

                    {/* Column 2: Stats */}
                    <div className="text-right space-y-1">
                      <p className="text-xs text-[#BEADFF] opacity-70">Vendidos</p>
                      <p className="text-base font-bold text-[#FFEDD8]">0 / 100</p>
                    </div>

                    {/* Column 3: Count Badge */}
                    <div className="w-14 h-14 rounded-[18px] bg-gradient-to-br from-[#758BFD] to-[#BEADFF] shadow-glow-primary flex items-center justify-center">
                      <span className="text-xl font-bold text-white">0</span>
                    </div>
                  </div>
                </div>

                {/* Artista Ticket - Compact */}
                <div
                  className="glass-light rounded-[20px] px-5 py-4 border border-[#758BFD] border-opacity-20 hover-glow active-press cursor-pointer"
                  onMouseEnter={() => setHoveredCard('artista')}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div className="grid grid-cols-[1fr_auto_auto] gap-4 items-center">
                    {/* Column 1: Type & Price */}
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-[#BEADFF] uppercase tracking-wide">
                        Artista
                      </p>
                      <p className="text-xl font-bold text-[#4ade80]">
                        Cortesía
                      </p>
                    </div>

                    {/* Column 2: Stats */}
                    <div className="text-right space-y-1">
                      <p className="text-xs text-[#BEADFF] opacity-70">Vendidos</p>
                      <p className="text-base font-bold text-[#FFEDD8]">0 / 20</p>
                    </div>

                    {/* Column 3: Count Badge */}
                    <div className="w-14 h-14 rounded-[18px] bg-gradient-to-br from-[#4ade80] to-[#22c55e] shadow-glow-success flex items-center justify-center">
                      <span className="text-xl font-bold text-white">0</span>
                    </div>
                  </div>
                </div>

                {/* Cortesía Ticket - Compact */}
                <div
                  className="glass-light rounded-[20px] px-5 py-4 border border-[#758BFD] border-opacity-20 hover-glow active-press cursor-pointer"
                  onMouseEnter={() => setHoveredCard('cortesia')}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div className="grid grid-cols-[1fr_auto_auto] gap-4 items-center">
                    {/* Column 1: Type & Price */}
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-[#BEADFF] uppercase tracking-wide">
                        Cortesía
                      </p>
                      <p className="text-xl font-bold text-[#4ade80]">
                        Gratis
                      </p>
                    </div>

                    {/* Column 2: Stats */}
                    <div className="text-right space-y-1">
                      <p className="text-xs text-[#BEADFF] opacity-70">Vendidos</p>
                      <p className="text-base font-bold text-[#FFEDD8]">0 / 10</p>
                    </div>

                    {/* Column 3: Count Badge */}
                    <div className="w-14 h-14 rounded-[18px] bg-gradient-to-br from-[#FF8C00] to-[#ff9f33] shadow-glow-orange flex items-center justify-center">
                      <span className="text-xl font-bold text-white">0</span>
                    </div>
                  </div>
                </div>

                {/* Edit Link - Compact */}
                <div className="pt-4">
                  <button className="flex items-center gap-3 text-[#758BFD] hover:text-[#BEADFF] transition-all group px-2">
                    <FontAwesomeIcon icon={faPenToSquare} className="text-lg group-hover:scale-110 transition-transform" />
                    <span className="text-lg font-bold underline">Editar Evento</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Alternative: Even More Compact Table-Style */}
            <div className="glass-medium rounded-[32px] p-6 shadow-elevated">
              <div className="flex items-center gap-3 mb-5 px-2">
                <div className="w-10 h-10 rounded-[18px] bg-[#758BFD] bg-opacity-20 flex items-center justify-center">
                  <FontAwesomeIcon icon={faTicket} className="text-[#758BFD] text-lg" />
                </div>
                <h3 className="text-2xl font-bold text-[#FFEDD8]">Table Style (Ultra Compact)</h3>
              </div>

              {/* Table Header */}
              <div className="grid grid-cols-[2fr_1fr_1fr_80px] gap-4 px-5 py-3 mb-2">
                <p className="text-xs font-bold text-[#BEADFF] uppercase tracking-wide opacity-70">Tipo</p>
                <p className="text-xs font-bold text-[#BEADFF] uppercase tracking-wide opacity-70 text-right">Precio</p>
                <p className="text-xs font-bold text-[#BEADFF] uppercase tracking-wide opacity-70 text-right">Vendidos</p>
                <p className="text-xs font-bold text-[#BEADFF] uppercase tracking-wide opacity-70 text-center">Total</p>
              </div>

              <div className="space-y-2">
                {/* Row 1 */}
                <div className="glass-light rounded-[18px] px-5 py-3 border border-[#758BFD] border-opacity-20 hover-glow cursor-pointer">
                  <div className="grid grid-cols-[2fr_1fr_1fr_80px] gap-4 items-center">
                    <p className="text-base font-bold text-[#FFEDD8] uppercase">Preventa</p>
                    <p className="text-base font-bold text-[#758BFD] text-right">$20,000</p>
                    <p className="text-sm text-[#FFEDD8] text-right">1 / 50</p>
                    <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-[#758BFD] to-[#BEADFF] flex items-center justify-center mx-auto">
                      <span className="text-lg font-bold text-white">1</span>
                    </div>
                  </div>
                </div>

                {/* Row 2 */}
                <div className="glass-light rounded-[18px] px-5 py-3 border border-[#758BFD] border-opacity-20 hover-glow cursor-pointer">
                  <div className="grid grid-cols-[2fr_1fr_1fr_80px] gap-4 items-center">
                    <p className="text-base font-bold text-[#FFEDD8] uppercase">Taquilla</p>
                    <p className="text-base font-bold text-[#758BFD] text-right">$25,000</p>
                    <p className="text-sm text-[#FFEDD8] text-right">0 / 100</p>
                    <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-[#758BFD] to-[#BEADFF] flex items-center justify-center mx-auto">
                      <span className="text-lg font-bold text-white">0</span>
                    </div>
                  </div>
                </div>

                {/* Row 3 */}
                <div className="glass-light rounded-[18px] px-5 py-3 border border-[#758BFD] border-opacity-20 hover-glow cursor-pointer">
                  <div className="grid grid-cols-[2fr_1fr_1fr_80px] gap-4 items-center">
                    <p className="text-base font-bold text-[#FFEDD8] uppercase">Artista</p>
                    <p className="text-base font-bold text-[#4ade80] text-right">Cortesía</p>
                    <p className="text-sm text-[#FFEDD8] text-right">0 / 20</p>
                    <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-[#4ade80] to-[#22c55e] flex items-center justify-center mx-auto">
                      <span className="text-lg font-bold text-white">0</span>
                    </div>
                  </div>
                </div>

                {/* Row 4 */}
                <div className="glass-light rounded-[18px] px-5 py-3 border border-[#758BFD] border-opacity-20 hover-glow cursor-pointer">
                  <div className="grid grid-cols-[2fr_1fr_1fr_80px] gap-4 items-center">
                    <p className="text-base font-bold text-[#FFEDD8] uppercase">Cortesía</p>
                    <p className="text-base font-bold text-[#4ade80] text-right">Gratis</p>
                    <p className="text-sm text-[#FFEDD8] text-right">0 / 10</p>
                    <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-[#FF8C00] to-[#ff9f33] flex items-center justify-center mx-auto">
                      <span className="text-lg font-bold text-white">0</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 px-2">
                <button className="flex items-center gap-3 text-[#758BFD] hover:text-[#BEADFF] transition-all group">
                  <FontAwesomeIcon icon={faPenToSquare} className="text-lg group-hover:scale-110 transition-transform" />
                  <span className="text-lg font-bold underline">Editar Evento</span>
                </button>
              </div>
            </div>
          </section>

          {/* Section 4: Buttons - Completely Redesigned */}
          <section className="space-y-8">
            <div className="glass-medium rounded-[32px] p-8 shadow-elevated">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-[#758BFD] to-[#BEADFF] shadow-glow-primary flex items-center justify-center">
                  <span className="text-4xl">🎯</span>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-[#FF8C00] text-glow-orange">
                    Buttons & Actions
                  </h2>
                  <p className="text-base text-[#BEADFF] opacity-80 mt-1">
                    Interactive elements with smooth feedback
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Primary Button */}
              <div className="glass-medium rounded-[32px] p-10 shadow-elevated space-y-6">
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-[#FFEDD8]">Primary Action</h3>
                  <p className="text-sm text-[#BEADFF] opacity-75">Main call-to-action button</p>
                </div>
                <button className="w-full px-10 py-6 bg-gradient-to-r from-[#758BFD] to-[#BEADFF] text-white rounded-[28px] font-bold text-xl shadow-glow-primary hover-lift active-press transition-smooth">
                  <FontAwesomeIcon icon={faWandMagicSparkles} className="mr-3" />
                  Create Event
                </button>
              </div>

              {/* Secondary Button */}
              <div className="glass-medium rounded-[32px] p-10 shadow-elevated space-y-6">
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-[#FFEDD8]">Secondary Action</h3>
                  <p className="text-sm text-[#BEADFF] opacity-75">Alternative action style</p>
                </div>
                <button className="w-full px-10 py-6 glass-light border-2 border-[#758BFD] border-opacity-30 text-[#758BFD] rounded-[28px] font-bold text-xl hover-glow active-press transition-smooth">
                  <FontAwesomeIcon icon={faFloppyDisk} className="mr-3" />
                  Save Changes
                </button>
              </div>

              {/* Success Button */}
              <div className="glass-medium rounded-[32px] p-10 shadow-elevated space-y-6">
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-[#FFEDD8]">Success State</h3>
                  <p className="text-sm text-[#BEADFF] opacity-75">Confirmation and success actions</p>
                </div>
                <button className="w-full px-10 py-6 bg-gradient-to-r from-[#4ade80] to-[#22c55e] text-white rounded-[28px] font-bold text-xl shadow-glow-success hover-lift active-press transition-smooth">
                  <FontAwesomeIcon icon={faCircleCheck} className="mr-3" />
                  Confirmed
                </button>
              </div>

              {/* Danger Button */}
              <div className="glass-medium rounded-[32px] p-10 shadow-elevated space-y-6">
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-[#FFEDD8]">Danger Action</h3>
                  <p className="text-sm text-[#BEADFF] opacity-75">Destructive or warning actions</p>
                </div>
                <button className="w-full px-10 py-6 bg-gradient-to-r from-[#ef4444] to-[#dc2626] text-white rounded-[28px] font-bold text-xl hover:shadow-[0_8px_32px_rgba(239,68,68,0.45)] hover-lift active-press transition-smooth">
                  Delete Event
                </button>
              </div>
            </div>
          </section>

          {/* Section 5: Form Inputs */}
          <section className="space-y-8">
            <div className="glass-medium rounded-[32px] p-8 shadow-elevated">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-[#758BFD] to-[#BEADFF] shadow-glow-primary flex items-center justify-center">
                  <span className="text-4xl">📝</span>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-[#FF8C00] text-glow-orange">
                    Form Elements
                  </h2>
                  <p className="text-base text-[#BEADFF] opacity-80 mt-1">
                    Modern input fields with glass aesthetics
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card-gradient rounded-[36px] p-10 md:p-12 shadow-floating">
              <div className="space-y-8">
                {/* Text Input */}
                <div className="space-y-4">
                  <label className="flex items-center gap-3 text-base font-semibold text-[#FFEDD8]">
                    <div className="w-10 h-10 rounded-[18px] bg-[#758BFD] bg-opacity-20 flex items-center justify-center">
                      <span className="text-xl">🎪</span>
                    </div>
                    Event Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter event name..."
                    className="w-full px-6 py-5 glass-medium border-2 border-[#758BFD] border-opacity-20 rounded-[24px] text-[#FFEDD8] text-lg placeholder-[#BEADFF] placeholder-opacity-50 focus:outline-none focus:border-[#758BFD] focus:border-opacity-50 focus:shadow-glow-primary transition-smooth"
                  />
                </div>

                {/* Grid of inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="flex items-center gap-3 text-base font-semibold text-[#FFEDD8]">
                      <div className="w-10 h-10 rounded-[18px] bg-[#758BFD] bg-opacity-20 flex items-center justify-center">
                        <FontAwesomeIcon icon={faCalendarDays} className="text-[#758BFD]" />
                      </div>
                      Date
                    </label>
                    <input
                      type="date"
                      className="w-full px-6 py-5 glass-medium border-2 border-[#758BFD] border-opacity-20 rounded-[24px] text-[#FFEDD8] text-lg focus:outline-none focus:border-[#758BFD] focus:border-opacity-50 focus:shadow-glow-primary transition-smooth"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center gap-3 text-base font-semibold text-[#FFEDD8]">
                      <div className="w-10 h-10 rounded-[18px] bg-[#758BFD] bg-opacity-20 flex items-center justify-center">
                        <FontAwesomeIcon icon={faClock} className="text-[#758BFD]" />
                      </div>
                      Time
                    </label>
                    <input
                      type="time"
                      className="w-full px-6 py-5 glass-medium border-2 border-[#758BFD] border-opacity-20 rounded-[24px] text-[#FFEDD8] text-lg focus:outline-none focus:border-[#758BFD] focus:border-opacity-50 focus:shadow-glow-primary transition-smooth"
                    />
                  </div>
                </div>

                {/* Textarea */}
                <div className="space-y-4">
                  <label className="flex items-center gap-3 text-base font-semibold text-[#FFEDD8]">
                    <div className="w-10 h-10 rounded-[18px] bg-[#758BFD] bg-opacity-20 flex items-center justify-center">
                      <span className="text-xl">📄</span>
                    </div>
                    Description
                  </label>
                  <textarea
                    placeholder="Enter event description..."
                    rows="5"
                    className="w-full px-6 py-5 glass-medium border-2 border-[#758BFD] border-opacity-20 rounded-[24px] text-[#FFEDD8] text-lg placeholder-[#BEADFF] placeholder-opacity-50 focus:outline-none focus:border-[#758BFD] focus:border-opacity-50 focus:shadow-glow-primary transition-smooth resize-none"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 6: Shadow Comparison */}
          <section className="space-y-8">
            <div className="glass-medium rounded-[32px] p-8 shadow-elevated">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-[#758BFD] to-[#BEADFF] shadow-glow-primary flex items-center justify-center">
                  <span className="text-4xl">🌑</span>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-[#FF8C00] text-glow-orange">
                    Shadow Elevation
                  </h2>
                  <p className="text-base text-[#BEADFF] opacity-80 mt-1">
                    Three depth levels for visual hierarchy
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="glass-medium rounded-[32px] p-10 shadow-elevated space-y-4">
                <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-[#758BFD] to-[#BEADFF] opacity-30" />
                <h3 className="text-2xl font-bold text-[#FFEDD8]">Elevated</h3>
                <p className="text-sm text-[#BEADFF] opacity-75 leading-relaxed">
                  Level 1 - Standard card depth
                </p>
              </div>

              <div className="glass-medium rounded-[32px] p-10 shadow-floating space-y-4">
                <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-[#758BFD] to-[#BEADFF] opacity-40" />
                <h3 className="text-2xl font-bold text-[#FFEDD8]">Floating</h3>
                <p className="text-sm text-[#BEADFF] opacity-75 leading-relaxed">
                  Level 2 - Important content depth
                </p>
              </div>

              <div className="glass-medium rounded-[32px] p-10 shadow-glow-primary space-y-4">
                <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-[#758BFD] to-[#BEADFF] opacity-50" />
                <h3 className="text-2xl font-bold text-[#FFEDD8]">Glow</h3>
                <p className="text-sm text-[#BEADFF] opacity-75 leading-relaxed">
                  Interactive - Active element depth
                </p>
              </div>
            </div>
          </section>

          {/* Section 7: Typography */}
          <section className="space-y-8">
            <div className="glass-medium rounded-[32px] p-8 shadow-elevated">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-[#758BFD] to-[#BEADFF] shadow-glow-primary flex items-center justify-center">
                  <span className="text-4xl">✍️</span>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-[#FF8C00] text-glow-orange">
                    Typography Scale
                  </h2>
                  <p className="text-base text-[#BEADFF] opacity-80 mt-1">
                    Clear visual hierarchy for content
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card-gradient rounded-[36px] p-12 shadow-floating space-y-8">
              <h1 className="text-6xl font-bold text-[#FFEDD8] leading-tight">Hero Heading</h1>
              <h2 className="text-5xl font-bold text-[#FFEDD8] leading-tight">Main Heading</h2>
              <h3 className="text-4xl font-bold text-[#FFEDD8] leading-snug">Section Heading</h3>
              <h4 className="text-3xl font-bold text-[#758BFD]">Subsection</h4>
              <p className="text-2xl text-[#FFEDD8] opacity-95 leading-relaxed">Large body text for emphasis</p>
              <p className="text-xl text-[#FFEDD8] opacity-90 leading-relaxed">Regular body text for content</p>
              <p className="text-base text-[#BEADFF] opacity-85 leading-relaxed">Small text for supporting information</p>
              <p className="text-sm text-[#BEADFF] opacity-75">Extra small for metadata</p>
            </div>
          </section>

          {/* Final CTA - Enhanced */}
          <div className="glass-heavy rounded-[40px] p-14 shadow-floating text-center space-y-8">
            <div className="inline-block mb-6">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#758BFD] to-[#BEADFF] shadow-glow-primary flex items-center justify-center mx-auto hover-lift">
                <span className="text-6xl">✨</span>
              </div>
            </div>
            <h2 className="text-5xl font-bold text-[#FFEDD8] mb-6 text-glow leading-tight">
              Ready to Transform Sígale?
            </h2>
            <p className="text-2xl text-[#BEADFF] opacity-95 mb-10 max-w-3xl mx-auto leading-relaxed">
              This modern design system brings depth, clarity, and premium feel to your event management platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button className="px-12 py-6 bg-gradient-to-r from-[#758BFD] to-[#BEADFF] text-white rounded-[28px] font-bold text-2xl shadow-glow-primary hover-lift active-press transition-smooth">
                Apply to Project
              </button>
              <button className="px-12 py-6 glass-light border-2 border-[#758BFD] border-opacity-30 text-[#758BFD] rounded-[28px] font-bold text-2xl hover-glow active-press transition-smooth">
                View Documentation
              </button>
            </div>
          </div>

        </div>

        {/* Bottom Spacing */}
        <div className="h-20" />
      </div>
    </>
  );
};
