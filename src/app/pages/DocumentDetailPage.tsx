import { useParams, useNavigate } from 'react-router';
import { StatusBar } from '../components/StatusBar';
import { MobileHeader } from '../components/MobileHeader';

export function DocumentDetailPage() {
  const { title } = useParams<{ title: string }>();
  const navigate = useNavigate();
  const decodedTitle = title ? decodeURIComponent(title) : 'Документ';

  return (
    <div
      className="relative w-full h-full min-h-0 flex flex-col overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-black box-border"
      style={{ width: '100%', height: '100%', maxWidth: 412 }}
    >
      <StatusBar />
      <MobileHeader
        title={decodedTitle}
        onBack={() => navigate(-1)}
        onMenu={() => {}}
      />
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-6">
        <h2 className="text-white text-xl font-semibold">{decodedTitle}</h2>
      </div>
    </div>
  );
}
