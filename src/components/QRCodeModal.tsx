import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Check, Share2, X, Users, Sparkles, Smartphone } from 'lucide-react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  roomId: string;
  hostName: string;
  listenerCount: number;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  roomCode,
  hostName,
  listenerCount,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const roomLink = typeof window !== 'undefined'
    ? `${window.location.origin}/?room=${encodeURIComponent(roomCode)}`
    : '';

  useEffect(() => {
    if (!isOpen || !roomLink) return;

    QRCode.toDataURL(roomLink, {
      width: 320,
      margin: 1.5,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Error generating QR code:', err));
  }, [isOpen, roomLink]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(roomLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join my SyncTune Jam!`,
          text: `Listen to live music with me in real time! Room code: ${roomCode}`,
          url: roomLink,
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1 mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Live Sync Room Active
          </div>
          <h3 className="text-xl font-black tracking-tight text-white">
            Invite Friends to Jam
          </h3>
          <p className="text-xs text-zinc-400">
            Scan with any phone camera to sync & listen to songs together live!
          </p>
        </div>

        {/* QR Code Frame */}
        <div className="flex flex-col items-center justify-center bg-zinc-950 border border-zinc-800 p-4 rounded-2xl shadow-inner mx-auto mb-5 max-w-[240px]">
          {qrDataUrl ? (
            <div className="bg-white p-2.5 rounded-xl shadow-md">
              <img
                src={qrDataUrl}
                alt="Scan to join room"
                className="w-44 h-44 rounded-lg object-contain"
              />
            </div>
          ) : (
            <div className="w-44 h-44 flex items-center justify-center text-zinc-500 text-xs">
              Generating QR...
            </div>
          )}
          <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-medium mt-2">
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" /> Scan with mobile camera
          </div>
        </div>

        {/* Room Code Display */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-3 mb-4 text-center">
          <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold block mb-1">
            Room Code
          </span>
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono text-2xl font-black tracking-widest text-emerald-400 bg-zinc-900 px-5 py-1.5 rounded-xl border border-zinc-800 select-all shadow-inner">
              {roomCode}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-sm font-bold rounded-xl text-zinc-200 border border-zinc-700 transition active:scale-[0.98]"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-zinc-400" />
                <span>Copy Link</span>
              </>
            )}
          </button>

          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-sm font-black rounded-xl text-black shadow-lg shadow-emerald-500/20 transition active:scale-[0.98]"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Room</span>
          </button>
        </div>

        {/* Host & Listeners metadata */}
        <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <span className="truncate">Host: <strong className="text-white">{hostName}</strong></span>
          <span className="flex items-center gap-1 text-zinc-300">
            <Users className="w-3.5 h-3.5 text-emerald-400" /> {listenerCount} in room
          </span>
        </div>
      </div>
    </div>
  );
};
