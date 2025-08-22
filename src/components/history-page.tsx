
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { History, Gauge, Target, Calendar, FileText, ChevronRight } from "lucide-react";
import { type HistoryItem } from "./typing-test";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { useAuth } from "@/contexts/auth-context";

export function HistoryPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    if (user) {
        try {
          const storedHistory = JSON.parse(localStorage.getItem("typingHistory") || "[]") as HistoryItem[];
          const userHistory = storedHistory.filter(item => item.userId === user.uid);
          setHistory(userHistory);
        } catch (e) {
          console.error("Could not load history", e);
          setHistory([]);
        }
    }
  }, [user]);

  if (!hasMounted) {
    return null; 
  }

  return (
    <Card className="w-full shadow-2xl">
      <CardHeader>
        <div className="flex justify-between items-center">
            <div>
                <CardTitle className="text-3xl font-bold text-primary flex items-center gap-3">
                    <History /> Typing History
                </CardTitle>
                <CardDescription>Review your past performance.</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center h-80 flex flex-col justify-center items-center">
            <History className="h-16 w-16 text-primary mb-4" />
            <h3 className="text-2xl font-semibold mb-2">No History Yet</h3>
            <p className="text-muted-foreground">Complete a typing test to see your results here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <Link href={`/history/${item.id}`} key={item.id} passHref>
                <div className="block border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                        <p className="font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-muted-foreground"/> {item.fileName}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(item.date), "PPP p")}
                        </p>
                    </div>
                    <div className="flex items-center gap-6 text-right">
                        <div className="flex items-center gap-2">
                           <Gauge className="h-5 w-5 text-primary"/>
                           <div>
                             <p className="font-bold text-lg">{item.typingSpeed}</p>
                             <p className="text-xs text-muted-foreground">WPM</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                           <Target className="h-5 w-5 text-primary"/>
                           <div>
                            <p className="font-bold text-lg">{item.accuracy.toFixed(1)}%</p>
                             <p className="text-xs text-muted-foreground">Accuracy</p>
                           </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
