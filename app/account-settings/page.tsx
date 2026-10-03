"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { 
  User, Mail, Lock, Phone, Globe, Shield, Bell, 
  CreditCard, Eye, EyeOff, Save, X, Check, 
  Upload, Key, Trash2, Smartphone, Palette
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface UserSettings {
  name: string;
  email: string;
  phone: string;
  bio: string;
  location: string;
  language: string;
  currency: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    bookingUpdates: boolean;
    promotions: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    showOnlineStatus: boolean;
    allowTagging: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    loginAlerts: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    fontSize: 'small' | 'medium' | 'large';
  };
}

export default function AccountSettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [settings, setSettings] = useState<UserSettings>({
    name: 'Sarah L.',
    email: 'sarah@example.com',
    phone: '+44 7890 123456',
    bio: 'Passionate hiker and photographer from Manchester. Love cooking and reading in my free time.',
    location: 'Manchester, UK',
    language: 'English',
    currency: 'GBP (£)',
    notifications: {
      email: true,
      push: true,
      sms: false,
      bookingUpdates: true,
      promotions: false,
    },
    privacy: {
      profileVisibility: 'public',
      showOnlineStatus: true,
      allowTagging: true,
    },
    security: {
      twoFactorEnabled: false,
      loginAlerts: true,
    },
    appearance: {
      theme: 'light',
      fontSize: 'medium',
    },
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [formData, setFormData] = useState(settings);

  useEffect(() => {
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem('staynestly_settings');
    const savedUser = localStorage.getItem('staynestly_user');
    
    if (savedUser) {
      const user = JSON.parse(savedUser);
      setSettings(prev => ({ ...prev, ...user }));
      setFormData(prev => ({ ...prev, ...user }));
    }
    
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      setSettings(prev => ({ ...prev, ...parsedSettings }));
      setFormData(prev => ({ ...prev, ...parsedSettings }));
    }
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    localStorage.setItem('staynestly_settings', JSON.stringify(formData));
    const savedUser = localStorage.getItem('staynestly_user');
    if (savedUser) {
      const user = JSON.parse(savedUser);
      const updatedUser = { ...user, ...formData };
      localStorage.setItem('staynestly_user', JSON.stringify(updatedUser));
    }
    
    setSettings(formData);
    setSaving(false);
  }, [formData]);

  const handleChange = (section: keyof UserSettings, field: string, value: any) => {
    setFormData(prev => {
      const currentSection = prev[section];
      
      // Only spread if the section is an object
      if (typeof currentSection === 'object' && currentSection !== null && !Array.isArray(currentSection)) {
        return {
          ...prev,
          [section]: {
            ...currentSection,
            [field]: value,
          },
        };
      }
      
      // If it's not an object, just set the value directly
      return {
        ...prev,
        [section]: value,
      };
    });
  };

  const handleNotificationChange = (field: keyof UserSettings['notifications']) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [field]: !prev.notifications[field],
      },
    }));
  };

  const handlePrivacyChange = (field: keyof UserSettings['privacy'], value: any) => {
    setFormData(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [field]: value,
      },
    }));
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      alert('Password must be at least 8 characters');
      return;
    }

    setSaving(true);
    // Simulate password change API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    alert('Password changed successfully!');
    setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setSaving(false);
  };

  const handleTwoFactorToggle = async () => {
    const newValue = !formData.security.twoFactorEnabled;
    setFormData(prev => ({
      ...prev,
      security: {
        ...prev.security,
        twoFactorEnabled: newValue,
      },
    }));
    
    if (newValue) {
      // In a real app, this would initiate 2FA setup
      alert('Two-factor authentication setup initiated. Check your email for next steps.');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ];

  const TabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-2">Tell others about yourself</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Preferences
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({...formData, language: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({...formData, currency: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  >
                    <option value="USD ($)">USD ($)</option>
                    <option value="GBP (£)">GBP (£)</option>
                    <option value="EUR (€)">EUR (€)</option>
                    <option value="JPY (¥)">JPY (¥)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </h3>
              <div className="space-y-4">
                {Object.entries(formData.notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {key === 'email' && 'Receive email notifications'}
                        {key === 'push' && 'Receive push notifications'}
                        {key === 'sms' && 'Receive SMS notifications'}
                        {key === 'bookingUpdates' && 'Get updates about your bookings'}
                        {key === 'promotions' && 'Receive promotional offers'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleNotificationChange(key as keyof UserSettings['notifications'])}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        value ? 'bg-orange-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          value ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Privacy Settings
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Profile Visibility
                  </label>
                  <div className="space-y-3">
                    {[
                      { value: 'public', label: 'Public', desc: 'Anyone can see your profile' },
                      { value: 'friends', label: 'Friends Only', desc: 'Only your connections can see your profile' },
                      { value: 'private', label: 'Private', desc: 'Only you can see your profile' },
                    ].map((option) => (
                      <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="visibility"
                          value={option.value}
                          checked={formData.privacy.profileVisibility === option.value}
                          onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500"
                        />
                        <div>
                          <p className="font-medium text-gray-900">{option.label}</p>
                          <p className="text-sm text-gray-500">{option.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-gray-900">Show Online Status</p>
                      <p className="text-sm text-gray-500">Let others see when you're online</p>
                    </div>
                    <button
                      onClick={() => handlePrivacyChange('showOnlineStatus', !formData.privacy.showOnlineStatus)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.privacy.showOnlineStatus ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.privacy.showOnlineStatus ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-gray-900">Allow Tagging</p>
                      <p className="text-sm text-gray-500">Allow others to tag you in posts and photos</p>
                    </div>
                    <button
                      onClick={() => handlePrivacyChange('allowTagging', !formData.privacy.allowTagging)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.privacy.allowTagging ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.privacy.allowTagging ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Security Settings
              </h3>
              
              <div className="space-y-6">
                {/* Password Change */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Key className="w-4 h-4" />
                    Change Password
                  </h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Current Password
                      </label>
                      <input
                        type={showOldPassword ? "text" : "password"}
                        value={passwordData.oldPassword}
                        onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                        className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                      >
                        {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>

                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>

                    <button
                      onClick={handlePasswordChange}
                      disabled={saving || !passwordData.oldPassword || !passwordData.newPassword}
                      className="w-full py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Changing Password...' : 'Change Password'}
                    </button>
                  </div>
                </div>

                {/* Two-Factor Authentication */}
                <div className="pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Two-Factor Authentication
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <button
                      onClick={handleTwoFactorToggle}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.security.twoFactorEnabled ? 'bg-green-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          formData.security.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Login Alerts */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">Login Alerts</h4>
                    <p className="text-sm text-gray-500">Get notified about new sign-ins</p>
                  </div>
                  <button
                    onClick={() => handleChange('security', 'loginAlerts', !formData.security.loginAlerts)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      formData.security.loginAlerts ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.security.loginAlerts ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Appearance Settings
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Theme
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { value: 'light', label: 'Light', icon: '☀️' },
                      { value: 'dark', label: 'Dark', icon: '🌙' },
                      { value: 'auto', label: 'Auto', icon: '⚙️' },
                    ].map((theme) => (
                      <label key={theme.value} className="cursor-pointer">
                        <input
                          type="radio"
                          name="theme"
                          value={theme.value}
                          checked={formData.appearance.theme === theme.value}
                          onChange={(e) => handleChange('appearance', 'theme', e.target.value)}
                          className="hidden"
                        />
                        <div className={`p-4 rounded-xl border-2 text-center transition-all ${
                          formData.appearance.theme === theme.value
                            ? 'border-orange-500 bg-orange-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                          <div className="text-2xl mb-2">{theme.icon}</div>
                          <p className="font-medium text-gray-900">{theme.label}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Font Size
                  </label>
                  <div className="flex items-center space-x-4">
                    {[
                      { value: 'small', label: 'Small' },
                      { value: 'medium', label: 'Medium' },
                      { value: 'large', label: 'Large' },
                    ].map((size) => (
                      <label key={size.value} className="cursor-pointer">
                        <input
                          type="radio"
                          name="fontSize"
                          value={size.value}
                          checked={formData.appearance.fontSize === size.value}
                          onChange={(e) => handleChange('appearance', 'fontSize', e.target.value)}
                          className="hidden"
                        />
                        <div className={`px-4 py-2 rounded-lg border-2 transition-all ${
                          formData.appearance.fontSize === size.value
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}>
                          <p className={`font-medium ${
                            size.value === 'small' ? 'text-sm' :
                            size.value === 'medium' ? 'text-base' : 'text-lg'
                          }`}>
                            {size.label}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(formData);

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
              <p className="text-gray-600 mt-2">Manage your account preferences and security</p>
            </div>
            <Link 
              href="/profile" 
              className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors"
            >
              <X className="w-4 h-4" />
              Back to Profile
            </Link>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-500">Account Status</p>
              <p className="font-semibold text-green-600">Active</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-500">Last Login</p>
              <p className="font-semibold text-gray-900">Today, 14:30</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-500">Security Score</p>
              <p className="font-semibold text-gray-900">85/100</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-200">
              <p className="text-sm text-gray-500">Member Since</p>
              <p className="font-semibold text-gray-900">2023</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Tabs */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Settings</h3>
              </div>
              <nav className="p-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                        activeTab === tab.id
                          ? 'bg-orange-50 text-orange-700 font-semibold'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Quick Links */}
            <div className="mt-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border border-orange-200">
              <h4 className="font-semibold text-gray-900 mb-3">Need Help?</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/help/privacy" className="text-sm text-gray-700 hover:text-orange-600">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/help/terms" className="text-sm text-gray-700 hover:text-orange-600">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/help/contact" className="text-sm text-gray-700 hover:text-orange-600">
                    Contact Support
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <TabContent />
              
              {/* Save Bar */}
              {hasChanges && (
                <div className="sticky bottom-0 border-t border-gray-200 bg-white p-6 rounded-b-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-gray-600">
                      <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>
                      <span className="text-sm">You have unsaved changes</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setFormData(settings)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        {saving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Danger Zone */}
            {activeTab === 'security' && (
              <div className="mt-6 bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
                    <Trash2 className="w-5 h-5" />
                    Danger Zone
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium text-gray-900">Delete Account</p>
                        <p className="text-sm text-gray-500">
                          Permanently delete your account and all data
                        </p>
                      </div>
                      <button className="px-4 py-2 border border-red-600 text-red-600 font-medium rounded-lg hover:bg-red-50 transition-colors">
                        Delete Account
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-medium text-gray-900">Deactivate Account</p>
                        <p className="text-sm text-gray-500">
                          Temporarily deactivate your account
                        </p>
                      </div>
                      <button className="px-4 py-2 border border-gray-600 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                        Deactivate
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}