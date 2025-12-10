import { Album, Client, Person } from '../types';

const API_BASE_URL = '/api';

class ApiService {
    private async fetchWithAuth(url: string, options: RequestInit = {}) {
        const response = await fetch(`${API_BASE_URL}${url}`, {
            ...options,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        return response.json();
    }

    // Albums
    async getAlbums(): Promise<Album[]> {
        return this.fetchWithAuth('/albums');
    }

    async getAlbum(id: string): Promise<Album> {
        return this.fetchWithAuth(`/albums/${id}`);
    }

    async createAlbum(data: { title: string; description?: string }): Promise<Album> {
        return this.fetchWithAuth('/albums', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateAlbum(id: string, updates: Partial<Album>): Promise<Album> {
        return this.fetchWithAuth(`/albums/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(updates),
        });
    }

    async deleteAlbum(id: string): Promise<void> {
        return this.fetchWithAuth(`/albums/${id}`, {
            method: 'DELETE',
        });
    }

    // Clients (placeholder - implement when client table is added)
    async getClients(): Promise<Client[]> {
        // TODO: Implement when clients table is added to schema
        return [];
    }

    async getClient(id: string): Promise<Client | null> {
        // TODO: Implement when clients table is added to schema
        return null;
    }

    async createClient(data: Partial<Client>): Promise<Client> {
        // TODO: Implement when clients table is added to schema
        throw new Error('Not implemented');
    }

    async updateClient(id: string, updates: Partial<Client>): Promise<Client> {
        // TODO: Implement when clients table is added to schema
        throw new Error('Not implemented');
    }

    async deleteClient(id: string): Promise<void> {
        // TODO: Implement when clients table is added to schema
        throw new Error('Not implemented');
    }

    // People (placeholder - implement when people table is added)
    async getPeople(): Promise<Person[]> {
        // TODO: Implement when people table is added to schema
        return [];
    }

    async getPerson(id: string): Promise<Person | null> {
        // TODO: Implement when people table is added to schema
        return null;
    }

    async updatePerson(id: string, updates: Partial<Person>): Promise<Person> {
        // TODO: Implement when people table is added to schema
        throw new Error('Not implemented');
    }

    async deletePerson(id: string): Promise<void> {
        // TODO: Implement when people table is added to schema
        throw new Error('Not implemented');
    }

    // Storage Providers
    async getStorageProviders(): Promise<Array<{ id: string; name: string }>> {
        return this.fetchWithAuth('/storage-providers');
    }
}

export const apiService = new ApiService();
