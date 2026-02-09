"use client";

type Props = {
  message: string;
  onUndo: () => void;
};

export default function UndoToast({ message, onUndo }: Props) {
  return (
    <div className="fixed bottom-6 right-6 bg-white border border-pink-200 shadow-lg rounded-xl px-4 py-3 flex gap-4 items-center z-50">
      <span className="text-sm text-pink-700">{message}</span>
      <button
        onClick={onUndo}
        className="text-sm font-semibold text-pink-600 underline"
      >
        Undo
      </button>
    </div>
  );
}
