import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useToast } from './use-toast';
import {
    getMitarbeiter,
    getMitarbeiterById,
    createMitarbeiter,
    updateMitarbeiter,
    toggleMitarbeiterStatus,
    type Mitarbeiter
} from '../api/mitarbeiter';
import {
    CreateMitarbeiterInput,
    UpdateMitarbeiterInput,
    FilterMitarbeiterInput
} from '../validations/mitarbeiter';

export function useMitarbeiter() {
    const { data: session } = useSession();
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch all employees with optional filtering
    const fetchMitarbeiter = useCallback(async (
        filter?: FilterMitarbeiterInput
    ): Promise<Mitarbeiter[]> => {
        setLoading(true);
        setError(null);

        try {
            const data = await getMitarbeiter(filter);
            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Fehler beim Laden der Mitarbeiter';
            setError(errorMessage);
            toast({
                title: 'Fehler',
                description: errorMessage,
                variant: 'destructive',
            });
            return [];
        } finally {
            setLoading(false);
        }
    }, [toast]);

    // Fetch a single employee by ID
    const fetchMitarbeiterById = useCallback(async (
        id: string
    ): Promise<Mitarbeiter | null> => {
        setLoading(true);
        setError(null);

        try {
            const data = await getMitarbeiterById(id);
            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Fehler beim Laden des Mitarbeiters';
            setError(errorMessage);
            toast({
                title: 'Fehler',
                description: errorMessage,
                variant: 'destructive',
            });
            return null;
        } finally {
            setLoading(false);
        }
    }, [toast]);

    // Create a new employee
    const addMitarbeiter = useCallback(async (
        data: CreateMitarbeiterInput,
        options?: { redirect?: boolean; redirectUrl?: string }
    ): Promise<Mitarbeiter | null> => {
        if (!session?.user) {
            setError('Bitte melden Sie sich an, um einen Mitarbeiter hinzuzufügen');
            toast({
                title: 'Fehler',
                description: 'Bitte melden Sie sich an, um einen Mitarbeiter hinzuzufügen',
                variant: 'destructive',
            });
            return null;
        }

        setLoading(true);
        setError(null);

        try {
            const newMitarbeiter = await createMitarbeiter(data);
            toast({
                title: 'Erfolg',
                description: 'Mitarbeiter wurde erfolgreich erstellt',
            });

            if (options?.redirect) {
                router.push(options.redirectUrl || `/mitarbeiter/${newMitarbeiter.id}`);
            }

            return newMitarbeiter;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Fehler beim Erstellen des Mitarbeiters';
            setError(errorMessage);
            toast({
                title: 'Fehler',
                description: errorMessage,
                variant: 'destructive',
            });
            return null;
        } finally {
            setLoading(false);
        }
    }, [session, router, toast]);

    // Update an existing employee
    const editMitarbeiter = useCallback(async (
        id: string,
        data: UpdateMitarbeiterInput,
        options?: { redirect?: boolean; redirectUrl?: string }
    ): Promise<Mitarbeiter | null> => {
        if (!session?.user) {
            setError('Bitte melden Sie sich an, um einen Mitarbeiter zu bearbeiten');
            toast({
                title: 'Fehler',
                description: 'Bitte melden Sie sich an, um einen Mitarbeiter zu bearbeiten',
                variant: 'destructive',
            });
            return null;
        }

        setLoading(true);
        setError(null);

        try {
            const updatedMitarbeiter = await updateMitarbeiter(id, data);
            toast({
                title: 'Erfolg',
                description: 'Mitarbeiter wurde erfolgreich aktualisiert',
            });

            if (options?.redirect) {
                router.push(options.redirectUrl || `/mitarbeiter/${id}`);
            }

            return updatedMitarbeiter;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Fehler beim Aktualisieren des Mitarbeiters';
            setError(errorMessage);
            toast({
                title: 'Fehler',
                description: errorMessage,
                variant: 'destructive',
            });
            return null;
        } finally {
            setLoading(false);
        }
    }, [session, router, toast]);

    // Toggle employee active status
    const toggleStatus = useCallback(async (
        id: string,
        isActive: boolean
    ): Promise<Mitarbeiter | null> => {
        if (!session?.user) {
            setError('Bitte melden Sie sich an, um den Status zu ändern');
            toast({
                title: 'Fehler',
                description: 'Bitte melden Sie sich an, um den Status zu ändern',
                variant: 'destructive',
            });
            return null;
        }

        setLoading(true);
        setError(null);

        try {
            const updatedMitarbeiter = await toggleMitarbeiterStatus(id, isActive);

            toast({
                title: 'Erfolg',
                description: `Mitarbeiter wurde erfolgreich als ${isActive ? 'aktiv' : 'inaktiv'} markiert`,
            });

            return updatedMitarbeiter;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Fehler beim Ändern des Status';
            setError(errorMessage);
            toast({
                title: 'Fehler',
                description: errorMessage,
                variant: 'destructive',
            });
            return null;
        } finally {
            setLoading(false);
        }
    }, [session, toast]);

    return {
        loading,
        error,
        fetchMitarbeiter,
        fetchMitarbeiterById,
        addMitarbeiter,
        editMitarbeiter,
        toggleStatus,
    };
}