import type { VerseMatch } from "@/lib/verse-detector";

interface VerseCardProps {
  verse: VerseMatch;
  onProject: () => void;
}

export default function VerseCard({ verse, onProject }: VerseCardProps) {
  return (
    <button
      type="button"
      onClick={onProject}
      className="w-full text-left p-3 rounded-lg bg-[#2A2931] hover:bg-[#3a3844] border border-[#3a3844] transition-colors"
    >
      <div className="text-[#6c5ce7] font-semibold text-sm">{verse.reference}</div>
      <div className="text-xs text-[#C8C4D7] mt-1 line-clamp-2">{verse.text ?? verse.rawText}</div>
      <div className="text-[10px] text-[#8a8699] mt-2">
        Confidence {Math.round(verse.confidence * 100)}%
      </div>
    </button>
  );
}
