import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

/** Shield icon in primary + "TrustMatrix" wordmark. */
export default function Logo({ to = '/', light = false }) {
  return (
    <Link to={to} className="flex items-center gap-2 shrink-0" aria-label="TrustMatrix">
      <span className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
        <ShieldCheck size={20} className="text-primary" aria-hidden />
      </span>
      <span className={`text-lg font-extrabold tracking-tight ${light ? 'text-white' : 'text-navy dark:text-white'}`}>
        Trust<span className="text-primary">Matrix</span>
      </span>
    </Link>
  );
}
