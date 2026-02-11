import { useState } from 'react';
import { ChevronDown, Edit2, Plus, Shield, Tag, Trash2, User, Users, X } from 'lucide-react';
import blastoisePng from '../assets/blastoise.png';
import pikachuSvg from '../assets/pikachu.svg';
import pokeballSvg from '../assets/pokeball.svg';
import squirtleSvg from '../assets/squirtle.svg';

const AdminPanel = ({
  onClose,
  users,
  allTags,
  onAddUser,
  onDeleteUser,
  onUpdateUser,
  onRenameTag,
  onDeleteTag,
  getTagColor
}) => {
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [editTagValue, setEditTagValue] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const [editingUser, setEditingUser] = useState(null);
  const [editPassword, setEditPassword] = useState('');
  const [editIsAdmin, setEditIsAdmin] = useState(false);
  const [editAvatar, setEditAvatar] = useState('');
  const [editAvatarPreview, setEditAvatarPreview] = useState('');
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);

  const avatarOptions = [
    { value: '', label: 'No avatar' },
    { value: blastoisePng, label: 'Blastoise', preview: blastoisePng },
    { value: pikachuSvg, label: 'Pikachu', preview: pikachuSvg },
    { value: squirtleSvg, label: 'Squirtle', preview: squirtleSvg },
    { value: pokeballSvg, label: 'Pokeball', preview: pokeballSvg }
  ];

  const handleAddUser = async () => {
    if (!newUsername || !newPassword) return;
    if (users.find((u) => u.username === newUsername)) {
      alert('Username already exists');
      return;
    }
    // Pass plain password - useAuthUsers handles hashing appropriately
    await onAddUser(newUsername, newPassword, newIsAdmin);
    setNewUsername('');
    setNewPassword('');
    setNewIsAdmin(false);
  };

  const openEditUser = (user) => {
    setEditingUser(user);
    setEditPassword('');
    setEditIsAdmin(!!user.is_admin);
    setEditAvatar(user.avatar_url || '');
    setEditAvatarPreview(user.avatar_url || '');
    setAvatarMenuOpen(false);
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    // Pass plain password - useAuthUsers handles hashing appropriately
    await onUpdateUser(editingUser.username, {
      password: editPassword || undefined,
      is_admin: editIsAdmin,
      avatar_url: editAvatar
    });
    setEditingUser(null);
    setAvatarMenuOpen(false);
    setEditPassword('');
    setEditIsAdmin(false);
    setEditAvatar('');
    setEditAvatarPreview('');
  };

  const handleRenameTag = (oldTag, newTag) => {
    onRenameTag(oldTag, newTag);
    setEditingTag(null);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full my-4 shadow-2xl min-h-[500px] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="bg-purple-600 p-4 rounded-t-2xl flex justify-between items-center">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Shield size={20} /> Admin Panel</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white" aria-label="Close admin panel" data-testid="admin-panel-close">
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-gray-200">
          <button onClick={() => setActiveTab('users')} className={`flex-1 py-3 px-4 font-semibold text-sm flex items-center justify-center gap-2 transition ${activeTab === 'users' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Users size={18} /> Users ({users.length})
          </button>
          <button onClick={() => setActiveTab('tags')} className={`flex-1 py-3 px-4 font-semibold text-sm flex items-center justify-center gap-2 transition ${activeTab === 'tags' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50' : 'text-gray-600 hover:bg-gray-50'}`}>
            <Tag size={18} /> Tags ({allTags.length})
          </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">All Users</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {users.map((u) => (
                    <div key={u.username} className="flex items-center justify-between bg-gray-100 p-3 rounded-lg" data-testid={`user-row-${u.username}`}>
                      <div className="flex items-center gap-3" data-testid="user-info">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden ${u.is_admin ? 'bg-purple-200' : 'bg-gray-200'}`} data-testid="user-avatar">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt={`${u.username} avatar`} className="w-full h-full object-cover" />
                          ) : (
                            u.is_admin ? <Shield size={18} className="text-purple-600" /> : <User size={18} className="text-gray-500" />
                          )}
                        </div>
                        <div data-testid="user-name">
                          <span className="font-medium text-gray-900 block">{u.username}</span>
                          {u.is_admin && <span className="text-xs text-purple-600">Administrator</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditUser(u)}
                          className="text-blue-600 hover:text-blue-800 px-3 py-2 hover:bg-blue-50 rounded-lg transition flex items-center gap-2 text-sm font-semibold"
                          aria-label={`Edit user ${u.username}`}
                          data-testid="edit-user"
                        >
                          <Edit2 size={16} />
                          Edit
                        </button>
                        {u.username !== 'admin' && (
                          <button
                            onClick={() => onDeleteUser(u.username)}
                            className="text-red-600 hover:text-red-800 px-3 py-2 hover:bg-red-50 rounded-lg transition flex items-center gap-2 text-sm font-semibold"
                            aria-label={`Delete user ${u.username}`}
                            data-testid="delete-user"
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3">Add New User</h3>
                <div className="space-y-3">
                  <input type="text" placeholder="Username" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-purple-500 focus:outline-none" />
                  <input type="password" placeholder="Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-purple-500 focus:outline-none" />
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
                    <input type="checkbox" checked={newIsAdmin} onChange={(e) => setNewIsAdmin(e.target.checked)} className="w-5 h-5 rounded" />
                    <div>
                      <span className="text-gray-900 font-medium">Admin privileges</span>
                      <p className="text-gray-500 text-xs">Can manage users and tags</p>
                    </div>
                  </label>
                  <button onClick={handleAddUser} className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2" data-testid="add-user">
                    <Plus size={18} /> Add User
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tags' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">All Tags</h3>
                {allTags.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Tag size={48} className="mx-auto mb-3 opacity-30" />
                    <p>No tags created yet</p>
                    <p className="text-sm mt-1">Tags will appear here when you add them to cards</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {allTags.map((tag) => {
                      const color = getTagColor(tag);
                      return (
                        <div key={tag} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          {editingTag === tag ? (
                            <input type="text" value={editTagValue} onChange={(e) => setEditTagValue(e.target.value)} onBlur={() => handleRenameTag(tag, editTagValue)} onKeyDown={(e) => { if (e.key === 'Enter') handleRenameTag(tag, editTagValue); if (e.key === 'Escape') setEditingTag(null); }} className="flex-1 px-3 py-2 rounded-lg border-2 border-purple-300 text-sm mr-3 focus:outline-none focus:border-purple-500" autoFocus />
                          ) : (
                            <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${color.bg} ${color.text} border ${color.border}`}>{tag}</span>
                          )}
                          <div className="flex gap-1">
                            <button onClick={() => { setEditingTag(tag); setEditTagValue(tag); }} className="text-blue-600 hover:text-blue-800 p-2 hover:bg-blue-50 rounded-lg transition"><Edit2 size={16} /></button>
                            <button onClick={() => onDeleteTag(tag)} className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition"><Trash2 size={16} /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              {allTags.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                  <strong>Tip:</strong> Editing a tag will update it on all cards. Deleting a tag will remove it from all cards.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setEditingUser(null)} data-testid="edit-user-modal">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Edit User</h3>
            <div className="space-y-3">
              <div className="text-sm text-gray-600">Username</div>
              <div className="px-3 py-2 rounded-lg bg-gray-100 text-gray-900 font-medium">{editingUser.username}</div>
              <label htmlFor="edit-user-password" className="block text-sm font-medium text-gray-700">New Password</label>
              <input
                id="edit-user-password"
                type="password"
                placeholder="Leave blank to keep"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 focus:border-purple-500 focus:outline-none"
                data-testid="edit-user-password"
              />
              <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition">
                <input type="checkbox" checked={editIsAdmin} onChange={(e) => setEditIsAdmin(e.target.checked)} className="w-5 h-5 rounded" />
                <div>
                  <span className="text-gray-900 font-medium">Admin privileges</span>
                  <p className="text-gray-500 text-xs">Can manage users and tags</p>
                </div>
              </label>
              <label className="block text-sm font-medium text-gray-700">Avatar</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setAvatarMenuOpen((open) => !open)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg border-2 border-gray-300 bg-white hover:border-purple-400 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                      {editAvatarPreview ? (
                        <img src={editAvatarPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                      ) : (
                        <User size={18} className="text-gray-500" />
                      )}
                    </div>
                    <span className="text-gray-900 text-sm font-medium">
                      {avatarOptions.find((opt) => opt.value === editAvatar)?.label || 'No avatar'}
                    </span>
                  </div>
                  <ChevronDown size={18} className="text-gray-500" />
                </button>
                {avatarMenuOpen && (
                  <div className="absolute z-10 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                    {avatarOptions.map((option) => (
                      <button
                        type="button"
                        key={option.label}
                        onClick={() => {
                          setEditAvatar(option.value);
                          setEditAvatarPreview(option.value);
                          setAvatarMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 text-sm text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                          {option.preview ? (
                            <img src={option.preview} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <User size={16} className="text-gray-400" />
                          )}
                        </div>
                        <span className="text-gray-800">{option.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleUpdateUser} className="flex-1 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition" data-testid="edit-user-save">Save Changes</button>
                <button onClick={() => setEditingUser(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition" data-testid="edit-user-cancel">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
