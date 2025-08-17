import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/auth';
import { cn } from '../utils/cn';

export function LoginPage() {
  const { login, resetPassword, loading, error, clearError } = useAuthStore();
  const [isFlipped, setIsFlipped] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    await login(email.trim(), password.trim());
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    
    try {
      await resetPassword(resetEmail.trim());
      setResetSent(true);
    } catch (error) {
      // Error handling in store
    }
  };

  const flipToReset = () => {
    clearError();
    setIsFlipped(true);
    setResetSent(false);
  };

  const flipToLogin = () => {
    clearError();
    setIsFlipped(false);
    setResetEmail('');
    setResetSent(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0],
            opacity: [0.6, 0.3, 0.6]
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-indigo-500/5 rounded-full blur-2xl"
          animate={{ 
            x: [-100, 100, -100],
            y: [-50, 50, -50],
            scale: [0.8, 1.1, 0.8]
          }}
          transition={{ 
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Floating Particles */}
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, -100, -20],
              x: [-10, 10, -10],
              opacity: [0.2, 0.8, 0.2],
              scale: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "easeInOut"
            }}
          />
        ))}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Card Container */}
      <motion.div 
        className="relative w-full max-w-md h-[500px] perspective-1000"
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        whileHover={{ scale: 1.02 }}
      >
        <motion.div
          className="relative w-full h-full preserve-3d cursor-pointer"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          whileHover={{ 
            rotateX: 2,
            rotateZ: 1,
          }}
          style={{
            transformStyle: "preserve-3d"
          }}
        >
          {/* Front Side - Login */}
          <div className="absolute inset-0 w-full h-full backface-hidden rounded-3xl bg-slate-900/80 border border-slate-700/50 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="absolute inset-px rounded-3xl bg-gradient-to-br from-cyan-500/10 via-emerald-500/5 to-indigo-500/10 pointer-events-none" />
            
            <div className="relative p-8 h-full flex flex-col">
              {/* Header */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg"
                >
                  AZ
                </motion.div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-emerald-400 to-indigo-400 bg-clip-text text-transparent">
                  AYZEK'e Hoş Geldin
                </h1>
                <p className="text-slate-400 text-sm mt-2">Hesabınıza giriş yapın</p>
              </div>

              {/* Form */}
              <motion.form 
                onSubmit={handleLogin} 
                className="flex-1 space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <motion.div 
                  className="space-y-4"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, staggerChildren: 0.1 }}
                >
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      E-posta
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ornek@email.com"
                      className="w-full rounded-xl bg-slate-800/60 border border-slate-600/40 focus:border-cyan-400 outline-none px-4 py-3 text-white placeholder-slate-500 transition"
                      required
                    />
                  </motion.div>

                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Şifre
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl bg-slate-800/60 border border-slate-600/40 focus:border-cyan-400 outline-none px-4 py-3 text-white placeholder-slate-500 transition"
                      required
                    />
                  </motion.div>
                </motion.div>

                {/* Error Display */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-3 rounded-lg bg-red-500/20 border border-red-400/30 text-red-300 text-sm"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Actions */}
                <motion.div 
                  className="space-y-4"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <motion.button
                    type="submit"
                    disabled={loading || !email.trim() || !password.trim()}
                    className={cn(
                      'w-full py-3 rounded-xl font-semibold text-white transition relative overflow-hidden',
                      loading || !email.trim() || !password.trim()
                        ? 'bg-slate-700 cursor-not-allowed'
                        : 'bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 active:scale-[0.98]'
                    )}
                    whileHover={{ scale: loading ? 1 : 1.02 }}
                    whileTap={{ scale: loading ? 1 : 0.98 }}
                    transition={{ duration: 0.1 }}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Giriş yapılıyor...
                      </div>
                    ) : (
                      'Giriş Yap'
                    )}
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={flipToReset}
                    className="w-full text-center text-sm text-slate-400 hover:text-cyan-400 transition"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Şifremi unuttum
                  </motion.button>
                </motion.div>
              </motion.form>
            </div>
          </div>

          {/* Back Side - Password Reset */}
          <div className="absolute inset-0 w-full h-full backface-hidden rounded-3xl bg-slate-900/80 border border-slate-700/50 backdrop-blur-xl shadow-2xl overflow-hidden transform rotateY-180">
            <div className="absolute inset-px rounded-3xl bg-gradient-to-br from-orange-500/10 via-red-500/5 to-pink-500/10 pointer-events-none" />
            
            <div className="relative p-8 h-full flex flex-col">
              {/* Header */}
              <div className="text-center mb-8">
                <motion.div
                  className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white shadow-lg"
                >
                  <KeyIcon />
                </motion.div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
                  Şifre Sıfırlama
                </h1>
                <p className="text-slate-400 text-sm mt-2">
                  {resetSent ? 'E-posta gönderildi!' : 'E-posta adresinizi girin'}
                </p>
              </div>

              {/* Content */}
              <div className="flex-1">
                {resetSent ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-4"
                  >
                    <div className="w-20 h-20 mx-auto rounded-full bg-green-500/20 border border-green-400/30 flex items-center justify-center">
                      <CheckIcon />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-green-400">E-posta Gönderildi</h3>
                      <p className="text-sm text-slate-400 leading-relaxed">
                        Şifre sıfırlama bağlantısı <strong>{resetEmail}</strong> adresine gönderildi.
                        E-postanızı kontrol edin ve bağlantıya tıklayarak yeni şifrenizi belirleyin.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        E-posta Adresi
                      </label>
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="ornek@email.com"
                        className="w-full rounded-xl bg-slate-800/60 border border-slate-600/40 focus:border-orange-400 outline-none px-4 py-3 text-white placeholder-slate-500 transition"
                        required
                      />
                    </div>

                    {/* Error Display */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="p-3 rounded-lg bg-red-500/20 border border-red-400/30 text-red-300 text-sm"
                        >
                          {error}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <button
                      type="submit"
                      disabled={loading || !resetEmail.trim()}
                      className={cn(
                        'w-full py-3 rounded-xl font-semibold text-white transition',
                        loading || !resetEmail.trim()
                          ? 'bg-slate-700 cursor-not-allowed'
                          : 'bg-gradient-to-r from-orange-500 to-red-500 hover:brightness-110 active:scale-[0.98]'
                      )}
                    >
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Gönderiliyor...
                        </div>
                      ) : (
                        'E-posta Gönder'
                      )}
                    </button>
                  </form>
                )}
              </div>

              {/* Back Button */}
              <button
                onClick={flipToLogin}
                className="mt-6 w-full text-center text-sm text-slate-400 hover:text-orange-400 transition"
              >
                ← Giriş sayfasına dön
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function KeyIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37a2.5 2.5 0 1 1 3.54 3.54L12 21.42l-3.53-3.54a2.5 2.5 0 1 1 3.54-3.54L12 14.34l.01-.01z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
      <polyline points="20,6 9,17 4,12" />
    </svg>
  );
}
