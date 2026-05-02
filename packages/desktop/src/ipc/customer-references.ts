import type { CustomerReference, CustomerReferenceUpdate } from '@episfolio/kernel';
import { invoke } from '@tauri-apps/api/core';

type CreateCustomerReferenceArgs = {
  customerType?: string;
  customerLabel?: string | null;
  companyName?: string;
  period?: string;
  industry?: string | null;
  companyScale?: string | null;
  counterpartRole?: string | null;
  typicalRequests?: string | null;
  ageRange?: string | null;
  familyStatus?: string | null;
  residence?: string | null;
  incomeRange?: string | null;
  hardestExperience?: string | null;
  claimContent?: string | null;
  responseTime?: string | null;
  strengthEpisode?: string | null;
  indirectRoleIdea?: string | null;
};

export async function createCustomerReference(
  args: CreateCustomerReferenceArgs,
): Promise<CustomerReference> {
  return invoke<CustomerReference>('create_customer_reference', { args });
}

export async function listCustomerReferences(): Promise<CustomerReference[]> {
  return invoke<CustomerReference[]>('list_customer_references');
}

export async function getCustomerReference(id: string): Promise<CustomerReference | null> {
  return invoke<CustomerReference | null>('get_customer_reference', { id });
}

export async function updateCustomerReference(
  id: string,
  patch: CustomerReferenceUpdate,
): Promise<CustomerReference> {
  return invoke<CustomerReference>('update_customer_reference', { id, patch });
}

export async function deleteCustomerReference(id: string): Promise<void> {
  return invoke<void>('delete_customer_reference', { id });
}
