
import { HistoryDetailPage } from '@/components/history-detail-page';
import { ProtectedRoute } from '@/components/protected-route';


export default function HistoryDetail({ params }: { params: { id: string } }) {
  return (
    <ProtectedRoute>
        <main className="flex min-h-screen w-full flex-col items-center p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-5xl">
                <HistoryDetailPage id={params.id} />
            </div>
        </main>
    </ProtectedRoute>
  );
}
