import pyodbc
import os
import json
import uuid
import random
from datetime import datetime, timedelta
from dotenv import load_dotenv

def main():
    # Umgebungsvariablen aus .env-Datei laden (falls vorhanden)
    load_dotenv()

    # Verbindungsinformationen
    server = "116.202.224.248"
    port = "1433"
    user = "sa"
    password = "YJ5C19QZ7ZUW!"
    db_name = "GFUKrankmeldung"

    # Verbindung zur Datenbank herstellen
    conn_str = f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server},{port};DATABASE={db_name};UID={user};PWD={password};TrustServerCertificate=yes;Connection Timeout=30;"

    try:
        print(f"Verbindung zur Datenbank {db_name} wird hergestellt...")
        conn = pyodbc.connect(conn_str)
        cursor = conn.cursor()
        print(f"Verbindung zur Datenbank {db_name} erfolgreich hergestellt.")

        # DML-Operationen (Dateneinfügung) mit Transaktion
        conn.autocommit = False

        try:
            # 1. Benutzer erstellen
            print("Erstelle Benutzer...")

            # Admin-Benutzer
            admin_id = str(uuid.uuid4())
            cursor.execute("""
            INSERT INTO [Benutzer] ([id], [email], [password], [vorname], [nachname], [istAdmin])
            VALUES (?, ?, ?, ?, ?, ?);
            """, admin_id, "admin@gfu-krankmeldung.de", "admin123", "Admin", "Benutzer", True)

            # Standard-Benutzer
            standard_id = str(uuid.uuid4())
            cursor.execute("""
            INSERT INTO [Benutzer] ([id], [email], [password], [vorname], [nachname], [istAdmin])
            VALUES (?, ?, ?, ?, ?, ?);
            """, standard_id, "benutzer@gfu-krankmeldung.de", "password123", "Standard", "Benutzer", False)

            # Weitere Benutzer
            benutzer_daten = [
                (str(uuid.uuid4()), "maria.mueller@gfu-krankmeldung.de", "password123", "Maria", "Müller", False),
                (str(uuid.uuid4()), "thomas.schmidt@gfu-krankmeldung.de", "password123", "Thomas", "Schmidt", False),
                (str(uuid.uuid4()), "anna.wagner@gfu-krankmeldung.de", "password123", "Anna", "Wagner", False),
                (str(uuid.uuid4()), "michael.becker@gfu-krankmeldung.de", "password123", "Michael", "Becker", False),
                (str(uuid.uuid4()), "julia.schneider@gfu-krankmeldung.de", "password123", "Julia", "Schneider", False)
            ]

            # IDs für spätere Verwendung speichern
            benutzer_ids = [admin_id, standard_id]
            for benutzer in benutzer_daten:
                cursor.execute("""
                INSERT INTO [Benutzer] ([id], [email], [password], [vorname], [nachname], [istAdmin])
                VALUES (?, ?, ?, ?, ?, ?);
                """, benutzer[0], benutzer[1], benutzer[2], benutzer[3], benutzer[4], benutzer[5])
                benutzer_ids.append(benutzer[0])

            # Zwischenspeichern der Benutzer
            conn.commit()
            print("Benutzer wurden erfolgreich erstellt.")

            # 2. Mitarbeiter erstellen
            print("Erstelle Mitarbeiter...")

            abteilungen = ["IT", "Vertrieb", "Marketing", "Personal", "Finanzen", "Produktion", "Forschung", "Kundendienst"]
            positionen = {
                "IT": ["Entwickler", "System-Administrator", "IT-Support", "DevOps Engineer", "Datenbankadministrator", "Netzwerktechniker"],
                "Vertrieb": ["Vertriebsmitarbeiter", "Account Manager", "Sales Manager", "Vertriebsleiter", "Key Account Manager"],
                "Marketing": ["Marketing-Assistent", "Social Media Manager", "Content Creator", "Marketing-Analyst", "Brand Manager"],
                "Personal": ["HR-Mitarbeiter", "Personalreferent", "Recruiting Manager", "Personalentwickler", "Ausbildungsbeauftragter"],
                "Finanzen": ["Buchhalter", "Controller", "Finanzanalyst", "Kreditsachbearbeiter", "Steuerreferent"],
                "Produktion": ["Produktionsmitarbeiter", "Schichtleiter", "Qualitätsprüfer", "Produktionsplaner", "Logistikmitarbeiter"],
                "Forschung": ["Forscher", "Laborant", "Produktentwickler", "R&D Spezialist", "Innovationsmanager"],
                "Kundendienst": ["Kundenberater", "Service-Mitarbeiter", "Helpdesk-Mitarbeiter", "Kundenbetreuer", "Call-Center-Agent"]
            }

            vornamen = ["Alexander", "Birgit", "Christian", "Dana", "Erik", "Franziska", "Gerhard", "Heike", "Ingo", "Jasmin",
                        "Karsten", "Laura", "Markus", "Nina", "Oliver", "Petra", "Quentin", "Rebecca", "Stefan", "Tanja",
                        "Uwe", "Vera", "Wolfgang", "Xenia", "Yannick", "Zoe"]

            nachnamen = ["Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker", "Schulz", "Hoffmann",
                         "Schäfer", "Koch", "Bauer", "Richter", "Klein", "Wolf", "Schröder", "Neumann", "Schwarz", "Zimmermann",
                         "Braun", "Krüger", "Hofmann", "Hartmann", "Lange", "Schmitt", "Werner", "Schmitz", "Krause", "Meier"]

            # Für jede Abteilung 3-5 Mitarbeiter erstellen
            mitarbeiter_ids = []
            personal_nr = 1000

            for abteilung in abteilungen:
                anzahl_mitarbeiter = random.randint(3, 5)
                for _ in range(anzahl_mitarbeiter):
                    mitarbeiter_id = str(uuid.uuid4())
                    personal_nr += 1
                    vorname = random.choice(vornamen)
                    nachname = random.choice(nachnamen)
                    position = random.choice(positionen[abteilung])

                    cursor.execute("""
                    INSERT INTO [Mitarbeiter] ([id], [personalnummer], [vorname], [nachname], [position])
                    VALUES (?, ?, ?, ?, ?);
                    """, mitarbeiter_id, f"P{personal_nr}", vorname, nachname, position)

                    mitarbeiter_ids.append(mitarbeiter_id)

            # Zwischenspeichern der Mitarbeiter
            conn.commit()
            print("Mitarbeiter wurden erfolgreich erstellt.")

            # 3. Krankmeldungen erstellen
            print("Erstelle Krankmeldungen...")

            krankmeldung_gruende = [
                "Grippe", "Erkältung", "Magen-Darm-Infektion", "Kopfschmerzen", "Rückenschmerzen",
                "COVID-19", "Zahnschmerzen", "Allergische Reaktion", "Migräne", "Verletzung durch Unfall",
                "Burnout", "Erschöpfung", "Fieber", "Mandeln-OP", "Augen-OP", "Knie-OP", "Bandscheibenvorfall",
                "Lungenentzündung", "Bronchitis", "Muskelzerrung", "Bänderriss", "Knochenbruch"
            ]

            # Aktuelle Zeit für relative Datumsberechnungen
            today = datetime.now().date()

            # Abgeschlossene Krankmeldungen (in der Vergangenheit)
            for _ in range(30):
                mitarbeiter_id = random.choice(mitarbeiter_ids)
                benutzer_id = random.choice(benutzer_ids)

                # Zufälliger Zeitpunkt in den letzten 90 Tagen
                tage_zurueck = random.randint(14, 90)
                start_datum = today - timedelta(days=tage_zurueck)
                dauer = random.randint(1, 10)  # 1-10 Tage krank
                end_datum = start_datum + timedelta(days=dauer)

                # In 80% der Fälle gibt es ein Arztdatum
                arzt_datum = start_datum if random.random() < 0.8 else None

                notizen = random.choice(krankmeldung_gruende)
                status = "abgeschlossen"  # Vergangene Krankmeldungen sind abgeschlossen

                krankmeldung_id = str(uuid.uuid4())
                cursor.execute("""
                INSERT INTO [Krankmeldung] ([id], [mitarbeiterId], [startdatum], [enddatum], [arztbesuchDatum], [notizen], [status], [erstelltVonId])
                VALUES (?, ?, ?, ?, ?, ?, ?, ?);
                """, krankmeldung_id, mitarbeiter_id, start_datum, end_datum, arzt_datum, notizen, status, benutzer_id)

                # AenderungsLog für diese Krankmeldung
                log_id = str(uuid.uuid4())
                neue_werte = json.dumps({
                    "mitarbeiterId": mitarbeiter_id,
                    "startdatum": start_datum.isoformat(),
                    "enddatum": end_datum.isoformat(),
                    "status": status,
                    "notizen": notizen
                })

                cursor.execute("""
                INSERT INTO [AenderungsLog] ([id], [tabellenname], [datensatzId], [aktion], [alteWerte], [neueWerte], [benutzerId], [benutzerAgent], [ipAdresse])
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
                """, log_id, "Krankmeldung", krankmeldung_id, "INSERT", None, neue_werte, benutzer_id, "Python Script", "127.0.0.1")

                # In 70% der Fälle gibt es noch einen UPDATE Log-Eintrag
                if random.random() < 0.7:
                    log_id = str(uuid.uuid4())
                    alte_werte = json.dumps({"status": "aktiv"})
                    neue_werte = json.dumps({"status": "abgeschlossen"})

                    cursor.execute("""
                    INSERT INTO [AenderungsLog] ([id], [tabellenname], [datensatzId], [aktion], [alteWerte], [neueWerte], [benutzerId], [benutzerAgent], [ipAdresse])
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
                    """, log_id, "Krankmeldung", krankmeldung_id, "UPDATE", alte_werte, neue_werte, benutzer_id, "Python Script", "127.0.0.1")

            # Zwischenspeichern nach den abgeschlossenen Krankmeldungen
            conn.commit()
            print("Abgeschlossene Krankmeldungen wurden erstellt.")

            # Aktive Krankmeldungen (aktuell laufend)
            for _ in range(10):
                mitarbeiter_id = random.choice(mitarbeiter_ids)
                benutzer_id = random.choice(benutzer_ids)

                # Zufälliger Zeitpunkt in den letzten 5 Tagen
                tage_zurueck = random.randint(0, 5)
                start_datum = today - timedelta(days=tage_zurueck)
                dauer = random.randint(3, 14)  # 3-14 Tage krank
                end_datum = start_datum + timedelta(days=dauer)

                # Wenn das Enddatum in der Zukunft liegt, ist die Krankmeldung aktiv
                if end_datum > today:
                    # In 80% der Fälle gibt es ein Arztdatum
                    arzt_datum = start_datum if random.random() < 0.8 else None

                    notizen = random.choice(krankmeldung_gruende)
                    status = "aktiv"

                    krankmeldung_id = str(uuid.uuid4())
                    cursor.execute("""
                    INSERT INTO [Krankmeldung] ([id], [mitarbeiterId], [startdatum], [enddatum], [arztbesuchDatum], [notizen], [status], [erstelltVonId])
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?);
                    """, krankmeldung_id, mitarbeiter_id, start_datum, end_datum, arzt_datum, notizen, status, benutzer_id)

                    # AenderungsLog für diese Krankmeldung
                    log_id = str(uuid.uuid4())
                    neue_werte = json.dumps({
                        "mitarbeiterId": mitarbeiter_id,
                        "startdatum": start_datum.isoformat(),
                        "enddatum": end_datum.isoformat(),
                        "status": status,
                        "notizen": notizen
                    })

                    cursor.execute("""
                    INSERT INTO [AenderungsLog] ([id], [tabellenname], [datensatzId], [aktion], [alteWerte], [neueWerte], [benutzerId], [benutzerAgent], [ipAdresse])
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
                    """, log_id, "Krankmeldung", krankmeldung_id, "INSERT", None, neue_werte, benutzer_id, "Python Script", "127.0.0.1")

            # Zwischenspeichern nach den aktiven Krankmeldungen
            conn.commit()
            print("Aktive Krankmeldungen wurden erstellt.")

            # Stornierte Krankmeldungen
            for _ in range(5):
                mitarbeiter_id = random.choice(mitarbeiter_ids)
                benutzer_id = random.choice(benutzer_ids)

                # Zufälliger Zeitpunkt in den letzten 30 Tagen
                tage_zurueck = random.randint(5, 30)
                start_datum = today - timedelta(days=tage_zurueck)
                dauer = random.randint(2, 7)  # 2-7 Tage krank
                end_datum = start_datum + timedelta(days=dauer)

                # In 60% der Fälle gibt es ein Arztdatum
                arzt_datum = start_datum if random.random() < 0.6 else None

                notizen = random.choice(krankmeldung_gruende) + " - Storniert: Mitarbeiter erschien doch zur Arbeit"
                status = "storniert"

                krankmeldung_id = str(uuid.uuid4())
                cursor.execute("""
                INSERT INTO [Krankmeldung] ([id], [mitarbeiterId], [startdatum], [enddatum], [arztbesuchDatum], [notizen], [status], [erstelltVonId])
                VALUES (?, ?, ?, ?, ?, ?, ?, ?);
                """, krankmeldung_id, mitarbeiter_id, start_datum, end_datum, arzt_datum, notizen, status, benutzer_id)

                # AenderungsLog für diese Krankmeldung (Erstellung)
                log_id = str(uuid.uuid4())
                neue_werte = json.dumps({
                    "mitarbeiterId": mitarbeiter_id,
                    "startdatum": start_datum.isoformat(),
                    "enddatum": end_datum.isoformat(),
                    "status": "aktiv",
                    "notizen": notizen.split(" - ")[0]
                })

                cursor.execute("""
                INSERT INTO [AenderungsLog] ([id], [tabellenname], [datensatzId], [aktion], [alteWerte], [neueWerte], [benutzerId], [benutzerAgent], [ipAdresse])
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
                """, log_id, "Krankmeldung", krankmeldung_id, "INSERT", None, neue_werte, benutzer_id, "Python Script", "127.0.0.1")

                # AenderungsLog für die Stornierung
                log_id = str(uuid.uuid4())
                alte_werte = json.dumps({
                    "status": "aktiv",
                    "notizen": notizen.split(" - ")[0]
                })
                neue_werte = json.dumps({
                    "status": "storniert",
                    "notizen": notizen
                })

                # Ein anderer Benutzer storniert die Krankmeldung
                anderer_benutzer_id = random.choice([id for id in benutzer_ids if id != benutzer_id])

                cursor.execute("""
                INSERT INTO [AenderungsLog] ([id], [tabellenname], [datensatzId], [aktion], [alteWerte], [neueWerte], [benutzerId], [benutzerAgent], [ipAdresse])
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
                """, log_id, "Krankmeldung", krankmeldung_id, "UPDATE", alte_werte, neue_werte, anderer_benutzer_id, "Python Script", "127.0.0.1")

            # Alle Änderungen bestätigen
            conn.commit()
            print("Stornierte Krankmeldungen wurden erstellt.")

            # Statistiken ausgeben
            cursor.execute("SELECT COUNT(*) FROM [Benutzer]")
            anzahl_benutzer = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM [Mitarbeiter]")
            anzahl_mitarbeiter = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM [Krankmeldung]")
            anzahl_krankmeldungen = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM [AenderungsLog]")
            anzahl_logs = cursor.fetchone()[0]

            print(f"\nDatenimport erfolgreich abgeschlossen!")
            print(f"Erstellte Datensätze:")
            print(f"  - {anzahl_benutzer} Benutzer")
            print(f"  - {anzahl_mitarbeiter} Mitarbeiter")
            print(f"  - {anzahl_krankmeldungen} Krankmeldungen")
            print(f"  - {anzahl_logs} Änderungslog-Einträge")

        except pyodbc.Error as e:
            # Bei Fehler die Transaktion zurückrollen
            conn.rollback()
            print(f"Fehler beim Einfügen der Testdaten: {e}")
            raise

    except pyodbc.Error as e:
        print(f"Fehler bei der Datenbankverbindung: {e}")
    finally:
        # Verbindung schließen
        if 'conn' in locals():
            conn.close()
            print("Datenbankverbindung geschlossen.")

if __name__ == "__main__":
    main()