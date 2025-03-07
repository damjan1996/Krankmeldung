// __mocks__/msw/handlers.js
import { rest } from 'msw';

export const handlers = [
    // Auth Handlers
    rest.post('/api/auth/login', (req, res, ctx) => {
        return res(
            ctx.status(200),
            ctx.json({
                user: {
                    id: 'A453E325-FED8-40FF-856D-83E75A6A04B2',
                    email: 'admin@gfu-krankmeldung.de',
                    vorname: 'Admin',
                    nachname: 'Benutzer',
                    istAdmin: true,
                },
                token: 'mock-jwt-token',
            })
        );
    }),

    // Krankmeldungen Handlers
    rest.get('/api/krankmeldungen', (req, res, ctx) => {
        return res(
            ctx.status(200),
            ctx.json({
                data: [
                    {
                        id: '584C4F7C-003F-4625-937D-0439DDE9190A',
                        mitarbeiterId: 'CF176328-64F7-47D1-932F-9EF7F22E516F',
                        mitarbeiter: {
                            id: 'CF176328-64F7-47D1-932F-9EF7F22E516F',
                            personalnummer: 'P1001',
                            vorname: 'Max',
                            nachname: 'Mustermann',
                            position: 'Entwickler',
                        },
                        startdatum: '2025-01-24',
                        enddatum: '2025-01-28',
                        arztbesuchDatum: '2025-01-24',
                        notizen: 'Knie-OP',
                        status: 'abgeschlossen',
                        erstelltVonId: 'A453E325-FED8-40FF-856D-83E75A6A04B2',
                        erstelltAm: '2025-03-04T14:10:01.990000',
                    },
                    {
                        id: '7CB3ECFA-CD13-44FB-B1E9-06E9C65E9E24',
                        mitarbeiterId: '5C7E0D82-A390-44F8-9410-F85F188CB7D5',
                        mitarbeiter: {
                            id: '5C7E0D82-A390-44F8-9410-F85F188CB7D5',
                            personalnummer: 'P1002',
                            vorname: 'Anna',
                            nachname: 'Schmidt',
                            position: 'Marketing',
                        },
                        startdatum: '2024-12-25',
                        enddatum: '2025-01-01',
                        arztbesuchDatum: '2024-12-25',
                        notizen: 'Mandeln-OP',
                        status: 'aktiv',
                        erstelltVonId: 'F3B94152-6C3A-4363-BD74-1A20416F07DC',
                        erstelltAm: '2025-03-04T14:09:49.730000',
                    },
                ],
            })
        );
    }),

    rest.get('/api/krankmeldungen/:id', (req, res, ctx) => {
        const { id } = req.params;
        return res(
            ctx.status(200),
            ctx.json({
                data: {
                    id,
                    mitarbeiterId: 'CF176328-64F7-47D1-932F-9EF7F22E516F',
                    startdatum: '2025-01-24',
                    enddatum: '2025-01-28',
                    arztbesuchDatum: '2025-01-24',
                    notizen: 'Knie-OP',
                    status: 'abgeschlossen',
                    erstelltVonId: 'A453E325-FED8-40FF-856D-83E75A6A04B2',
                    erstelltAm: '2025-03-04T14:10:01.990000',
                    mitarbeiter: {
                        id: 'CF176328-64F7-47D1-932F-9EF7F22E516F',
                        personalnummer: 'P1001',
                        vorname: 'Max',
                        nachname: 'Mustermann',
                        position: 'Entwickler',
                    },
                },
            })
        );
    }),

    rest.post('/api/krankmeldungen', async (req, res, ctx) => {
        const data = await req.json();
        return res(
            ctx.status(201),
            ctx.json({
                data: {
                    id: 'new-id',
                    ...data,
                    status: 'aktiv',
                    erstelltVonId: 'A453E325-FED8-40FF-856D-83E75A6A04B2',
                    erstelltAm: new Date().toISOString(),
                },
            })
        );
    }),

    rest.put('/api/krankmeldungen/:id', async (req, res, ctx) => {
        const { id } = req.params;
        const data = await req.json();
        return res(
            ctx.status(200),
            ctx.json({
                data: {
                    id,
                    ...data,
                    aktualisiertAm: new Date().toISOString(),
                },
            })
        );
    }),

    // Mitarbeiter Handlers
    rest.get('/api/mitarbeiter', (req, res, ctx) => {
        return res(
            ctx.status(200),
            ctx.json({
                data: [
                    {
                        id: 'CF176328-64F7-47D1-932F-9EF7F22E516F',
                        personalnummer: 'P1001',
                        vorname: 'Max',
                        nachname: 'Mustermann',
                        position: 'Entwickler',
                        istAktiv: true,
                        erstelltAm: '2025-03-04T14:09:40.563333',
                    },
                    {
                        id: '5C7E0D82-A390-44F8-9410-F85F188CB7D5',
                        personalnummer: 'P1002',
                        vorname: 'Anna',
                        nachname: 'Schmidt',
                        position: 'Marketing',
                        istAktiv: true,
                        erstelltAm: '2025-03-04T14:09:41.063333',
                    },
                ],
            })
        );
    }),

    rest.get('/api/mitarbeiter/:id', (req, res, ctx) => {
        const { id } = req.params;
        return res(
            ctx.status(200),
            ctx.json({
                data: {
                    id,
                    personalnummer: 'P1001',
                    vorname: 'Max',
                    nachname: 'Mustermann',
                    position: 'Entwickler',
                    istAktiv: true,
                    erstelltAm: '2025-03-04T14:09:40.563333',
                },
            })
        );
    }),
];