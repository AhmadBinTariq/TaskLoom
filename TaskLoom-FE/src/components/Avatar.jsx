import './Avatar.css'

const palette = ['red', 'orange', 'yellow', 'green', 'teal', 'blue', 'violet', 'pink']

function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}

function Avatar({ name, size = 28 }) {
  let hash = 0
  for (const ch of name) hash += ch.charCodeAt(0)
  const color = `var(--label-${palette[hash % palette.length]})`
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.4, borderColor: color, color }} title={name} aria-hidden="true">
      {initials(name)}
    </span>
  )
}

export default Avatar
