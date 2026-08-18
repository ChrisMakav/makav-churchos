"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/rbac/guard";
import { getDefaultSiteId } from "@/lib/sites";
import { groupFormSchema } from "@/lib/validation/groups";
import { groupReportFormSchema } from "@/lib/validation/group-reports";

export interface GroupFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

const NO_DAY = "__none__";

function parseGroupForm(formData: FormData) {
  const rawDay = String(formData.get("meetingDay") ?? "");
  const result = groupFormSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    meetingDay: rawDay === NO_DAY ? "" : rawDay,
    meetingTime: String(formData.get("meetingTime") ?? ""),
    location: String(formData.get("location") ?? ""),
    capacity: String(formData.get("capacity") ?? ""),
  });

  if (!result.success) {
    return { error: "Le nom du groupe est requis.", fieldErrors: { name: "Requis" }, data: null } as const;
  }
  return { error: undefined, fieldErrors: undefined, data: result.data } as const;
}

export async function createGroup(
  organizationId: string,
  _prevState: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  try {
    await requirePermission(organizationId, "groups.write");
  } catch {
    return { error: "Vous n'avez pas la permission de créer un groupe." };
  }

  const parsed = parseGroupForm(formData);
  if (!parsed.data) return { error: parsed.error, fieldErrors: parsed.fieldErrors };

  const siteId = await getDefaultSiteId(organizationId);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("groups")
    .insert({
      organization_id: organizationId,
      site_id: siteId,
      name: parsed.data.name,
      description: parsed.data.description,
      meeting_day: parsed.data.meetingDay,
      meeting_time: parsed.data.meetingTime,
      location: parsed.data.location,
      capacity: parsed.data.capacity,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: "Un groupe avec ce nom existe déjà.", fieldErrors: { name: "Déjà utilisé" } };
    }
    return { error: "Impossible de créer le groupe." };
  }

  revalidatePath("/groupes");
  redirect(`/groupes/${data.id}`);
}

export async function updateGroup(
  organizationId: string,
  groupId: string,
  _prevState: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  try {
    await requirePermission(organizationId, "groups.write");
  } catch {
    return { error: "Vous n'avez pas la permission de modifier ce groupe." };
  }

  const parsed = parseGroupForm(formData);
  if (!parsed.data) return { error: parsed.error, fieldErrors: parsed.fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase
    .from("groups")
    .update({
      name: parsed.data.name,
      description: parsed.data.description,
      meeting_day: parsed.data.meetingDay,
      meeting_time: parsed.data.meetingTime,
      location: parsed.data.location,
      capacity: parsed.data.capacity,
    })
    .eq("id", groupId)
    .eq("organization_id", organizationId);

  if (error) {
    if (error.code === "23505") {
      return { error: "Un groupe avec ce nom existe déjà.", fieldErrors: { name: "Déjà utilisé" } };
    }
    return { error: "Impossible d'enregistrer les modifications." };
  }

  revalidatePath("/groupes");
  revalidatePath(`/groupes/${groupId}`);
  redirect(`/groupes/${groupId}`);
}

export async function setGroupStatus(organizationId: string, groupId: string, status: string) {
  await requirePermission(organizationId, "groups.write");
  const supabase = await createClient();
  const { error } = await supabase
    .from("groups")
    .update({ status })
    .eq("id", groupId)
    .eq("organization_id", organizationId);
  if (error) throw error;
  revalidatePath(`/groupes/${groupId}`);
  revalidatePath("/groupes");
}

export async function addGroupMember(
  organizationId: string,
  groupId: string,
  memberId: string,
  roleInGroup: string,
) {
  await requirePermission(organizationId, "groups.write");
  const supabase = await createClient();
  const { error } = await supabase
    .from("group_members")
    .upsert(
      { group_id: groupId, member_id: memberId, role_in_group: roleInGroup },
      { onConflict: "group_id,member_id" },
    );
  if (error) throw error;
  revalidatePath(`/groupes/${groupId}`);
}

export async function removeGroupMember(organizationId: string, groupId: string, memberId: string) {
  await requirePermission(organizationId, "groups.write");
  const supabase = await createClient();
  const { error } = await supabase
    .from("group_members")
    .delete()
    .eq("group_id", groupId)
    .eq("member_id", memberId);
  if (error) throw error;
  revalidatePath(`/groupes/${groupId}`);
}

export async function setGroupLeader(
  organizationId: string,
  groupId: string,
  leaderMemberId: string | null,
) {
  await requirePermission(organizationId, "groups.write");
  const supabase = await createClient();
  const { error } = await supabase
    .from("groups")
    .update({ leader_member_id: leaderMemberId })
    .eq("id", groupId)
    .eq("organization_id", organizationId);
  if (error) throw error;
  revalidatePath(`/groupes/${groupId}`);
}

// --- Rapports d'activité -----------------------------------------------------

export interface GroupReportFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

function parseGroupReportForm(formData: FormData) {
  const result = groupReportFormSchema.safeParse({
    meetingDate: String(formData.get("meetingDate") ?? ""),
    theme: String(formData.get("theme") ?? ""),
    womenCount: String(formData.get("womenCount") ?? "0"),
    menCount: String(formData.get("menCount") ?? "0"),
    teensCount: String(formData.get("teensCount") ?? "0"),
    childrenCount: String(formData.get("childrenCount") ?? "0"),
    newPeopleCount: String(formData.get("newPeopleCount") ?? "0"),
    newBirthsCount: String(formData.get("newBirthsCount") ?? "0"),
    notes: String(formData.get("notes") ?? ""),
  });

  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { error: "Corrigez les champs indiqués.", fieldErrors, data: null } as const;
  }
  return { error: undefined, fieldErrors: undefined, data: result.data } as const;
}

export async function createGroupReport(
  organizationId: string,
  groupId: string,
  _prevState: GroupReportFormState,
  formData: FormData,
): Promise<GroupReportFormState> {
  try {
    await requirePermission(organizationId, "groups.write");
  } catch {
    return { error: "Vous n'avez pas la permission d'ajouter un rapport." };
  }

  const parsed = parseGroupReportForm(formData);
  if (!parsed.data) return { error: parsed.error, fieldErrors: parsed.fieldErrors };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée." };

  const siteId = await getDefaultSiteId(organizationId);
  const { error } = await supabase.from("group_reports").insert({
    organization_id: organizationId,
    site_id: siteId,
    group_id: groupId,
    meeting_date: parsed.data.meetingDate,
    theme: parsed.data.theme,
    women_count: parsed.data.womenCount,
    men_count: parsed.data.menCount,
    teens_count: parsed.data.teensCount,
    children_count: parsed.data.childrenCount,
    new_people_count: parsed.data.newPeopleCount,
    new_births_count: parsed.data.newBirthsCount,
    notes: parsed.data.notes,
    created_by: user.id,
  });

  if (error) return { error: "Impossible d'enregistrer le rapport." };

  revalidatePath(`/groupes/${groupId}`);
  redirect(`/groupes/${groupId}`);
}

export async function updateGroupReport(
  organizationId: string,
  groupId: string,
  reportId: string,
  _prevState: GroupReportFormState,
  formData: FormData,
): Promise<GroupReportFormState> {
  try {
    await requirePermission(organizationId, "groups.write");
  } catch {
    return { error: "Vous n'avez pas la permission de modifier ce rapport." };
  }

  const parsed = parseGroupReportForm(formData);
  if (!parsed.data) return { error: parsed.error, fieldErrors: parsed.fieldErrors };

  const supabase = await createClient();
  const { error } = await supabase
    .from("group_reports")
    .update({
      meeting_date: parsed.data.meetingDate,
      theme: parsed.data.theme,
      women_count: parsed.data.womenCount,
      men_count: parsed.data.menCount,
      teens_count: parsed.data.teensCount,
      children_count: parsed.data.childrenCount,
      new_people_count: parsed.data.newPeopleCount,
      new_births_count: parsed.data.newBirthsCount,
      notes: parsed.data.notes,
    })
    .eq("id", reportId)
    .eq("organization_id", organizationId);

  if (error) return { error: "Impossible d'enregistrer les modifications." };

  revalidatePath(`/groupes/${groupId}`);
  redirect(`/groupes/${groupId}`);
}

export async function deleteGroupReport(organizationId: string, groupId: string, reportId: string) {
  await requirePermission(organizationId, "groups.write");
  const supabase = await createClient();
  const { error } = await supabase
    .from("group_reports")
    .delete()
    .eq("id", reportId)
    .eq("organization_id", organizationId);
  if (error) throw error;
  revalidatePath(`/groupes/${groupId}`);
}
