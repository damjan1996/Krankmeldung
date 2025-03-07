import os
import sys

def create_directory(dir_path):
    """Erstellt ein Verzeichnis, wenn es nicht existiert."""
    if not os.path.exists(dir_path):
        os.makedirs(dir_path)
        print(f"Verzeichnis erstellt: {dir_path}")
    else:
        print(f"Verzeichnis existiert bereits: {dir_path}")

def create_file(file_path):
    """Erstellt eine leere Datei, wenn sie nicht existiert."""
    if not os.path.exists(file_path):
        with open(file_path, 'w') as f:
            pass  # Erzeugt leere Datei
        print(f"Datei erstellt: {file_path}")
    else:
        print(f"Datei existiert bereits: {file_path}")

def main():
    # Stammverzeichnis definieren
    base_dir = r"C:\Users\DamjanSavic\Documents\WebStorm\Krankmeldung"

    # Projektstruktur als Liste von Pfaden
    directories = [
        "",  # Root-Verzeichnis
        "app",
        "app/(auth)",
        "app/(auth)/login",
        "app/(dashboard)",
        "app/(dashboard)/dashboard",
        "app/(dashboard)/krankmeldungen",
        "app/(dashboard)/krankmeldungen/[id]",
        "app/(dashboard)/krankmeldungen/[id]/bearbeiten",
        "app/(dashboard)/krankmeldungen/neu",
        "app/(dashboard)/mitarbeiter",
        "app/(dashboard)/mitarbeiter/[id]",
        "app/api",
        "app/api/auth",
        "app/api/auth/[...nextauth]",
        "app/api/krankmeldungen",
        "app/api/krankmeldungen/[id]",
        "app/api/mitarbeiter",
        "app/api/mitarbeiter/[id]",
        "components",
        "components/auth",
        "components/dashboard",
        "components/krankmeldungen",
        "components/mitarbeiter",
        "components/layout",
        "components/ui",
        "lib",
        "lib/api",
        "lib/hooks",
        "lib/validations",
        "prisma",
        "public",
        "public/images",
        "types"
    ]

    # Dateien als Liste von Pfaden (relativ zum Stammverzeichnis)
    files = [
        ".env",
        ".env.example",
        ".eslintrc.json",
        ".gitignore",
        "components.json",
        "next.config.js",
        "package.json",
        "postcss.config.js",
        "tailwind.config.js",
        "tsconfig.json",

        # App-Verzeichnis
        "app/favicon.ico",
        "app/globals.css",
        "app/layout.tsx",
        "app/loading.tsx",
        "app/error.tsx",
        "app/page.tsx",

        # Auth
        "app/(auth)/layout.tsx",
        "app/(auth)/login/page.tsx",

        # Dashboard
        "app/(dashboard)/layout.tsx",
        "app/(dashboard)/dashboard/page.tsx",
        "app/(dashboard)/krankmeldungen/page.tsx",
        "app/(dashboard)/krankmeldungen/[id]/page.tsx",
        "app/(dashboard)/krankmeldungen/[id]/bearbeiten/page.tsx",
        "app/(dashboard)/krankmeldungen/neu/page.tsx",
        "app/(dashboard)/mitarbeiter/page.tsx",
        "app/(dashboard)/mitarbeiter/[id]/page.tsx",

        # API-Routen
        "app/api/auth/[...nextauth]/route.ts",
        "app/api/krankmeldungen/route.ts",
        "app/api/krankmeldungen/[id]/route.ts",
        "app/api/mitarbeiter/route.ts",
        "app/api/mitarbeiter/[id]/route.ts",

        # Komponenten
        "components/auth/login-form.tsx",
        "components/auth/user-auth-form.tsx",

        "components/dashboard/aktive-krankmeldungen.tsx",
        "components/dashboard/krankmeldung-status-card.tsx",
        "components/dashboard/recent-activity.tsx",
        "components/dashboard/welcome-banner.tsx",

        "components/krankmeldungen/krankmeldung-form.tsx",
        "components/krankmeldungen/krankmeldung-card.tsx",
        "components/krankmeldungen/krankmeldungen-tabelle.tsx",

        "components/mitarbeiter/mitarbeiter-card.tsx",
        "components/mitarbeiter/mitarbeiter-tabelle.tsx",

        "components/layout/main-nav.tsx",
        "components/layout/sidebar-nav.tsx",
        "components/layout/site-footer.tsx",
        "components/layout/site-header.tsx",

        # UI-Komponenten (shadcn/ui)
        "components/ui/avatar.tsx",
        "components/ui/button.tsx",
        "components/ui/calendar.tsx",
        "components/ui/card.tsx",
        "components/ui/checkbox.tsx",
        "components/ui/dropdown-menu.tsx",
        "components/ui/form.tsx",
        "components/ui/input.tsx",
        "components/ui/label.tsx",
        "components/ui/select.tsx",
        "components/ui/separator.tsx",
        "components/ui/sheet.tsx",
        "components/ui/table.tsx",
        "components/ui/tabs.tsx",
        "components/ui/textarea.tsx",
        "components/ui/toast.tsx",
        "components/ui/toaster.tsx",

        # Lib
        "lib/prisma.ts",
        "lib/utils.ts",
        "lib/auth.ts",

        "lib/api/krankmeldungen.ts",
        "lib/api/mitarbeiter.ts",

        "lib/hooks/use-krankmeldung.ts",
        "lib/hooks/use-mitarbeiter.ts",
        "lib/hooks/use-toast.ts",

        "lib/validations/krankmeldung.ts",
        "lib/validations/mitarbeiter.ts",

        # Prisma
        "prisma/schema.prisma",
        "prisma/seed.ts",

        # Public
        "public/images/logo.svg",
        "public/favicon.ico",

        # Types
        "types/index.d.ts",
        "types/krankmeldung.d.ts",
        "types/mitarbeiter.d.ts",
        "types/next-auth.d.ts",
    ]

    print(f"Erstelle Projektstruktur in {base_dir}")

    # Verzeichnisse erstellen
    for directory in directories:
        full_path = os.path.join(base_dir, directory)
        create_directory(full_path)

    # Dateien erstellen
    for file in files:
        full_path = os.path.join(base_dir, file)
        # Stelle sicher, dass das übergeordnete Verzeichnis existiert
        parent_dir = os.path.dirname(full_path)
        if not os.path.exists(parent_dir):
            os.makedirs(parent_dir)
        create_file(full_path)

    print("\nProjektstruktur wurde erfolgreich erstellt!")
    print(f"Insgesamt wurden {len(directories)} Verzeichnisse und {len(files)} Dateien erstellt.")

if __name__ == "__main__":
    main()