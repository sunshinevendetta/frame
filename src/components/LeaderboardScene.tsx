import React, { useEffect, useState } from 'react';
import { fetchUserDetails } from '../utils/airstackUtils';

const LeaderboardScene: React.FC = () => {
  const [leaderboardData, setLeaderboardData] = useState<{ name: string; score: number }[]>([]);
  const [lastResetTime, setLastResetTime] = useState<number>(0);

  useEffect(() => {
    fetchLeaderboardData();
    startLeaderboardResetTimer();
  }, []);

  const fetchLeaderboardData = async () => {
    try {
      // Fetch leaderboard data from your backend or database
      const response = await fetch('/api/leaderboard');
      const data = await response.json();
      setLeaderboardData(data);
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    }
  };

  const startLeaderboardResetTimer = () => {
    const currentTime = Date.now();
    const nextResetTime = getNextResetTime();

    if (currentTime >= nextResetTime) {
      resetLeaderboard();
    } else {
      const remainingTime = nextResetTime - currentTime;
      setTimeout(resetLeaderboard, remainingTime);
    }
  };

  const getNextResetTime = () => {
    const currentDate = new Date();
    const nextResetDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() + 1, // Next day
      0, // Reset at 00:00 UTC
      0,
      0
    );
    return nextResetDate.getTime();
  };

  const resetLeaderboard = async () => {
    try {
      // Reset leaderboard data in your backend or database
      await fetch('/api/leaderboard/reset', { method: 'POST' });
      setLeaderboardData([]);
      setLastResetTime(Date.now());
      awardBountyToWinner();
      startLeaderboardResetTimer();
    } catch (error) {
      console.error('Error resetting leaderboard:', error);
    }
  };

  const awardBountyToWinner = async () => {
    if (leaderboardData.length > 0) {
      const winner = leaderboardData[0];
      const winnerFID = await getUserFID(winner.name);

      if (winnerFID) {
        // Award bounty to the winner using their FID
        // Implement the logic to send the bounty to the winner's wallet
        console.log(`Awarding bounty to winner: ${winner.name} (FID: ${winnerFID})`);
      }
    }
  };

  const getUserFID = async (username: string): Promise<number | null> => {
    try {
      const userDetails = await fetchUserDetails(username);
      return userDetails?.fid || null;
    } catch (error) {
      console.error('Error fetching user FID:', error);
      return null;
    }
  };

  return (
    <div>
      <h2>Leaderboard</h2>
      <p>Last reset time: {new Date(lastResetTime).toLocaleString()}</p>
      <ul>
        {leaderboardData.map((entry, index) => (
          <li key={index}>
            {index + 1}. {entry.name}: {entry.score}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LeaderboardScene;
