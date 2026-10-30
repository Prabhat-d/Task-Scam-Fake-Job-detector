import { useEffect, useState } from 'react';
import { Volume2, Square, MessageSquareText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Card from '../common/Card.jsx';
import Button from '../common/Button.jsx';
import { LANGUAGES } from '../../i18n/index.js';
import { loc } from '../../utils/formatters.js';
import { speak } from '../../utils/alerts.js';

/** Plain-language explanation in the selected language with a "Listen" button (Web Speech API). */
export default function ExplanationCard({ explanation }) {
  const { t, i18n } = useTranslation();
  const [speaking, setSpeaking] = useState(false);
  const text = loc(explanation, i18n.language);
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => () => supported && window.speechSynthesis.cancel(), [supported]);
  useEffect(() => {
    if (supported) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [i18n.language, supported]);

  const toggle = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const tag = LANGUAGES.find((l) => l.code === i18n.language)?.speech || 'en-IN';
    setSpeaking(true);
    speak(text, tag, { onEnd: () => setSpeaking(false) });
  };

  return (
    <Card
      title={t('result.explanationTitle')}
      icon={MessageSquareText}
      actions={
        supported && (
          <Button variant={speaking ? 'secondary' : 'teal'} size="sm" icon={speaking ? Square : Volume2} onClick={toggle} aria-pressed={speaking}>
            {speaking ? t('result.stop') : t('result.listen')}
          </Button>
        )
      }
    >
      <p className="text-base leading-relaxed text-body">{text}</p>
    </Card>
  );
}
