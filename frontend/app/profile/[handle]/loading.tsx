export default function Loading() {
return (
<div className="mx-auto max-w-5xl p-4 animate-pulse">
<div className="h-40 w-full rounded-2xl bg-gray-200" />
<div className="-mt-10 flex items-end gap-4 px-6">
<div className="h-28 w-28 rounded-full bg-gray-300 ring-4 ring-white" />
<div className="h-6 w-48 bg-gray-200 rounded" />
</div>
<div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
<div className="h-24 bg-gray-200 rounded-2xl" />
<div className="h-24 bg-gray-200 rounded-2xl" />
<div className="h-24 bg-gray-200 rounded-2xl" />
</div>
</div>
);
}