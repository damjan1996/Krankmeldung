import pyodbc
import os
import time
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

    # Verbindung zur master-Datenbank herstellen
    master_conn_str = f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server},{port};DATABASE=master;UID={user};PWD={password};TrustServerCertificate=yes;Connection Timeout=30;"

    try:
        print(f"Verbindung zum SQL Server {server} wird hergestellt...")
        conn = pyodbc.connect(master_conn_str)

        # WICHTIG: Autocommit auf True setzen, um Transaktionsprobleme zu vermeiden
        conn.autocommit = True

        cursor = conn.cursor()
        print("Verbindung zur master-Datenbank erfolgreich hergestellt.")

        # Prüfen, ob die Datenbank existiert
        cursor.execute(f"SELECT database_id FROM sys.databases WHERE name = '{db_name}'")
        db_exists = cursor.fetchone() is not None

        if db_exists:
            # Aktive Verbindungen zur bestehenden Datenbank beenden
            print(f"Datenbank {db_name} existiert. Aktive Verbindungen werden beendet...")

            try:
                # Bestehende Verbindungen killen (außer der eigenen)
                cursor.execute(f"""
                USE master;
                
                DECLARE @kill varchar(8000) = '';
                SELECT @kill = @kill + 'KILL ' + CONVERT(varchar(5), session_id) + ';'
                FROM sys.dm_exec_sessions
                WHERE database_id = DB_ID('{db_name}')
                AND session_id <> @@SPID;
                
                EXEC(@kill);
                """)
                print("Aktive Verbindungen wurden beendet.")

                # Single-User-Modus für die Datenbank setzen
                cursor.execute(f"ALTER DATABASE [{db_name}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE")
                print(f"Die Datenbank {db_name} wurde in den Single-User-Modus versetzt.")

                # Bestehende Datenbank löschen
                cursor.execute(f"DROP DATABASE [{db_name}]")
                print(f"Die bestehende Datenbank {db_name} wurde gelöscht.")

            except pyodbc.Error as e:
                print(f"Fehler beim Vorbereiten der Datenbank für das Löschen: {e}")

                # Alternativer Ansatz - direkt löschen
                try:
                    print("Versuche direktes Löschen der Datenbank...")
                    cursor.execute(f"DROP DATABASE IF EXISTS [{db_name}]")
                    print(f"Die bestehende Datenbank {db_name} wurde gelöscht.")
                except pyodbc.Error as e2:
                    print(f"Kritischer Fehler beim Löschen der Datenbank: {e2}")
                    print("Die bestehende Datenbank konnte nicht gelöscht werden.")

                    # Prüfen, ob die Datenbank noch existiert
                    cursor.execute(f"SELECT database_id FROM sys.databases WHERE name = '{db_name}'")
                    db_still_exists = cursor.fetchone() is not None

                    if db_still_exists:
                        print("Die Datenbank existiert noch. Fahre mit der Neuerstellung fort.")
                        return
        else:
            print(f"Datenbank {db_name} existiert nicht. Erstelle neue Datenbank.")

        # Neue Datenbank erstellen
        print(f"Neue Datenbank {db_name} wird erstellt...")
        cursor.execute(f"""
        CREATE DATABASE [{db_name}]
        COLLATE Latin1_General_CI_AS;
        """)
        print(f"Die neue Datenbank {db_name} wurde erfolgreich erstellt.")

        # Datenbank-Einstellungen konfigurieren
        cursor.execute(f"""
        ALTER DATABASE [{db_name}] SET MULTI_USER;
        ALTER DATABASE [{db_name}] SET READ_WRITE;
        """)
        print(f"Datenbank {db_name} Einstellungen wurden konfiguriert.")

        print("\nDer Prozess wurde erfolgreich abgeschlossen.")
        print(f"Die Datenbank {db_name} wurde neu erstellt und ist bereit für die Tabellenerstellung.")

    except pyodbc.Error as e:
        print(f"Fehler bei der Datenbankoperation: {e}")
    finally:
        # Verbindung schließen
        if 'conn' in locals():
            conn.close()
            print("Datenbankverbindung geschlossen.")

if __name__ == "__main__":
    main()