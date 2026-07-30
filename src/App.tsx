import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
// Rotas "quentes" (aluno/jogador) carregam de imediato — leve e rápido.
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { JoinPage } from './pages/JoinPage'
import { PlayPage } from './pages/PlayPage'

// Rotas de criador/host carregam sob demanda (code-splitting) — mantém o pacote inicial pequeno.
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const EditorPage = lazy(() => import('./pages/EditorPage').then((m) => ({ default: m.EditorPage })))
const HostPage = lazy(() => import('./pages/HostPage').then((m) => ({ default: m.HostPage })))
const ResultsPage = lazy(() => import('./pages/ResultsPage').then((m) => ({ default: m.ResultsPage })))
const CreateAiPage = lazy(() => import('./pages/CreateAiPage').then((m) => ({ default: m.CreateAiPage })))
const ExplorePage = lazy(() => import('./pages/ExplorePage').then((m) => ({ default: m.ExplorePage })))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })))
const SoloPage = lazy(() => import('./pages/SoloPage').then((m) => ({ default: m.SoloPage })))
const CreatorPage = lazy(() => import('./pages/CreatorPage').then((m) => ({ default: m.CreatorPage })))

function Loading() {
  return (
    <div className="min-h-screen grid place-items-center">
      <p className="font-display font-semibold text-body text-lg">Carregando…</p>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/join" element={<JoinPage />} />
            <Route path="/play/:gameId" element={<PlayPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/solo/:quizId" element={<SoloPage />} />
            <Route path="/creator" element={<CreatorPage />} />
            <Route path="/creator/:quizId" element={<CreatorPage />} />
            <Route
              path="/host/:gameId"
              element={
                <ProtectedRoute>
                  <HostPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quiz/:id"
              element={
                <ProtectedRoute>
                  <EditorPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-ai"
              element={
                <ProtectedRoute>
                  <CreateAiPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/results/:gameId"
              element={
                <ProtectedRoute>
                  <ResultsPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
