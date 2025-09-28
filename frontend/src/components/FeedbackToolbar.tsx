'use client';

interface FeedbackToolbarProps {
  onAccept?: () => void;
  onReject?: () => void;
  onEdit?: () => void;
  disabled?: boolean;
}

export default function FeedbackToolbar({ onAccept, onReject, onEdit, disabled }: FeedbackToolbarProps) {
  return (
    <div className="flex gap-2 p-4 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Feedback Toolbar</h3>
      <p className="text-gray-600">Accept/Reject/Edit buttons for human feedback</p>
      {/* TODO: Implement accept, reject, and edit buttons */}
    </div>
  );
}