"use client";

import { useState, useRef, type ChangeEvent, useEffect } from "react";
import Link from "next/link";
import {
  Upload,
  FileText,
  Loader2,
  AudioLines,
  Gauge,
  Target,
  RefreshCw,
  Timer,
  History,
  LogIn,
  Sparkles,
  LineChart,
  ListChecks,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { transcribeAudio } from "@/ai/flows/audio-transcription";
import {
  compareUserText,
  type CompareUserTextOutput,
} from "@/ai/flows/compare-user-text";
import { ScrollArea } from "./ui/scroll-area";
import { Badge } from "./ui/badge";
import { useAuth } from "@/contexts/auth-context";

const readFileAs = (file: File, type: "dataURL" | "text"): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    if (type === "dataURL") {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  });
};

export type HistoryItem = CompareUserTextOutput & {
  id: string;
  date: string;
  fileName: string;
  originalText: string;
  userText: string;
  elapsedTime: number;
  userId?: string;
};

export function TypingTest() {
  const { user } = useAuth();
  const [originalText, setOriginalText] = useState<string>("");
  const [userText, setUserText] = useState<string>("");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [result, setResult] = useState<CompareUserTextOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [wpm, setWpm] = useState<number>(0);

  const audioInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { toast } = useToast();

  const clearTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, []);

  const handleResetTypingState = () => {
    clearTimer();
    setStartTime(null);
    setElapsedTime(0);
    setWpm(0);
  };

  const handleFileSelect = (ref: React.RefObject<HTMLInputElement>) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "You need to be logged in to start a test.",
        action: (
          <Link href="/login">
            <Button variant="secondary" size="sm">
              <LogIn className="mr-2 h-4 w-4" /> Login
            </Button>
          </Link>
        ),
      });
      return;
    }
    ref.current?.click();
  };

  const handleReset = () => {
    setOriginalText("");
    setUserText("");
    setAudioUrl(null);
    setResult(null);
    setIsLoading(false);
    setLoadingMessage("");
    setFileName("");
    handleResetTypingState();
    if (audioInputRef.current) audioInputRef.current.value = "";
    if (textInputRef.current) textInputRef.current.value = "";
  };

  const processFile = async (file: File, type: "audio" | "text") => {
    handleReset();
    setIsLoading(true);
    setFileName(file.name);

    try {
      if (type === "audio") {
        setLoadingMessage("Transcribing audio, this may take a moment...");
        const audioDataUri = await readFileAs(file, "dataURL");
        setAudioUrl(audioDataUri);
        const { transcription } = await transcribeAudio({ audioDataUri });
        setOriginalText(transcription);
      } else {
        setLoadingMessage("Processing text file...");
        const textContent = await readFileAs(file, "text");
        setOriginalText(textContent);
      }
    } catch (error) {
      console.error("Error processing file:", error);
      toast({
        variant: "destructive",
        title: "File Processing Error",
        description: "Could not process the file. Please try a different one.",
      });
      handleReset();
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const handleAudioFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file, "audio");
  };

  const handleTextFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file, "text");
  };

  const handleUserTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setUserText(newText);

    if (!startTime && newText.length > 0) {
      const now = Date.now();
      setStartTime(now);
      clearTimer();

      timerIntervalRef.current = setInterval(() => {
        const currentElapsedTime = Math.floor((Date.now() - now) / 1000);
        setElapsedTime(currentElapsedTime);
        if (currentElapsedTime > 0) {
          const words = newText.trim().split(/\s+/).length;
          const currentWpm = (words / currentElapsedTime) * 60;
          setWpm(Math.round(currentWpm));
        }
      }, 1000);
    }

    if (startTime) {
      const seconds = (Date.now() - startTime) / 1000;
      if (seconds > 0) {
        const words = newText.trim().split(/\s+/).length;
        const currentWpm = (words / seconds) * 60;
        setWpm(Math.round(currentWpm));
      }
    }

    if (newText.length === 0) {
      handleResetTypingState();
    }
  };

  const saveToHistory = (result: CompareUserTextOutput) => {
    if (!user) return;
    const historyItem: HistoryItem = {
      ...result,
      id: Date.now().toString(),
      date: new Date().toISOString(),
      fileName,
      originalText,
      userText,
      elapsedTime,
      userId: user.uid,
    };

    try {
      const history = JSON.parse(localStorage.getItem("typingHistory") || "[]");
      history.unshift(historyItem);
      localStorage.setItem(
        "typingHistory",
        JSON.stringify(history.slice(0, 50))
      ); // limit history size
    } catch (e) {
      console.error("Could not save to history", e);
    }
  };

  const handleShowResult = async () => {
    if (!userText.trim()) {
      toast({
        title: "Input Required",
        description: "Please type something before showing results.",
      });
      return;
    }

    setIsLoading(true);
    setLoadingMessage("Analyzing your performance...");
    if (audioPlayerRef.current) audioPlayerRef.current.pause();
    clearTimer();

    const finalElapsedTime = startTime
      ? Math.floor((Date.now() - startTime) / 1000)
      : elapsedTime;
    setElapsedTime(finalElapsedTime);

    try {
      const analysisResult = await compareUserText({
        originalText,
        userText,
        durationSeconds: finalElapsedTime,
      });
      setResult(analysisResult);
      saveToHistory(analysisResult);
    } catch (error) {
      console.error("Error analyzing text:", error);
      toast({
        variant: "destructive",
        title: "Analysis Error",
        description: "Could not analyze your text. Please try again.",
      });
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-80 gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">{loadingMessage}</p>
        </div>
      );
    }

    if (result) {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Typing Speed
                </CardTitle>
                <Gauge className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {result.typingSpeed} WPM
                </div>
                <p className="text-xs text-muted-foreground">
                  Words Per Minute
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {result.accuracy.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Based on your input
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Time Taken
                </CardTitle>
                <Timer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {String(Math.floor(elapsedTime / 60)).padStart(2, "0")}:
                  {String(elapsedTime % 60).padStart(2, "0")}
                </div>
                <p className="text-xs text-muted-foreground">Minutes:Seconds</p>
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="text-accent" /> Overall Remarks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{result.overallRemarks}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="text-accent" /> Timing/Consistency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{result.timingConsistency}</p>
              </CardContent>
            </Card>
          </div>
          {result.errorSummary &&
            Object.keys(result.errorSummary).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ListChecks className="text-accent" /> Error Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4">
                    {Object.entries(result.errorSummary).map(
                      ([type, count]) => (
                        <div
                          key={type}
                          className="flex items-center gap-2 capitalize"
                        >
                          <span className="font-bold text-lg">
                            {typeof count === "number" ? count : 0}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {type}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          <Card>
            <CardHeader>
              <CardTitle>Highlighted Analysis</CardTitle>
              <CardDescription>
                {originalText && (
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {
                          originalText
                            .split(/\s+/)
                            .filter((word) => word.length > 0).length
                        }
                        Total original Words
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {
                          userText
                            .split(/\s+/)
                            .filter((word) => word.length > 0).length
                        }
                        Total original Words
                      </span>
                    </div>
                  </div>
                )}
                Here is the original text with your mistakes highlighted.
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 bg-green-600 rounded-full"></span>
                    Correct
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 bg-red-600 rounded-full"></span>
                    Incorrect
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="inline-block w-3 h-3 bg-gray-700 rounded-full"></span>{" "}
                    Missing
                  </div>
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-60 w-full rounded-md border p-4">
                <div
                  className="prose dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: result.highlightedText }}
                ></div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (originalText) {
      return (
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <Badge variant="secondary" className="p-2">
              {fileName}
            </Badge>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>
                  {
                    originalText.split(/\s+/).filter((word) => word.length > 0)
                      .length
                  }
                  Words
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono">
                  {String(Math.floor(elapsedTime / 60)).padStart(2, "0")}:
                  {String(elapsedTime % 60).padStart(2, "0")}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono">{wpm} WPM</span>
              </div>
            </div>
          </div>
          {audioUrl && (
            <div className="flex flex-col items-center">
              <audio
                ref={audioPlayerRef}
                src={audioUrl}
                controls
                className="w-full"
              ></audio>
              <p className="text-sm text-muted-foreground mt-2">
                Listen to the audio and start typing below.
              </p>
            </div>
          )}
          <Textarea
            value={userText}
            onChange={handleUserTextChange}
            placeholder="Start typing here..."
            className="min-h-[200px] text-base"
            aria-label="Typing input area"
          />
        </div>
      );
    }

    return (
      <div className="text-center h-80 flex flex-col justify-center items-center">
        <AudioLines className="h-16 w-16 text-primary mb-4" />
        <h3 className="text-2xl font-semibold mb-2">Start Your Typing Test</h3>
        <p className="text-muted-foreground mb-6">
          {user
            ? "Upload an audio or text file to begin."
            : "Please log in to start a typing test."}
        </p>
        <div className="flex gap-4">
          <input
            type="file"
            ref={audioInputRef}
            onChange={handleAudioFileChange}
            accept="audio/*"
            className="hidden"
          />
          <Button onClick={() => handleFileSelect(audioInputRef)} size="lg">
            <Upload className="mr-2 h-5 w-5" />
            Upload Audio
          </Button>
          <input
            type="file"
            ref={textInputRef}
            onChange={handleTextFileChange}
            accept=".txt, .md"
            className="hidden"
          />
          <Button
            onClick={() => handleFileSelect(textInputRef)}
            variant="secondary"
            size="lg"
          >
            <FileText className="mr-2 h-5 w-5" />
            Upload Text
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card className="w-full shadow-2xl">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-3xl font-bold text-primary">
              TypeWise
            </CardTitle>
            <CardDescription>
              A wise way to improve your typing.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {(originalText || result) && (
              <Button variant="ghost" onClick={handleReset} size="sm">
                <RefreshCw className="mr-2 h-4 w-4" /> Try Again
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
      <CardFooter className="flex justify-center">
        {!isLoading && originalText && !result && (
          <Button
            onClick={handleShowResult}
            size="lg"
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            Show Result
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
