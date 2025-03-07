import { PrismaClient } from '@prisma/client';
import { addDays, subDays, subMonths, format } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Clear all data (be careful with this in production!)
    console.log('🧹 Clearing existing data...');
    await prisma.aenderungsLog.deleteMany();
    await prisma.krankmeldung.deleteMany();
    await prisma.mitarbeiter.deleteMany();
    await prisma.benutzer.deleteMany();

    // Create users
    console.log('👥 Creating users...');
    const adminUser = await prisma.benutzer.create({
        data: {
            email: 'admin@gfu-krankmeldung.de',
            password: 'admin123',
            vorname: 'Admin',
            nachname: 'Benutzer',
            istAdmin: true,
        },
    });

    const standardUser = await prisma.benutzer.create({
        data: {
            email: 'benutzer@gfu-krankmeldung.de',
            password: 'password123',
            vorname: 'Standard',
            nachname: 'Benutzer',
            istAdmin: false,
        },
    });

    const mariaUser = await prisma.benutzer.create({
        data: {
            email: 'maria.mueller@gfu-krankmeldung.de',
            password: 'password123',
            vorname: 'Maria',
            nachname: 'Müller',
            istAdmin: false,
        },
    });

    const juliaUser = await prisma.benutzer.create({
        data: {
            email: 'julia.schneider@gfu-krankmeldung.de',
            password: 'password123',
            vorname: 'Julia',
            nachname: 'Schneider',
            istAdmin: false,
        },
    });

    const michaelUser = await prisma.benutzer.create({
        data: {
            email: 'michael.becker@gfu-krankmeldung.de',
            password: 'password123',
            vorname: 'Michael',
            nachname: 'Becker',
            istAdmin: false,
        },
    });

    // Create employees
    console.log('👷 Creating employees...');
    const employees = [
        {
            personalnummer: 'P1001',
            vorname: 'Max',
            nachname: 'Mustermann',
            position: 'Teamleiter',
        },
        {
            personalnummer: 'P1002',
            vorname: 'Lisa',
            nachname: 'Schmidt',
            position: 'Softwareentwickler',
        },
        {
            personalnummer: 'P1003',
            vorname: 'Stefan',
            nachname: 'Meyer',
            position: 'Systemadministrator',
        },
        {
            personalnummer: 'P1004',
            vorname: 'Anna',
            nachname: 'Müller',
            position: 'Projektmanager',
        },
        {
            personalnummer: 'P1005',
            vorname: 'Thomas',
            nachname: 'Fischer',
            position: 'UI/UX Designer',
        },
        {
            personalnummer: 'P1006',
            vorname: 'Sarah',
            nachname: 'Bauer',
            position: 'Buchhalter',
        },
        {
            personalnummer: 'P1007',
            vorname: 'Markus',
            nachname: 'Schulz',
            position: 'Marketing-Manager',
        },
        {
            personalnummer: 'P1008',
            vorname: 'Laura',
            nachname: 'Weber',
            position: 'Personalreferent',
        },
        {
            personalnummer: 'P1009',
            vorname: 'Florian',
            nachname: 'Hoffmann',
            position: 'Vertriebsmitarbeiter',
        },
        {
            personalnummer: 'P1010',
            vorname: 'Claudia',
            nachname: 'Koch',
            position: 'Qualitätsmanager',
        },
    ];

    const createdEmployees = [];
    for (const emp of employees) {
        const employee = await prisma.mitarbeiter.create({
            data: emp,
        });
        createdEmployees.push(employee);
    }

    // Create sick leave reports
    console.log('🤒 Creating sick leave reports...');
    const today = new Date();

    // Active sick leave reports
    const activeSickLeaves = [
        {
            mitarbeiterId: createdEmployees[0].id,
            startdatum: subDays(today, 5),
            enddatum: addDays(today, 5),
            arztbesuchDatum: subDays(today, 5),
            notizen: 'Erkältung',
            status: 'aktiv',
            erstelltVonId: standardUser.id,
        },
        {
            mitarbeiterId: createdEmployees[2].id,
            startdatum: subDays(today, 3),
            enddatum: addDays(today, 7),
            arztbesuchDatum: subDays(today, 3),
            notizen: 'Grippe',
            status: 'aktiv',
            erstelltVonId: mariaUser.id,
        },
        {
            mitarbeiterId: createdEmployees[5].id,
            startdatum: subDays(today, 1),
            enddatum: addDays(today, 3),
            arztbesuchDatum: subDays(today, 1),
            notizen: 'Migräne',
            status: 'aktiv',
            erstelltVonId: adminUser.id,
        },
    ];

    // Completed sick leave reports
    const completedSickLeaves = [
        {
            mitarbeiterId: createdEmployees[1].id,
            startdatum: subDays(today, 20),
            enddatum: subDays(today, 15),
            arztbesuchDatum: subDays(today, 20),
            notizen: 'Rückenschmerzen',
            status: 'abgeschlossen',
            erstelltVonId: juliaUser.id,
        },
        {
            mitarbeiterId: createdEmployees[3].id,
            startdatum: subDays(today, 18),
            enddatum: subDays(today, 12),
            arztbesuchDatum: subDays(today, 18),
            notizen: 'Magen-Darm-Infekt',
            status: 'abgeschlossen',
            erstelltVonId: michaelUser.id,
        },
        {
            mitarbeiterId: createdEmployees[6].id,
            startdatum: subMonths(today, 1),
            enddatum: subDays(subMonths(today, 1), -5),
            arztbesuchDatum: subMonths(today, 1),
            notizen: 'COVID-19',
            status: 'abgeschlossen',
            erstelltVonId: standardUser.id,
        },
        {
            mitarbeiterId: createdEmployees[4].id,
            startdatum: subMonths(today, 2),
            enddatum: subDays(subMonths(today, 2), -3),
            arztbesuchDatum: subMonths(today, 2),
            notizen: 'Bronchitis',
            status: 'abgeschlossen',
            erstelltVonId: mariaUser.id,
        },
    ];

    // Cancelled sick leave reports
    const cancelledSickLeaves = [
        {
            mitarbeiterId: createdEmployees[7].id,
            startdatum: subDays(today, 10),
            enddatum: subDays(today, 8),
            arztbesuchDatum: null,
            notizen: 'Storniert - Irrtümlich gemeldet',
            status: 'storniert',
            erstelltVonId: adminUser.id,
        },
        {
            mitarbeiterId: createdEmployees[9].id,
            startdatum: subDays(today, 7),
            enddatum: subDays(today, 5),
            arztbesuchDatum: null,
            notizen: 'Storniert - Doppelte Erfassung',
            status: 'storniert',
            erstelltVonId: juliaUser.id,
        },
    ];

    // Create all sick leave reports
    const allSickLeaves = [...activeSickLeaves, ...completedSickLeaves, ...cancelledSickLeaves];
    for (const sickLeave of allSickLeaves) {
        await prisma.krankmeldung.create({
            data: {
                mitarbeiterId: sickLeave.mitarbeiterId,
                startdatum: sickLeave.startdatum,
                enddatum: sickLeave.enddatum,
                arztbesuchDatum: sickLeave.arztbesuchDatum,
                notizen: sickLeave.notizen,
                status: sickLeave.status,
                erstelltVonId: sickLeave.erstelltVonId,
            },
        });
    }

    // Create some audit logs
    console.log('📝 Creating audit logs...');
    const auditLogEntries = [
        {
            tabellenname: 'Krankmeldung',
            datensatzId: (await prisma.krankmeldung.findFirst({ where: { status: 'aktiv' } }))!.id,
            aktion: 'INSERT',
            alteWerte: null,
            neueWerte: JSON.stringify({ status: 'aktiv', startdatum: format(subDays(today, 5), 'yyyy-MM-dd') }),
            benutzerId: standardUser.id,
            benutzerAgent: 'Seed Script',
            ipAdresse: '127.0.0.1',
        },
        {
            tabellenname: 'Krankmeldung',
            datensatzId: (await prisma.krankmeldung.findFirst({ where: { status: 'abgeschlossen' } }))!.id,
            aktion: 'UPDATE',
            alteWerte: JSON.stringify({ status: 'aktiv' }),
            neueWerte: JSON.stringify({ status: 'abgeschlossen' }),
            benutzerId: juliaUser.id,
            benutzerAgent: 'Seed Script',
            ipAdresse: '127.0.0.1',
        },
        {
            tabellenname: 'Mitarbeiter',
            datensatzId: createdEmployees[0].id,
            aktion: 'INSERT',
            alteWerte: null,
            neueWerte: JSON.stringify({ personalnummer: 'P1001', vorname: 'Max', nachname: 'Mustermann' }),
            benutzerId: adminUser.id,
            benutzerAgent: 'Seed Script',
            ipAdresse: '127.0.0.1',
        },
    ];

    for (const logEntry of auditLogEntries) {
        await prisma.aenderungsLog.create({
            data: logEntry,
        });
    }

    console.log('✅ Seeding complete!');
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });