import { useEffect, useState, useRef } from 'react';
import webSocket from '../services/websocket';

function Game() {
  const [multiplier, setMultiplier] = useState<number>(1.0);
  const [status, setStatus] = useState<string>('BETTING');
  const [balance, _setBalance] = useState<number>(0);
  const [betAmount, setBetAmount] = useState<string>('10.00');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    webSocket.connect();

    webSocket.on('round:multiplier_update', (_data) => {
      setMultiplier(_data.multiplier);
      setStatus('RUNNING');
    });

    webSocket.on('round:crashed', (_data) => {
      setStatus('CRASHED');
    });

    webSocket.on('round:started', (_data) => {
      setStatus('RUNNING');
    });

    return () => {
      webSocket.disconnect();
    };
  }, []);

  const handlePlaceBet = async () => {
    const token = localStorage.getItem('kc_token');
    const amountCents = Math.round(parseFloat(betAmount) * 100);

    try {
      const response = await fetch('http://localhost:8000/games/bet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ amountCents }),
      });

      if (response.ok) {
        alert('Bet placed successfully!');
      }
    } catch (error) {
      console.error('Failed to place bet:', error);
    }
  };

  const handleCashOut = async () => {
    const token = localStorage.getItem('kc_token');

    try {
      const response = await fetch('http://localhost:8000/games/bet/cashout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('Cashed out!');
      }
    } catch (error) {
      console.error('Failed to cash out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-green-400">Crash Game</h1>
          <div className="text-right">
            <p className="text-sm text-gray-400">Balance</p>
            <p className="text-2xl font-bold">${balance.toFixed(2)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-gray-800 rounded-xl p-6">
            <div className="text-center mb-6">
              <div className={`text-8xl font-bold mb-4 ${status === 'CRASHED' ? 'text-red-500' : 'text-green-400'}`}>
                {multiplier.toFixed(2)}x
              </div>
              <div className="inline-block px-4 py-2 bg-gray-700 rounded-full text-sm">
                Status: {status}
              </div>
            </div>

            <canvas
              ref={canvasRef}
              className="w-full h-64 bg-gray-900 rounded-lg"
            />
          </div>

          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">Place Your Bet</h2>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">
                Bet Amount ($)
              </label>
              <input
                type="number"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-green-400 focus:outline-none"
                min="1.00"
                max="1000.00"
                step="0.01"
              />
            </div>
            <button
              onClick={handlePlaceBet}
              disabled={status !== 'BETTING'}
              className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-bold transition-colors mb-3"
            >
              Place Bet
            </button>
            <button
              onClick={handleCashOut}
              disabled={status !== 'RUNNING'}
              className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-bold transition-colors"
            >
              Cash Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Game;
