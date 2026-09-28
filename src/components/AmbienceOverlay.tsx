import React, { useEffect } from 'react';
import { Sparkles, CloudRain, Flame, Wind, Volume2, X, Sliders, Heart, Sun, Zap, Palette, Power } from 'lucide-react';
import { AmbienceConfig, AmbienceTheme, AmbienceSoundType } from '../types';
import { ambienceAudio } from '../utils/ambienceAudio';

interface AmbienceOverlayProps {
  config: AmbienceConfig;
  onChangeConfig: (config: AmbienceConfig) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const AmbienceOverlay: React.FC<AmbienceOverlayProps> = ({
  config,
  onChangeConfig,
  isOpen,
  onClose,
}) => {
  // Sync audio with configuration changes
  useEffect(() => {
    if (config.sound === 'none' || config.theme === 'off') {
      ambienceAudio.stop();
    } else {
      ambienceAudio.play(config.sound, config.volume);
    }
  }, [config.sound, config.theme]);

  useEffect(() => {
    ambienceAudio.setVolume(config.volume);
  }, [config.volume]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      ambienceAudio.stop();
    };
  }, []);

  const intensityMultiplier =
    config.intensity === 'soft'
      ? 0.4
      : config.intensity === 'medium'
      ? 0.7
      : config.intensity === 'ultra'
      ? 1.0
      : 0.85; // vibrant (default)

  const handleThemeSelect = (theme: AmbienceTheme) => {
    onChangeConfig({
      ...config,
      theme,
      sound:
        theme === 'rain'
          ? 'rain'
          : theme === 'candlelight'
          ? 'crackle'
          : theme === 'aurora'
          ? 'breeze'
          : config.sound,
    });
  };

  return (
    <>
      {/* VIBRANT FULL-SCREEN AMBIENT GLOW LAYER */}
      {config.theme !== 'off' && (
        <div
          className="fixed inset-0 pointer-events-none z-20 overflow-hidden transition-opacity duration-700"
          style={{ opacity: intensityMultiplier }}
        >
          {/* RAINBOW PRISM FLOW THEME */}
          {config.theme === 'rainbow' && (
            <>
              {/* Full Perimeter Luminous Inset Edge Glow */}
              <div
                className="absolute inset-0 animate-pulse"
                style={{
                  boxShadow:
                    'inset 0 0 70px 15px rgba(236,72,153,0.45), inset 0 0 130px 40px rgba(168,85,247,0.35), inset 0 0 200px 60px rgba(6,182,212,0.25)',
                  animationDuration: '4s',
                }}
              />
              {/* 4 Corner Dynamic Color Auras */}
              <div
                className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl animate-pulse"
                style={{
                  background: 'radial-gradient(circle, #f43f5e 20%, #a855f7 60%, transparent)',
                  animationDuration: '3.5s',
                }}
              />
              <div
                className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl animate-pulse"
                style={{
                  background: 'radial-gradient(circle, #06b6d4 20%, #3b82f6 60%, transparent)',
                  animationDuration: '4.2s',
                }}
              />
              <div
                className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-3xl animate-pulse"
                style={{
                  background: 'radial-gradient(circle, #10b981 20%, #eab308 60%, transparent)',
                  animationDuration: '3.8s',
                }}
              />
              <div
                className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-3xl animate-pulse"
                style={{
                  background: 'radial-gradient(circle, #ec4899 20%, #8b5cf6 60%, transparent)',
                  animationDuration: '4.5s',
                }}
              />
              {/* Floating Multi-Color Light Orbs */}
              {Array.from({ length: 14 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full blur-md opacity-70 animate-pulse"
                  style={{
                    width: `${12 + (i % 4) * 8}px`,
                    height: `${12 + (i % 4) * 8}px`,
                    left: `${(i * 18 + 7) % 94}%`,
                    top: `${(i * 24 + 11) % 90}%`,
                    backgroundColor: ['#f43f5e', '#a855f7', '#06b6d4', '#10b981', '#fbbf24', '#ec4899'][i % 6],
                    boxShadow: `0 0 25px 8px ${['#f43f5e', '#a855f7', '#06b6d4', '#10b981', '#fbbf24', '#ec4899'][i % 6]}`,
                    animationDuration: `${2.2 + (i % 4) * 0.7}s`,
                  }}
                />
              ))}
            </>
          )}

          {/* ROMANTIC PASSION GLOW (LOVE & HEARTS) */}
          {config.theme === 'romantic' && (
            <>
              <div
                className="absolute inset-0 animate-pulse"
                style={{
                  boxShadow:
                    'inset 0 0 80px 25px rgba(244,63,94,0.55), inset 0 0 160px 50px rgba(236,72,153,0.35)',
                  animationDuration: '3s',
                }}
              />
              <div
                className="absolute inset-x-0 bottom-0 h-64 blur-3xl opacity-60"
                style={{
                  background: 'radial-gradient(ellipse at bottom, #f43f5e 20%, #ec4899 50%, transparent 80%)',
                }}
              />
              {/* Floating Glowing Love Hearts */}
              {Array.from({ length: 16 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute text-pink-400 blur-[0.5px] animate-pulse"
                  style={{
                    fontSize: `${16 + (i % 4) * 6}px`,
                    left: `${(i * 17 + 5) % 92}%`,
                    top: `${(i * 26 + 8) % 88}%`,
                    filter: 'drop-shadow(0 0 12px #f43f5e)',
                    animationDuration: `${2 + (i % 3) * 0.8}s`,
                    animationDelay: `${i * 0.25}s`,
                  }}
                >
                  ❤️
                </div>
              ))}
            </>
          )}

          {/* CYBERPUNK NEON (ELECTRIC CYAN & PURPLE) */}
          {config.theme === 'cyberpunk' && (
            <>
              <div
                className="absolute inset-0 animate-pulse"
                style={{
                  boxShadow:
                    'inset 0 0 80px 20px rgba(6,182,212,0.6), inset 0 0 150px 45px rgba(168,85,247,0.45)',
                  animationDuration: '2.5s',
                }}
              />
              <div
                className="absolute -top-20 inset-x-0 h-40 blur-2xl opacity-60"
                style={{
                  background: 'linear-gradient(90deg, #06b6d4, #a855f7, #06b6d4)',
                }}
              />
              <div
                className="absolute -bottom-20 inset-x-0 h-40 blur-2xl opacity-60"
                style={{
                  background: 'linear-gradient(90deg, #a855f7, #06b6d4, #a855f7)',
                }}
              />
            </>
          )}

          {/* SUNSET TWILIGHT (WARM GOLD & CORAL) */}
          {config.theme === 'sunset' && (
            <>
              <div
                className="absolute inset-0 animate-pulse"
                style={{
                  boxShadow:
                    'inset 0 0 75px 20px rgba(245,158,11,0.5), inset 0 0 160px 45px rgba(239,68,68,0.35)',
                  animationDuration: '3.6s',
                }}
              />
              <div
                className="absolute -bottom-28 inset-x-0 h-80 blur-3xl opacity-70"
                style={{
                  background: 'radial-gradient(circle at center bottom, #fbbf24 15%, #f97316 45%, #ef4444 75%, transparent)',
                }}
              />
            </>
          )}

          {/* COSMIC AURORA (EMERALD & SAPPHIRE) */}
          {config.theme === 'aurora' && (
            <>
              <div
                className="absolute inset-0 animate-pulse"
                style={{
                  boxShadow:
                    'inset 0 0 75px 20px rgba(16,185,129,0.5), inset 0 0 150px 40px rgba(59,130,246,0.35)',
                  animationDuration: '4s',
                }}
              />
              <div
                className="absolute -top-32 inset-x-0 h-96 blur-3xl opacity-60 animate-pulse"
                style={{
                  background: 'linear-gradient(90deg, #10b981, #06b6d4, #6366f1, #10b981)',
                  animationDuration: '6s',
                }}
              />
            </>
          )}

          {/* COZY CANDLELIGHT (ORGANIC HEARTH) */}
          {config.theme === 'candlelight' && (
            <>
              <div
                className="absolute inset-0 animate-pulse"
                style={{
                  boxShadow:
                    'inset 0 0 85px 25px rgba(217,119,6,0.6), inset 0 0 170px 50px rgba(180,83,9,0.35)',
                  animationDuration: '2.8s',
                }}
              />
              <div
                className="absolute -bottom-16 inset-x-12 h-64 blur-3xl opacity-60 animate-pulse"
                style={{
                  background: 'radial-gradient(circle, #f59e0b 20%, #b45309 60%, transparent)',
                  animationDuration: '2.4s',
                }}
              />
            </>
          )}

          {/* FAIRY LIGHTS */}
          {config.theme === 'fairylights' && (
            <>
              <div
                className="absolute inset-0"
                style={{
                  boxShadow:
                    'inset 0 0 60px 15px rgba(253,224,71,0.35), inset 0 0 120px 30px rgba(244,63,94,0.25)',
                }}
              />
              <div className="absolute top-0 inset-x-0 h-20 flex justify-around items-start opacity-90">
                {Array.from({ length: 18 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-3.5 h-4.5 rounded-full blur-[0.5px] animate-pulse"
                    style={{
                      backgroundColor: ['#fef08a', '#fda4af', '#93c5fd', '#a7f3d0', '#fde047'][i % 5],
                      boxShadow: `0 0 20px 6px ${['#fef08a', '#fda4af', '#93c5fd', '#a7f3d0', '#fde047'][i % 5]}`,
                      animationDuration: `${1.2 + (i % 4) * 0.4}s`,
                      transform: `translateY(${Math.sin(i) * 12 + 8}px)`,
                    }}
                  />
                ))}
              </div>
            </>
          )}

          {/* RAIN */}
          {config.theme === 'rain' && (
            <div
              className="absolute inset-0"
              style={{
                boxShadow: 'inset 0 0 90px 30px rgba(30,58,138,0.7)',
                backgroundImage:
                  'repeating-linear-gradient(170deg, transparent, transparent 35px, rgba(147, 197, 253, 0.4) 36px, transparent 38px)',
              }}
            />
          )}
        </div>
      )}

      {/* AMBIENCE CONTROL MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700/80 rounded-3xl p-6 shadow-2xl space-y-5 text-white max-h-[92vh] overflow-y-auto">
            {/* Header with Quick Power Toggle */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-pink-500 via-purple-500 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black flex items-center gap-1.5 text-white">
                    Screen Glow & Ambience (माहौल)
                  </h3>
                  <p className="text-xs text-zinc-400">Dynamic colorful screen backlights & relaxing soundscapes</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    onChangeConfig({
                      ...config,
                      theme: config.theme === 'off' ? 'rainbow' : 'off',
                    })
                  }
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                    config.theme !== 'off'
                      ? 'bg-emerald-500 text-black shadow-md'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{config.theme !== 'off' ? 'Active' : 'Turn On'}</span>
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Glowing Themes Grid */}
            <div className="space-y-2.5">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                Choose Screen Glow Color Aura
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  {
                    id: 'rainbow',
                    label: 'Rainbow Flow',
                    desc: 'Multi-Color RGB Wave',
                    gradient: 'from-pink-500 via-purple-500 to-cyan-400',
                    icon: '🌈',
                  },
                  {
                    id: 'romantic',
                    label: 'Romantic Love',
                    desc: 'Deep Rose & Crimson',
                    gradient: 'from-rose-500 to-pink-500',
                    icon: '💖',
                  },
                  {
                    id: 'cyberpunk',
                    label: 'Cyberpunk Neon',
                    desc: 'Electric Cyan & Violet',
                    gradient: 'from-cyan-400 to-purple-600',
                    icon: '⚡',
                  },
                  {
                    id: 'sunset',
                    label: 'Sunset Twilight',
                    desc: 'Warm Amber & Gold',
                    gradient: 'from-amber-400 to-red-500',
                    icon: '🌅',
                  },
                  {
                    id: 'aurora',
                    label: 'Cosmic Aurora',
                    desc: 'Emerald & Sapphire',
                    gradient: 'from-emerald-400 to-blue-600',
                    icon: '🌌',
                  },
                  {
                    id: 'candlelight',
                    label: 'Candle Hearth',
                    desc: 'Warm Campfire Flicker',
                    gradient: 'from-amber-500 to-orange-700',
                    icon: '🕯️',
                  },
                  {
                    id: 'fairylights',
                    label: 'Fairy Bulbs',
                    desc: 'Twinkling Hanging Bulbs',
                    gradient: 'from-yellow-300 to-pink-400',
                    icon: '✨',
                  },
                  {
                    id: 'rain',
                    label: 'Rainy Night',
                    desc: 'Moody Deep Blue',
                    gradient: 'from-blue-600 to-indigo-900',
                    icon: '🌧️',
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleThemeSelect(item.id as AmbienceTheme)}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 relative overflow-hidden group ${
                      config.theme === item.id
                        ? 'border-white bg-zinc-800 shadow-xl shadow-purple-950/50 scale-[1.02]'
                        : 'border-zinc-800 bg-zinc-950/70 hover:border-zinc-700 hover:bg-zinc-800/80'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <span className="text-xl">{item.icon}</span>
                      <div
                        className={`w-3.5 h-3.5 rounded-full bg-gradient-to-tr ${item.gradient} shadow-sm`}
                      />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white group-hover:text-pink-300 transition">
                        {item.label}
                      </p>
                      <p className="text-[10px] text-zinc-400 leading-tight mt-0.5">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Glow Intensity Selector */}
            {config.theme !== 'off' && (
              <div className="space-y-2 pt-1 border-t border-zinc-800">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                  Screen Glow Brightness / Intensity
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'soft', label: 'Soft Aura' },
                    { id: 'medium', label: 'Medium' },
                    { id: 'vibrant', label: 'Vibrant' },
                    { id: 'ultra', label: 'Ultra Room Glow 🔥' },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      onClick={() =>
                        onChangeConfig({
                          ...config,
                          intensity: lvl.id as any,
                        })
                      }
                      className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition text-center truncate ${
                        (config.intensity || 'vibrant') === lvl.id
                          ? 'bg-pink-500/20 border-pink-400 text-pink-300'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                      }`}
                    >
                      {lvl.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Background Soundscape */}
            <div className="space-y-2 pt-1 border-t border-zinc-800">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                Relaxing Background Soundscape
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'none', label: 'Muted', icon: '🔇' },
                  { id: 'rain', label: 'Soft Rain', icon: '🌧️' },
                  { id: 'crackle', label: 'Campfire', icon: '🔥' },
                  { id: 'breeze', label: 'Night Breeze', icon: '🌬️' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() =>
                      onChangeConfig({
                        ...config,
                        sound: item.id as AmbienceSoundType,
                      })
                    }
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition ${
                      config.sound === item.id
                        ? 'bg-teal-500/20 border-teal-400 text-teal-300'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Ambience Volume Slider */}
            {config.sound !== 'none' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-teal-400" />
                    Soundscape Volume
                  </span>
                  <span>{Math.round(config.volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={config.volume}
                  onChange={(e) =>
                    onChangeConfig({
                      ...config,
                      volume: parseFloat(e.target.value),
                    })
                  }
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
                />
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:opacity-90 text-black font-black rounded-2xl text-xs transition shadow-lg shadow-purple-950/40"
            >
              Apply Glow & Close ✨
            </button>
          </div>
        </div>
      )}
    </>
  );
};
