



import React, { useState, useRef } from 'react';
import { enhanceScaffoldingPrompt } from '../services/geminiService';
import { useCredits } from '../hooks/useCredits';

// Professional SVG Icons
const UploadIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const SparklesIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const ArrowRightIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
  </svg>
);

const SpinnerIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const PaperClipIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
  </svg>
);

const FolderIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

interface HomePageProps {
  onProjectUpload: (files: FileList) => void;
  onProjectDrop: (dataTransfer: DataTransfer) => void;
  onScaffoldProject: (prompt: string) => void;
  onOpenLogin?: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onProjectUpload, onProjectDrop, onScaffoldProject, onOpenLogin }) => {
  const { checkCredits, useCredit, credits, isLoggedIn } = useCredits();
  const [isDragging, setIsDragging] = useState(false);
  const [scaffoldPrompt, setScaffoldPrompt] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setIsUploading(true);
      try {
        await onProjectUpload(event.target.files);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleScaffoldSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (scaffoldPrompt.trim() && !isEnhancing) {
      try {
        if (!isLoggedIn) {
          if (onOpenLogin) {
            onOpenLogin();
          }
          return;
        }
        
        checkCredits();
        await useCredit();
        onScaffoldProject(scaffoldPrompt.trim());
      } catch (error: any) {
        console.error('Error scaffolding project:', error);
        alert(error.message);
      }
    }
  };

  const handleDragEvents = (e: React.DragEvent<HTMLFormElement>, isEntering: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(isEntering);
  };
  
  const handleDrop = async (e: React.DragEvent<HTMLFormElement>) => {
    handleDragEvents(e, false);
    if (e.dataTransfer) {
      setIsUploading(true);
      try {
        await onProjectDrop(e.dataTransfer);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setScaffoldPrompt(e.target.value);
  };

  const handleEnhancePrompt = async () => {
    if (!scaffoldPrompt.trim() || isEnhancing) return;

    setIsEnhancing(true);
    try {
        const enhancedPrompt = await enhanceScaffoldingPrompt(scaffoldPrompt);
        setScaffoldPrompt(enhancedPrompt);
    } catch (error) {
        console.error("Failed to enhance prompt:", error);
        alert(`Could not enhance the prompt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
        setIsEnhancing(false);
    }
  };

  return (
    <div className="w-full h-full bg-bg-primary overflow-y-auto">
      <div className="min-h-full bg-bg-primary flex flex-col items-center justify-center px-6">
        
        {/* Main Content - Centered like bolt.new */}
        <div className="w-full max-w-4xl mx-auto text-center">
          
          {/* Hero Section */}
          <div className="mb-8 animate-fade-in-up">
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-4 leading-tight">
              What should we build today?
            </h1>
            <p className="text-base text-text-secondary max-w-xl mx-auto leading-relaxed">
              Create stunning apps & websites by chatting with AI.
            </p>
          </div>

          {/* Credits Display - Above Input Box */}
          {isLoggedIn && (
            <div className="mb-4 animate-fade-in-up">
              <div className="inline-flex items-center space-x-2 bg-bg-glass-light rounded-full px-3 py-1.5 border border-border-secondary">
                <div className="w-1.5 h-1.5 bg-accent-primary rounded-full animate-pulse"></div>
                <span className="text-xs text-text-secondary font-medium">
                  {credits} credits available
                </span>
              </div>
            </div>
          )}

          {/* Main Input Form - bolt.new style */}
          <div className="w-full max-w-2xl mx-auto animate-fade-in-up">
            <form 
              onSubmit={handleScaffoldSubmit}
              onDragEnter={(e) => handleDragEvents(e, true)}
              onDragLeave={(e) => handleDragEvents(e, false)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={`relative bg-bg-glass border border-border-primary rounded-xl shadow-glass transition-all duration-300 ${
                isDragging 
                  ? 'border-accent-primary bg-bg-glass scale-[1.02] shadow-accent-hover' 
                  : isUploading 
                    ? 'border-accent-primary bg-bg-glass'
                    : 'hover:shadow-glass-hover'
              }`}
            >
              {/* Textarea - bolt.new style */}
              <div className="relative p-4">
                <textarea
                  ref={textareaRef}
                  value={scaffoldPrompt}
                  onChange={handleTextareaInput}
                  placeholder="Type your idea and we'll build it together."
                  className="w-full min-h-[100px] bg-transparent text-text-primary placeholder-text-muted font-sans text-base resize-none focus:outline-none focus:ring-0 border-0 leading-relaxed"
                />
                
                {/* Action Icons - bolt.new style */}
                <div className="flex items-center space-x-4 mt-3 pt-3 border-t border-border-secondary">
                  <button 
                    type="button" 
                    onClick={handleEnhancePrompt}
                    disabled={!scaffoldPrompt.trim() || isEnhancing}
                    className="text-text-muted hover:text-text-primary transition-colors duration-200"
                  >
                    {isEnhancing ? (
                      <SpinnerIcon className="w-4 h-4 animate-spin" />
                    ) : (
                      <SparklesIcon className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                webkitdirectory=""
                multiple
                style={{ display: 'none' }}
              />

              {/* Submit Button - Conditional */}
              {scaffoldPrompt.trim() && (
                <div className="absolute top-4 right-4">
                  <button 
                    type="submit" 
                    disabled={isEnhancing}
                    className="w-8 h-8 bg-accent-primary hover:bg-accent-primary/90 disabled:bg-bg-glass-light disabled:cursor-not-allowed text-text-primary rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 shadow-accent"
                  >
                    <ArrowRightIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Folder Import Button */}
          <div className="mt-6 text-center animate-fade-in-up">
            <div className="flex items-center justify-center space-x-3">
              <p className="text-text-muted text-xs">or import from</p>
              <button 
                onClick={handleUploadClick}
                disabled={isUploading}
                className="flex items-center space-x-2 px-3 py-1.5 bg-bg-glass-light border border-border-secondary rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-glass transition-all duration-200"
              >
                {isUploading ? (
                  <SpinnerIcon className="w-3 h-3 animate-spin" />
                ) : (
                  <FolderIcon className="w-3 h-3" />
                )}
                <span className="text-xs font-medium">
                  {isUploading ? 'Importing...' : 'Folder Import'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;