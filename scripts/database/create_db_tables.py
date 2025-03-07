import pyodbc
import os
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

        # Wichtig: DDL-Operationen (CREATE TABLE etc.) sollten außerhalb von
        # Transaktionen ausgeführt werden
        conn.autocommit = True

        cursor = conn.cursor()
        print(f"Verbindung zur Datenbank {db_name} erfolgreich hergestellt.")

        # Die Schritte werden in Try-Except-Blöcke aufgeteilt, damit bei einem Fehler
        # die anderen Operationen noch ausgeführt werden können

        # Tabelle: Benutzer
        try:
            print("Erstelle Tabelle: Benutzer...")
            cursor.execute("""
            CREATE TABLE [Benutzer] (
                [id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                [email] NVARCHAR(255) NOT NULL UNIQUE,
                [password] NVARCHAR(MAX) NULL,
                [vorname] NVARCHAR(255) NULL,
                [nachname] NVARCHAR(255) NULL,
                [istAdmin] BIT NOT NULL DEFAULT 0,
                [erstelltAm] DATETIME2 NOT NULL DEFAULT GETDATE(),
                [aktualisiertAm] DATETIME2 NULL
            );
            """)
            print("Tabelle Benutzer erfolgreich erstellt.")
        except pyodbc.Error as e:
            print(f"Fehler beim Erstellen der Tabelle Benutzer: {e}")

        # Tabelle: Mitarbeiter
        try:
            print("Erstelle Tabelle: Mitarbeiter...")
            cursor.execute("""
            CREATE TABLE [Mitarbeiter] (
                [id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                [personalnummer] NVARCHAR(50) NOT NULL UNIQUE,
                [vorname] NVARCHAR(255) NOT NULL,
                [nachname] NVARCHAR(255) NOT NULL,
                [position] NVARCHAR(255) NULL,
                [istAktiv] BIT NOT NULL DEFAULT 1,
                [erstelltAm] DATETIME2 NOT NULL DEFAULT GETDATE(),
                [aktualisiertAm] DATETIME2 NULL
            );
            """)
            print("Tabelle Mitarbeiter erfolgreich erstellt.")
        except pyodbc.Error as e:
            print(f"Fehler beim Erstellen der Tabelle Mitarbeiter: {e}")

        # Tabelle: Krankmeldung
        try:
            print("Erstelle Tabelle: Krankmeldung...")
            cursor.execute("""
            CREATE TABLE [Krankmeldung] (
                [id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                [mitarbeiterId] UNIQUEIDENTIFIER NOT NULL,
                [startdatum] DATE NOT NULL,
                [enddatum] DATE NOT NULL,
                [arztbesuchDatum] DATE NULL,
                [notizen] NVARCHAR(MAX) NULL,
                [status] NVARCHAR(50) NOT NULL DEFAULT 'aktiv',
                [erstelltVonId] UNIQUEIDENTIFIER NOT NULL,
                [erstelltAm] DATETIME2 NOT NULL DEFAULT GETDATE(),
                [aktualisiertAm] DATETIME2 NULL,
                [aktualisiertVonId] UNIQUEIDENTIFIER NULL,
                FOREIGN KEY ([mitarbeiterId]) REFERENCES [Mitarbeiter]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION,
                FOREIGN KEY ([erstelltVonId]) REFERENCES [Benutzer]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION,
                FOREIGN KEY ([aktualisiertVonId]) REFERENCES [Benutzer]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION
            );
            """)
            print("Tabelle Krankmeldung erfolgreich erstellt.")
        except pyodbc.Error as e:
            print(f"Fehler beim Erstellen der Tabelle Krankmeldung: {e}")

        # Tabelle: AenderungsLog
        try:
            print("Erstelle Tabelle: AenderungsLog...")
            cursor.execute("""
            CREATE TABLE [AenderungsLog] (
                [id] UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
                [tabellenname] NVARCHAR(255) NOT NULL,
                [datensatzId] UNIQUEIDENTIFIER NOT NULL,
                [aktion] NVARCHAR(50) NOT NULL,
                [alteWerte] NVARCHAR(MAX) NULL,
                [neueWerte] NVARCHAR(MAX) NULL,
                [benutzerId] UNIQUEIDENTIFIER NOT NULL,
                [benutzerAgent] NVARCHAR(255) NULL,
                [ipAdresse] NVARCHAR(50) NULL,
                [erstelltAm] DATETIME2 NOT NULL DEFAULT GETDATE(),
                FOREIGN KEY ([benutzerId]) REFERENCES [Benutzer]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION
            );
            """)
            print("Tabelle AenderungsLog erfolgreich erstellt.")
        except pyodbc.Error as e:
            print(f"Fehler beim Erstellen der Tabelle AenderungsLog: {e}")

        # Indizes erstellen
        try:
            print("Erstelle Indizes für die Tabellen...")

            # Indizes für Mitarbeiter
            cursor.execute("CREATE INDEX [IX_Mitarbeiter_Nachname] ON [Mitarbeiter]([nachname]);")
            cursor.execute("CREATE INDEX [IX_Mitarbeiter_istAktiv] ON [Mitarbeiter]([istAktiv]);")

            # Indizes für Krankmeldung
            cursor.execute("CREATE INDEX [IX_Krankmeldung_mitarbeiterId] ON [Krankmeldung]([mitarbeiterId]);")
            cursor.execute("CREATE INDEX [IX_Krankmeldung_status] ON [Krankmeldung]([status]);")
            cursor.execute("CREATE INDEX [IX_Krankmeldung_startdatum] ON [Krankmeldung]([startdatum]);")
            cursor.execute("CREATE INDEX [IX_Krankmeldung_enddatum] ON [Krankmeldung]([enddatum]);")

            # Indizes für AenderungsLog
            cursor.execute("CREATE INDEX [IX_AenderungsLog_tabellenname] ON [AenderungsLog]([tabellenname]);")
            cursor.execute("CREATE INDEX [IX_AenderungsLog_datensatzId] ON [AenderungsLog]([datensatzId]);")
            cursor.execute("CREATE INDEX [IX_AenderungsLog_benutzerId] ON [AenderungsLog]([benutzerId]);")

            print("Indizes wurden erfolgreich erstellt.")
        except pyodbc.Error as e:
            print(f"Fehler beim Erstellen der Indizes: {e}")

        print("\nDie Tabellenerstellung wurde abgeschlossen!")

    except pyodbc.Error as e:
        print(f"Fehler bei der Datenbankverbindung: {e}")
    finally:
        # Verbindung schließen
        if 'conn' in locals():
            conn.close()
            print("Datenbankverbindung geschlossen.")

if __name__ == "__main__":
    main()