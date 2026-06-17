import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight, faTrash } from "@fortawesome/free-solid-svg-icons";
import s from "./SlideToConfirm.module.css";

export const SlideToConfirm = ({ onConfirm, label, disabled = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const containerRef = useRef(null);
  const startXRef = useRef(0);

  const THRESHOLD = 0.85;

  const getMaxPosition = () => {
    if (!containerRef.current) return 200;
    return containerRef.current.offsetWidth - 56;
  };

  const handleStart = (clientX) => {
    if (disabled || confirmed) return;
    setIsDragging(true);
    startXRef.current = clientX - position;
  };

  const handleMove = (clientX) => {
    if (!isDragging || disabled || confirmed) return;
    const maxPos = getMaxPosition();
    const newPosition = Math.max(0, Math.min(clientX - startXRef.current, maxPos));
    setPosition(newPosition);
  };

  const handleEnd = () => {
    if (!isDragging || disabled || confirmed) return;
    setIsDragging(false);
    const maxPos = getMaxPosition();
    const progress = position / maxPos;
    if (progress >= THRESHOLD) {
      setPosition(maxPos);
      setConfirmed(true);
      onConfirm();
    } else {
      setPosition(0);
    }
  };

  const handleMouseDown = (e) => { e.preventDefault(); handleStart(e.clientX); };
  const handleMouseMove = (e) => { handleMove(e.clientX); };
  const handleMouseUp = () => { handleEnd(); };
  const handleTouchStart = (e) => { handleStart(e.touches[0].clientX); };
  const handleTouchMove = (e) => { handleMove(e.touches[0].clientX); };
  const handleTouchEnd = () => { handleEnd(); };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging]);

  const maxPos = getMaxPosition();
  const progress = maxPos > 0 ? position / maxPos : 0;

  // The track's red fill is computed in CSS from the --p custom property,
  // keeping every colour value inside the design-token layer.
  return (
    <div
      ref={containerRef}
      className={`${s.track} ${disabled ? s.disabled : ""} ${confirmed ? s.confirmed : ""}`}
      style={{ "--p": progress }}
    >
      {/* Background label */}
      <div className={s.labelRow}>
        <FontAwesomeIcon icon={faChevronRight} className={s.chevron} style={{ opacity: progress > 0.2 ? 0 : 1 }} />
        <FontAwesomeIcon icon={faChevronRight} className={s.chevron} style={{ opacity: progress > 0.4 ? 0 : 1 }} />
        <span className={s.labelText} style={{ opacity: progress > 0.5 ? 0 : 1 }}>
          {confirmed ? "" : label}
        </span>
        <FontAwesomeIcon icon={faChevronRight} className={s.chevron} style={{ opacity: progress > 0.6 ? 0 : 1 }} />
        <FontAwesomeIcon icon={faChevronRight} className={s.chevron} style={{ opacity: progress > 0.8 ? 0 : 1 }} />
      </div>

      {/* Draggable thumb */}
      <div
        className={s.thumb}
        style={{
          transform: `translateX(${position}px)`,
          transition: isDragging ? "none" : "transform 0.3s ease-out",
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <FontAwesomeIcon icon={confirmed ? faTrash : faChevronRight} />
      </div>

      {/* Confirmed overlay */}
      {confirmed && (
        <div className={s.confirmedOverlay}>
          <FontAwesomeIcon icon={faTrash} />
        </div>
      )}
    </div>
  );
};
