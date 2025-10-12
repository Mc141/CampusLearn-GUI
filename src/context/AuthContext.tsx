import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User } from "../types";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: Partial<User>, password: string) => Promise<boolean>;
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem("campuslearn_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem("campuslearn_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    // Simulate API call with dummy data
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Dummy authentication logic
    const dummyUsers: User[] = [
      {
        id: "1",
        email: "student@belgiumcampus.ac.za",
        firstName: "John",
        lastName: "Doe",
        role: "student",
        studentNumber: "BC2023001",
        modules: ["BCOM101", "BCOM102"],
        createdAt: new Date("2023-01-01"),
        lastLogin: new Date(),
      },
      {
        id: "2",
        email: "tutor@belgiumcampus.ac.za",
        firstName: "Jane",
        lastName: "Smith",
        role: "tutor",
        modules: ["BCOM101", "BCOM102", "BIT101"],
        createdAt: new Date("2023-01-01"),
        lastLogin: new Date(),
      },
      {
        id: "3",
        email: "admin@belgiumcampus.ac.za",
        firstName: "Admin",
        lastName: "User",
        role: "admin",
        createdAt: new Date("2023-01-01"),
        lastLogin: new Date(),
      },
    ];

    const foundUser = dummyUsers.find((u) => u.email === email);

    if (foundUser && password === "password") {
      setUser(foundUser);
      localStorage.setItem("campuslearn_user", JSON.stringify(foundUser));
      setIsLoading(false);
      return true;
    }

    setIsLoading(false);
    return false;
  };

  const register = async (
    userData: Partial<User>,
    password: string
  ): Promise<boolean> => {
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Validate email domain
    if (!userData.email?.endsWith("@belgiumcampus.ac.za")) {
      setIsLoading(false);
      return false;
    }

    const newUser: User = {
      id: Date.now().toString(),
      email: userData.email!,
      firstName: userData.firstName!,
      lastName: userData.lastName!,
      role: userData.role || "student",
      studentNumber: userData.studentNumber,
      modules: userData.modules || [],
      createdAt: new Date(),
    };

    setUser(newUser);
    localStorage.setItem("campuslearn_user", JSON.stringify(newUser));
    setIsLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("campuslearn_user");
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    register,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
