import { auth } from '@/lib/firebase';
import { API_BASE_URL } from '@/config/constants';
import type { GeneratorResponse, GeneratorParams } from './types';

async function makeGeneratorRequest(endpoint: string, params: GeneratorParams): Promise<GeneratorResponse> {
  const token = await auth.currentUser?.getIdToken();
  
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error('Generator request failed');
  }

  return response.json();
}

export const generatePrompts = (params: GeneratorParams) => 
  makeGeneratorRequest('/scripts/run-analysis', params);

export const generateImages = (params: GeneratorParams) => 
  makeGeneratorRequest('/scripts/run-analysis', params);