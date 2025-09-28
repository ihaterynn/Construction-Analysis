'use client';

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export default function Loader({ size = 'md', text, className = '' }: LoaderProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className="animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 h-8 w-8"></div>
      {text && <p className="mt-2 text-gray-600">{text}</p>}
      {/* TODO: Add different spinner sizes and styles */}
    </div>
  );
}