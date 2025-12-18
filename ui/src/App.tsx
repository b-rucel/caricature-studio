import { useState, useEffect } from 'react'
import './App.css'
import Header from './components/Header'
import Footer from './components/Footer'
import Slider from './components/Slider'
import AccordionSection from './components/AccordionSection'
import { PresetGallery } from './components/PresetGallery'
import { JsonDisplay } from './components/JsonDisplay'
import { PhotoUploadModal } from './components/PhotoUploadModal'
import type { Settings, SectionEnabled } from './types'
import { buildJsonPrompt } from './utils/promptBuilder'
import { randomizeSettings, maximizeExaggerations, ALL_SECTIONS_ENABLED } from './utils/settingsHelpers'
import { PRESETS, AVAILABLE_MODELS } from './constants'
import type { Preset, ModelType } from './constants'
import { generateCaricature } from './services/api'

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
    subjectType: ''
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
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelType>('flux-1-schnell');
  const [previewingHistoryItem, setPreviewingHistoryItem] = useState<any | null>(null);
  const [deleteConfirmIdx, setDeleteConfirmIdx] = useState<number | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileWidgetId, setTurnstileWidgetId] = useState<string | null>(null);
  const [isLocalhost, setIsLocalhost] = useState(false);

  // Handle generate caricature
  const handleGenerateCaricature = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const jsonPrompt = buildJsonPrompt(settings, sectionEnabled, userPhoto, extraMode);

      const response = await generateCaricature({
        settings: jsonPrompt,
        userPhoto: userPhoto || undefined,
        extraMode,
        model: selectedModel,
      }, turnstileToken);

      if (response.error) {
        setError(response.error);
        return;
      }

      if (response.image) {
        // Image is already a complete data URI from the worker
        setGeneratedImage(response.image);

        // Add to history
        const newHistoryItem = {
          image: response.image,
          prompt: jsonPrompt,
          timestamp: new Date().toISOString()
        };

        setHistory(prev => {
          const updated = [newHistoryItem, ...prev].slice(0, 10);
          try {
            localStorage.setItem('caricature-history', JSON.stringify(updated));
          } catch (err) {
            if (err instanceof Error && err.name === 'QuotaExceededError') {
              setError('History is full - please refresh the page to clear old creations');
            } else {
              console.error('Storage error:', err);
            }
          }
          return updated;
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate caricature';
      setError(errorMessage);
      console.error('Generation error:', err);
    } finally {
      setIsLoading(false);
      if (!isLocalhost && turnstileWidgetId && (window as any).turnstile) {
        (window as any).turnstile.reset(turnstileWidgetId);
        setTurnstileToken(null);
      }
    }
  };

  // Localhost detection
  useEffect(() => {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    setIsLocalhost(isLocal);
    if (isLocal) {
      // Auto-approve on localhost for development convenience
      setTurnstileToken('bypass');
    }
  }, []);

  // Turnstile initialization
  useEffect(() => {
    if (isLocalhost) {
      return; // Skip Turnstile widget on localhost
    }

    const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

    if (!siteKey) {
      setError('App configuration is missing. Please contact support.');
      return;
    }

    if (typeof window !== 'undefined' && (window as any).turnstile) {
      const widgetId = (window as any).turnstile.render('#turnstile-container', {
        sitekey: siteKey,
        callback: (token: string) => {
          setTurnstileToken(token);
        },
        'error-callback': () => {
          setTurnstileToken(null);
          setError('Turnstile verification failed. Please try again.');
        },
        'expired-callback': () => {
          setTurnstileToken(null);
        },
        theme: 'dark',
        size: 'normal',
      });
      setTurnstileWidgetId(widgetId);
    }
  }, [isLocalhost]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('caricature-history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Failed to load history:', err);
      localStorage.removeItem('caricature-history');
    }
    try {
      const savedPhoto = localStorage.getItem('caricature-user-photo');
      if (savedPhoto) {
        setUserPhoto(savedPhoto);
      }
    } catch (err) {
      console.error('Failed to load photo:', err);
      localStorage.removeItem('caricature-user-photo');
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

  // Handle remove photo
  const handleRemovePhoto = () => {
    setUserPhoto(null);
    try {
      localStorage.removeItem('caricature-user-photo');
    } catch (err) {
      console.error('Failed to remove photo:', err);
    }
  };

  // Handle photo selected from modal
  const handlePhotoSelected = (photoData: string) => {
    setUserPhoto(photoData);
    try {
      localStorage.setItem('caricature-user-photo', photoData);
    } catch (err) {
      if (err instanceof Error && err.name === 'QuotaExceededError') {
        setError('Storage is full - unable to save photo');
      } else {
        console.error('Failed to save photo:', err);
      }
    }
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

  // Confirm and delete history item
  const confirmDeleteHistoryItem = (idx: number) => {
    setHistory(prev => {
      const updated = prev.filter((_, i) => i !== idx);
      try {
        localStorage.setItem('caricature-history', JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save history:', err);
      }
      return updated;
    });
    setDeleteConfirmIdx(null);
  };

  // Cancel deletion
  const cancelDelete = () => {
    setDeleteConfirmIdx(null);
  };

  // Preview history item
  const previewHistoryItem = (item: any) => {
    setPreviewingHistoryItem(item);
    setGeneratedImage(item.image);
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
              {userPhoto ? (
                <div className="photo-preview-container">
                  <img src={userPhoto} alt="Your photo" className="photo-preview" />
                  <div className="flex gap-2">
                    <button className="remove-photo-btn" onClick={handleRemovePhoto}>✕ Remove</button>
                    <button className="change-photo-btn" onClick={() => setShowPhotoModal(true)}>📷 Change</button>
                  </div>
                </div>
              ) : (
                <button className="upload-trigger-btn w-full" onClick={() => setShowPhotoModal(true)}>
                  <span className="text-2xl mb-2">📸</span>
                  <span>Add Your Photo</span>
                </button>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-amber-200/80 mb-2">Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as ModelType)}
                className="custom-select w-full"
              >
                {AVAILABLE_MODELS.map(model => (
                  <option key={model} value={model}>
                    {model === 'flux-1-schnell' ? 'FLUX 1 Schnell' : 'SDXL Lightning'}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-amber-200/80 mb-2">Subject Type</label>
              <input
                type="text"
                className="custom-input w-full"
                placeholder="e.g., older man, young woman, businessman..."
                value={settings.subjectType}
                onChange={(e) => setSettings(prev => ({ ...prev, subjectType: e.target.value }))}
              />
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

            {!isLocalhost && <div id="turnstile-container" className="mb-4"></div>}

            <button onClick={makeItExtra} className="extra-btn w-full mt-4 ">🤫 Make it EXTRA</button>
            <button onClick={handleGenerateCaricature} disabled={isLoading || !turnstileToken} className="generate-btn w-full mt-4">
              {isLoading ? '⏳ Generating...' : '✨ Transform Your Photo'}
            </button>
            {error && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-200 text-sm">
                {error}
              </div>
            )}
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
              {generatedImage ? (
                <img src={generatedImage} alt="Generated Caricature" className="generated-image" />
              ) : (
                <div className="placeholder-state">
                  <span className="text-6xl mb-4">🎨</span>
                  <p className="text-amber-200/40">Your masterpiece awaits</p>
                  <p className="text-amber-200/20 text-sm mt-2">{isLoading ? 'Generating your caricature...' : 'Click Generate to create!'}</p>
                </div>
              )}
            </div>
            <div className="history-section mt-8">
              <h3 className="text-amber-400/80 text-sm font-semibold mb-4 uppercase tracking-wider">Recent Creations</h3>
              <div className="history-grid">
                {history.length > 0 ? (
                  history.map((item, idx) => (
                    <div
                      key={idx}
                      className="history-item-wrapper relative group"
                    >
                      {deleteConfirmIdx === idx ? (
                        <div className="absolute inset-0 bg-black/70 rounded flex flex-col items-center justify-center gap-2 z-10">
                          <p className="text-white text-xs font-semibold text-center px-2">Delete this?</p>
                          <div className="flex gap-1">
                            <button
                              onClick={() => confirmDeleteHistoryItem(idx)}
                              className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs font-bold transition"
                            >
                              Yes
                            </button>
                            <button
                              onClick={cancelDelete}
                              className="bg-slate-600 hover:bg-slate-700 text-white px-2 py-1 rounded text-xs font-bold transition"
                            >
                              No
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <img
                            src={item.image}
                            alt={`History ${idx}`}
                            className="history-thumb cursor-pointer hover:opacity-75 transition"
                            title={new Date(item.timestamp).toLocaleString()}
                            onClick={() => previewHistoryItem(item)}
                          />
                          <button
                            onClick={() => setDeleteConfirmIdx(idx)}
                            className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-sm font-bold"
                            title="Delete this creation"
                          >
                            ✕
                          </button>
                        </>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-amber-200/40 text-sm col-span-3">No creations yet - make some magic!</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <PhotoUploadModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        onPhotoSelected={handlePhotoSelected}
      />
    </div>
  )
}

export default App
