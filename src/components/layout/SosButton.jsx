import CallHelplineButton from '../common/CallHelplineButton.jsx';

/** Floating "Call 1930" button on mobile so help is always one tap away. */
export default function SosButton() {
  return (
    <CallHelplineButton
      compact
      iconSize={18}
      className="lg:hidden fixed bottom-4 right-4 z-30 h-12 pl-4 pr-5 !rounded-full shadow-lg shadow-danger/30"
    />
  );
}
