import { useState, useRef, useEffect } from 'react'
import './App.css'
import Header from './components/Header'
import Footer from './components/Footer'
import Slider from './components/Slider'
import AccordionSection from './components/AccordionSection'
import { PresetGallery } from './components/PresetGallery'
import { JsonDisplay } from './components/JsonDisplay'
import type { Settings, SectionEnabled } from './types'
import { buildJsonPrompt } from './utils/promptBuilder'
import { randomizeSettings, maximizeExaggerations, ALL_SECTIONS_ENABLED } from './utils/settingsHelpers'
import { PRESETS } from './constants'
import type { Preset } from './constants'

function App() {
  // State management
  const [settings, setSettings] = useState<Settings>({
    hairColor: 'blond',
    hairStyle: 'voluminous swept to side',
    expression: 'stern',
    outfit: 'dark formal suit',
    shirtColor: 'white',
    tieStyle: 'solid blue tie',
    lighting: 'soft studio lighting',
    background: 'dark gradient',
    cheeks: 70,
    chin: 75,
    forehead: 60,
    nose: 70,
    ears: 55,
    subjectType: 'older man'
  });

  const [sectionEnabled, setSectionEnabled] = useState<SectionEnabled>({
    hair: false,
    face: false,
    clothing: false,
    style: false
  });

  const [expandedSections, setExpandedSections] = useState<SectionEnabled>({
    hair: false,
    face: false,
    clothing: false,
    style: false
  });

  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [extraMode, setExtraMode] = useState(false);
  const [jsonCopied, setJsonCopied] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('caricature-history');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
    const savedPhoto = localStorage.getItem('caricature-user-photo');
    if (savedPhoto) {
      setUserPhoto(savedPhoto);
    }
  }, []);

  // Clear JSON copied notification after 2 seconds
  useEffect(() => {
    if (jsonCopied) {
      const timer = setTimeout(() => setJsonCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [jsonCopied]);

  // Handle copy JSON
  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(buildJsonPrompt(settings, sectionEnabled, userPhoto, extraMode), null, 2));
    setJsonCopied(true);
  };

  // Toggle accordion section
  const toggleSection = (sectionName: 'hair' | 'face' | 'clothing' | 'style') => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  // Randomize settings
  const randomize = () => {
    setSettings(randomizeSettings(settings.subjectType));
    setSectionEnabled(ALL_SECTIONS_ENABLED);
  };

  // Make it EXTRA - maximize all facial exaggerations
  const makeItExtra = () => {
    setExtraMode(true);
    setSettings(prev => maximizeExaggerations(prev));
    // Enable face section when making it extra
    setSectionEnabled(prev => ({ ...prev, face: true }));
  };


  // Apply preset settings
  const applyPreset = (preset: Preset) => {
    setSettings(preset.settings);
    setSectionEnabled(ALL_SECTIONS_ENABLED);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col overflow-hidden">
      <Header />

      <PresetGallery presets={PRESETS} onApplyPreset={applyPreset} />

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="grid lg:grid-cols-2 gap-8">

          <div className="control-panel">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-amber-100">Customize Your Subject</h2>
              <button onClick={randomize} className="randomize-btn text-sm">🎲 Randomize</button>
            </div>

            <div className="photo-uploader mb-6">
              <label className="block text-sm font-medium text-amber-200/80 mb-2">Your Photo (Optional)</label>
              <div className="photo-preview-container">
                <img src="data:image/webp;base64,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" alt="Your photo" className="photo-preview" />
                <button className="remove-photo-btn">✕ Remove</button>
                <button className="change-photo-btn">📷 Change</button>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-amber-200/80 mb-2">Subject Type</label>
              <input type="text" className="custom-input w-full" placeholder="e.g., older man, young woman, businessman..." value="" />
            </div>

            <AccordionSection
              icon="💇"
              title="Hair"
              sectionKey="hair"
              expandedSections={expandedSections}
              sectionEnabled={sectionEnabled}
              toggleSection={toggleSection}
              setSectionEnabled={setSectionEnabled}
            >
              <div className="mb-4">
                <label className="block text-sm font-medium text-amber-200/80 mb-2">Color</label>
                <select
                  value={settings.hairColor}
                  onChange={(e) => setSettings(prev => ({ ...prev, hairColor: e.target.value }))}
                  className="custom-select w-full"
                >
                  <option value="blond">blond</option>
                  <option value="dark brown">dark brown</option>
                  <option value="black">black</option>
                  <option value="gray">gray</option>
                  <option value="white">white</option>
                  <option value="red">red</option>
                  <option value="auburn">auburn</option>
                  <option value="silver">silver</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-amber-200/80 mb-2">Style</label>
                <select
                  value={settings.hairStyle}
                  onChange={(e) => setSettings(prev => ({ ...prev, hairStyle: e.target.value }))}
                  className="custom-select w-full"
                >
                  <option value="voluminous swept to side">voluminous swept to side</option>
                  <option value="slicked back">slicked back</option>
                  <option value="curly">curly</option>
                  <option value="bald">bald</option>
                  <option value="spiky">spiky</option>
                  <option value="wavy">wavy</option>
                  <option value="short cropped">short cropped</option>
                  <option value="wild and messy">wild and messy</option>
                </select>
              </div>
            </AccordionSection>

            <AccordionSection
              icon="👤"
              title="Face Features"
              sectionKey="face"
              expandedSections={expandedSections}
              sectionEnabled={sectionEnabled}
              toggleSection={toggleSection}
              setSectionEnabled={setSectionEnabled}
            >
              <div className="mb-4">
                <label className="block text-sm font-medium text-amber-200/80 mb-2">Expression</label>
                <select
                  value={settings.expression}
                  onChange={(e) => setSettings(prev => ({ ...prev, expression: e.target.value }))}
                  className="custom-select w-full"
                >
                  <option value="stern">stern</option>
                  <option value="smiling warmly">smiling warmly</option>
                  <option value="surprised">surprised</option>
                  <option value="pouty">pouty</option>
                  <option value="smug">smug</option>
                  <option value="contemplative">contemplative</option>
                  <option value="mischievous">mischievous</option>
                  <option value="serious">serious</option>
                </select>
              </div>
              <Slider
                label="Cheeks"
                value={settings.cheeks}
                onChange={(v) => setSettings(prev => ({ ...prev, cheeks: v }))}
              />
              <Slider
                label="Chin"
                value={settings.chin}
                onChange={(v) => setSettings(prev => ({ ...prev, chin: v }))}
              />
              <Slider
                label="Forehead"
                value={settings.forehead}
                onChange={(v) => setSettings(prev => ({ ...prev, forehead: v }))}
              />
              <Slider
                label="Nose"
                value={settings.nose}
                onChange={(v) => setSettings(prev => ({ ...prev, nose: v }))}
              />
              <Slider
                label="Ears"
                value={settings.ears}
                onChange={(v) => setSettings(prev => ({ ...prev, ears: v }))}
              />
            </AccordionSection>

            <AccordionSection
              icon="👔"
              title="Clothing"
              sectionKey="clothing"
              expandedSections={expandedSections}
              sectionEnabled={sectionEnabled}
              toggleSection={toggleSection}
              setSectionEnabled={setSectionEnabled}
            >
              <div className="mb-4">
                <label className="block text-sm font-medium text-amber-200/80 mb-2">Outfit</label>
                <select
                  value={settings.outfit}
                  onChange={(e) => setSettings(prev => ({ ...prev, outfit: e.target.value }))}
                  className="custom-select w-full"
                >
                  <option value="dark formal suit">dark formal suit</option>
                  <option value="casual sweater">casual sweater</option>
                  <option value="vintage tuxedo">vintage tuxedo</option>
                  <option value="leather jacket">leather jacket</option>
                  <option value="lab coat">lab coat</option>
                  <option value="military uniform">military uniform</option>
                  <option value="superhero cape">superhero cape</option>
                  <option value="banana costume">banana costume</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-amber-200/80 mb-2">Shirt Color</label>
                <select
                  value={settings.shirtColor}
                  onChange={(e) => setSettings(prev => ({ ...prev, shirtColor: e.target.value }))}
                  className="custom-select w-full"
                >
                  <option value="white">white</option>
                  <option value="light blue">light blue</option>
                  <option value="pink">pink</option>
                  <option value="cream">cream</option>
                  <option value="black">black</option>
                  <option value="striped">striped</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-amber-200/80 mb-2">Tie/Accessory</label>
                <select
                  value={settings.tieStyle}
                  onChange={(e) => setSettings(prev => ({ ...prev, tieStyle: e.target.value }))}
                  className="custom-select w-full"
                >
                  <option value="solid blue tie">solid blue tie</option>
                  <option value="red power tie">red power tie</option>
                  <option value="bow tie">bow tie</option>
                  <option value="no tie">no tie</option>
                  <option value="gold tie">gold tie</option>
                  <option value="polka dot tie">polka dot tie</option>
                </select>
              </div>
            </AccordionSection>

            <AccordionSection
              icon="🎬"
              title="Mood &amp; Style"
              sectionKey="style"
              expandedSections={expandedSections}
              sectionEnabled={sectionEnabled}
              toggleSection={toggleSection}
              setSectionEnabled={setSectionEnabled}
            >
              <div className="mb-4">
                <label className="block text-sm font-medium text-amber-200/80 mb-2">Lighting</label>
                <select
                  value={settings.lighting}
                  onChange={(e) => setSettings(prev => ({ ...prev, lighting: e.target.value }))}
                  className="custom-select w-full"
                >
                  <option value="soft studio lighting">soft studio lighting</option>
                  <option value="dramatic rim lighting">dramatic rim lighting</option>
                  <option value="warm golden hour">warm golden hour</option>
                  <option value="cool blue tones">cool blue tones</option>
                  <option value="high contrast noir">high contrast noir</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-amber-200/80 mb-2">Background</label>
                <select
                  value={settings.background}
                  onChange={(e) => setSettings(prev => ({ ...prev, background: e.target.value }))}
                  className="custom-select w-full"
                >
                  <option value="dark gradient">dark gradient</option>
                  <option value="smoky atmosphere">smoky atmosphere</option>
                  <option value="rich burgundy">rich burgundy</option>
                  <option value="deep navy blue">deep navy blue</option>
                  <option value="charcoal gray">charcoal gray</option>
                </select>
              </div>
            </AccordionSection>

            <button onClick={makeItExtra} className="extra-btn w-full mt-4 ">🤫 Make it EXTRA</button>
            <button className="generate-btn w-full mt-4">✨ Transform Your Photo</button>
            <JsonDisplay
              isVisible={showJson}
              onToggle={() => setShowJson(!showJson)}
              jsonData={buildJsonPrompt(settings, sectionEnabled, userPhoto, extraMode)}
              onCopy={handleCopyJson}
              isCopied={jsonCopied}
            />
          </div>

          <div className="preview-panel">
            <h2 className="text-xl font-bold text-amber-100 mb-4">Preview</h2>
            <div className="image-frame">
              <div className="placeholder-state">
                <span className="text-6xl mb-4">🎨</span>
                <p className="text-amber-200/40">Your masterpiece awaits</p>
                <p className="text-amber-200/20 text-sm mt-2">Your photo is ready - click Generate!</p>
              </div>
            </div>
            {/* <div className="image-frame"><img src="https://caricature-studio.berrry.app/api/nanobanana/image/17914" alt="Generated Caricature" className="generated-image" /></div> */}
            <div className="history-section mt-8">
              <h3 className="text-amber-400/80 text-sm font-semibold mb-4 uppercase tracking-wider">Recent Creations</h3>
              <div className="history-grid">
                <img src="https://caricature-studio.berrry.app/api/nanobanana/image/17914" alt="History 2" className="history-thumb" />
                <img src="https://caricature-studio.berrry.app/api/nanobanana/image/17914" alt="History 2" className="history-thumb" />
                <img src="https://caricature-studio.berrry.app/api/nanobanana/image/17914" alt="History 2" className="history-thumb" />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default App
