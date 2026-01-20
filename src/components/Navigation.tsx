'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getUserHousehold, getHouseholdMembers, invitePartner, cancelInvite } from '@/lib/household';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import type { User } from '@supabase/supabase-js';
import type { Household, HouseholdMember } from '@/lib/types';

export function Navigation() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHouseholdModal, setShowHouseholdModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      loadHouseholdData();
    }
  }, [user]);

  async function loadHouseholdData() {
    try {
      const { household } = await getUserHousehold();
      setHousehold(household);
      if (household) {
        const membersData = await getHouseholdMembers();
        setMembers(membersData);
      }
    } catch (err) {
      console.error('Failed to load household:', err);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail) return;

    setInviting(true);
    setInviteError(null);

    try {
      await invitePartner(inviteEmail);
      setInviteEmail('');
      await loadHouseholdData();
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to send invite');
    } finally {
      setInviting(false);
    }
  }

  async function handleCancelInvite(inviteId: string) {
    try {
      await cancelInvite(inviteId);
      await loadHouseholdData();
    } catch (err) {
      console.error('Failed to cancel invite:', err);
    }
  }

  const pendingInvites = members.filter((m) => m.status === 'pending');
  const activeMembers = members.filter((m) => m.status === 'active');

  return (
    <>
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <Link href="/" className="text-xl font-semibold text-gray-900">
              Vacation Tracker
            </Link>
            <div className="flex items-center gap-4">
              {!loading && user && (
                <>
                  <Link href="/" className="text-gray-600 hover:text-gray-900">
                    Trips
                  </Link>
                  <Link href="/calendar" className="text-gray-600 hover:text-gray-900">
                    Calendar
                  </Link>
                  <button
                    onClick={() => setShowHouseholdModal(true)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    {household?.name || 'Household'}
                  </button>
                  <Button variant="outline" size="sm" onClick={handleSignOut}>
                    Sign out
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      <Dialog open={showHouseholdModal} onOpenChange={setShowHouseholdModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{household?.name || 'Household'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Members</h4>
              <div className="space-y-2">
                {activeMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between text-sm">
                    <span>{member.user_id === user?.id ? `${user.email} (you)` : 'Partner'}</span>
                    <span className="text-gray-500 capitalize">{member.role}</span>
                  </div>
                ))}
              </div>
            </div>

            {pendingInvites.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Pending Invites</h4>
                <div className="space-y-2">
                  {pendingInvites.map((invite) => (
                    <div key={invite.id} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                      <span>{invite.invited_email}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelInvite(invite.id)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeMembers.length < 2 && (
              <form onSubmit={handleInvite} className="space-y-2">
                <Label htmlFor="invite-email">Invite Partner</Label>
                {inviteError && (
                  <p className="text-red-500 text-sm">{inviteError}</p>
                )}
                <div className="flex gap-2">
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="partner@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <Button type="submit" disabled={inviting || !inviteEmail}>
                    {inviting ? '...' : 'Invite'}
                  </Button>
                </div>
                {pendingInvites.length > 0 && pendingInvites[0].invite_token && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                    <p className="text-gray-600 mb-1">Or share this invite code:</p>
                    <code className="block p-1 bg-white border rounded break-all">
                      {pendingInvites[0].invite_token}
                    </code>
                  </div>
                )}
              </form>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHouseholdModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
