import type { CustomerReference } from '../domain/customer-reference.js';
import type { CustomerReferenceUpdate } from '../schemas/customer-reference.js';

export interface CustomerReferenceStoragePort {
  create(ref: CustomerReference): Promise<CustomerReference>;
  list(): Promise<CustomerReference[]>;
  get(id: string): Promise<CustomerReference | null>;
  update(id: string, patch: CustomerReferenceUpdate): Promise<CustomerReference>;
  delete(id: string): Promise<void>;
}
