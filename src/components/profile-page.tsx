"use client";

import { useRouter } from "next/navigation";
import { logOut } from "@/services/auth";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User, LogOut } from "lucide-react";

export function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logOut();
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
      });
      router.push("/login");
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Logout Failed",
            description: error.message,
        });
    }
  };

  if (!user) {
    return null; // or a loading spinner, or a redirect
  }

  return (
    <Card className="w-full max-w-md shadow-2xl">
      <CardHeader className="text-center">
        <div className="mx-auto bg-primary rounded-full h-24 w-24 flex items-center justify-center">
            <User className="h-16 w-16 text-primary-foreground"/>
        </div>
        <CardTitle className="mt-4 text-2xl">User Profile</CardTitle>
        <CardDescription>Your account information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col items-center space-y-2">
          <p className="font-medium">Email</p>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
         <div className="flex flex-col items-center space-y-2">
          <p className="font-medium">User ID</p>
          <p className="text-muted-foreground text-xs">{user.uid}</p>
        </div>
        <Button onClick={handleLogout} className="w-full" variant="destructive">
          <LogOut className="mr-2 h-4 w-4"/>
          Logout
        </Button>
      </CardContent>
    </Card>
  );
}
