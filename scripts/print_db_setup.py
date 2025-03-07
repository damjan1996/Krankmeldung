import pyodbc
import textwrap
import os

# Konfiguration der Datenbankverbindung
server_ip = '116.202.224.248'
username = 'sa'
password = 'YJ5C19QZ7ZUW!'
database_name = 'GFUKrankmeldung'

def connect_to_database():
    try:
        conn_str = f"DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server_ip};DATABASE={database_name};UID={username};PWD={password};TrustServerCertificate=yes;Connection Timeout=30"
        conn = pyodbc.connect(conn_str)
        print(f"Verbindung zur Datenbank {database_name} hergestellt.")
        return conn
    except Exception as e:
        print(f"Fehler bei der Verbindung zur Datenbank: {e}")
        return None

def get_tables(cursor):
    """Gibt alle Tabellen in der Datenbank zurück"""
    query = """
    SELECT 
        t.name AS TableName,
        SCHEMA_NAME(t.schema_id) AS SchemaName
    FROM 
        sys.tables t
    ORDER BY 
        SchemaName, TableName
    """
    cursor.execute(query)
    return cursor.fetchall()

def get_columns(cursor, table_name, schema_name):
    """Gibt alle Spalten einer Tabelle zurück"""
    query = """
    SELECT 
        c.name AS ColumnName,
        t.name AS DataType,
        c.max_length,
        c.precision,
        c.scale,
        c.is_nullable,
        c.is_identity,
        CASE 
            WHEN pk.column_id IS NOT NULL THEN 1
            ELSE 0
        END AS IsPrimaryKey,
        CASE 
            WHEN fk.parent_column_id IS NOT NULL THEN 1
            ELSE 0
        END AS IsForeignKey,
        OBJECT_NAME(fk.referenced_object_id) AS ReferencedTable,
        COL_NAME(fk.referenced_object_id, fk.referenced_column_id) AS ReferencedColumn,
        dc.definition AS DefaultValue
    FROM 
        sys.columns c
    INNER JOIN 
        sys.types t ON c.user_type_id = t.user_type_id
    INNER JOIN 
        sys.tables tbl ON c.object_id = tbl.object_id
    LEFT JOIN 
        sys.indexes i ON tbl.object_id = i.object_id AND i.is_primary_key = 1
    LEFT JOIN 
        sys.index_columns pk ON i.object_id = pk.object_id AND i.index_id = pk.index_id AND c.column_id = pk.column_id
    LEFT JOIN 
        sys.foreign_key_columns fk ON tbl.object_id = fk.parent_object_id AND c.column_id = fk.parent_column_id
    LEFT JOIN 
        sys.default_constraints dc ON c.default_object_id = dc.object_id
    WHERE 
        tbl.name = ? AND SCHEMA_NAME(tbl.schema_id) = ?
    ORDER BY 
        c.column_id
    """
    cursor.execute(query, (table_name, schema_name))
    return cursor.fetchall()

def get_foreign_keys(cursor, table_name, schema_name):
    """Gibt alle Fremdschlüssel einer Tabelle zurück"""
    query = """
    SELECT 
        fk.name AS FK_Name,
        OBJECT_NAME(fk.parent_object_id) AS ParentTable,
        COL_NAME(fkc.parent_object_id, fkc.parent_column_id) AS ParentColumn,
        OBJECT_NAME(fk.referenced_object_id) AS ReferencedTable,
        COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) AS ReferencedColumn,
        fk.delete_referential_action_desc AS OnDelete,
        fk.update_referential_action_desc AS OnUpdate
    FROM 
        sys.foreign_keys fk
    INNER JOIN 
        sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
    INNER JOIN 
        sys.tables t ON fk.parent_object_id = t.object_id
    WHERE 
        t.name = ? AND SCHEMA_NAME(t.schema_id) = ?
    ORDER BY 
        FK_Name
    """
    cursor.execute(query, (table_name, schema_name))
    return cursor.fetchall()

def get_indexes(cursor, table_name, schema_name):
    """Gibt alle Indizes einer Tabelle zurück"""
    query = """
    SELECT 
        i.name AS IndexName,
        i.type_desc AS IndexType,
        i.is_unique AS IsUnique,
        i.is_primary_key AS IsPrimaryKey,
        STRING_AGG(c.name, ', ') WITHIN GROUP (ORDER BY ic.key_ordinal) AS Columns
    FROM 
        sys.indexes i
    INNER JOIN 
        sys.tables t ON i.object_id = t.object_id
    INNER JOIN 
        sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
    INNER JOIN 
        sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
    WHERE 
        t.name = ? AND SCHEMA_NAME(t.schema_id) = ? AND i.name IS NOT NULL
    GROUP BY 
        i.name, i.type_desc, i.is_unique, i.is_primary_key
    ORDER BY 
        i.is_primary_key DESC, IndexName
    """
    cursor.execute(query, (table_name, schema_name))
    return cursor.fetchall()

def get_row_count(cursor, table_name, schema_name):
    """Gibt die Anzahl der Zeilen in einer Tabelle zurück"""
    query = f"SELECT COUNT(*) FROM [{schema_name}].[{table_name}]"
    cursor.execute(query)
    return cursor.fetchone()[0]

def generate_create_table_script(cursor, table_name, schema_name):
    """Generiert ein CREATE TABLE Script für eine Tabelle"""
    query = f"""
    SELECT OBJECT_DEFINITION(OBJECT_ID('[{schema_name}].[{table_name}]'))
    """
    cursor.execute(query)
    result = cursor.fetchone()
    if result and result[0]:
        return result[0]
    return "-- CREATE TABLE Skript nicht verfügbar"

def print_database_structure():
    """Gibt die gesamte Datenbankstruktur aus"""
    conn = connect_to_database()
    if not conn:
        print("Konnte keine Verbindung zur Datenbank herstellen.")
        return

    cursor = conn.cursor()

    # Ausgabedatei erstellen
    output_file = "../Datenbankstruktur.txt"
    with open(output_file, "w", encoding="utf-8") as f:
        # Datenbankübersicht
        f.write("=" * 80 + "\n")
        f.write(f"DATENBANKSTRUKTUR: {database_name}\n")
        f.write("=" * 80 + "\n\n")

        # Datenbank-Version
        cursor.execute("SELECT @@VERSION")
        version = cursor.fetchone()[0]
        f.write(f"SQL Server Version:\n{version}\n\n")

        # Tabellen auflisten
        tables = get_tables(cursor)
        f.write(f"TABELLEN-ÜBERSICHT:\n")
        f.write("-" * 80 + "\n")
        for i, (table_name, schema_name) in enumerate(tables, 1):
            row_count = get_row_count(cursor, table_name, schema_name)
            f.write(f"{i}. [{schema_name}].[{table_name}] - {row_count} Zeilen\n")
        f.write("\n")

        # Detaillierte Tabellenstruktur
        f.write("DETAILLIERTE TABELLENSTRUKTUR:\n")
        f.write("=" * 80 + "\n\n")

        for table_name, schema_name in tables:
            f.write(f"TABELLE: [{schema_name}].[{table_name}]\n")
            f.write("-" * 80 + "\n")

            # Spalten
            columns = get_columns(cursor, table_name, schema_name)
            f.write("Spalten:\n")
            for col in columns:
                col_name = col.ColumnName
                data_type = col.DataType

                # Bestimme die Länge/Präzision/Skala basierend auf dem Datentyp
                type_details = ""
                if data_type in ("varchar", "nvarchar", "char", "nchar"):
                    if col.max_length == -1:
                        type_details = "(MAX)"
                    else:
                        # Für nvarchar ist die Länge doppelt gespeichert
                        length = col.max_length
                        if data_type.startswith("n"):
                            length = length // 2
                        type_details = f"({length})"
                elif data_type in ("decimal", "numeric"):
                    type_details = f"({col.precision}, {col.scale})"

                nullable = "NULL" if col.is_nullable else "NOT NULL"
                pk = "PRIMARY KEY" if col.IsPrimaryKey else ""
                fk = ""
                if col.IsForeignKey and col.ReferencedTable:
                    fk = f"FOREIGN KEY REFERENCES [{col.ReferencedTable}]([{col.ReferencedColumn}])"

                default = ""
                if col.DefaultValue:
                    default = f"DEFAULT {col.DefaultValue}"

                identity = "IDENTITY" if col.is_identity else ""

                f.write(f"  {col_name} {data_type}{type_details} {nullable} {pk} {identity} {default} {fk}\n".replace("  ", " ").strip())

            f.write("\n")

            # Fremdschlüssel
            foreign_keys = get_foreign_keys(cursor, table_name, schema_name)
            if foreign_keys:
                f.write("Fremdschlüssel:\n")
                for fk in foreign_keys:
                    f.write(f"  {fk.FK_Name}: [{fk.ParentTable}].[{fk.ParentColumn}] -> [{fk.ReferencedTable}].[{fk.ReferencedColumn}]\n")
                    f.write(f"    ON DELETE {fk.OnDelete}, ON UPDATE {fk.OnUpdate}\n")
                f.write("\n")

            # Indizes
            indexes = get_indexes(cursor, table_name, schema_name)
            if indexes:
                f.write("Indizes:\n")
                for idx in indexes:
                    unique = "UNIQUE " if idx.IsUnique else ""
                    pk = "PRIMARY KEY " if idx.IsPrimaryKey else ""
                    f.write(f"  {idx.IndexName}: {unique}{pk}{idx.IndexType} ({idx.Columns})\n")
                f.write("\n")

            # CREATE TABLE Script
            f.write("CREATE TABLE Script:\n")
            create_script = generate_create_table_script(cursor, table_name, schema_name)
            f.write(textwrap.indent(create_script, "  "))
            f.write("\n\n")

            # Beispieldaten
            row_count = get_row_count(cursor, table_name, schema_name)
            if row_count > 0:
                max_rows = min(5, row_count)  # Zeige höchstens 5 Zeilen
                f.write(f"Beispieldaten ({max_rows} von {row_count} Zeilen):\n")

                query = f"SELECT TOP {max_rows} * FROM [{schema_name}].[{table_name}]"
                cursor.execute(query)

                # Spaltennamen ausgeben
                columns = [column[0] for column in cursor.description]
                header = " | ".join(columns)
                f.write(f"  {header}\n")
                f.write(f"  {'-' * len(header)}\n")

                # Daten ausgeben
                for row in cursor.fetchall():
                    row_values = []
                    for value in row:
                        if value is None:
                            row_values.append("NULL")
                        elif isinstance(value, (bytes, bytearray)):
                            row_values.append("<binary>")
                        else:
                            # Wert auf maximal 50 Zeichen begrenzen
                            str_value = str(value)
                            if len(str_value) > 50:
                                str_value = str_value[:47] + "..."
                            row_values.append(str_value)

                    row_str = " | ".join(row_values)
                    f.write(f"  {row_str}\n")

                f.write("\n")

            f.write("=" * 80 + "\n\n")

    cursor.close()
    conn.close()

    print(f"Datenbankstruktur wurde in die Datei '{output_file}' exportiert.")
    return output_file

if __name__ == "__main__":
    output_file = print_database_structure()

    # Ggf. die Ausgabedatei öffnen
    try:
        if os.name == 'nt':  # Windows
            os.system(f'start {output_file}')
        elif os.name == 'posix':  # macOS oder Linux
            if os.system('which xdg-open > /dev/null') == 0:  # Linux
                os.system(f'xdg-open {output_file}')
            else:  # macOS
                os.system(f'open {output_file}')
    except:
        print(f"Die Ausgabedatei konnte nicht automatisch geöffnet werden.")
        print(f"Sie finden die Datei unter: {os.path.abspath(output_file)}")

    input("Drücken Sie Enter, um das Programm zu beenden...")