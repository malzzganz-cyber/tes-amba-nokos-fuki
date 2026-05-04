export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; classes: string }> = {
    pending: { label: 'Pending', classes: 'bg-amber-100 text-amber-700' },
    success: { label: 'Sukses', classes: 'bg-green-100 text-green-700' },
    cancel: { label: 'Batal', classes: 'bg-red-100 text-red-600' },
    waiting: { label: 'Menunggu', classes: 'bg-blue-100 text-blue-700' },
    received: { label: 'OTP Diterima', classes: 'bg-green-100 text-green-700' },
  };

  const config = map[status?.toLowerCase()] ?? { label: status, classes: 'bg-gray-100 text-gray-600' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.classes}`}>
      {config.label}
    </span>
  );
}
