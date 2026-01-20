'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserHousehold, createHousehold, getPendingInvites, acceptInvite } from '@/lib/household';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { HouseholdMember } from '@/lib/types';

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<'loading' | 'choose' | 'create' | 'join'>('loading');
  const [pendingInvites, setPendingInvites] = useState<HouseholdMember[]>([]);
  const [householdName, setHouseholdName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkHousehold() {
      try {
        const { household } = await getUserHousehold();
        if (household) {
          router.push('/');
          return;
        }

        const invites = await getPendingInvites();
        setPendingInvites(invites);
        setStep('choose');
      } catch {
        setStep('choose');
      }
    }
    checkHousehold();
  }, [router]);

  async function handleCreateHousehold(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await createHousehold(householdName || 'My Household');
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create household');
      setLoading(false);
    }
  }

  async function handleAcceptInvite(invite: HouseholdMember) {
    setError(null);
    setLoading(true);

    try {
      await acceptInvite(invite.invite_token);
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invite');
      setLoading(false);
    }
  }

  async function handleJoinWithCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await acceptInvite(inviteCode);
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid invite code');
      setLoading(false);
    }
  }

  if (step === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (step === 'create') {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create Your Household</CardTitle>
            <CardDescription>
              Give your household a name. You can invite your partner after.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleCreateHousehold}>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Household Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Our Adventures"
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep('choose')}>
                Back
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Household'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  if (step === 'join') {
    return (
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Join a Household</CardTitle>
            <CardDescription>
              Enter the invite code your partner shared with you.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleJoinWithCode}>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="code">Invite Code</Label>
                <Input
                  id="code"
                  placeholder="Paste invite code here"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep('choose')}>
                Back
              </Button>
              <Button type="submit" disabled={loading || !inviteCode}>
                {loading ? 'Joining...' : 'Join Household'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Welcome to Vacation Tracker</h1>
        <p className="text-gray-600 mt-2">
          Get started by creating a household or joining your partner&apos;s.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-md">
          {error}
        </div>
      )}

      {pendingInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending Invites</CardTitle>
            <CardDescription>You&apos;ve been invited to join:</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingInvites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <span className="font-medium">
                  {(invite as HouseholdMember & { households: { name: string } }).households?.name || 'Household'}
                </span>
                <Button size="sm" onClick={() => handleAcceptInvite(invite)} disabled={loading}>
                  Accept
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        <Card className="cursor-pointer hover:border-gray-400 transition-colors" onClick={() => setStep('create')}>
          <CardHeader>
            <CardTitle className="text-lg">Create a Household</CardTitle>
            <CardDescription>
              Start fresh and invite your partner to join you.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:border-gray-400 transition-colors" onClick={() => setStep('join')}>
          <CardHeader>
            <CardTitle className="text-lg">Join with Invite Code</CardTitle>
            <CardDescription>
              Your partner already created a household? Enter their invite code.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
