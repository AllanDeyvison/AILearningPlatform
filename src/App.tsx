/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { StudyProvider, useStudy } from './context/StudyContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { CommandPalette } from './components/common/CommandPalette';
import { DashboardView } from './components/dashboard/DashboardView';
import { QuizCenterView } from './components/quiz/QuizCenterView';
import { FlashcardStudyView } from './components/flashcards/FlashcardStudyView';
import { StudyLabView } from './components/materials/StudyLabView';
import { TutorChatView } from './components/tutor/TutorChatView';
import { ReviewDiagnosticsView } from './components/review/ReviewDiagnosticsView';
import { CreateQuizModal } from './components/modals/CreateQuizModal';
import { CreateFlashcardsModal } from './components/modals/CreateFlashcardsModal';
import { CreateMaterialModal } from './components/modals/CreateMaterialModal';
import { CreateDeckModal } from './components/modals/CreateDeckModal';

const AppContent: React.FC = () => {
  const { activeTab } = useStudy();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [cardsModalOpen, setCardsModalOpen] = useState(false);
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [deckModalOpen, setDeckModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#DFE2F1] flex flex-col md:flex-row antialiased">
      {/* Navigation Sidebar */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onOpenQuickQuiz={() => setQuizModalOpen(true)}
        onOpenQuickFlashcards={() => setCardsModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              onOpenQuickQuiz={() => setQuizModalOpen(true)}
              onOpenQuickFlashcards={() => setCardsModalOpen(true)}
              onOpenQuickMaterial={() => setMaterialModalOpen(true)}
            />
          )}

          {activeTab === 'quizzes' && (
            <QuizCenterView onOpenCreateQuizModal={() => setQuizModalOpen(true)} />
          )}

          {activeTab === 'flashcards' && (
            <FlashcardStudyView
              onOpenCreateCardsModal={() => setCardsModalOpen(true)}
              onOpenCreateDeckModal={() => setDeckModalOpen(true)}
            />
          )}

          {activeTab === 'materials' && (
            <StudyLabView onOpenCreateMaterialModal={() => setMaterialModalOpen(true)} />
          )}

          {activeTab === 'tutor' && <TutorChatView />}

          {activeTab === 'review' && <ReviewDiagnosticsView />}
        </main>
      </div>

      {/* Global Modals */}
      <CommandPalette
        onOpenQuickQuiz={() => setQuizModalOpen(true)}
        onOpenQuickFlashcards={() => setCardsModalOpen(true)}
        onOpenQuickMaterial={() => setMaterialModalOpen(true)}
      />

      <CreateQuizModal
        isOpen={quizModalOpen}
        onClose={() => setQuizModalOpen(false)}
      />

      <CreateFlashcardsModal
        isOpen={cardsModalOpen}
        onClose={() => setCardsModalOpen(false)}
      />

      <CreateMaterialModal
        isOpen={materialModalOpen}
        onClose={() => setMaterialModalOpen(false)}
      />

      <CreateDeckModal
        isOpen={deckModalOpen}
        onClose={() => setDeckModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <StudyProvider>
      <AppContent />
    </StudyProvider>
  );
}
