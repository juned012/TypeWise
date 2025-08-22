import { ProfilePage } from "@/components/profile-page";
import { ProtectedRoute } from "@/components/protected-route";

export default function Profile() {
    return (
        <ProtectedRoute>
            <main className="flex w-full flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
                <ProfilePage />
            </main>
        </ProtectedRoute>
    )
}
