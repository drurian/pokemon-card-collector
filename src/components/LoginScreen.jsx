import { useState } from 'react';
import { hashPassword, isPasswordHash } from '../utils/auth';

const LoginScreen = ({ onLogin, users }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!username || !password) {
      setError('Please enter username and password');
      return;
    }
    const hashedPassword = await hashPassword(password);
    const isPreHashed = isPasswordHash(password);
    const user = users.find((u) => (
      u.username === username
      && (u.password === hashedPassword || (isPreHashed && u.password === password))
    ));
    if (user) {
      onLogin(user, rememberMe);
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">⚡</div>
          <h1 className="text-2xl font-bold text-gray-900">Pokémon Card Collector</h1>
          <p className="text-gray-600 text-sm mt-1">Sign in to your collection</p>
        </div>
        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}
        <div className="space-y-3">
          <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none" />
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
            Remember me on this device
          </label>
          <button onClick={handleSubmit} className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition">Sign In</button>
        </div>
        <p className="text-center text-gray-500 text-xs mt-4">Default: admin / admin123</p>
      </div>
    </div>
  );
};

export default LoginScreen;
