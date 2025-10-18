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
  refreshUserProfile: () => Promise<void>;
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);

      if (session?.user) {
        // CRITICAL FIX: Defer async call to avoid deadlock
        setTimeout(() => {
          fetchUserProfile(session.user.id).catch((err) =>
            console.error("Initial profile fetch failed", err)
          );
        }, 0);
      } else {
        // No session, set loading to false
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state change:", event, session?.user?.email);
      setSession(session);
      setSupabaseUser(session?.user ?? null);

      if (session?.user) {
        console.log("Scheduling profile fetch for user:", session.user.id);
        // CRITICAL FIX: Defer async call to avoid deadlock
        setTimeout(() => {
          fetchUserProfile(session.user.id).catch((err) =>
            console.error("Profile fetch failed", err)
          );
        }, 0);
      } else {
        console.log("No user session, clearing user");
        setUser(null);
        setIsLoading(false);
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
      try {
        // First, check if user exists in database
        const { data: existingUser, error: fetchError } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .single();

        if (fetchError && fetchError.code === "PGRST116") {
          // User doesn't exist in database, check if user exists by email first
          console.log("User not found by ID, checking by email...");
          const { data: existingByEmail, error: emailError } = await supabase
            .from("users")
            .select("*")
            .eq("email", session.user.email!)
            .single();

          if (emailError && emailError.code === "PGRST116") {
            // User doesn't exist at all, create them
            console.log("User not found in database, creating profile...");
            const { error: insertError } = await supabase.from("users").insert([
              {
                id: session.user.id,
                email: session.user.email!,
                first_name: session.user.user_metadata?.first_name || "",
                last_name: session.user.user_metadata?.last_name || "",
                role: "student", // Default to student for new users
                student_number: session.user.user_metadata?.student_number,
                created_at: new Date().toISOString(),
              },
            ]);

            if (insertError) {
              console.error("Error creating user profile:", insertError);
              // Fallback to basic profile
              const basicProfile: User = {
                id: session.user.id,
                email: session.user.email!,
                firstName: session.user.user_metadata?.first_name || "",
                lastName: session.user.user_metadata?.last_name || "",
                role: "student", // Default to student
                studentNumber: session.user.user_metadata?.student_number,
                modules: [],
                createdAt: new Date(session.user.created_at),
                lastLogin: undefined,
              };
              setUser(basicProfile);
            } else {
              console.log("User profile created successfully");
              // Now fetch the created user
              const { data: newUser } = await supabase
                .from("users")
                .select("*")
                .eq("id", userId)
                .single();

              if (newUser) {
                const userProfile: User = {
                  id: newUser.id,
                  email: newUser.email,
                  firstName: newUser.first_name,
                  lastName: newUser.last_name,
                  role: newUser.role,
                  studentNumber: newUser.student_number,
                  modules: newUser.modules || [],
                  profilePicture: newUser.profile_picture,
                  githubUsername: newUser.github_username,
                  githubProfileUrl: newUser.github_profile_url,
                  githubBio: newUser.github_bio,
                  githubLocation: newUser.github_location,
                  githubWebsite: newUser.github_website,
                  githubCompany: newUser.github_company,
                  createdAt: new Date(newUser.created_at),
                  lastLogin: newUser.last_login
                    ? new Date(newUser.last_login)
                    : undefined,
                };
                setUser(userProfile);
              }
            }
          } else if (existingByEmail) {
            // User exists by email but with different ID, update the ID
            console.log("User exists with different ID, updating ID...");
            const { error: updateError } = await supabase
              .from("users")
              .update({ id: session.user.id })
              .eq("email", session.user.email!);

            if (updateError) {
              console.error("Error updating user ID:", updateError);
              // Use the existing user data
              const userProfile: User = {
                id: existingByEmail.id,
                email: existingByEmail.email,
                firstName: existingByEmail.first_name,
                lastName: existingByEmail.last_name,
                role: existingByEmail.role,
                studentNumber: existingByEmail.student_number,
                modules: existingByEmail.modules || [],
                profilePicture: existingByEmail.profile_picture,
                githubUsername: existingByEmail.github_username,
                githubProfileUrl: existingByEmail.github_profile_url,
                githubBio: existingByEmail.github_bio,
                githubLocation: existingByEmail.github_location,
                githubWebsite: existingByEmail.github_website,
                githubCompany: existingByEmail.github_company,
                createdAt: new Date(existingByEmail.created_at),
                lastLogin: existingByEmail.last_login
                  ? new Date(existingByEmail.last_login)
                  : undefined,
              };
              setUser(userProfile);
            } else {
              // Fetch the updated user
              const { data: updatedUser } = await supabase
                .from("users")
                .select("*")
                .eq("id", userId)
                .single();

              if (updatedUser) {
                const userProfile: User = {
                  id: updatedUser.id,
                  email: updatedUser.email,
                  firstName: updatedUser.first_name,
                  lastName: updatedUser.last_name,
                  role: updatedUser.role,
                  studentNumber: updatedUser.student_number,
                  modules: updatedUser.modules || [],
                  profilePicture: updatedUser.profile_picture,
                  githubUsername: updatedUser.github_username,
                  githubProfileUrl: updatedUser.github_profile_url,
                  githubBio: updatedUser.github_bio,
                  githubLocation: updatedUser.github_location,
                  githubWebsite: updatedUser.github_website,
                  githubCompany: updatedUser.github_company,
                  createdAt: new Date(updatedUser.created_at),
                  lastLogin: updatedUser.last_login
                    ? new Date(updatedUser.last_login)
                    : undefined,
                };
                setUser(userProfile);
              }
            }
          }
        } else if (existingUser) {
          // User exists, create profile from database data
          const userProfile: User = {
            id: existingUser.id,
            email: existingUser.email,
            firstName: existingUser.first_name,
            lastName: existingUser.last_name,
            role: existingUser.role,
            studentNumber: existingUser.student_number,
            modules: existingUser.modules || [],
            profilePicture: existingUser.profile_picture,
            githubUsername: existingUser.github_username,
            githubProfileUrl: existingUser.github_profile_url,
            githubBio: existingUser.github_bio,
            githubLocation: existingUser.github_location,
            githubWebsite: existingUser.github_website,
            githubCompany: existingUser.github_company,
            createdAt: new Date(existingUser.created_at),
            lastLogin: existingUser.last_login
              ? new Date(existingUser.last_login)
              : undefined,
          };
          setUser(userProfile);
        }
      } catch (error) {
        console.error("Error in fetchUserProfile:", error);
        // Fallback to basic profile
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

  const refreshUserProfile = async () => {
    if (supabaseUser) {
      await fetchUserProfile(supabaseUser.id);
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
    refreshUserProfile,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
