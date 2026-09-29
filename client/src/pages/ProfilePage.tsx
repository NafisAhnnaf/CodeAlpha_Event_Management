import React, { useEffect, useState } from "react";
import {
  User,
  Mail,
  Calendar,
  ShieldCheck,
  Briefcase,
  Users,
  Sparkles,
} from "lucide-react";
import { useAuthStore, type User as UserType } from "../store/useAuthStore.ts";
import { api } from "../services/api.ts";
import { formatDateOnly } from "../lib/utils.ts";

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [usersList, setUsersList] = useState<UserType[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [roleMessage, setRoleMessage] = useState<{ id: string; text: string } | null>(null);

  const isAdmin = user?.role === "admin";
  const isOrganizer = user?.role === "organizer";

  useEffect(() => {
    if (isAdmin) {
      const fetchAllUsers = async () => {
        setLoadingUsers(true);
        try {
          const res = await api.get("/users");
          setUsersList(res.data.users || []);
        } catch (err) {
          console.error("Failed to fetch user list", err);
        } finally {
          setLoadingUsers(false);
        }
      };
      fetchAllUsers();
    }
  }, [isAdmin]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await api.patch(`/users/${userId}/role`, { role: newRole });
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: res.data.user.role } : u))
      );
      if (user && user.id === userId) {
        updateUser({ role: res.data.user.role });
      }
      setRoleMessage({ id: userId, text: `Role updated to ${newRole}` });
      setTimeout(() => setRoleMessage(null), 3000);
    } catch (err: any) {
      console.error("Failed to update role", err);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto py-4 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
          Account & Profile
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Manage your personal details and system privileges.
        </p>
      </div>

      {/* User Information Card */}
      <div className="glass-card rounded-3xl p-6 sm:p-10 border border-zinc-200/80 dark:border-zinc-800 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-indigo-500/25">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                {user.name}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <ShieldCheck className="w-4 h-4" />
              <span>Role: {user.role}</span>
            </span>
          </div>
        </div>

        {/* Profile Attributes */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-200/60 dark:border-zinc-800">
          <div className="p-4 rounded-2xl glass border border-zinc-200/60 dark:border-zinc-800">
            <span className="text-[11px] font-semibold text-zinc-400 block uppercase tracking-wider">
              Email Address
            </span>
            <div className="flex items-center gap-2 mt-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
              <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl glass border border-zinc-200/60 dark:border-zinc-800">
            <span className="text-[11px] font-semibold text-zinc-400 block uppercase tracking-wider">
              Date of Birth
            </span>
            <div className="flex items-center gap-2 mt-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              <Calendar className="w-3.5 h-3.5 text-purple-500 shrink-0" />
              <span>{formatDateOnly(user.dob) || "Not specified"}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl glass border border-zinc-200/60 dark:border-zinc-800">
            <span className="text-[11px] font-semibold text-zinc-400 block uppercase tracking-wider">
              Member Since
            </span>
            <div className="flex items-center gap-2 mt-1 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              <Sparkles className="w-3.5 h-3.5 text-pink-500 shrink-0" />
              <span>{formatDateOnly(user.created_at)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Become an Organizer Callout for Regular Users */}
      {!isOrganizer && !isAdmin && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-purple-500/20 bg-purple-500/5 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
              <Briefcase className="w-5 h-5" />
              <h3 className="text-base font-bold">Interested in Hosting Events?</h3>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Organizers can create events, manage rich text agendas, and monitor attendee ticket lists.
              Your account currently has attendee permissions. Contact an administrator to approve organizer access for your account.
            </p>
          </div>
          <div className="px-4 py-2 rounded-xl bg-purple-600/10 border border-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-semibold text-center shrink-0">
            Contact Admin for Approval
          </div>
        </div>
      )}

      {/* Admin User Management Section */}
      {isAdmin && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-zinc-200/80 dark:border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  User Management & Role Approvals
                </h3>
                <p className="text-xs text-zinc-500">
                  Admins can promote users to 'organizer' or 'admin' roles.
                </p>
              </div>
            </div>
          </div>

          {loadingUsers ? (
            <div className="p-8 text-center text-xs text-zinc-500 animate-pulse">
              Loading registered users...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-3">User</th>
                    <th className="py-3 px-3">Email</th>
                    <th className="py-3 px-3">Current Role</th>
                    <th className="py-3 px-3 text-right">Change Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-zinc-100/50 dark:hover:bg-zinc-800/40">
                      <td className="py-3 px-3 font-semibold text-zinc-900 dark:text-zinc-100">
                        {u.name}
                      </td>
                      <td className="py-3 px-3 text-zinc-500 dark:text-zinc-400">{u.email}</td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {u.role}
                        </span>
                        {roleMessage?.id === u.id && (
                          <span className="ml-2 text-emerald-500 font-semibold text-[10px]">
                            {roleMessage.text}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                        >
                          <option value="user">User</option>
                          <option value="organizer">Organizer</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
