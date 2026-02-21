import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Files, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { insertUserSchema } from "@shared/schema";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [isLogin, setIsLogin] = useState(true);

  /* ✅ redirect safely */
  useEffect(() => {
    if (user) setLocation("/");
  }, [user, setLocation]);

  /* ---------- LOGIN ---------- */
  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
  });

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  /* ---------- REGISTER ---------- */
  const registerForm = useForm<z.infer<typeof insertUserSchema>>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  /* ✅ HARD RESET ON TOGGLE */
  const toggleMode = () => {
    setIsLogin((v) => !v);
    loginForm.reset();
    registerForm.reset();
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* LEFT */}
      <div className="hidden lg:flex relative flex-col bg-slate-900 text-white p-12">
        <img
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80"
          className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
          alt=""
        />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Files className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold">PropDoc</span>
          </div>
          <h1 className="text-4xl font-bold mb-6">
            Automate your real estate documentation workflow.
          </h1>
          <p className="text-lg text-slate-300">
            Generate, manage, and sign real estate documents with ease.
          </p>
        </div>
      </div>

      {/* RIGHT */}
      <div className="flex items-center justify-center p-6 bg-slate-50">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader>
            <CardTitle>{isLogin ? "Welcome back" : "Create an account"}</CardTitle>
            <CardDescription>
              {isLogin
                ? "Sign in to your account"
                : "Enter your details to get started"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isLogin ? (
              /* LOGIN */
              <Form {...loginForm} key="login">
                <form
                  autoComplete="off"
                  onSubmit={loginForm.handleSubmit((d) =>
                    loginMutation.mutate(d)
                  )}
                  className="space-y-4"
                >
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} autoComplete="off" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            {...field}
                            autoComplete="current-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Sign In
                  </Button>
                </form>
              </Form>
            ) : (
              /* REGISTER */
              <Form {...registerForm} key="register">
                <form
                  autoComplete="off"
                  onSubmit={registerForm.handleSubmit((d) =>
                    registerMutation.mutate(d)
                  )}
                  className="space-y-4"
                >
                  <FormField
                    control={registerForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} autoComplete="off" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} autoComplete="off" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            {...field}
                            autoComplete="new-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Create Account
                  </Button>
                </form>
              </Form>
            )}

            <div className="mt-6 text-center">
              <Button variant="ghost" onClick={toggleMode}>
                {isLogin
                  ? "Don't have an account? Sign up"
                  : "Already have an account? Sign in"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
