#!/usr/bin/env python3
import os
import sys

def print_file_content(file_path, base_dir):
    """Gibt den Inhalt einer Datei aus mit Formatierung"""
    full_path = os.path.join(base_dir, file_path.lstrip('/'))

    print("\n" + "=" * 80)
    print(f"DATEI: {file_path}")
    print("=" * 80 + "\n")

    try:
        with open(full_path, 'r', encoding='utf-8') as file:
            content = file.read()
            print(content)
    except FileNotFoundError:
        print(f"FEHLER: Datei '{full_path}' wurde nicht gefunden.")
    except Exception as e:
        print(f"FEHLER beim Lesen der Datei: {str(e)}")

def main():
    # Basis-Verzeichnis des Projekts definieren
    # Standardmäßig aktuelles Verzeichnis, kann aber als Argument übergeben werden
    base_dir = sys.argv[1] if len(sys.argv) > 1 else os.getcwd()

    # Liste der zu druckenden Dateien
    files_to_print = [
        # Authentication core files
        "/app/login/page.tsx",
        "/components/login-form.tsx",
        "/lib/auth.ts",
        "/middleware.ts",

        # Next-Auth API routes
        "/app/api/auth/[...nextauth]/route.js",  # or route.ts

        # Database connection (already requested)
        "/lib/prisma.ts",

        # Environment configuration
        "/.env",  # to check auth secrets and database connection

        # Error logging (already requested)
        "/lib/logger.ts",

        # Types
        "/types/next-auth.d.ts"
    ]

    print(f"Ausgabe der Dashboard-Berichts-Dateien aus: {base_dir}\n")

    # Jeden Dateiinhalt ausgeben
    for file_path in files_to_print:
        print_file_content(file_path, base_dir)

if __name__ == "__main__":
    main()