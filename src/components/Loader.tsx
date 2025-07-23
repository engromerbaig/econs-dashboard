// components/Loader.tsx
export default function Loader() {
  return (
    <div className="flex items-center justify-center bg-white min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-econs-blue"></div>
    </div>
  );
}