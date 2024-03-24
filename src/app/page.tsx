// page.tsx
import React from 'react';
import GameComponent from './components/GameComponent';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();

  // Check if the page is being accessed via Warpcaster
  const isWarpcaster = router.query.warpcaster === 'true';

  if (!isWarpcaster) {
    // Redirect to an error page or display a message if not accessed via Warpcaster
    return <div>This game can only be accessed via Warpcaster.</div>;
  }

  return (
    <div>
      <h1>Cosmic Chuckles Game</h1>
      <GameComponent />
    </div>
  );
}
