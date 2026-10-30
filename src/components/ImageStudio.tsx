import React, { useState, useRef } from 'react';
import { GeneratedImageItem } from '../types/keno';
import {
  Sparkles,
  Wand2,
  Image as ImageIcon,
  Upload,
  Download,
  Copy,
  Check,
  Maximize2,
  Trash2,
  Layers,
  ArrowRight,
  AlertCircle,
  Loader2,
  Sliders,
  Ratio,
  Info,
} from 'lucide-react';

interface ImageStudioProps {
  selectedSpots: number[];
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
}

const PRESET_PROMPTS = [
  {
    title: 'Golden Talisman',
    prompt:
      'A majestic circular casino talisman medallion made of polished gold, deeply engraved with lucky glowing Keno numbers {NUMBERS}, resting on rich emerald casino felt with cinematic lighting and subtle floating golden particles, 8k render.',
  },
  {
    title: 'Neon 1980s Keno Lounge',
    prompt:
      'A vintage 1980s retro neon casino Keno lounge with glowing cyan and hot pink neon tubes, a wooden ticket counter, CRT displays showing an 80-number statistical grid, atmospheric cinematic film grain.',
  },
  {
    title: 'Cosmic Lottery Hopper',
    prompt:
      'An antique brass and glass Keno goose ball hopper spinning weightlessly in a deep cosmic nebula, glowing planetary lottery balls numbered {NUMBERS} floating in space with stardust trails.',
  },
  {
    title: 'Cyberpunk Matrix Board',
    prompt:
      'A futuristic cyberpunk terminal displaying a holographic 80-ball Keno probability heatmap matrix, glowing green and violet wireframe analytics, volumetric neon spotlights, hyper-detailed tech interface.',
  },
];

export const ImageStudio: React.FC<ImageStudioProps> = ({
  selectedSpots,
  initialPrompt = '',
  onClearInitialPrompt,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'edit' | 'gallery'>('create');

  // Generation state
  const [prompt, setPrompt] = useState(
    initialPrompt ||
      'A majestic circular casino talisman medallion made of polished gold, engraved with lucky Keno numbers 7, 14, 21, 77 on deep green velvet, cinematic lighting'
  );
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('1:1');
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [quotaNotice, setQuotaNotice] = useState<string | null>(null);

  // Edit state
  const [sourceImageForEdit, setSourceImageForEdit] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('Add glowing golden sparkles and a red lucky seal stamp');
  const [isEditing, setIsEditing] = useState(false);

  // Gallery state
  const [gallery, setGallery] = useState<GeneratedImageItem[]>(() => {
    try {
      const saved = localStorage.getItem('kenostats_ai_gallery');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<GeneratedImageItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Update gallery in localStorage
  const saveToGallery = (item: GeneratedImageItem) => {
    const updated = [item, ...gallery];
    setGallery(updated);
    try {
      localStorage.setItem('kenostats_ai_gallery', JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage quota exceeded, keeping in memory', e);
    }
  };

  const removeFromGallery = (id: string) => {
    const updated = gallery.filter((item) => item.id !== id);
    setGallery(updated);
    try {
      localStorage.setItem('kenostats_ai_gallery', JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not update storage', e);
    }
    if (lightboxImage?.id === id) setLightboxImage(null);
  };

  // Insert user's active ticket numbers into prompt
  const handleInsertActiveNumbers = () => {
    const numsString = selectedSpots.length > 0 ? selectedSpots.join(', ') : '7, 14, 21, 77';
    setPrompt((prev) => `${prev.trim()} with lucky numbers ${numsString}`);
  };

  // Generate Image Handler
  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      setErrorMessage('Please enter a description prompt.');
      return;
    }
    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspectRatio,
          imageSize,
          model: 'gemini-nano-banana-2.1',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      const newItem: GeneratedImageItem = {
        id: `img-${Date.now()}`,
        type: 'create',
        prompt,
        imageUrl: data.imageUrl,
        modelUsed: data.modelUsed || 'gemini-nano-banana-2.1',
        aspectRatio,
        imageSize,
        timestamp: new Date().toISOString(),
        textNote: data.textNote,
      };

      if (data.quotaNotice) {
        setQuotaNotice(data.quotaNotice);
      } else {
        setQuotaNotice(null);
      }

      saveToGallery(newItem);
      setActiveTab('gallery');
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || '';
      if (
        msg.includes('403') ||
        msg.includes('PERMISSION_DENIED') ||
        msg.includes('API_KEY') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('quota')
      ) {
        setErrorMessage(
          'Image generation models require a billing-enabled API key. You can select one in the Settings > Secrets panel.'
        );
      } else {
        setErrorMessage(msg || 'Error communicating with Gemini image service.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Edit Image Handler
  const handleEditImage = async () => {
    if (!sourceImageForEdit) {
      setErrorMessage('Please upload or select an image to edit.');
      return;
    }
    if (!editPrompt.trim()) {
      setErrorMessage('Please enter instructions for what changes to make.');
      return;
    }

    setIsEditing(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/edit-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: editPrompt.trim(),
          image: sourceImageForEdit,
          aspectRatio: '1:1',
          imageSize: '1K',
          model: 'gemini-nano-banana-2.1',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to edit image');
      }

      const newItem: GeneratedImageItem = {
        id: `img-${Date.now()}`,
        type: 'edit',
        prompt: editPrompt,
        imageUrl: data.imageUrl,
        originalImageUrl: sourceImageForEdit,
        modelUsed: data.modelUsed || 'gemini-nano-banana-2.1',
        aspectRatio: '1:1',
        imageSize: '1K',
        timestamp: new Date().toISOString(),
        textNote: data.textNote,
      };

      if (data.quotaNotice) {
        setQuotaNotice(data.quotaNotice);
      } else {
        setQuotaNotice(null);
      }

      saveToGallery(newItem);
      setActiveTab('gallery');
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || '';
      if (
        msg.includes('403') ||
        msg.includes('PERMISSION_DENIED') ||
        msg.includes('API_KEY') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('quota')
      ) {
        setErrorMessage(
          'Image editing models require a billing-enabled API key. You can select one in the Settings > Secrets panel.'
        );
      } else {
        setErrorMessage(msg || 'Error editing image with Gemini.');
      }
    } finally {
      setIsEditing(false);
    }
  };

  // Handle local image file upload for editing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setSourceImageForEdit(result);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleCopyPrompt = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadImage = (imageUrl: string, filename: string = 'gemini_image.png') => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl backdrop-blur-md space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-wide flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>AI Image Studio</span>
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono font-medium">
              gemini-nano-banana-2.1
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Create high-resolution Keno talisman cards, retro casino art, and statistical visuals, or edit existing images with text prompts.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
          <button
            onClick={() => {
              setActiveTab('create');
              setErrorMessage(null);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Create New</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('edit');
              setErrorMessage(null);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'edit'
                ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Edit Image</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('gallery');
              setErrorMessage(null);
            }}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'gallery'
                ? 'bg-slate-800 text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Gallery ({gallery.length})</span>
          </button>
        </div>
      </div>

      {/* Quota Notice Banner */}
      {quotaNotice && (
        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5">
          <Info className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
          <div className="flex-1 space-y-1">
            <span className="font-semibold text-white block">Free Tier Notice</span>
            <span className="text-slate-300 leading-relaxed block">{quotaNotice}</span>
          </div>
          <button onClick={() => setQuotaNotice(null)} className="text-amber-400 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span className="flex-1">{errorMessage}</span>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* TAB 1: CREATE IMAGE */}
      {activeTab === 'create' && (
        <div className="space-y-5">
          {/* Preset Prompts Inspiration Bar */}
          <div>
            <span className="text-xs font-semibold text-slate-300 block mb-2">Preset Inspirations:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {PRESET_PROMPTS.map((preset, idx) => {
                const filledPrompt = preset.prompt.replace(
                  '{NUMBERS}',
                  selectedSpots.length > 0 ? selectedSpots.join(', ') : '7, 14, 21, 77'
                );
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(filledPrompt)}
                    className="p-2.5 text-left rounded-xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/40 hover:bg-slate-800/40 transition-all text-xs group cursor-pointer"
                  >
                    <span className="font-semibold text-amber-300 block group-hover:text-amber-200">
                      {preset.title}
                    </span>
                    <span className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                      {preset.prompt.replace('{NUMBERS}', selectedSpots.slice(0, 3).join(', ') || '7, 14')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prompt Textarea */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-200">Prompt Description:</label>
              {selectedSpots.length > 0 && (
                <button
                  type="button"
                  onClick={handleInsertActiveNumbers}
                  className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Insert Ticket Spots ({selectedSpots.join(', ')})</span>
                </button>
              )}
            </div>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to create (e.g. A lucky golden Keno coin with numbers 7, 21, 42 glowing in 3D...)"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none transition-colors"
            />
          </div>

          {/* Aspect Ratio & Resolution Configs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2 flex items-center gap-1.5">
                <Ratio className="w-3.5 h-3.5 text-slate-400" />
                <span>Aspect Ratio</span>
              </label>
              <div className="flex flex-wrap gap-2 text-xs">
                {(['1:1', '16:9', '9:16', '4:3', '3:4'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`px-3 py-1.5 rounded-lg border font-mono transition-all cursor-pointer ${
                      aspectRatio === ratio
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <span>Resolution (gemini-nano-banana-2.1)</span>
              </label>
              <div className="flex gap-2 text-xs">
                {(['1K', '2K', '4K'] as const).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setImageSize(sz)}
                    className={`px-3 py-1.5 rounded-lg border font-mono transition-all cursor-pointer ${
                      imageSize === sz
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/60 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {sz} Res
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <button
            type="button"
            onClick={handleGenerateImage}
            disabled={isGenerating}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-400 hover:to-amber-600 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-950/40 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Creating image with gemini-nano-banana-2.1...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Image ({imageSize}, {aspectRatio})</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* TAB 2: EDIT IMAGE */}
      {activeTab === 'edit' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Source Image Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-200 block">Source Image to Edit:</label>
              {sourceImageForEdit ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 max-h-72 flex items-center justify-center">
                  <img src={sourceImageForEdit} alt="Source to edit" className="max-h-72 object-contain" />
                  <button
                    type="button"
                    onClick={() => setSourceImageForEdit(null)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-rose-950 text-white text-xs transition-colors"
                    title="Remove image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-8 text-center cursor-pointer transition-all bg-slate-950/50 hover:bg-slate-900/50 flex flex-col items-center justify-center space-y-2"
                >
                  <div className="p-3 rounded-full bg-slate-800 text-indigo-400">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-xs text-slate-300 font-semibold">Click to upload image or drag & drop</div>
                  <div className="text-[11px] text-slate-500">Supports PNG, JPG, WebP</div>
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />

              {gallery.length > 0 && !sourceImageForEdit && (
                <div className="pt-2">
                  <span className="text-[11px] text-slate-400 block mb-1.5">Or pick from generated gallery:</span>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {gallery.slice(0, 5).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSourceImageForEdit(item.imageUrl)}
                        className="w-14 h-14 rounded-lg overflow-hidden border border-slate-700 shrink-0 hover:border-indigo-500 transition-colors"
                      >
                        <img src={item.imageUrl} alt="gallery thumbnail" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Instruction Prompt */}
            <div className="space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-200 block">Edit Instructions:</label>
                <textarea
                  rows={4}
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="Tell Gemini what to change, add, or transform (e.g. Add a glowing golden seal with number 77, make the lighting dramatic casino style, add celebratory confetti...)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none transition-colors"
                />

                <div className="flex flex-wrap gap-1.5 text-[11px] text-slate-400 pt-1">
                  <span>Quick edits:</span>
                  {[
                    'Add lucky number 7 glowing in gold',
                    'Transform into a vintage 1970s print',
                    'Add dramatic casino spotlights',
                    'Make background dark luxury velvet',
                  ].map((tip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEditPrompt(tip)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                    >
                      {tip}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleEditImage}
                disabled={isEditing || !sourceImageForEdit}
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-950/40 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isEditing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Applying edits with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Apply Image Edit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GALLERY */}
      {activeTab === 'gallery' && (
        <div className="space-y-4">
          {gallery.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-300">Your AI Gallery is empty</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Use the "Create New" or "Edit Image" tab to generate lucky talisman coins, vintage Keno boards, and tickets.
              </p>
              <button
                onClick={() => setActiveTab('create')}
                className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-md hover:bg-amber-400 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Create First Image</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {gallery.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden flex flex-col group hover:border-slate-700 transition-all shadow-md"
                >
                  <div className="relative aspect-square bg-slate-900 overflow-hidden">
                    <img
                      src={item.imageUrl}
                      alt={item.prompt}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Badge */}
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-black/70 text-amber-300 backdrop-blur-sm border border-amber-500/30">
                        {item.type === 'edit' ? 'Edited' : 'Created'} • {item.modelUsed}
                      </span>
                    </div>

                    {/* Hover action overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => setLightboxImage(item)}
                        className="p-2 rounded-lg bg-slate-800/90 text-white hover:bg-slate-700 transition-colors"
                        title="View Fullscreen"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadImage(item.imageUrl, `kenostats_${item.id}.png`)}
                        className="p-2 rounded-lg bg-slate-800/90 text-white hover:bg-slate-700 transition-colors"
                        title="Download PNG"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSourceImageForEdit(item.imageUrl);
                          setActiveTab('edit');
                        }}
                        className="p-2 rounded-lg bg-indigo-600/90 text-white hover:bg-indigo-500 transition-colors"
                        title="Edit this image"
                      >
                        <Wand2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Card Info */}
                  <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {item.prompt}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px] text-slate-500">
                      <span>{new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyPrompt(item.id, item.prompt)}
                          className="hover:text-slate-300 flex items-center gap-1 transition-colors"
                          title="Copy prompt"
                        >
                          {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={() => removeFromGallery(item.id)}
                          className="hover:text-rose-400 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col cursor-default"
          >
            <div className="p-3 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <span className="font-semibold text-white">Full Resolution Preview</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDownloadImage(lightboxImage.imageUrl, `kenostats_${lightboxImage.id}.png`)}
                  className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs flex items-center gap-1 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setLightboxImage(null)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-slate-950">
              <img
                src={lightboxImage.imageUrl}
                alt={lightboxImage.prompt}
                className="max-h-[70vh] object-contain rounded-lg shadow-2xl"
              />
            </div>

            <div className="p-3 border-t border-slate-800 text-xs text-slate-400">
              <p className="text-slate-200 mb-1">{lightboxImage.prompt}</p>
              <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                <span>Model: {lightboxImage.modelUsed}</span>
                <span>Size: {lightboxImage.imageSize}</span>
                <span>Aspect: {lightboxImage.aspectRatio}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
