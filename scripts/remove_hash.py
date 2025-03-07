#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
import pyodbc
import time
from datetime import datetime

# Database connection parameters
DB_SERVER = "116.202.224.248"
DB_NAME = "GFUKrankmeldung"
DB_USER = "sa"
DB_PASSWORD = "YJ5C19QZ7ZUW!"

def connect_to_database():
    """Establish a connection to the SQL Server database."""
    try:
        connection_string = (
            f"DRIVER={{ODBC Driver 17 for SQL Server}};"
            f"SERVER={DB_SERVER};"
            f"DATABASE={DB_NAME};"
            f"UID={DB_USER};"
            f"PWD={DB_PASSWORD};"
            f"TrustServerCertificate=yes;"
        )

        conn = pyodbc.connect(connection_string)
        print("✅ Datenbankverbindung hergestellt")
        return conn
    except Exception as e:
        print(f"❌ Fehler bei der Datenbankverbindung: {str(e)}")
        sys.exit(1)

def check_column_exists(conn, table_name, column_name):
    """Check if the specified column exists in the table."""
    cursor = conn.cursor()
    try:
        cursor.execute(f"""
            SELECT COUNT(*)
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_NAME = '{table_name}'
            AND COLUMN_NAME = '{column_name}'
        """)
        result = cursor.fetchone()[0]
        return result > 0
    finally:
        cursor.close()

def rename_column_if_needed(conn):
    """Rename the passwortHash column to password if it exists."""
    try:
        cursor = conn.cursor()

        # Check if passwortHash exists and password doesn't
        has_password_hash = check_column_exists(conn, 'Benutzer', 'passwortHash')
        has_password = check_column_exists(conn, 'Benutzer', 'password')

        if has_password_hash and not has_password:
            print("🔄 Benenne Spalte 'passwortHash' zu 'password' um...")
            cursor.execute("EXEC sp_rename '[dbo].[Benutzer].[passwortHash]', 'password', 'COLUMN';")
            conn.commit()
            print("✅ Spalte wurde umbenannt")
        elif has_password:
            print("✅ Spalte 'password' existiert bereits")
        else:
            print("❌ Weder 'passwortHash' noch 'password' Spalte gefunden")
            return False

        return True
    except Exception as e:
        print(f"❌ Fehler beim Umbenennen der Spalte: {str(e)}")
        return False
    finally:
        if cursor:
            cursor.close()

def update_passwords(conn):
    """Update the passwords to plaintext values."""
    try:
        cursor = conn.cursor()

        # Update admin user password
        print("🔄 Aktualisiere Admin-Passwort...")
        cursor.execute("""
            UPDATE [dbo].[Benutzer]
            SET [password] = ?, [aktualisiertAm] = ?
            WHERE [email] = ?
        """, ('admin123', datetime.now(), 'admin@gfu-krankmeldung.de'))
        admin_count = cursor.rowcount

        # Update all other users' passwords
        print("🔄 Aktualisiere Benutzer-Passwörter...")
        cursor.execute("""
            UPDATE [dbo].[Benutzer]
            SET [password] = ?, [aktualisiertAm] = ?
            WHERE [email] != ?
        """, ('password123', datetime.now(), 'admin@gfu-krankmeldung.de'))
        user_count = cursor.rowcount

        conn.commit()
        print(f"✅ {admin_count} Admin-Passwort und {user_count} Benutzer-Passwörter aktualisiert")
        return True
    except Exception as e:
        print(f"❌ Fehler beim Aktualisieren der Passwörter: {str(e)}")
        conn.rollback()
        return False
    finally:
        if cursor:
            cursor.close()

def verify_updates(conn):
    """Verify that the updates were successful."""
    try:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT [id], [email], [password], [vorname], [nachname], [istAdmin]
            FROM [dbo].[Benutzer]
        """)

        print("\n📊 Überprüfung der Aktualisierungen:")
        print("-" * 80)
        print(f"{'E-Mail':<30} {'Passwort':<15} {'Name':<25} {'Admin'}")
        print("-" * 80)

        rows = cursor.fetchall()
        for row in rows:
            email = row.email if row.email else 'N/A'
            password = row.password if row.password else 'N/A'
            name = f"{row.vorname or ''} {row.nachname or ''}".strip() or 'N/A'
            admin = "Ja" if row.istAdmin else "Nein"

            print(f"{email:<30} {password:<15} {name:<25} {admin}")

        print("-" * 80)
        print(f"Insgesamt {len(rows)} Benutzer gefunden.")

    except Exception as e:
        print(f"❌ Fehler bei der Überprüfung: {str(e)}")
    finally:
        if cursor:
            cursor.close()

def main():
    """Main function to execute the script."""
    print("\n🔒 GFU Krankmeldung - Passwort-Fixer 🔒\n")

    # Connect to the database
    conn = connect_to_database()

    try:
        # Rename column if needed
        if not rename_column_if_needed(conn):
            return

        # Update passwords
        if not update_passwords(conn):
            return

        # Verify updates
        verify_updates(conn)

        print("\n✅ Passwörter wurden erfolgreich aktualisiert!")

    except Exception as e:
        print(f"\n❌ Ein unerwarteter Fehler ist aufgetreten: {str(e)}")
    finally:
        if conn:
            conn.close()
            print("\n🔌 Datenbankverbindung geschlossen")

if __name__ == "__main__":
    main()