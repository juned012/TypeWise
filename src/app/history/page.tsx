
import { HistoryPage } from '@/components/history-page';
import { ProtectedRoute } from '@/components/protected-route';

export default function History() {
  return (
    <ProtectedRoute>
      <main className="flex min-h-screen w-full flex-col items-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-5xl">
          <HistoryPage />
        </div>
      </main>
    </ProtectedRoute>
  );
}
