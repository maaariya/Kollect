"use client";

type Props = {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmModal({
  open,
  title,
  description,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-6 w-80 shadow-lg">
        <h2 className="text-lg font-bold text-pink-700 mb-2">{title}</h2>
        <p className="text-sm text-pink-500 mb-4">{description}</p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-gray-200 text-gray-700"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-pink-500 text-white"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
