import { BrowserRouter, Routes, Route } from "react-router-dom";
import QuizRunner from "@/features/quiz/QuizRunner";
import Hero from "@/features/hero/Hero";
import Quiz from "@/pages/Quiz";
import Result from "@/features/quiz/Result";
import Ranking from "@/features/ranking/Ranking";
import Historial from "@/pages/Historial";
import PrivateRoute from "@/features/auth/PrivateRoute";
import ContactForm from "@/components/ui/ContactForm";
import Gracias from "@/pages/Gracias";
import Summary from "@/features/quiz/pages/Summary";
import Footer from "@/components/ui/Footer";
import Navbar from "@/components/ui/Navbar";
import Dashboard from "@/features/dashboard/Dashboard";
import Achievements from "@/components/ui/Achievements";
import ChallengeCategories from "@/features/challenges/pages/ChallengeCategories";
import ChallengeEditorPage from "@/features/challenges/pages/ChallengeEditorPage";
import Header from "@/components/ui/Header";

export type Category = { id: string; slug?: string; name?: string };

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Navbar />
      {/* <Header /> */}
      <Routes>
        <Route path="/" element={<Hero />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/quiz/:category" element={<QuizRunner />} />
        <Route path="/result" element={<Result />} />
        <Route path="/summary" element={<Summary />} />
        <Route path="/ranking" element={<Ranking />} />
        <Route
          path="/historial"
          element={
            <PrivateRoute>
              <Historial />
            </PrivateRoute>
          }
        />
        <Route
          path="/editor"
          element={
            <PrivateRoute>
              <ChallengeCategories
                isAuthenticated={true}
                onSelectCategory={() => {}}
              />
            </PrivateRoute>
          }
        />
        <Route
          path="/editor/:categoria/:id"
          element={
            <PrivateRoute>
              <ChallengeEditorPage />
            </PrivateRoute>
          }
        />
        <Route path="/contacto" element={<ContactForm />} />
        <Route path="/gracias" element={<Gracias />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/logros"
          element={
            <PrivateRoute>
              <Achievements
                achievements={[
                  { icon: "🏆", title: "Logro 1", unlocked: true },
                  { icon: "🎉", title: "Logro 2", unlocked: false },
                  { icon: "🥇", title: "Logro 3", unlocked: true },
                ]}
              />
            </PrivateRoute>
          }
        />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}
