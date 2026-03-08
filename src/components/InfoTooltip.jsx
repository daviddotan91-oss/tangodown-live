import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function InfoTooltip({ text, position = 'bottom' }) {
  const [show, setShow] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const [placement, setPlacement] = useState(position)
  const iconRef = useRef(null)
  const tipRef = useRef(null)

  useEffect(() => {
    if (!show || !iconRef.current) return

    const iconRect = iconRef.current.getBoundingClientRect()
    const cx = iconRect.left + iconRect.width / 2
    const cy = iconRect.top + iconRect.height / 2
    const tipW = 240
    const tipH = 120 // estimate, will refine after render
    const gap = 10

    let top, left, pos = position

    // Try preferred position, flip if off-screen
    if (pos === 'bottom') {
      top = iconRect.bottom + gap
      left = cx - tipW / 2
      if (top + tipH > window.innerHeight - 10) pos = 'top'
    }
    if (pos === 'top') {
      top = iconRect.top - gap - tipH
      left = cx - tipW / 2
      if (top < 10) pos = 'bottom'
    }
    if (pos === 'right') {
      top = cy - tipH / 2
      left = iconRect.right + gap
      if (left + tipW > window.innerWidth - 10) pos = 'left'
    }
    if (pos === 'left') {
      top = cy - tipH / 2
      left = iconRect.left - gap - tipW
      if (left < 10) pos = 'right'
    }

    // Recalculate with final position
    if (pos === 'bottom') { top = iconRect.bottom + gap; left = cx - tipW / 2 }
    if (pos === 'top') { top = iconRect.top - gap; left = cx - tipW / 2 }
    if (pos === 'right') { top = cy; left = iconRect.right + gap }
    if (pos === 'left') { top = cy; left = iconRect.left - gap - tipW }

    // Clamp horizontal
    if (left < 8) left = 8
    if (left + tipW > window.innerWidth - 8) left = window.innerWidth - tipW - 8

    // Clamp vertical
    if (top < 8) top = 8

    setCoords({ top, left })
    setPlacement(pos)

    // Refine after render with actual height
    requestAnimationFrame(() => {
      if (!tipRef.current) return
      const actualH = tipRef.current.offsetHeight
      let t = top, l = left
      if (pos === 'top') t = iconRect.top - gap - actualH
      if (pos === 'left' || pos === 'right') t = cy - actualH / 2
      if (t < 8) t = 8
      if (t + actualH > window.innerHeight - 8) t = window.innerHeight - actualH - 8
      setCoords({ top: t, left: l })
    })
  }, [show, position])

  const bubble = show ? createPortal(
    <div
      className={`info-tooltip-bubble info-tooltip-${placement}`}
      ref={tipRef}
      style={{ top: coords.top, left: coords.left }}
    >
      <span className="info-tooltip-text">{text}</span>
    </div>,
    document.body
  ) : null

  return (
    <span
      className="info-tooltip-wrap"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span className="info-tooltip-icon" ref={iconRef}>i</span>
      {bubble}
    </span>
  )
}
