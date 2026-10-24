import { useState } from 'react'
import { Mic2, Cpu, Zap, Settings2, CheckCircle2, AlertCircle, ToggleLeft, ToggleRight, Volume2, Activity } from 'lucide-react'
import { useAIStore, type AIMode, type ModelType } from '../store/aiStore'
import { useAISpeech } from '../hooks/useAISpeech'
import { isSpeechCaptureAvailable } from '../lib/speechCapture'
import { cn } from '../lib/utils'

const MODELS: { id: ModelType; label: string; size: string; cpu: string; tier: string; recommended?: boolean }[] = [
  { id: 'vosk-small', label: 'Vosk Small', size: '50 MB', cpu: '< 5% CPU', tier: 'Community' },
  { id: 'whisper-tiny', label: 'Whisper Tiny', size: '75 MB', cpu: '< 15% CPU', tier: 'Standard', recommended: true },
  { id: 'whisper-base', label: 'Whisper Base', size: '142 MB', cpu: '< 30% CPU', tier: 'Standard' },
  { id: 'whisper-small', label: 'Whisper Small', size: '466 MB', cpu: '< 60% CPU', tier: 'Pro' },
]

const MODES: { id: AIMode; label: string; desc: string }[] = [
  { id: 'auto', label: 'Auto-Project', desc: 'Detected verses are projected immediately without operator confirmation' },
  { id: 'assisted', label: 'Assisted Mode', desc: 'Detected verses appear in the cue queue for operator review before projection' },
  { id: 'off', label: 'Off', desc: 'AI listening disabled entirely' },
]

export default function AIEngine() {
  const {
    mode, model, sensitivity, confidenceThreshold, isListening,
    audioInputDevice, audioLevel, transcriptBuffer,
    setMode, setModel, setSensitivity, setConfidenceThreshold,
    setIsListening, setAudioLevel, setAudioInputDevice,
  } = useAIStore()

  const [calibrating, setCalibrating] = useState(false)
  const [calibrated, setCalibrated] = useState(false)
  const [calibrationProgress, setCalibrationProgress] = useState(0)
  const speechAvailable = isSpeechCaptureAvailable()

  useAISpeech()

  const runCalibration = async () => {
    setCalibrating(true)
    setCalibrationProgress(0)
    const interval = setInterval(() => {
      setCalibrationProgress((p) => Math.min(100, p + 10))
    }, 300)
    try {
      if (window.luminary) await window.luminary.ai.calibrate()
      setCalibrated(true)
    } finally {
      clearInterval(interval)
      setCalibrating(false)
      setCalibrationProgress(100)
    }
  }

  return (
    <div className="h-full flex bg-[#13131a] overflow-y-auto">
      <div className="flex-1 p-8 max-w-5xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">AI Voice Engine</h1>
          <p className="text-[#C8C4D7] max-w-xl">Configure high-precision listening and automated cue synchronization for the worship environment.</p>
          {!speechAvailable && (
            <p className="text-amber-400/90 text-sm mt-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Speech recognition requires Chromium (Electron). Enable mic permissions when prompted.
            </p>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Input & Calibration */}
          <div className="lg:col-span-7 space-y-8">
            {/* Audio Input */}
            <section className="bg-[#1F1F26] p-6 rounded-xl relative overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-white font-bold tracking-tight flex items-center gap-2">
                  <Mic2 className="w-5 h-5 text-[#c6bfff]" />
                  Audio Input
                </h2>
                <span className="text-[10px] font-bold tracking-widest uppercase text-[#4bddb7]">
                  {isListening ? 'Listening' : 'Idle'}
                </span>
              </div>

              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => setIsListening(!isListening)}
                  className={cn(
                    'flex-1 py-3 rounded-xl font-bold text-sm transition-all',
                    isListening
                      ? 'bg-[#4bddb7]/20 text-[#4bddb7] border border-[#4bddb7]/40'
                      : 'bg-gradient-to-br from-[#6c5ce7] to-[#4029ba] text-white shadow-lg'
                  )}
                >
                  {isListening ? 'Stop Listening' : 'Start Listening'}
                </button>
              </div>

              <div className="space-y-6">
                {/* Device Selection */}
                <div className="relative">
                  <label className="block text-[10px] uppercase tracking-widest text-[#928ea0] mb-2">Device Selection</label>
                  <div className="bg-[#13131a] border border-[#474554]/30 px-4 py-3 rounded-xl flex justify-between items-center cursor-pointer hover:bg-[#1B1B22] transition-colors">
                    <span className="text-white font-medium">USB Audio Interface (Live Mix L/R)</span>
                    <span className="text-[#928ea0]">▼</span>
                  </div>
                </div>

                {/* VU Meter Visualization */}
                <div>
                  <div className="flex justify-between text-[10px] uppercase tracking-widest text-[#928ea0] mb-2">
                    <span>Input Level</span>
                    <span className="text-[#4bddb7]">{isListening ? (-14 + audioLevel * 10).toFixed(1) : '--'} dB</span>
                  </div>
                  <div className="h-8 bg-[#13131a] rounded-lg p-1 flex items-center overflow-hidden">
                    <div
                      className="h-full rounded-sm transition-all duration-100"
                      style={{
                        width: `${Math.max(5, audioLevel * 100)}%`,
                        background: `linear-gradient(to right, #00b894 0%, #00b894 60%, #f0bf63 80%, #ffb4ab 100%)`,
                        boxShadow: isListening ? '0 0 15px rgba(0,184,148,0.3)' : 'none'
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[8px] text-[#928ea0] mt-1 px-1">
                    <span>-∞</span>
                    <span>-40</span>
                    <span>-20</span>
                    <span>-12</span>
                    <span>-6</span>
                    <span className="text-[#ffb4ab]">0</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Room Calibration */}
            <section className="bg-[#1F1F26] p-6 rounded-xl border border-[#c6bfff]/10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-white font-bold tracking-tight mb-1">Room Calibration</h2>
                  <p className="text-sm text-[#928ea0]">Profile the noise floor to improve Whisper accuracy in loud environments.</p>
                </div>
                <button
                  onClick={runCalibration}
                  disabled={calibrating}
                  className="bg-gradient-to-br from-[#6c5ce7] to-[#4029ba] text-white px-8 py-3 rounded-xl font-bold tracking-tight shadow-xl shadow-[#6c5ce7]/20 active:scale-95 transition-all whitespace-nowrap disabled:opacity-50"
                >
                  {calibrating ? 'Calibrating...' : 'Calibrate Room (10s)'}
                </button>
              </div>

              {/* Progress Bar */}
              {calibrating && (
                <div className="mt-8 space-y-2">
                  <div className="flex justify-between items-center text-[10px] uppercase tracking-widest">
                    <span className="text-[#f0bf63] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#f0bf63] animate-pulse"></span>
                      Detecting Noise Floor...
                    </span>
                    <span className="text-[#928ea0]">{calibrationProgress}%</span>
                  </div>
                  <div className="h-1 w-full bg-[#13131a] rounded-full overflow-hidden">
                    <div className="h-full bg-[#f0bf63] rounded-full transition-all duration-200" style={{ width: `${calibrationProgress}%` }}></div>
                  </div>
                </div>
              )}

              {calibrated && !calibrating && (
                <div className="mt-6 flex items-center gap-2 text-[#4bddb7]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-semibold">Calibration Complete - Room Profile Saved</span>
                </div>
              )}
            </section>
          </div>

          {/* RIGHT COLUMN: Model & Settings */}
          <div className="lg:col-span-5 space-y-8">
            {/* Model Selection */}
            <section>
              <h2 className="text-[10px] uppercase tracking-widest text-[#928ea0] mb-4 font-bold">Inference Engine</h2>
              <div className="space-y-3">
                {MODELS.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => setModel(m.id)}
                    className={cn(
                      'p-4 rounded-xl border cursor-pointer transition-all',
                      model === m.id
                        ? 'bg-[#1F1F26] border-[#c6bfff] shadow-lg shadow-[#c6bfff]/5'
                        : 'bg-[#1F1F26] border-[#474554]/10 hover:border-[#c6bfff]/30'
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <span className={cn(
                          'material-symbols-outlined',
                          model === m.id ? 'text-[#c6bfff]' : 'text-[#928ea0]'
                        )}>
                          {m.id === 'vosk-small' ? 'speed' : m.recommended ? 'verified' : 'high_quality'}
                        </span>
                        <div>
                          <div className="text-white font-bold">{m.label}</div>
                          <div className="text-xs text-[#928ea0]">{m.cpu}</div>
                        </div>
                      </div>
                      <span className={cn(
                        'text-[9px] px-2 py-0.5 rounded-full',
                        model === m.id ? 'bg-[#c6bfff]/20 text-[#c6bfff]' : 'bg-[#2A2931] text-[#C8C4D7]'
                      )}>{m.size}</span>
                    </div>
                    {m.recommended && (
                      <div className="absolute -top-2 right-4 bg-[#c6bfff] text-[#2900a0] text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">Recommended</div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Sensitivity & Mode */}
            <section className="bg-[#1F1F26] p-6 rounded-xl space-y-6">
              {/* Auto-Project Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-xl bg-[#4bddb7]/10 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-[#4bddb7]" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">Auto-Project</div>
                    <div className="text-xs text-[#928ea0]">Seamless slide transitions.</div>
                  </div>
                </div>
                <button
                  onClick={() => setMode(mode === 'auto' ? 'off' : 'auto')}
                  className={cn(
                    'w-12 h-6 rounded-full relative transition-all',
                    mode === 'auto' ? 'bg-[#4bddb7]' : 'bg-[#2A2931]'
                  )}
                >
                  <div className={cn(
                    'absolute top-1 w-4 h-4 bg-white rounded-full transition-all',
                    mode === 'auto' ? 'right-1' : 'left-1'
                  )} />
                </button>
              </div>

              {/* Assisted Mode Toggle */}
              <div className="flex items-center justify-between">
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-xl bg-[#c6bfff]/10 flex items-center justify-center">
                    <Settings2 className="w-5 h-5 text-[#c6bfff]" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">Assisted</div>
                    <div className="text-xs text-[#928ea0]">UI prompts for manual cues.</div>
                  </div>
                </div>
                <button
                  onClick={() => setMode(mode === 'assisted' ? 'off' : 'assisted')}
                  className={cn(
                    'w-12 h-6 rounded-full relative transition-all',
                    mode === 'assisted' ? 'bg-[#c6bfff]' : 'bg-[#2A2931]'
                  )}
                >
                  <div className={cn(
                    'absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-all',
                    mode === 'assisted' ? 'right-1' : 'left-1'
                  )} />
                </button>
              </div>

              {/* Confidence Threshold */}
              <div className="pt-4 border-t border-[#474554]/15">
                <div className="flex justify-between text-[10px] uppercase tracking-widest text-[#928ea0] mb-4">
                  <span>Confidence Threshold</span>
                  <span className="text-white">{confidenceThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  value={confidenceThreshold}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    setConfidenceThreshold(v)
                    if (window.luminary) {
                      void window.luminary.settings.set('aiConfidenceThreshold', v / 100)
                    }
                  }}
                  className="w-full h-1 bg-[#13131a] rounded-lg appearance-none cursor-pointer accent-[#c6bfff]"
                />
              </div>
            </section>
          </div>
        </div>

        {/* Live Transcript Preview */}
        {isListening && (
          <div className="mt-8 bg-[#1F1F26] p-6 rounded-xl">
            <h3 className="text-[10px] uppercase tracking-widest text-[#928ea0] mb-3 font-bold flex items-center gap-2">
              <Activity className="w-3 h-3" />
              Live Transcript
            </h3>
            <p className="text-white font-mono text-sm leading-relaxed min-h-[3rem]">
              {transcriptBuffer || <span className="text-[#928ea0]">Listening for scripture references…</span>}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
