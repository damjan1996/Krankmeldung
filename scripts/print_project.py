import os
import sys

def list_directory_contents(root_dir):
    # Pfade, die ignoriert werden sollen
    ignore_paths = [
        os.path.join(root_dir, '.idea'),
        os.path.join(root_dir, '.next'),
        os.path.join(root_dir, 'node_modules'),
    ]

    # Dateien, die ignoriert werden sollen
    ignore_files = [
        'package-lock.json'
    ]

    # Strings, die in Pfaden nicht vorkommen sollen
    ignore_strings = [
        '.git',
        '__pycache__',
        'External Libraries',
        'Scratches and Consoles'
    ]

    # Durch alle Verzeichnisse und Unterverzeichnisse gehen
    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Prüfen, ob der aktuelle Pfad ignoriert werden soll
        should_ignore = False
        for ignore_path in ignore_paths:
            if dirpath.startswith(ignore_path):
                should_ignore = True
                break

        for ignore_string in ignore_strings:
            if ignore_string in dirpath:
                should_ignore = True
                break

        if should_ignore:
            continue

        # Verzeichnispfad ausgeben
        print(f"\n{'='*80}\nDIRECTORY: {dirpath}\n{'='*80}")

        # Dateien in diesem Verzeichnis verarbeiten
        for filename in filenames:
            # Prüfen, ob die Datei ignoriert werden soll
            if filename in ignore_files:
                continue

            file_path = os.path.join(dirpath, filename)

            # Dateiinformationen ausgeben
            print(f"\n{'-'*40}\nFILE: {file_path}\n{'-'*40}")

            # Dateityp erkennen (binär oder text)
            try:
                # Versuchen, die Datei als Text zu öffnen
                with open(file_path, 'r', encoding='utf-8') as file:
                    content = file.read()
                    # Dateiinhalt ausgeben
                    print(content)
            except UnicodeDecodeError:
                print("[Binärdatei - Inhalt nicht angezeigt]")
            except Exception as e:
                print(f"[Fehler beim Lesen der Datei: {str(e)}]")

if __name__ == "__main__":
    root_directory = r"C:\Users\DamjanSavic\Documents\WebStorm\Krankmeldung"
    list_directory_contents(root_directory)