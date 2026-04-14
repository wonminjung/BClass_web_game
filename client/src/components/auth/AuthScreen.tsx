import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/common/Button';

function AuthScreen() {
  const navigate = useNavigate();
  const { login, isAuthenticated, error, isLoading } = useAuth();
  const [saveCode, setSaveCode] = useState('');

  const formatSaveCode = useCallback((value: string) => {
    const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 16);
    return cleaned.replace(/(.{4})(?=.)/g, '$1-');
  }, []);

  const handleCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/-/g, '');
      if (raw.length <= 16) {
        setSaveCode(formatSaveCode(raw));
      }
    },
    [formatSaveCode],
  );

  const handleLogin = useCallback(async () => {
    const rawCode = saveCode.replace(/-/g, '');
    if (rawCode.length === 0) return;
    await login(rawCode);
  }, [saveCode, login]);

  const handleNewGame = useCallback(() => {
    navigate('/select');
  }, [navigate]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* Title area */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-black text-dungeon-accent mb-3 tracking-wider">
          어둠의 던전
        </h1>
        <p className="text-gray-500 text-lg">끝없는 어둠 속, 당신의 모험이 시작됩니다</p>
      </div>

      {/* Login panel */}
      <div className="panel w-full max-w-md space-y-6">
        <div>
          <label htmlFor="saveCode" className="block text-sm text-gray-400 mb-2">
            저장 코드
          </label>
          <input
            id="saveCode"
            type="text"
            value={saveCode}
            onChange={handleCodeChange}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            className="w-full px-4 py-3 bg-dungeon-bg border border-dungeon-border rounded-lg
                       text-center text-lg tracking-widest font-mono text-gray-100
                       focus:outline-none focus:border-dungeon-accent transition-colors"
          />
        </div>

        {error && (
          <p className="text-dungeon-health text-sm text-center">{error}</p>
        )}

        <div className="space-y-3">
          <Button
            variant="primary"
            size="lg"
            onClick={handleLogin}
            disabled={isLoading || saveCode.replace(/-/g, '').length === 0}
            className="w-full"
          >
            {isLoading ? '접속 중...' : '모험 계속하기'}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={handleNewGame}
            disabled={isLoading}
            className="w-full"
          >
            새로운 모험
          </Button>
        </div>
      </div>

      {/* Footer */}
      <p className="text-gray-600 text-xs mt-8">
        저장 코드를 잃어버리면 데이터를 복구할 수 없습니다
      </p>
    </div>
  );
}

export default AuthScreen;
