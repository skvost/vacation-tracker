import { supabase } from './supabase';
import type { Household, HouseholdMember } from './types';

export async function getUserHousehold(): Promise<{
  household: Household | null;
  membership: HouseholdMember | null;
}> {
  const { data: membership, error: memberError } = await supabase
    .from('household_members')
    .select('*, households(*)')
    .eq('status', 'active')
    .single();

  if (memberError || !membership) {
    return { household: null, membership: null };
  }

  return {
    household: membership.households as Household,
    membership: membership as HouseholdMember,
  };
}

export async function createHousehold(name: string): Promise<{
  household: Household;
  membership: HouseholdMember;
}> {
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Create household
  const { data: household, error: householdError } = await supabase
    .from('households')
    .insert({ name })
    .select()
    .single();

  if (householdError) throw householdError;

  // Create membership as owner
  const { data: membership, error: memberError } = await supabase
    .from('household_members')
    .insert({
      household_id: household.id,
      user_id: user.id,
      role: 'owner',
      status: 'active',
    })
    .select()
    .single();

  if (memberError) throw memberError;

  return { household, membership };
}

export async function getPendingInvites(): Promise<HouseholdMember[]> {
  const { data, error } = await supabase
    .from('household_members')
    .select('*, households(*)')
    .eq('status', 'pending');

  if (error) throw error;
  return data ?? [];
}

export async function acceptInvite(inviteToken: string): Promise<HouseholdMember> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Update the invite to active and set user_id
  const { data: membership, error } = await supabase
    .from('household_members')
    .update({
      user_id: user.id,
      status: 'active',
    })
    .eq('invite_token', inviteToken)
    .eq('status', 'pending')
    .select()
    .single();

  if (error) throw error;
  return membership;
}

export async function invitePartner(email: string): Promise<HouseholdMember> {
  const { household } = await getUserHousehold();
  if (!household) throw new Error('No household found');

  const { data: invite, error } = await supabase
    .from('household_members')
    .insert({
      household_id: household.id,
      invited_email: email,
      role: 'member',
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;
  return invite;
}

export async function getHouseholdMembers(): Promise<HouseholdMember[]> {
  const { data, error } = await supabase
    .from('household_members')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function cancelInvite(inviteId: string): Promise<void> {
  const { error } = await supabase
    .from('household_members')
    .delete()
    .eq('id', inviteId)
    .eq('status', 'pending');

  if (error) throw error;
}
