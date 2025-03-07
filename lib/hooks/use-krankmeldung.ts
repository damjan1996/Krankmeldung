import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useToast } from './use-toast';
import {
    getKrankmeldungen,
    getKrankmeldungById,
    createKrankmeldung,
    updateKrankmeldung,
    changeKrankmeldungStatus,
    type Krankmeldung
} from '../api/krankmeldungen';
import {
    CreateKrankmeldungInput,
    UpdateKrankmeldungInput,
    FilterKrankmeldungInput
} from '../validations/krankmeldung';

export function useKrankmeldung() {
    const { data: session } = useSession();
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch all sick leave reports with optional filtering
    const fetchKrankmeldungen = useCallback(async (
        filter?: FilterKrankmeldungInput
    ): Promise<Krankmeldung[]> => {
        setLoading(true);
        setError(null);

        try {
            const data = await getKrankmeldungen(filter);
            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Fehler beim Laden der Krankmeldungen';
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

    // Fetch a single sick leave report by ID
    const fetchKrankmeldungById = useCallback(async (
        id: string
    ): Promise<Krankmeldung | null> => {
        setLoading(true);
        setError(null);

        try {
            const data = await getKrankmeldungById(id);
            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Fehler beim Laden der Krankmeldung';
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

    // Create a new sick leave report
    const addKrankmeldung = useCallback(async (
        data: CreateKrankmeldungInput,
        options?: { redirect?: boolean; redirectUrl?: string }
    ): Promise<Krankmeldung | null> => {
        if (!session?.user) {
            setError('Bitte melden Sie sich an, um eine Krankmeldung zu erstellen');
            toast({
                title: 'Fehler',
                description: 'Bitte melden Sie sich an, um eine Krankmeldung zu erstellen',
                variant: 'destructive',
            });
            return null;
        }

        setLoading(true);
        setError(null);

        try {
            const newKrankmeldung = await createKrankmeldung(data);
            toast({
                title: 'Erfolg',
                description: 'Krankmeldung wurde erfolgreich erstellt',
            });

            if (options?.redirect) {
                router.push(options.redirectUrl || `/krankmeldungen/${newKrankmeldung.id}`);
            }

            return newKrankmeldung;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Fehler beim Erstellen der Krankmeldung';
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

    // Update an existing sick leave report
    const editKrankmeldung = useCallback(async (
        id: string,
        data: UpdateKrankmeldungInput,
        options?: { redirect?: boolean; redirectUrl?: string }
    ): Promise<Krankmeldung | null> => {
        if (!session?.user) {
            setError('Bitte melden Sie sich an, um eine Krankmeldung zu bearbeiten');
            toast({
                title: 'Fehler',
                description: 'Bitte melden Sie sich an, um eine Krankmeldung zu bearbeiten',
                variant: 'destructive',
            });
            return null;
        }

        setLoading(true);
        setError(null);

        try {
            const updatedKrankmeldung = await updateKrankmeldung(id, data);
            toast({
                title: 'Erfolg',
                description: 'Krankmeldung wurde erfolgreich aktualisiert',
            });

            if (options?.redirect) {
                router.push(options.redirectUrl || `/krankmeldungen/${id}`);
            }

            return updatedKrankmeldung;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Fehler beim Aktualisieren der Krankmeldung';
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

    // Change the status of a sick leave report
    const updateStatus = useCallback(async (
        id: string,
        status: 'aktiv' | 'abgeschlossen' | 'storniert'
    ): Promise<Krankmeldung | null> => {
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
            const updatedKrankmeldung = await changeKrankmeldungStatus(id, status);

            const statusText =
                status === 'aktiv' ? 'aktiv' :
                    status === 'abgeschlossen' ? 'abgeschlossen' : 'storniert';

            toast({
                title: 'Erfolg',
                description: `Krankmeldung wurde erfolgreich als ${statusText} markiert`,
            });

            return updatedKrankmeldung;
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
        fetchKrankmeldungen,
        fetchKrankmeldungById,
        addKrankmeldung,
        editKrankmeldung,
        updateStatus,
    };
}