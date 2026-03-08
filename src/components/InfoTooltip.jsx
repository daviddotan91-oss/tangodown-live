import React, { useState, useRef, useEffect } from 'react'

export default function InfoTooltip({ text, position = 'bottom' }) {
  const [show, setShow] = useState(false)
  const [adjustedPos, setAdjustedPos] = useState(position)
  const tipRef = useRef(null)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (show && tipRef.current && wrapRef.current) {
      const rect = tipRef.current.getBoundingClientRect()
      const wrapRect = wrapRef.current.getBoundingClientRect()
      let newPos = position

      // Flip if tooltip goes off-screen
      if (position === 'bottom' && rect.bottom > window.innerHeight - 10) newPos = 'top'
      if (position === 'top' && rect.top < 10) newPos = 'bottom'
      if (position === 'right' && rect.right > window.innerWidth - 10) newPos = 'left'
      if (position === 'left' && rect.left < 10) newPos = 'right'

      // Also check horizontal overflow for top/bottom tooltips
      if ((newPos === 'top' || newPos === 'bottom') && rect.right > window.innerWidth - 10) {
        newPos = 'left'
      }
      if ((newPos === 'top' || newPos === 'bottom') && rect.left < 10) {
        newPos = 'right'
      }

      if (newPos !== adjustedPos) setAdjustedPos(newPos)
    }
  }, [show, position])

  return (
    <span
      className="info-tooltip-wrap"
      ref={wrapRef}
      onMouseEnter={() => { setAdjustedPos(position); setShow(true) }}
      onMouseLeave={() => setShow(false)}
    >
      <span className="info-tooltip-icon">i</span>
      {show && (
        <span className={`info-tooltip-bubble info-tooltip-${adjustedPos}`} ref={tipRef}>
          <span className="info-tooltip-text">{text}</span>
        </span>
      )}
    </span>
  )
}
