import { Battery, Signal, Wifi } from 'lucide-react';

export function StatusBar() {
  return (
    <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 text-white">
      <span className="text-sm font-semibold">9:41</span>
      
      <div className="flex items-center gap-1.5">
        <Signal className="w-4 h-4" />
        <Wifi className="w-4 h-4" />
        <Battery className="w-5 h-4" />
      </div>
    </div>
  );
}
