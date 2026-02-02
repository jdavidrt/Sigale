import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight, faTrash } from "@fortawesome/free-solid-svg-icons";

export const SlideToConfirm = ({ onConfirm, label, disabled = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const containerRef = useRef(null);
  const startXRef = useRef(0);

  const THRESHOLD = 0.85; // 85% of the track to confirm

  const getMaxPosition = () => {
    if (!containerRef.current) return 200;
    return containerRef.current.offsetWidth - 56; // 56px is the thumb width
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

  // Mouse events
  const handleMouseDown = (e) => {
    e.preventDefault();
    handleStart(e.clientX);
  };

  const handleMouseMove = (e) => {
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Touch events
  const handleTouchStart = (e) => {
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Add global mouse listeners when dragging
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

  return (
    <div
      ref={containerRef}
      className={`relative h-14 rounded-xl overflow-hidden select-none ${
        disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
      style={{
        background: confirmed
          ? "linear-gradient(90deg, #dc2626, #b91c1c)"
          : `linear-gradient(90deg, rgba(220, 38, 38, ${0.3 + progress * 0.7}), rgba(185, 28, 28, ${0.3 + progress * 0.7}))`,
      }}
      onMouseMove={isDragging ? handleMouseMove : undefined}
      onMouseUp={isDragging ? handleMouseUp : undefined}
      onMouseLeave={isDragging ? handleMouseUp : undefined}
    >
      {/* Background track with animated arrows */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex items-center gap-2 text-white text-opacity-60">
          <FontAwesomeIcon
            icon={faChevronRight}
            className={`text-sm transition-opacity ${progress > 0.2 ? "opacity-0" : "opacity-100"}`}
          />
          <FontAwesomeIcon
            icon={faChevronRight}
            className={`text-sm transition-opacity ${progress > 0.4 ? "opacity-0" : "opacity-100"}`}
          />
          <span className={`text-sm font-medium transition-opacity ${progress > 0.5 ? "opacity-0" : "opacity-100"}`}>
            {confirmed ? "" : label}
          </span>
          <FontAwesomeIcon
            icon={faChevronRight}
            className={`text-sm transition-opacity ${progress > 0.6 ? "opacity-0" : "opacity-100"}`}
          />
          <FontAwesomeIcon
            icon={faChevronRight}
            className={`text-sm transition-opacity ${progress > 0.8 ? "opacity-0" : "opacity-100"}`}
          />
        </div>
      </div>

      {/* Draggable thumb */}
      <div
        className={`absolute top-1 bottom-1 left-1 w-12 rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing transition-colors ${
          confirmed ? "bg-white" : "bg-white"
        } ${isDragging ? "shadow-lg" : "shadow-md"}`}
        style={{
          transform: `translateX(${position}px)`,
          transition: isDragging ? "none" : "transform 0.3s ease-out",
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <FontAwesomeIcon
          icon={confirmed ? faTrash : faChevronRight}
          className={`text-lg ${confirmed ? "text-red-600" : "text-red-500"}`}
        />
      </div>

      {/* Confirmed state overlay */}
      {confirmed && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-600">
          <span className="text-white font-bold flex items-center gap-2">
            <FontAwesomeIcon icon={faTrash} />
          </span>
        </div>
      )}
    </div>
  );
};
