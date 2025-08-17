import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useUserStore } from '../store/user';
import { cn } from '../utils/cn';

export function ProfilePage() {
  const { profile, updateProfile, setAvatar, removeAvatar } = useUserStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: profile.username,
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    phone: profile.phone,
    bio: profile.bio || '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    updateProfile(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      username: profile.username,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: profile.phone,
      bio: profile.bio || '',
    });
    setIsEditing(false);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Dosya boyutu kontrolü (2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Dosya boyutu 2MB\'dan küçük olmalıdır.');
      return;
    }

    // Dosya tipi kontrolü
    if (!file.type.startsWith('image/')) {
      alert('Sadece resim dosyaları yüklenebilir.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setAvatar(String(reader.result));
      }
    };
    reader.readAsDataURL(file);
  };

  const getInitials = (username: string, firstName: string, lastName: string) => {
    if (firstName && lastName) {
      return (firstName[0] + lastName[0]).toUpperCase();
    }
    return username.split(/\s+/).map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-emerald-400 to-indigo-400 bg-clip-text text-transparent">
          Profil Ayarları
        </h1>
        <p className="text-slate-400 text-sm">Hesap bilgilerinizi düzenleyin</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Avatar Section */}
        <div className="lg:col-span-1">
          <ProfileCard>
            <div className="text-center space-y-6">
              {/* Avatar */}
              <div className="relative inline-block">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-slate-700/50"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-slate-900 text-3xl font-bold border-4 border-slate-700/50">
                    {getInitials(profile.username, profile.firstName, profile.lastName)}
                  </div>
                )}
                
                {/* Upload Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white flex items-center justify-center transition shadow-lg border-2 border-slate-900"
                >
                  <CameraIcon />
                </button>
                
                {/* Remove Button */}
                {profile.avatar && (
                  <button
                    onClick={removeAvatar}
                    className="absolute top-0 right-0 w-8 h-8 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition shadow-lg text-xs"
                  >
                    ×
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />

              {/* User Info */}
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">
                  {profile.firstName && profile.lastName 
                    ? `${profile.firstName} ${profile.lastName}`
                    : profile.username
                  }
                </h2>
                <p className="text-slate-400 text-sm">@{profile.username}</p>
                {profile.bio && (
                  <p className="text-slate-300 text-sm leading-relaxed px-4">
                    {profile.bio}
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="text-center p-3 rounded-xl bg-slate-800/40">
                  <div className="text-lg font-bold text-cyan-400">
                    {new Date(profile.createdAt).toLocaleDateString('tr-TR')}
                  </div>
                  <div className="text-xs text-slate-500">Katılım</div>
                </div>
                <div className="text-center p-3 rounded-xl bg-slate-800/40">
                  <div className="text-lg font-bold text-emerald-400">
                    {new Date(profile.updatedAt).toLocaleDateString('tr-TR')}
                  </div>
                  <div className="text-xs text-slate-500">Son Güncelleme</div>
                </div>
              </div>
            </div>
          </ProfileCard>
        </div>

        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          <ProfileCard>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Kişisel Bilgiler</h3>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-sm transition"
                >
                  Düzenle
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-500 text-white font-medium text-sm transition"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition"
                  >
                    Kaydet
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Username */}
              <FormField
                label="Kullanıcı Adı"
                value={formData.username}
                onChange={(value) => setFormData({ ...formData, username: value })}
                disabled={!isEditing}
                required
              />

              {/* Email */}
              <FormField
                label="E-posta"
                type="email"
                value={formData.email}
                onChange={(value) => setFormData({ ...formData, email: value })}
                disabled={!isEditing}
              />

              {/* First Name */}
              <FormField
                label="Ad"
                value={formData.firstName}
                onChange={(value) => setFormData({ ...formData, firstName: value })}
                disabled={!isEditing}
              />

              {/* Last Name */}
              <FormField
                label="Soyad"
                value={formData.lastName}
                onChange={(value) => setFormData({ ...formData, lastName: value })}
                disabled={!isEditing}
              />

              {/* Phone */}
              <FormField
                label="Telefon"
                type="tel"
                value={formData.phone}
                onChange={(value) => setFormData({ ...formData, phone: value })}
                disabled={!isEditing}
                placeholder="+90 5XX XXX XX XX"
              />
            </div>

            {/* Bio */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Biyografi
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                disabled={!isEditing}
                rows={3}
                placeholder="Kendiniz hakkında birkaç kelime..."
                className={cn(
                  'w-full rounded-xl border outline-none p-3 text-sm resize-none transition',
                  isEditing
                    ? 'bg-slate-800/60 border-slate-600/40 focus:border-cyan-400 text-slate-200'
                    : 'bg-slate-800/30 border-slate-700/30 text-slate-400 cursor-not-allowed'
                )}
                maxLength={200}
              />
              <div className="flex justify-between mt-1">
                <span className="text-xs text-slate-500">Maksimum 200 karakter</span>
                <span className="text-xs text-slate-500">{formData.bio.length}/200</span>
              </div>
            </div>
          </ProfileCard>

          {/* Account Info */}
          <ProfileCard>
            <h3 className="text-lg font-semibold mb-4">Hesap Bilgileri</h3>
            <div className="space-y-4">
              <InfoRow label="Kullanıcı ID" value={profile.id} />
              <InfoRow 
                label="Hesap Oluşturulma" 
                value={new Date(profile.createdAt).toLocaleString('tr-TR')} 
              />
              <InfoRow 
                label="Son Güncelleme" 
                value={new Date(profile.updatedAt).toLocaleString('tr-TR')} 
              />
            </div>
          </ProfileCard>
        </div>
      </div>
    </div>
  );
}

function ProfileCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl p-6 bg-slate-900/60 border border-slate-800/60 backdrop-blur-xl relative overflow-hidden"
    >
      <div className="absolute inset-px rounded-3xl bg-gradient-to-br from-slate-50/2 via-slate-50/0 to-slate-50/0 pointer-events-none" />
      <div className="relative">{children}</div>
    </motion.div>
  );
}

function FormField({
  label,
  value,
  onChange,
  disabled,
  type = 'text',
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-xl border outline-none px-3 py-2 text-sm transition',
          disabled
            ? 'bg-slate-800/30 border-slate-700/30 text-slate-400 cursor-not-allowed'
            : 'bg-slate-800/60 border-slate-600/40 focus:border-cyan-400 text-slate-200'
        )}
      />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-700/30 last:border-b-0">
      <span className="text-sm font-medium text-slate-400">{label}</span>
      <span className="text-sm text-slate-300 font-mono">{value}</span>
    </div>
  );
}

function CameraIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
