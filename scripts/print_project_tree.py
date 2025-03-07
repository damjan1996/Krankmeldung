import os
import json
from pathlib import Path

def scan_directory(root_dir, ignore_list=None):
    """
    Scannt rekursiv ein Verzeichnis und gibt die Struktur zurück.

    Args:
        root_dir (str): Das zu scannende Wurzelverzeichnis
        ignore_list (list): Liste der zu ignorierenden Verzeichnisse und Dateien

    Returns:
        dict: Die Verzeichnisstruktur
    """
    if ignore_list is None:
        ignore_list = []

    # Normalisiere den Pfad
    root_dir = os.path.normpath(root_dir)
    result = {
        "path": root_dir,
        "type": "directory",
        "name": os.path.basename(root_dir) or root_dir,
        "children": []
    }

    try:
        # Scanne Verzeichnisinhalt
        for item in os.listdir(root_dir):
            item_path = os.path.join(root_dir, item)

            # Prüfe, ob das Element ignoriert werden soll
            should_ignore = False
            for ignore_pattern in ignore_list:
                if ignore_pattern in item_path:
                    should_ignore = True
                    break

            if should_ignore:
                continue

            # Verzeichnis
            if os.path.isdir(item_path):
                child = scan_directory(item_path, ignore_list)
                result["children"].append(child)

            # Datei
            elif os.path.isfile(item_path):
                # Füge Datei ohne Inhalt hinzu
                result["children"].append({
                    "path": item_path,
                    "type": "file",
                    "name": item,
                    "extension": os.path.splitext(item)[1]
                })
    except Exception as e:
        result["error"] = str(e)

    return result

def print_structure_to_console(structure):
    """
    Gibt die Verzeichnisstruktur direkt in der Konsole aus

    Args:
        structure (dict): Die Verzeichnisstruktur
    """
    def _print_structure(item, level=0):
        indent = "  " * level

        # Verzeichnis ausgeben
        if item["type"] == "directory":
            print(f"{indent}📁 {item['name']}")
            for child in item["children"]:
                _print_structure(child, level + 1)

        # Datei ausgeben
        else:
            print(f"{indent}📄 {item['name']}")

    print(f"\nPROJEKTSTRUKTUR: {structure['name']}\n")
    _print_structure(structure)

def main():
    # Konfiguration
    root_directory = r"C:\Users\DamjanSavic\Documents\WebStorm\Krankmeldung"
    ignore_list = [
        ".idea",
        ".next",
        "__pycache__",
        "node_modules",
        "package-lock.json",
        "External Libraries",
        "Scratches and Consoles",
        ".git"
    ]

    # Scannen und Ausgabe erstellen
    print(f"Scanne Verzeichnis: {root_directory}")
    structure = scan_directory(root_directory, ignore_list)

    # Ausgabe in der Konsole
    print_structure_to_console(structure)

    # Statistiken
    file_count = 0
    dir_count = 0

    def count_items(item):
        nonlocal file_count, dir_count
        if item["type"] == "directory":
            dir_count += 1
            for child in item["children"]:
                count_items(child)
        else:
            file_count += 1

    count_items(structure)
    print(f"\nZUSAMMENFASSUNG:")
    print(f"Verzeichnisse: {dir_count}")
    print(f"Dateien: {file_count}")

if __name__ == "__main__":
    main()