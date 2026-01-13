import { useEffect, useState } from 'react';
import { DEFAULT_ADMIN, LEGACY_DEFAULT_ADMIN_HASHES } from '../constants/admin';
import { hashPassword } from '../utils/auth';
import { SESSION_STORAGE_KEY, getStoredAvatar, storeAvatar } from '../utils/storage';
import { hasSupabaseCredentials, supabase } from '../services/supabase';

const buildUserAvatar = (user) => ({
  ...user,
  avatar_url: user.avatar_url != null ? user.avatar_url : getStoredAvatar(user.username) || undefined
});

export default function useAuthUsers() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [showLogin, setShowLogin] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);
  const [cloudConnected, setCloudConnected] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
      if (!hasSupabaseCredentials) {
        setCloudConnected(false);
        const hashedPw = await hashPassword(DEFAULT_ADMIN.password);
        const localAvatar = getStoredAvatar(DEFAULT_ADMIN.username);
        setUsers([{ username: DEFAULT_ADMIN.username, password: hashedPw, is_admin: true, avatar_url: localAvatar || undefined }]);
        return;
      }
      try {
        const data = await supabase.getUsers();
        if (!data || data.length === 0 || data.error) {
          const hashedPw = await hashPassword(DEFAULT_ADMIN.password);
          try {
            await supabase.createUser(DEFAULT_ADMIN.username, hashedPw, true);
          } catch (createErr) {
            console.log('Admin may already exist:', createErr);
          }
          const refreshedData = await supabase.getUsers();
          const baseUsers = refreshedData || [{ username: DEFAULT_ADMIN.username, password: hashedPw, is_admin: true }];
          setUsers(baseUsers.map(buildUserAvatar));
        } else {
          const hashedPw = await hashPassword(DEFAULT_ADMIN.password);
          const adminUser = data.find((user) => user.username === DEFAULT_ADMIN.username);
          if (adminUser && LEGACY_DEFAULT_ADMIN_HASHES.includes(adminUser.password) && adminUser.password !== hashedPw) {
            try {
              await supabase.updateUserPassword(DEFAULT_ADMIN.username, hashedPw);
              const updatedUsers = data.map((user) => (
                user.username === DEFAULT_ADMIN.username ? { ...user, password: hashedPw } : user
              ));
              setUsers(updatedUsers.map(buildUserAvatar));
            } catch (updateErr) {
              console.log('Failed to update admin password hash:', updateErr);
              setUsers(data.map(buildUserAvatar));
            }
          } else {
            setUsers(data.map(buildUserAvatar));
          }
        }
        setCloudConnected(true);
      } catch (e) {
        console.error('Failed to load users:', e);
        const hashedPw = await hashPassword(DEFAULT_ADMIN.password);
        const localAvatar = getStoredAvatar(DEFAULT_ADMIN.username);
        setUsers([{ username: DEFAULT_ADMIN.username, password: hashedPw, is_admin: true, avatar_url: localAvatar || undefined }]);
        setCloudConnected(false);
      }
    };

    loadUsers();
  }, []);

  useEffect(() => {
    if (currentUser || users.length === 0) return;
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw);
      const restoredUser = users.find((user) => user.username === saved.username);
      if (restoredUser) {
        setCurrentUser(restoredUser);
        setShowLogin(false);
      } else {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch (e) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [users, currentUser]);

  const handleLogin = (user, rememberMe = false) => {
    setCurrentUser(user);
    setShowLogin(false);
    setShowAdmin(false);
    if (rememberMe) {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ username: user.username }));
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setCurrentUser(null);
    setShowLogin(true);
    setShowAdmin(false);
  };

  const addNewUser = async (username, password, isAdmin) => {
    if (!username || !password) return;
    if (cloudConnected) {
      await supabase.createUser(username, password, isAdmin);
    }
    setUsers((prev) => [...prev, { username, password, is_admin: isAdmin }]);
  };

  const deleteUserAccount = async (username) => {
    if (username === 'admin') {
      alert('Cannot delete admin account');
      return;
    }
    if (!confirm(`Delete user "${username}" and all their data?`)) return;
    if (cloudConnected) {
      await supabase.deleteUser(username);
    }
    setUsers((prev) => prev.filter((user) => user.username !== username));
  };

  const updateUserAccount = async (username, updates) => {
    if (!username) return;
    const avatarValue = updates.avatar_url === '' ? null : updates.avatar_url;
    const payload = {
      ...(updates.password ? { password: updates.password } : {}),
      ...(typeof updates.is_admin === 'boolean' ? { is_admin: updates.is_admin } : {}),
      ...(updates.avatar_url !== undefined ? { avatar_url: avatarValue } : {})
    };
    if (cloudConnected && Object.keys(payload).length > 0) {
      await supabase.updateUser(username, payload);
    }
    if (updates.avatar_url !== undefined) {
      storeAvatar(username, avatarValue || '');
    }
    setUsers((prev) => prev.map((user) => (
      user.username === username ? { ...user, ...payload } : user
    )));
    setCurrentUser((prev) => (
      prev?.username === username ? { ...prev, ...payload } : prev
    ));
  };

  return {
    currentUser,
    users,
    showLogin,
    showAdmin,
    cloudConnected,
    setShowAdmin,
    handleLogin,
    handleLogout,
    addNewUser,
    deleteUserAccount,
    updateUserAccount
  };
}
