import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSocketEvent } from '../../hooks/useSocketEvent.js';
import { useNotificationStore } from '../../store/notificationStore.js';
import { useHeadlineStore } from '../../store/headlineStore.js';
import { loc } from '../../utils/formatters.js';

/** App-wide socket listeners: notifications and headline updates. Renders nothing. */
export default function RealtimeBridge() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const add = useNotificationStore((s) => s.add);
  const setHeadlines = useHeadlineStore((s) => s.setHeadlines);

  useSocketEvent('notification:new', (n) => {
    add(n);
    // Stage changes have their own red toast on the Live page.
    if (n.type === 'stage_changed' && window.location.pathname === '/live') return;
    toast(
      (tt) => (
        <button
          type="button"
          className="text-left"
          onClick={() => {
            toast.dismiss(tt.id);
            if (n.link) navigate(n.link);
          }}
        >
          <span className="block font-semibold">{loc(n.title, i18n.language)}</span>
          <span className="block text-xs opacity-80">{loc(n.body, i18n.language)}</span>
        </button>
      ),
      { icon: '🔔' }
    );
  });

  useSocketEvent('headline:updated', (list) => setHeadlines(Array.isArray(list) ? list : list?.headlines || []));

  return null;
}
