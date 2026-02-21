import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { insertUserSchema, type User, type InsertUser } from "@shared/schema";
import { api } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: any;
  logoutMutation: any;
  registerMutation: any;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  const {
    data: user,
    error,
    isLoading,
    refetch,
  } = useQuery<User | null>({
    queryKey: ["/api/user"],
    queryFn: async () => {
      // Check localStorage for token and user
      const storedUser = localStorage.getItem("propdoc_user");
      const token = localStorage.getItem("propdoc_token");
      
      if (storedUser && token) {
        try {
          return JSON.parse(storedUser);
        } catch (e) {
          localStorage.removeItem("propdoc_user");
          localStorage.removeItem("propdoc_token");
        }
      }
      return null;
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: Pick<InsertUser, "email" | "password">) => {
      const res = await fetch(api.auth.signin.path, {
        method: api.auth.signin.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Invalid credentials");
      }

      const data = await res.json();
      localStorage.setItem("propdoc_token", data.token);
      localStorage.setItem("propdoc_user", JSON.stringify(data.user));
      return data.user as User;
    },
    onSuccess: (user: User) => {
      refetch();
      toast({ title: "Welcome back", description: `Signed in as ${user.name}` });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await fetch(api.auth.signup.path, {
        method: api.auth.signup.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Registration failed");
      }

      const data = await res.json();
      localStorage.setItem("propdoc_token", data.token);
      localStorage.setItem("propdoc_user", JSON.stringify(data.user));
      return data.user as User;
    },
    onSuccess: (user: User) => {
      refetch();
      toast({ title: "Account created", description: "Welcome to PropDoc!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      localStorage.removeItem("propdoc_user");
      localStorage.removeItem("propdoc_token");
    },
    onSuccess: () => {
      refetch();
      toast({ title: "Logged out", description: "See you soon!" });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
