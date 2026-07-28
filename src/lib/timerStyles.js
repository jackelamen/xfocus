// Timer face catalogue + persistence key.
// Kept out of the component file so React Fast Refresh keeps working and so
// the picker can import the list without pulling in every face.

export const TIMER_STYLES = [
  { id: 'digital',  label: 'Digital',  icon: 'pin' },
  { id: 'flip',     label: 'Flip',     icon: 'view_agenda' },
  { id: 'ring',     label: 'Ring',     icon: 'radio_button_unchecked' },
  { id: 'analog',   label: 'Analog',   icon: 'schedule' },
  { id: 'racecar',  label: 'F1',       icon: 'sports_score' },
  { id: 'airplane', label: 'Plane',    icon: 'flight' },
  { id: 'rocket',   label: 'Rocket',   icon: 'rocket_launch' },
  { id: 'hiker',    label: 'Summit',   icon: 'landscape' },
]

export const STYLE_IDS = TIMER_STYLES.map(s => s.id)
export const STYLE_STORAGE_KEY = 'xf-timer-style'
