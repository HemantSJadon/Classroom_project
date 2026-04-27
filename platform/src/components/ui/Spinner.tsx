interface Props {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const SIZES = { sm: 'w-4 h-4 border-2', md: 'w-7 h-7 border-2', lg: 'w-10 h-10 border-[3px]' };

export default function Spinner({ size = 'md', label }: Props) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`rounded-full border-indigo-500 border-t-transparent animate-spin-smooth ${SIZES[size]}`}
        role="status"
        aria-label={label ?? 'Loading'}
      />
      {label && <span className="text-sm text-gray-400">{label}</span>}
    </div>
  );
}
