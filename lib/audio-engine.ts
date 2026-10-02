'use client';

import { ChangeEvent, PointerEvent, useEffect, useMemo, useRef, useState } from 'react';
import { DJAudioEngine, type DeckState } from '@/lib/audio-engine';

const engine = new DJAudioEngine();

type VisiblePair = [number, number];
const defaultPair: VisiblePair = [1, 2];

const deckNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const deckPalette = ['#8baec5', '#c9a465'];

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) return '00:00';
  const mins = Math.floor(value / 60);
  const secs = Math.floor(value % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function drawWaveform(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  samples: number[],
  deckColor: string,
  playhead: number,
  total: number,
  offset: number,
  accent: string,
) {
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.fillRect(0, 0, width, height);

  ctx.lineWidth = 1;
  const mid = height / 2;
  const step = Math.max(1, Math.floor(samples.length / width));

  for (let x = 0; x < width; x += 1) {
    let minY = 0;
    let maxY = 0;
    for (let i = 0; i < step; i += 1) {
      const idx = Math.min(samples.length - 1, x * step + i);
      const value = samples[idx] ?? 0;
      minY = Math.min(minY, value);
      maxY = Math.max(maxY, value);
    }

    const y1 = mid + minY * (height * 0.75);
    const y2 = mid + maxY * (height * 0.75);
    ctx.beginPath();
    ctx.strokeStyle = deckColor;
    ctx.moveTo(x, y1);
    ctx.lineTo(x, y2);
    ctx.stroke();
  }

  if (total > 0 && playhead >= 0) {
    const x = (playhead / total) * width;
    ctx.beginPath();
    ctx.strokeStyle = accent;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  const markerCount = 10;
  for (let i = 0; i < markerCount; i += 1) {
    const t = (i / markerCount) * width;
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.moveTo(t, 0);
    ctx.lineTo(t, height);
    ctx.stroke();
  }
}

function formatBpm(value: number) {
  return `${value.toFixed(1)} BPM`;
}

export default function Page() {
  const [decks, setDecks] = useState<DeckState[]>(() => engine.getDecks());
  const [pair, setPair] = useState<VisiblePair>(defaultPair);
  const [activeDeckId, setActiveDeckId] = useState(1);
  const [skin, setSkin] = useState<'PRO' | 'MODERN'>('PRO');
  const [crossfader, setCrossfader] = useState(0);
  const [library, setLibrary] = useState<{ title: string; artist: string; bpm: number; key: string; duration: string; genre: string; rating: number }[]>([
    { title: 'RUN THIS TOWN', artist: 'Jay-Z ft. Rihanna & Kanye West', bpm: 128.0, key: '8A', duration: '03:52', genre: 'Hip Hop', rating: 5 },
    { title: 'HYPNOTIZE', artist: 'The Notorious B.I.G.', bpm: 124.0, key: '7A', duration: '03:49', genre: 'Hip Hop', rating: 5 },
    { title: 'SICKO MODE', artist: 'Travis Scott', bpm: 130.0, key: '5A', duration: '05:12', genre: 'Hip Hop', rating: 4 },
    { title: 'GOOD’S PLAN', artist: 'Drake', bpm: 77.0, key: '2A', duration: '03:19', genre: 'Hip Hop', rating: 4 },
    { title: 'POWER', artist: 'Kanye West', bpm: 104.0, key: '10A', duration: '04:52', genre: 'Hip Hop', rating: 4 },
    { title: 'HUMBLE', artist: 'Kendrick Lamar', bpm: 150.0, key: '6A', duration: '02:57', genre: 'Hip Hop', rating: 5 },
  ]);

  const waveformRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);

  const leftDeck = useMemo(
    () => decks.find((deck) => deck.id === pair[0]) ?? decks[0],
    [decks, pair],
  );

  const rightDeck = useMemo(
    () => decks.find((deck) => deck.id === pair[1]) ?? decks[1],
    [decks, pair],
  );

  useEffect(() => {
    const update = () => {
      setDecks(engine.getDecks());
      setCrossfader(engine.getCrossfader());
      frameRef.current = requestAnimationFrame(update);
    };
    frameRef.current = requestAnimationFrame(update);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  useEffect(() => {
    const canvas = waveformRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = canvas.clientWidth || 1200;
    const height = canvas.clientHeight || 110;
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    const leftSamples = leftDeck?.waveform ?? [];
    const rightSamples = rightDeck?.waveform ?? [];

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    ctx.fillRect(0, 0, width, height);

    const drawDeck = (samples: number[], deckColor: string, accent: string, playhead: number, total: number) => {
      const w = width;
      const h = height;
      const mid = h / 2;
      const step = Math.max(1, Math.floor(samples.length / w));
      for (let x = 0; x < w; x += 1) {
        let minY = 0;
        let maxY = 0;
        for (let i = 0; i < step; i += 1) {
          const idx = Math.min(samples.length - 1, x * step + i);
          const value = samples[idx] ?? 0;
          minY = Math.min(minY, value);
          maxY = Math.max(maxY, value);
        }
        const y1 = mid + minY * (h * 0.75);
        const y2 = mid + maxY * (h * 0.75);
        ctx.beginPath();
        ctx.strokeStyle = deckColor;
        ctx.moveTo(x, y1);
        ctx.lineTo(x, y2);
        ctx.stroke();
      }
      if (total > 0 && playhead >= 0) {
        const px = (playhead / total) * w;
        ctx.beginPath();
        ctx.strokeStyle = accent;
        ctx.moveTo(px, 0);
        ctx.lineTo(px, h);
        ctx.stroke();
      }
    };

    drawDeck(leftSamples, '#8aaec3', '#c6d8dd', leftDeck?.position ?? 0, leftDeck?.duration ?? 1);
    drawDeck(rightSamples, '#d5b17b', '#f3d7a6', rightDeck?.position ?? 0, rightDeck?.duration ?? 1);
  }, [decks, leftDeck, rightDeck, pair]);

  const loadTrack = async (deckId: number, file: File) => {
    const fileUrl = URL.createObjectURL(file);
    await engine.loadTrackFromFile(deckId, file, fileUrl);
    setDecks(engine.getDecks());
  };

  const deckView = (id: number) => {
    setActiveDeckId(id);
    const deck = decks.find((d) => d.id === id);
    if (deck) {
      engine.setSelectedDeck(id);
    }
  };

  const shiftToPair = (nextPair: VisiblePair) => {
    setPair(nextPair);
    engine.setVisiblePair(nextPair);
  };

  const changeDeckMode = (mode: '2' | '4' | '8') => {
    engine.setDeckMode(mode);
  };

  const onFileInput = (event: ChangeEvent<HTMLInputElement>, deckId: number) => {
    const file = event.target.files?.[0];
    if (file) {
      loadTrack(deckId, file);
    }
    event.target.value = '';
  };

  const rotateDeck = (event: PointerEvent<HTMLDivElement>, deckId: number) => {
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const angle = Math.atan2(event.clientY - centerY, event.clientX - centerX);
    engine.handleJogInteraction(deckId, angle);
  };

  const renderDeck = (deck: DeckState) => {
    const isActive = deck.id === activeDeckId;
    const info = deck.isLoaded ? deck.title : 'No track loaded';
    const artist = deck.isLoaded ? deck.artist : 'Load a track to begin';
    const bpmText = deck.isLoaded ? formatBpm(deck.bpm) : '0.0 BPM';

    return (
      <div key={deck.id} className="deck-panel overflow-hidden rounded-xl border border-[#2a2a2a] bg-[#111111] shadow-hardware" style={{ borderColor: isActive ? 'rgba(198,162,106,0.8)' : 'rgba(255,255,255,0.08)' }}>
        <div className="bg-[#111111] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#d6d6d6]">
          {deck.id === 1 || deck.id === 2 ? 'A' : 'B'}
        </div>
        <div className="flex items-start justify-between gap-3 px-3 pb-2">
          <div className="flex min-w-0 items-center gap-3">
            <div className="h-12 w-12 rounded-sm border border-[#353535] bg-[#111]" />
            <div className="min-w-0">
              <div className="truncate text-[14px] font-bold uppercase tracking-[0.08em] text-[#f0f0f0]">{info}</div>
              <div className="truncate text-[11px] text-[#b5b5b5]">{artist}</div>
            </div>
          </div>
          <div className="text-right text-[11px] uppercase tracking-[0.15em] text-[#d6b575]">
            <div>{bpmText}</div>
            <div>{deck.key}</div>
          </div>
        </div>

        <div className="px-3 pb-2 text-[10px] uppercase tracking-[0.2em] text-[#909090]">
          <div className="flex justify-between gap-3">
            <span>{formatTime(deck.position)}</span>
            <span>{formatTime(deck.duration)}</span>
          </div>
        </div>

        <div className="flex items-center justify-evenly gap-3 px-3 pb-3">
          <div className="relative h-[150px] w-[150px]">
            <div className="vinyl-surface absolute inset-0 rounded-full border-[2px] border-[#121212]" style={{ boxShadow: `0 0 0 5px ${deck.id % 2 === 0 ? '#c8a36d' : '#7ea7c1'}40` }}>
              <div className="absolute inset-[18px] rounded-full border border-[#4b4b4b]" />
              <div className="absolute left-1/2 top-1/2 h-[38px] w-[38px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#3b3b3b] bg-[#111]" />
              <div className="absolute left-1/2 top-1/2 h-[26px] w-[26px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0d0d0d] text-[10px] font-black uppercase tracking-[0.3em] text-[#d1b171]" style={{ display: 'grid', placeItems: 'center' }}>
                SPIN
                <span className="text-[9px]">DAT</span>
              </div>
            </div>
            <div
              className="absolute inset-0 rounded-full"
              style={{
                transform: `rotate(${(deck.position / (deck.duration || 1)) * 360 * 8}deg)`,
                transition: 'transform 0.05s linear',
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 px-3 pb-3">
          <button
            className="h-8 w-8 rounded-md border border-[#4b4b4b] bg-[#1a1a1a] text-xs text-[#f0f0f0]"
            onClick={() => engine.togglePlay(deck.id)}
          >
            {deck.isPlaying ? '⏸' : '▶'}
          </button>
          <button className="h-8 w-8 rounded-md border border-[#4b4b4b] bg-[#1a1a1a] text-xs text-[#f0f0f0]" onClick={() => engine.cue(deck.id)}>
            CUE
          </button>
          <button className="h-8 w-8 rounded-md border border-[#4b4b4b] bg-[#1a1a1a] text-xs text-[#f0f0f0]" onClick={() => engine.seek(deck.id, 0)}>
            ↺
          </button>
          <button className="h-8 w-8 rounded-md border border-[#4b4b4b] bg-[#1a1a1a] text-xs text-[#f0f0f0]" onClick={() => engine.selectDeck(deck.id)}>
            ⟳
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 px-3 pb-3">
          <label className="rounded-md border border-[#373737] bg-[#151515] p-2 text-[10px] uppercase tracking-[0.12em] text-[#bcbcbc]">
            <div>Load</div>
            <input type="file" accept="audio/*" onChange={(e) => onFileInput(e, deck.id)} className="mt-1 block w-full text-[9px] text-[#f0f0f0]" />
          </label>
          <button className="rounded-md border border-[#373737] bg-[#151515] p-2 text-[10px] uppercase tracking-[0.12em] text-[#f0f0f0]" onClick={() => deckView(deck.id)}>
            Active
          </button>
        </div>
      </div>
    );
  };

  const activeDeck = decks.find((deck) => deck.id === activeDeckId) || decks[0];

  return (
    <main className="min-h-screen bg-[#090909] p-3 text-[#f5f5f5]">
      <div className="mx-auto max-w-[1700px] rounded-[18px] border border-[#252525] bg-[#111111] p-3 shadow-hardware">
        <header className="flex items-center justify-between gap-4 border-b border-[#272727] pb-3">
          <div className="flex items-center gap-3">
            <button className="h-8 w-8 rounded-md border border-[#3b3b3b] bg-[#171717] text-xl text-[#f7f7f7]">☰</button>
            <div>
              <div className="font-black uppercase tracking-[0.12em] text-[#f2e8d3]" style={{ fontSize: '30px', letterSpacing: '0.08em' }}>
                SPIN DAT
              </div>
              <div className="text-[10px] uppercase tracking-[0.28em] text-[#8c8c8c]">HIP HOP • MIX • CREATE • PERFORM</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {[['2 DECK', 2], ['4 DECK', 4], ['8 DECK', 8]].map(([label, value]) => (
              <button
                key={label}
                onClick={() => changeDeckMode(String(value) as '2' | '4' | '8')}
                className={`rounded-md border px-3 py-2 text-[11px] font-bold uppercase tracking-[0.15em] ${value === 2 ? 'border-[#d3ad69] bg-[#1a1a1a] text-[#f2d7a1]' : 'border-[#343434] bg-[#111] text-[#d9d9d9]'}`}
              >
                {label}
              </button>
            ))}
            <button className="rounded-md border border-[#343434] bg-[#111] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#d9d9d9]">
              DECK VIEW
            </button>
          </div>

          <div className="flex items-center gap-3 text-[12px] uppercase tracking-[0.16em] text-[#f5f5f5]">
            <div className="rounded-md border border-[#373737] bg-[#101010] px-2 py-1">HEADPHONES</div>
            <div className="flex items-center gap-2 rounded-md border border-[#373737] bg-[#101010] px-2 py-1">
              <span className="text-[#bcbcbc]">MASTER</span>
              <div className="flex items-end gap-[2px]">
                {[70, 92, 58, 74, 82].map((v, idx) => (
                  <div key={idx} className="h-3 w-[5px] rounded-[2px] bg-[#f0c67d]" style={{ opacity: idx >= 3 ? 0.35 : 1, height: `${v / 2}px` }} />
                ))}
              </div>
              <span className="text-[#d7b575]">120.0 V</span>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#343434] bg-[#1a1a1a] text-sm">◉</div>
          </div>
        </header>

        <div className="mt-3">
          <div className="mb-2 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <button className="rounded-md border border-[#3c3c3c] bg-[#171717] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#d8b67d]" onClick={() => shiftToPair([pair[0] - 2 >= 1 ? pair[0] - 2 : 1, pair[1] - 2 >= 2 ? pair[1] - 2 : 2])}>
                &lt; SHIFT
              </button>
              <div className="text-[11px] uppercase tracking-[0.2em] text-[#d4d4d4]">{pair[0]} • {pair[1]}</div>
              <button className="rounded-md border border-[#3c3c3c] bg-[#171717] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-[#d8b67d]" onClick={() => shiftToPair([pair[0] + 2 <= 7 ? pair[0] + 2 : 1, pair[1] + 2 <= 8 ? pair[1] + 2 : 2])}>
                SHIFT &gt;
              </button>
            </div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-[#d7c7a9]">{skin} MODE</div>
          </div>

          <div className="waveform-glow mb-3 h-[110px] overflow-hidden rounded-xl border border-[#2d2d2d] bg-[#101010] p-2">
            <canvas ref={waveformRef} className="h-full w-full rounded-md" />
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.8fr_1.15fr]">
          <section className="space-y-3">
            {renderDeck(leftDeck)}
          </section>

          <section className="relative rounded-xl border border-[#2d2d2d] bg-[#101010] p-3">
            <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-[#c7af75]">
              <span>MASTER</span>
              <span>{crossfader.toFixed(2)}</span>
            </div>

            <div className="space-y-3">
              <div className="rounded-lg border border-[#2b2b2b] bg-[#0d0d0d] p-3">
                <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-[#cfcfcf]">
                  <span>TRIM</span>
                  <span>+0.0</span>
                </div>
                <input className="slider" type="range" min={-10} max={10} step={0.1} defaultValue={0} />
              </div>

              {[['HIGH', activeDeck.high], ['MID', activeDeck.mid], ['LOW', activeDeck.low], ['FILTER', activeDeck.filter]].map(([label, value]) => (
                <div key={label as string} className="rounded-lg border border-[#2b2b2b] bg-[#0d0d0d] p-3">
                  <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-[#cfcfcf]">
                    <span>{label}</span>
                    <span>{Number(value).toFixed(1)}</span>
                  </div>
                  <input
                    className="slider"
                    type="range"
                    min={-12}
                    max={12}
                    step={0.1}
                    value={Number(value)}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (label === 'HIGH') engine.setEq(activeDeckId, 'high', val);
                      if (label === 'MID') engine.setEq(activeDeckId, 'mid', val);
                      if (label === 'LOW') engine.setEq(activeDeckId, 'low', val);
                      if (label === 'FILTER') engine.setFilter(activeDeckId, val);
                      setDecks(engine.getDecks());
                    }}
                  />
                </div>
              ))}

              <div className="rounded-lg border border-[#2b2b2b] bg-[#0d0d0d] p-3">
                <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.18em] text-[#cfcfcf]">
                  <span>Crossfader</span>
                  <span>{crossfader.toFixed(2)}</span>
                </div>
                <input
                  className="slider"
                  type="range"
                  min={-1}
                  max={1}
                  step={0.01}
                  value={crossfader}
                  onChange={(e) => {
                    const nextValue = Number(e.target.value);
                    engine.setCrossfader(nextValue);
                    setCrossfader(nextValue);
                    setDecks(engine.getDecks());
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button className="rounded-md border border-[#3c3c3c] bg-[#1a1a1a] px-2 py-2 text-[10px] uppercase tracking-[0.18em] text-[#f5f5f5]">HEADPHONE CUE</button>
                <button className="rounded-md border border-[#3c3c3c] bg-[#1a1a1a] px-2 py-2 text-[10px] uppercase tracking-[0.18em] text-[#f5f5f5]">MASTER</button>
                <button className="rounded-md border border-[#3c3c3c] bg-[#1a1a1a] px-2 py-2 text-[10px] uppercase tracking-[0.18em] text-[#f5f5f5]">CUE</button>
                <button className="rounded-md border border-[#3c3c3c] bg-[#1a1a1a] px-2 py-2 text-[10px] uppercase tracking-[0.18em] text-[#f5f5f5]">SYNC</button>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            {renderDeck(rightDeck)}
          </section>
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-xl border border-[#2d2d2d] bg-[#111111] p-3">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-[0.22em] text-[#d0b175]">Tracks</div>
              <div className="text-[11px] uppercase tracking-[0.22em] text-[#8b8b8b]">Records</div>
            </div>

            <div className="overflow-hidden rounded-lg border border-[#2b2b2b] bg-[#0e0e0e]">
              <div className="grid grid-cols-[36px_1.2fr_1fr_70px_60px_70px_80px] gap-2 border-b border-[#2b2b2b] bg-[#121212] px-3 py-2 text-[10px] uppercase tracking-[0.18em] text-[#b9b9b9]">
                <span>#</span>
                <span>Title</span>
                <span>Artist</span>
                <span>BPM</span>
                <span>Key</span>
                <span>Time</span>
                <span>Genre</span>
              </div>

              {library.map((track, index) => (
                <div key={track.title} className="grid grid-cols-[36px_1.2fr_1fr_70px_60px_70px_80px] gap-2 border-b border-[#222] px-3 py-2 text-[11px] text-[#f0f0f0] last:border-0 hover:bg-[#181818]">
                  <span className="text-[#a1a1a1]">{index + 1}</span>
                  <span className="font-bold text-[#f0f0f0]">{track.title}</span>
                  <span className="text-[#d7d7d7]">{track.artist}</span>
                  <span className="text-[#d5b265]">{track.bpm.toFixed(1)}</span>
                  <span className="text-[#b9b9b9]">{track.key}</span>
                  <span className="text-[#b9b9b9]">{track.duration}</span>
                  <span className="text-[#b9b9b9]">{track.genre}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#2d2d2d] bg-[#111111] p-3">
            <div className="mb-3 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-[#d0b175]">
              <span>Sampler</span>
              <span>Deck {activeDeckId}</span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <button key={index} className="rounded-md border border-[#383838] bg-[#171717] px-2 py-4 text-[10px] uppercase tracking-[0.18em] text-[#f5f5f5]">
                  {index + 1}
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-md border border-[#2c2c2c] bg-[#0d0d0d] p-3">
              <div className="mb-2 text-[10px] uppercase tracking-[0.18em] text-[#bcbcbc]">Volume</div>
              <input
                className="slider"
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={activeDeck.volume}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  engine.setVolume(activeDeckId, next);
                  setDecks(engine.getDecks());
                }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <button className="flex-1 rounded-md border border-[#3a3a3a] bg-[#171717] px-2 py-2 text-[10px] uppercase tracking-[0.18em] text-[#f5f5f5]">Record</button>
              <button className="flex-1 rounded-md border border-[#3a3a3a] bg-[#171717] px-2 py-2 text-[10px] uppercase tracking-[0.18em] text-[#f5f5f5]">Auto Mix</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
