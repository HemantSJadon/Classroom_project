import Spinner from '@/components/ui/Spinner';

export default function ClassroomLoading() {
  return (
    <div className="flex items-center justify-center h-full p-8">
      <Spinner size="lg" label="Loading classroom…" />
    </div>
  );
}
