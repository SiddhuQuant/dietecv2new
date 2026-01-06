import { useState, useEffect } from "react";
import { supabase } from "./utils/supabase/client";
import { authService } from "./services/authService";
import { LoginPage } from "./components/LoginPage";
import { HomePage } from "./components/HomePage";
import { DoctorDashboard } from "./components/DoctorDashboard";
import { AdminDashboard } from "./components/AdminDashboard";
import { PersonalDoctor } from "./components/PersonalDoctor";
import { MedicalHistory } from "./components/MedicalHistory";
import { MedicalDoubts } from "./components/MedicalDoubts";
import { DietNutritionGuide } from "./components/DietNutritionGuide";
import { FirstAidHelp } from "./components/FirstAidHelp";
import { DoctorConnect } from "./components/DoctorConnect";
import { PhysiotherapyExercises } from "./components/PhysiotherapyExercises";
import { TestBookingComponent } from "./components/TestBookingComponent";
import { DoctorBookingComponent } from "./components/DoctorBookingComponent";
import { VoiceBot } from "./components/VoiceBot";
import { Billing } from "./components/Billing";
import { Medicines } from "./components/Medicines";
import OnboardingGuide from "./components/OnboardingGuide";
import { MedicalAdvisor } from "./components/MedicalAdvisor";
import { LoadingScreen } from "./components/LoadingScreen";
import { ProfileCompletionModal, ProfileData } from "./components/ProfileCompletionModal";
import { userProfileService } from "./services/userProfileService";

type Section =
  | "home"
  | "personal-doctor"
  | "medical"
  | "doubts"
  | "diet"
  | "firstaid"
  | "doctor"
  | "exercises"
  | "medicaladvisor"
  | "book-tests"
  | "book-appointments"
  | "billing"
  | "medicines";

interface User {
  name: string;
  email: string;
  role: "patient" | "doctor" | "admin";
}

export default function App() {
  const getInitialSection = (): Section => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '');
      const validSections: Section[] = [
        "home", "personal-doctor", "medical", "doubts", "diet",
        "firstaid", "doctor", "exercises", "medicaladvisor", "book-tests", "book-appointments",
        "billing", "medicines"
      ];
      if (validSections.includes(hash as Section)) {
        return hash as Section;
      }
    }
    return "home";
  };

  const [currentSection, setCurrentSection] = useState<Section>(getInitialSection());
  const [user, setUser] = useState<User | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] =
    useState<boolean>(false);
  const [showProfileSetup, setShowProfileSetup] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      // 1. Check localStorage for doctor/admin (they don't use Supabase Auth)
      const storedUser = localStorage.getItem('dietec-current-user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUser({
            name: userData.name,
            email: userData.email,
            role: userData.role
          });
          setIsLoading(false);
          return;
        } catch (e) {
          localStorage.removeItem('dietec-current-user');
        }
      }

      // 2. Check Supabase session for patients
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser({
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          role: 'patient'
        });
      }
      setIsLoading(false);
    };

    checkSession();

    // Handle browser navigation
    const handlePopState = () => {
      const hash = window.location.hash.replace('#', '');
      const validSections: Section[] = [
        "home", "personal-doctor", "medical", "doubts", "diet",
        "firstaid", "doctor", "exercises", "medicaladvisor",
        "billing", "medicines"
      ];
      if (validSections.includes(hash as Section)) {
        setCurrentSection(hash as Section);
      } else {
        setCurrentSection("home");
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Load theme preference from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("dietec-theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setIsDarkMode(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);

    if (newTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("dietec-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("dietec-theme", "light");
    }
  };

  const handleLogin = (userData: User) => {
    setUser({
      name: userData.name,
      email: userData.email,
      role: userData.role || 'patient'
    });
    setCurrentSection("home");
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    localStorage.setItem("dietec-onboarding-completed", "true");
  };

  const handleLogout = async () => {
    localStorage.removeItem('dietec-current-user');
    await supabase.auth.signOut();
    setUser(null);
    setCurrentSection("home");
  };

  const navigateToSection = (section: string) => {
    setCurrentSection(section as Section);
    window.history.pushState({ section }, '', `#${section}`);
    window.scrollTo(0, 0);
  };

  const goHome = () => {
    setCurrentSection("home");
    window.history.pushState({ section: 'home' }, '', '#home');
    window.scrollTo(0, 0);
  };

  // Show loading screen on initial load
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Show login page if user is not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <LoginPage
          onLogin={handleLogin}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
        />
        <VoiceBot
          currentSection="login"
          userName={undefined}
          isLoggedIn={false}
          isDarkMode={isDarkMode}
        />
      </div>
    );
  }

  const renderCurrentSection = () => {
    // Handle role-based dashboard rendering
    if (currentSection === "home" || currentSection === "home") {
      if (user?.role === "doctor") {
        return (
          <DoctorDashboard
            onNavigate={navigateToSection}
            doctorName={user.name}
            onLogout={handleLogout}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
          />
        );
      } else if (user?.role === "admin") {
        return (
          <AdminDashboard
            onNavigate={navigateToSection}
            adminName={user.name}
            onLogout={handleLogout}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
          />
        );
      }
      // Default patient dashboard
      return (
        <HomePage
          onNavigate={navigateToSection}
          userName={user.name}
          onLogout={handleLogout}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
          onCompleteProfile={() => setShowProfileSetup(true)}
        />
      );
    }

    // Only allow patients to access other sections
    if (user?.role !== "patient") {
      // Return to appropriate dashboard for non-patients
      if (user?.role === "doctor") {
        return (
          <DoctorDashboard
            onNavigate={navigateToSection}
            doctorName={user.name}
            onLogout={handleLogout}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
          />
        );
      } else if (user?.role === "admin") {
        return (
          <AdminDashboard
            onNavigate={navigateToSection}
            adminName={user.name}
            onLogout={handleLogout}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
          />
        );
      }
    }

    switch (currentSection) {
      case "personal-doctor":
        return (
          <PersonalDoctor
            onBack={goHome}
            userName={user.name}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
          />
        );
      case "medical":
        return (
          <MedicalHistory
            onBack={goHome}
            userName={user.name}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
          />
        );
      case "doubts":
        return (
          <MedicalDoubts
            onBack={goHome}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
          />
        );
      case "diet":
        return (
          <DietNutritionGuide
            onBack={goHome}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
          />
        );
      case "firstaid":
        return (
          <FirstAidHelp
            onBack={goHome}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
            userName={userObject?.name || "User"}
            onLogout={logout}
          />
        );
      case "doctor":
        return (
          <DoctorConnect
            onBack={goHome}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
            userName={userObject?.name || "User"}
            onLogout={logout}
          />
        );
      case "exercises":
        return (
          <PhysiotherapyExercises
            onBack={goHome}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
          />
        );
      case "medicaladvisor":
        return (
          <MedicalAdvisor
            onBack={goHome}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
          />
        );
      case "book-tests":
        return (
          <TestBookingComponent
            isDarkMode={isDarkMode}
            userName={user.name}
            onLogout={handleLogout}
            onToggleTheme={toggleTheme}
            onBack={goHome}
          />
        );
      case "book-appointments":
        return (
          <DoctorBookingComponent
            isDarkMode={isDarkMode}
            userName={user.name}
            onLogout={handleLogout}
            onToggleTheme={toggleTheme}
            onBack={goHome}
          />
        );
      case "billing":
        return (
          <Billing
            onBack={goHome}
            userName={user.name}
            isDarkMode={isDarkMode}
          />
        );
      case "medicines":
        return (
          <Medicines
            onBack={goHome}
            userName={user.name}
            isDarkMode={isDarkMode}
          />
        );
      default:
        return (
          <HomePage
            onNavigate={navigateToSection}
            userName={user.name}
            onLogout={handleLogout}
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
            onCompleteProfile={() => setShowProfileSetup(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderCurrentSection()}
      <VoiceBot
        currentSection={currentSection}
        userName={user?.name}
        isLoggedIn={!!user}
        isDarkMode={isDarkMode}
      />
      {showOnboarding && (
        <OnboardingGuide
          isFirstTimeUser={true}
          onComplete={handleOnboardingComplete}
          isDarkMode={isDarkMode}
        />
      )}
      {showProfileSetup && user && (
        <ProfileCompletionModal
          isOpen={showProfileSetup}
          onComplete={async (profileData: ProfileData) => {
            // Save profile data to Supabase and localStorage
            try {
              console.log('💾 Saving profile data...', profileData);
              
              await userProfileService.saveUserProfile({
                fullName: profileData.fullName,
                dateOfBirth: profileData.dateOfBirth,
                gender: profileData.gender,
                phoneNumber: profileData.phoneNumber,
                address: profileData.address,
                medicalConditions: profileData.medicalConditions || "",
                allergies: profileData.allergies || "",
                emergencyContact: profileData.emergencyContact || "",
              });
              
              console.log('✅ Profile saved successfully! Data synced to Medical History.');
              
              // Mark profile as completed
              localStorage.setItem("dietec-profile-completed", "true");
              setShowProfileSetup(false);
              
              // After profile setup, show onboarding
              const hasSeenOnboarding = localStorage.getItem("dietec-onboarding-completed");
              if (!hasSeenOnboarding) {
                setTimeout(() => setShowOnboarding(true), 500);
              }
            } catch (error) {
              console.error("❌ Failed to save profile:", error);
              alert("Failed to save profile. Please try again or check your internet connection.");
              // Don't close modal if save fails so user can retry
            }
          }}
          onClose={() => {
            // Allow closing without completing (for now)
            setShowProfileSetup(false);
          }}
        />
      )}
    </div>
  );
}