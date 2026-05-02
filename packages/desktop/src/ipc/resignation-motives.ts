import type { ResignationMotive, ResignationMotiveUpdate } from '@episfolio/kernel';
import { invoke } from '@tauri-apps/api/core';

type CreateResignationMotiveArgs = {
  companyDissatisfaction?: string;
  jobDissatisfaction?: string;
  compensationDissatisfaction?: string;
  relationshipDissatisfaction?: string;
  resolutionIntent?: string;
  note?: string | null;
};

export async function createResignationMotive(
  args: CreateResignationMotiveArgs,
): Promise<ResignationMotive> {
  return invoke<ResignationMotive>('create_resignation_motive', { args });
}

export async function listResignationMotives(): Promise<ResignationMotive[]> {
  return invoke<ResignationMotive[]>('list_resignation_motives');
}

export async function getResignationMotive(id: string): Promise<ResignationMotive | null> {
  return invoke<ResignationMotive | null>('get_resignation_motive', { id });
}

export async function updateResignationMotive(
  id: string,
  patch: ResignationMotiveUpdate,
): Promise<ResignationMotive> {
  return invoke<ResignationMotive>('update_resignation_motive', { id, patch });
}

export async function deleteResignationMotive(id: string): Promise<void> {
  return invoke<void>('delete_resignation_motive', { id });
}
