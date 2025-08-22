
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { History, Gauge, Target, Timer, ArrowLeft, Loader2, FileWarning, Sparkles, LineChart, ListChecks } from "lucide-react";
import { type HistoryItem } from "./typing-test";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { ScrollArea } from "./ui/scroll-area";

export function HistoryDetailPage({ id }: { id: string }) {
  const [item, setItem] = useState<HistoryItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedHistory = JSON.parse(localStorage.getItem("typingHistory") || "[]") as HistoryItem[];
      const foundItem = storedHistory.find(h => h.id === id);
      if(foundItem) {
          setItem(foundItem);
      }
    } catch (e) {
      console.error("Could not load history item", e);
    } finally {
        setLoading(false);
    }
  }, [id]);

  if (loading) {
      return (
        <div className="flex flex-col items-center justify-center h-80 gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Loading result...</p>
        </div>
      );
  }

  if (!item) {
    return (
        <Card className="w-full shadow-2xl">
            <CardHeader>
                <CardTitle className="text-3xl font-bold text-destructive flex items-center gap-3">
                    <FileWarning /> Not Found
                </CardTitle>
                <CardDescription>The requested test result could not be found.</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
                 <Link href="/history" passHref>
                    <Button>
                        <ArrowLeft className="mr-2 h-4 w-4"/> Back to History
                    </Button>
                </Link>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card className="w-full shadow-2xl">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-3xl font-bold text-primary flex items-center gap-3">
              <History /> Test Result
            </CardTitle>
            <CardDescription>
              Details for test on {item.fileName}
            </CardDescription>
          </div>
          <Link href="/history" passHref>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to History
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Typing Speed</CardTitle>
              <Gauge className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.typingSpeed} WPM</div>
              <p className="text-xs text-muted-foreground">Words Per Minute</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.accuracy.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Based on your input</p>
            </CardContent>
          </Card>
           <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Time Taken</CardTitle>
                <Timer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{String(Math.floor(item.elapsedTime/60)).padStart(2,'0')}:{String(item.elapsedTime%60).padStart(2,'0')}</div>
                <p className="text-xs text-muted-foreground">Minutes:Seconds</p>
              </CardContent>
            </Card>
        </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Sparkles className="text-accent"/> Overall Remarks</CardTitle>
                </CardHeader>
                <CardContent>
                   <p className="text-sm">{item.overallRemarks}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><LineChart className="text-accent"/> Timing/Consistency</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm">{item.timingConsistency}</p>
                </CardContent>
            </Card>
         </div>
         {item.errorSummary && Object.keys(item.errorSummary).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ListChecks className="text-accent"/> Error Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {Object.entries(item.errorSummary).map(([type, count]) => (
                  <div key={type} className="flex items-center gap-2 capitalize">
                    <span className="font-bold text-lg">{count}</span>
                    <span className="text-sm text-muted-foreground">{type}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle>Highlighted Analysis</CardTitle>
            <CardDescription>
              Here is the original text with your mistakes highlighted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-60 w-full rounded-md border p-4">
              <div
                className="prose dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: item.highlightedText }}
              ></div>
            </ScrollArea>
          </CardContent>
        </Card>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Original Text</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-40 w-full rounded-md border p-4">
                        <p className="text-sm">{item.originalText}</p>
                    </ScrollArea>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Your Text</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-40 w-full rounded-md border p-4">
                         <p className="text-sm">{item.userText}</p>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
      </CardContent>
    </Card>
  );
}
