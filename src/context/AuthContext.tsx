import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User as SupabaseUser, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { User } from "../types";

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  session: Session | null;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (userData: Partial<User>, password: string) => Promise<boolean>;
  resendConfirmation: (email: string) => Promise<boolean>;
  createUserProfile: (userData: Partial<User>) => Promise<boolean>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);

      if (session?.user) {
        // Fetch user profile from database
        fetchUserProfile(session.user.id);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event, session?.user?.email);
      setSession(session);
      setSupabaseUser(session?.user ?? null);

      if (session?.user) {
        console.log("Fetching profile for user:", session.user.id);
        await fetchUserProfile(session.user.id);
      } else {
        console.log("No user session, clearing user");
        setUser(null);
        if (event === "SIGNED_OUT") {
          console.log("User signed out successfully");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    // Get the current session to access user data
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      const basicProfile: User = {
        id: session.user.id,
        email: session.user.email!,
        firstName: session.user.user_metadata?.first_name || "",
        lastName: session.user.user_metadata?.last_name || "",
        role: session.user.user_metadata?.role || "student",
        studentNumber: session.user.user_metadata?.student_number,
        modules: [],
        createdAt: new Date(session.user.created_at),
        lastLogin: undefined,
      };
      setUser(basicProfile);
    }

    setIsLoading(false);
  };

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error:", error.message);

        // Handle specific error cases
        if (error.message.includes("Email not confirmed")) {
          return {
            success: false,
            error:
              "Please check your email and click the confirmation link to activate your account.",
          };
        } else if (error.message.includes("Invalid login credentials")) {
          return { success: false, error: "Invalid email or password." };
        } else {
          return { success: false, error: error.message };
        }
      }

      // User profile will be fetched by the auth state change listener
      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "An unexpected error occurred." };
    }
  };

  const register = async (
    userData: Partial<User>,
    password: string
  ): Promise<boolean> => {
    try {
      // Validate email domain
      if (
        !userData.email?.endsWith("@belgiumcampus.ac.za") &&
        !userData.email?.endsWith("@student.belgiumcampus.ac.za")
      ) {
        return false;
      }

      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: userData.email!,
        password,
        options: {
          data: {
            first_name: userData.firstName,
            last_name: userData.lastName,
            role: userData.role || "student",
            student_number: userData.studentNumber,
          },
        },
      });

      if (error) {
        console.error("Registration error:", error.message);
        return false;
      }

      if (data.user) {
        console.log("User created in Supabase Auth:", data.user.id);
      }

      return true;
    } catch (error) {
      console.error("Registration error:", error);
      return false;
    }
  };

  const logout = async () => {
    console.log("Logging out user");
    await supabase.auth.signOut();
    console.log("Supabase signOut completed");
  };

  const resendConfirmation = async (email: string): Promise<boolean> => {
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
      });

      if (error) {
        console.error("Resend confirmation error:", error.message);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Resend confirmation error:", error);
      return false;
    }
  };

  const createUserProfile = async (
    userData: Partial<User>
  ): Promise<boolean> => {
    if (!supabaseUser) {
      console.error("No authenticated user to create profile for");
      return false;
    }

    try {
      console.log("Creating user profile for:", supabaseUser.id);

      // Create user profile in database
      const { error: profileError } = await supabase.from("users").insert([
        {
          id: supabaseUser.id,
          email: userData.email || supabaseUser.email!,
          first_name:
            userData.firstName || supabaseUser.user_metadata?.first_name || "",
          last_name:
            userData.lastName || supabaseUser.user_metadata?.last_name || "",
          role: userData.role || supabaseUser.user_metadata?.role || "student",
          student_number:
            userData.studentNumber ||
            supabaseUser.user_metadata?.student_number,
          created_at: new Date().toISOString(),
        },
      ]);

      if (profileError) {
        console.error("Profile creation error:", profileError.message);
        return false;
      }

      // Add user modules if provided
      if (userData.modules && userData.modules.length > 0) {
        // First, get the module IDs from the module codes
        const { data: modules, error: modulesError } = await supabase
          .from("modules")
          .select("id")
          .in("code", userData.modules);

        if (modulesError) {
          console.error("Error fetching modules:", modulesError.message);
        } else if (modules) {
          const moduleInserts = modules.map((module) => ({
            user_id: supabaseUser.id,
            module_id: module.id,
          }));

          const { error: moduleError } = await supabase
            .from("user_modules")
            .insert(moduleInserts);

          if (moduleError) {
            console.error("Module assignment error:", moduleError.message);
          }
        }
      }

      console.log("User profile created successfully");
      return true;
    } catch (error) {
      console.error("Error creating user profile:", error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    supabaseUser,
    session,
    login,
    logout,
    register,
    resendConfirmation,
    createUserProfile,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
