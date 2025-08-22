import { TypingTest } from '@/components/typing-test';

export default function Home() {
  return (
    <main className="flex w-full flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-5xl">
        <TypingTest />
      </div>
    </main>
  );
}
