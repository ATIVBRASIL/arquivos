import React, { useState } from 'react';
import { Shield, Menu, X, LogOut, Bookmark, Home, Settings } from 'lucide-react';
import { EXTERNAL_TRAINING_URL } from '../constants';
import { Button } from './Button';
import { ViewState } from '../types';

interface NavbarProps {
  onNavigate: (view: ViewState) => void;
  onLogout: () => void;
  isLoggedIn: boolean;
  currentView: ViewState;
  isAdmin: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onNavigate, onLogout, isLoggedIn, currentView, isAdmin }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black-900/95 backdrop-blur-sm border-b border-graphite-700 h-16 md:h-20 transition-all">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          
          {/* Logo Section - Heráldica Oficial sem redundância */}
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => onNavigate('home')}
          >
            <div className="flex items-center justify-center transition-transform group-hover:scale-105 duration-300">
              <img 
                src="/logo_ativ.png" 
                alt="ATIV BRASIL" 
                className="h-10 md:h-12 w-auto object-contain drop-shadow-[0_0_8px_rgba(245,158,11,0.2)]" 
              />
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-display font-bold text-lg md:text-2xl tracking-tighter text-text-primary leading-none uppercase">
                ARSENAL
              </span>
              {/* O nome ATIV BRASIL foi removido aqui pois já consta na logo oficial */}
            </div>
          </div>

          {/* Desktop Navigation */}
          {isLoggedIn && (
            <div className="hidden md:flex items-center gap-8">
              <button 
                onClick={() => onNavigate('home')}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${currentView === 'home' ? 'text-amber-500' : 'text-text-secondary hover:text-text-primary'}`}
              >
                <Home size={18} />
                Início
              </button>

              {/* BOTÃO ADMIN */}
              {isAdmin && (
                <button 
                  onClick={() => onNavigate('admin')}
                  className={`flex items-center gap-2 text-sm font-bold transition-colors ${currentView === 'admin' ? 'text-amber-500' : 'text-amber-500/80 hover:text-amber-500'}`}
                >
                  <Settings size={18} />
                  PAINEL ADMIN
                </button>
              )}

              {/* BOTÃO MINHA LISTA - OPERACIONALIZADO */}
              <button 
                onClick={() => onNavigate('my-list')}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${currentView === 'my-list' ? 'text-amber-500' : 'text-text-secondary hover:text-text-primary'}`}
              >
                <Bookmark size={18} />
                Minha Lista
              </button>
            </div>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <a 
              href={EXTERNAL_TRAINING_URL}
              target="_blank"
              rel="noreferrer"
              className="hidden md:flex bg-amber-500 hover:bg-amber-600 text-black-900 font-bold font-sans text-sm px-5 py-2 rounded-lg transition-all shadow-[0_0_15px_rgba(255,159,28,0.2)]"
            >
              TREINAMENTOS
            </a>

            {isLoggedIn && (
              <button onClick={onLogout} className="hidden md:block text-text-secondary hover:text-red-500 transition-colors p-2">
                <LogOut size={20} />
              </button>
            )}

            <button 
              className="md:hidden text-text-primary p-2"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-40 bg-black-900 md:hidden flex flex-col p-6 animate-fade-in">
          {isLoggedIn && (
            <div className="flex flex-col gap-6">
              <button 
                onClick={() => { onNavigate('home'); setIsMobileMenuOpen(false); }}
                className={`flex items-center gap-4 text-lg font-medium border-b border-graphite-700 pb-4 ${currentView === 'home' ? 'text-amber-500' : 'text-text-primary'}`}
              >
                <Home size={24} /> Início
              </button>

              <button 
                onClick={() => { onNavigate('my-list'); setIsMobileMenuOpen(false); }}
                className={`flex items-center gap-4 text-lg font-medium border-b border-graphite-700 pb-4 ${currentView === 'my-list' ? 'text-amber-500' : 'text-text-primary'}`}
              >
                <Bookmark size={24} /> Minha Lista
              </button>

              {isAdmin && (
                <button 
                  onClick={() => { onNavigate('admin'); setIsMobileMenuOpen(false); }}
                  className={`flex items-center gap-4 text-lg font-bold border-b border-graphite-700 pb-4 ${currentView === 'admin' ? 'text-amber-500' : 'text-amber-500/80'}`}
                >
                  <Settings size={24} /> Painel Admin
                </button>
              )}
            </div>
          )}
          <div className="mt-auto">
             <Button variant="secondary" onClick={onLogout} fullWidth>Sair do Sistema</Button>
          </div>
        </div>
      )}
    </>
  );
};