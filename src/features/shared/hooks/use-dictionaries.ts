import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "./query-keys";
import type { Dictionary, DictionaryValue } from "@/types/kpi";

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------

function mapDictionary(row: {
  id: string;
  name: string;
  is_system: boolean;
  show_in_filters: boolean;
  created_at: string;
  updated_at: string;
  dictionary_values: Array<{
    id: string;
    dictionary_id: string;
    value: string;
    sort_order: number;
    created_at: string;
    updated_at: string;
  }>;
}): Dictionary {
  return {
    id: row.id,
    name: row.name,
    isSystem: row.is_system,
    showInFilters: row.show_in_filters,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    values: row.dictionary_values
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(
        (v): DictionaryValue => ({
          id: v.id,
          dictionaryId: v.dictionary_id,
          value: v.value,
          sortOrder: v.sort_order,
          createdAt: v.created_at,
          updatedAt: v.updated_at,
        }),
      ),
  };
}

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

async function fetchDictionaries(): Promise<Dictionary[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("dictionaries")
    .select("*, dictionary_values(*)")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row) => mapDictionary(row as any));
}

async function fetchDictionary(id: string): Promise<Dictionary> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("dictionaries")
    .select("*, dictionary_values(*)")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return mapDictionary(data as any);
}

// ---------------------------------------------------------------------------
// Mutation helpers
// ---------------------------------------------------------------------------

async function createDictionaryValue(input: {
  dictionaryId: string;
  value: string;
  sortOrder?: number;
}): Promise<{ id: string }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("dictionary_values")
    .insert({
      dictionary_id: input.dictionaryId,
      value: input.value,
      sort_order: input.sortOrder ?? 0,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return { id: data.id };
}

async function updateDictionaryValue(input: {
  id: string;
  dictionaryId: string;
  value?: string;
  sortOrder?: number;
}): Promise<void> {
  const supabase = createClient();
  const updateData: { value?: string; sort_order?: number; updated_at: string } = {
    updated_at: new Date().toISOString(),
  };
  if (input.value !== undefined) updateData.value = input.value;
  if (input.sortOrder !== undefined) updateData.sort_order = input.sortOrder;

  const { error } = await supabase
    .from("dictionary_values")
    .update(updateData)
    .eq("id", input.id);

  if (error) throw new Error(error.message);
}

async function deleteDictionaryValue(input: {
  id: string;
  dictionaryId: string;
}): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("dictionary_values")
    .delete()
    .eq("id", input.id);

  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useDictionaries() {
  return useQuery({
    queryKey: queryKeys.dictionaries.lists(),
    queryFn: fetchDictionaries,
  });
}

export function useDictionary(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.dictionaries.detail(id ?? ""),
    queryFn: () => fetchDictionary(id!),
    enabled: Boolean(id),
  });
}

export function useCreateDictionaryValue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDictionaryValue,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dictionaries.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.dictionaries.detail(variables.dictionaryId),
      });
    },
  });
}

export function useUpdateDictionaryValue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateDictionaryValue,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dictionaries.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.dictionaries.detail(variables.dictionaryId),
      });
    },
  });
}

export function useDeleteDictionaryValue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDictionaryValue,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dictionaries.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.dictionaries.detail(variables.dictionaryId),
      });
    },
  });
}
