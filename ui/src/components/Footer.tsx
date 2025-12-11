import stormtrooper from '../assets/stormtrooper.png'

export default function Footer() {
  return (
    <footer className="footer-section mt-16 py-8 px-4 text-center border-t border-amber-500/10">
      <p className="text-amber-200/40 mb-2">Made with exaggerated love by <a href="https://brucelim.com/" className="text-amber-400 hover:text-amber-300 inline-flex items-center gap-2 align-middle"><img src={stormtrooper} alt="stormtrooper" className="h-6 w-6" /> brucelim</a>
      </p>
      <p className="text-amber-200/20 text-sm">⚠️ No actual politicians were harmed in the making of these caricatures</p>
    </footer>
  )
}
