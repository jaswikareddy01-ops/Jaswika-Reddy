export function Orb({ small = false }: { small?: boolean }) {
  return <div className={`orb ${small ? 'orb-small' : ''}`} aria-hidden="true"><div className="orb-orbit orbit-one"/><div className="orb-orbit orbit-two"/><div className="orb-dashes"/><div className="orb-ring"/><div className="orb-inner"><div className="orb-core"/></div>{!small && <><span className="orb-cross cross-top">+</span><span className="orb-cross cross-bottom">+</span><span className="orb-cross cross-left">+</span><span className="orb-cross cross-right">+</span></>}</div>
}
