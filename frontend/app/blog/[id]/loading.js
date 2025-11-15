export default function LoadingPost() {
  return (
    <div className="mx-auto max-w-2xl py-10">
      <div className="h-6 w-40 animate-pulse rounded bg-gray-200" />
      <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="h-7 w-72 animate-pulse rounded bg-gray-200" />
        <div className="mt-3 h-4 w-40 animate-pulse rounded bg-gray-200" />
        <div className="mt-6 space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}