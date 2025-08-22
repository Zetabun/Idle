
export default function promptUpdate(registration) {
  // Basic update prompt; replace with a nicer UI in your game
  const shouldUpdate = confirm("An update is available. Restart now?");
  if (shouldUpdate) {
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      registration.waiting.addEventListener('statechange', (e) => {
        if (e.target.state === 'activated') {
          window.location.reload();
        }
      });
    } else {
      window.location.reload();
    }
  }
}
