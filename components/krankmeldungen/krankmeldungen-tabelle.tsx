"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    FileEdit,
    MoreHorizontal,
    Search,
    SlidersHorizontal,
    FileCheck,
    FileX2,
    Loader2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useToast } from "@/lib/hooks/use-toast";

/**
 * Interface für die Daten in der Krankmeldungstabelle
 */
interface KrankmeldungenTabelleDaten {
    id: string;
    mitarbeiter: string;
    personalnummer: string;
    startdatum: string;
    enddatum: string;
    dauer?: number;
    status: "aktiv" | "abgeschlossen" | "storniert";
    erstelltVon?: string;
    erstelltAm?: string;
}

/**
 * Props für die KrankmeldungenTabelle-Komponente
 */
interface KrankmeldungenTabelleProps {
    data: KrankmeldungenTabelleDaten[];
    isLoading?: boolean;
    showActions?: boolean;
    showPagination?: boolean;
    defaultPageSize?: number;
    className?: string;
    onStatusChange?: (id: string, newStatus: string) => Promise<void>;
}

// Komponente für Tabellen-Skelett
const TableSkeleton = ({ rowCount = 5 }: { rowCount?: number }) => (
    <>
        <TableHeader>
            <TableRow>
                {Array.from({ length: 8 }).map((_, index) => (
                    <TableHead key={`header-${index}`}>
                        <Skeleton className="h-6 w-full" />
                    </TableHead>
                ))}
            </TableRow>
        </TableHeader>
        <TableBody>
            {Array.from({ length: rowCount }).map((_, rowIndex) => (
                <TableRow key={`row-${rowIndex}`}>
                    {Array.from({ length: 8 }).map((_, cellIndex) => (
                        <TableCell key={`cell-${rowIndex}-${cellIndex}`}>
                            <Skeleton className="h-10 w-full" />
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </TableBody>
    </>
);

/**
 * Tabellen-Komponente zur Anzeige von Krankmeldungen
 */
export function KrankmeldungenTabelle({
                                          data: initialData,
                                          isLoading = false,
                                          showActions = true,
                                          showPagination = true,
                                          defaultPageSize = 10,
                                          className,
                                          onStatusChange,
                                      }: KrankmeldungenTabelleProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [data, setData] = useState<KrankmeldungenTabelleDaten[]>(initialData);

    // Table States
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});

    // Aktualisieren der lokalen Daten, wenn die Props-Daten sich ändern
    useEffect(() => {
        setData(initialData);
    }, [initialData]);

    // Funktion zum Formatieren von Datum für API-Anfragen
    const formatDate = useCallback((date: string | Date) => {
        if (!date) return null;
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }, []);

    /**
     * Standard-Implementierung für Statusänderungen
     */
    const defaultHandleStatusChange = async (id: string, newStatus: string) => {
        setIsUpdating(id);
        try {
            // Optimistische UI-Aktualisierung - Status lokal ändern
            setData(prevData =>
                prevData.map(item =>
                    item.id === id ? { ...item, status: newStatus as "aktiv" | "abgeschlossen" | "storniert" } : item
                )
            );

            // Zuerst die aktuelle Krankmeldung abrufen
            const getResponse = await fetch(`/api/krankmeldungen/${id}`);

            if (!getResponse.ok) {
                // Lokales Update rückgängig machen
                setData(initialData);
                toast({
                    title: "Fehler",
                    description: "Krankmeldung konnte nicht geladen werden",
                    variant: "destructive",
                });
                return;
            }

            const currentData = await getResponse.json();

            // Daten für die API vorbereiten - mit korrektem Datumsformat
            const updateData = {
                mitarbeiterId: currentData.mitarbeiterId,
                startdatum: formatDate(currentData.startdatum),
                enddatum: formatDate(currentData.enddatum),
                arztbesuchDatum: currentData.arztbesuchDatum ? formatDate(currentData.arztbesuchDatum) : null,
                notizen: currentData.notizen,
                status: newStatus
            };

            // Jetzt den Status aktualisieren mit allen anderen benötigten Feldern
            const updateResponse = await fetch(`/api/krankmeldungen/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updateData),
            });

            if (!updateResponse.ok) {
                // Lokales Update rückgängig machen
                setData(initialData);
                const errorData = await updateResponse.json().catch(() => null);
                console.error("Fehler beim Statusupdate:", errorData);
                toast({
                    title: "Statusänderung fehlgeschlagen",
                    description: errorData?.error || "Fehler beim Aktualisieren des Status",
                    variant: "destructive",
                });
                return;
            }

            toast({
                title: "Status aktualisiert",
                description: `Krankmeldung wurde als "${newStatus}" markiert`,
                variant: "default",
            });

            // Vollständigen Page-Refresh durchführen, um alle Daten korrekt zu aktualisieren
            // Verwende einen Timeout, damit der Toast noch angezeigt werden kann
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error) {
            // Lokales Update rückgängig machen
            setData(initialData);
            console.error("Fehler bei Statusänderung:", error);
            toast({
                title: "Fehler",
                description: "Es ist ein unerwarteter Fehler aufgetreten",
                variant: "destructive",
            });
        } finally {
            setIsUpdating(null);
        }
    };

    // Die zu verwendende Statusänderungsfunktion (entweder die übergebene oder die Standard-Implementierung)
    const handleStatusChange = onStatusChange || defaultHandleStatusChange;

    // Tabellenspalten definieren
    const getColumns = useCallback((): ColumnDef<KrankmeldungenTabelleDaten>[] => [
        // Mitarbeiter
        {
            accessorKey: "mitarbeiter",
            header: "Mitarbeiter",
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <Link
                        href={`/krankmeldungen/${row.original.id}`}
                        className="font-medium hover:underline whitespace-nowrap"
                    >
                        {row.getValue("mitarbeiter")}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                        {row.original.personalnummer}
                    </span>
                </div>
            ),
        },

        // Zeitraum
        {
            accessorKey: "startdatum",
            header: "Von",
            cell: ({ row }) => <div className="whitespace-nowrap">{row.getValue("startdatum")}</div>,
        },

        {
            accessorKey: "enddatum",
            header: "Bis",
            cell: ({ row }) => <div className="whitespace-nowrap">{row.getValue("enddatum")}</div>,
        },

        // Dauer
        {
            accessorKey: "dauer",
            header: "Dauer",
            cell: ({ row }) => {
                const dauer = row.original.dauer || 0;
                return (
                    <div className="text-center">
                        {dauer} {dauer === 1 ? "Tag" : "Tage"}
                    </div>
                );
            },
        },

        // Status
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("status") as string;
                let variant: "default" | "outline" | "secondary" | "destructive";

                switch (status) {
                    case "aktiv":
                        variant = "default";
                        break;
                    case "abgeschlossen":
                        variant = "secondary";
                        break;
                    case "storniert":
                        variant = "destructive";
                        break;
                    default:
                        variant = "outline";
                }

                return (
                    <Badge variant={variant} className="whitespace-nowrap">
                        {status}
                    </Badge>
                );
            },
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id));
            },
        },

        // Erstellt von (ggf. optional)
        {
            accessorKey: "erstelltVon",
            header: "Erstellt von",
            cell: ({ row }) => row.getValue("erstelltVon") || "-",
        },

        // Erstellt am (ggf. optional)
        {
            accessorKey: "erstelltAm",
            header: "Erstellt am",
            cell: ({ row }) => <div className="whitespace-nowrap">{row.getValue("erstelltAm") || "-"}</div>,
        },

        // Aktionen
        {
            id: "actions",
            cell: ({ row }) => {
                const krankmeldung = row.original;
                const isCurrentlyUpdating = isUpdating === krankmeldung.id;

                return (
                    <div className="flex justify-end">
                        {showActions ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0" disabled={isCurrentlyUpdating}>
                                        {isCurrentlyUpdating ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <MoreHorizontal className="h-4 w-4" />
                                        )}
                                        <span className="sr-only">Menü öffnen</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
                                    <DropdownMenuItem asChild>
                                        <Link href={`/krankmeldungen/${krankmeldung.id}`}>
                                            <ExternalLink className="mr-2 h-4 w-4" />
                                            Details
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href={`/krankmeldungen/${krankmeldung.id}/bearbeiten`}>
                                            <FileEdit className="mr-2 h-4 w-4" />
                                            Bearbeiten
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {krankmeldung.status === "aktiv" && (
                                        <DropdownMenuItem
                                            disabled={isCurrentlyUpdating}
                                            onSelect={(e) => {
                                                e.preventDefault();
                                                handleStatusChange(krankmeldung.id, "abgeschlossen");
                                            }}
                                        >
                                            <FileCheck className="mr-2 h-4 w-4" />
                                            Als abgeschlossen markieren
                                        </DropdownMenuItem>
                                    )}
                                    {krankmeldung.status !== "storniert" && (
                                        <DropdownMenuItem
                                            disabled={isCurrentlyUpdating}
                                            onSelect={(e) => {
                                                e.preventDefault();
                                                handleStatusChange(krankmeldung.id, "storniert");
                                            }}
                                            className="text-destructive"
                                        >
                                            <FileX2 className="mr-2 h-4 w-4" />
                                            Stornieren
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                asChild
                            >
                                <Link href={`/krankmeldungen/${krankmeldung.id}`}>
                                    <span className="sr-only">Details anzeigen</span>
                                    <ExternalLink className="h-4 w-4" />
                                </Link>
                            </Button>
                        )}
                    </div>
                );
            },
        },
    ], [isUpdating, handleStatusChange, formatDate]);

    /**
     * Tabelleninstanz erstellen
     */
    const table = useReactTable({
        data,
        columns: getColumns(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
        initialState: {
            pagination: {
                pageSize: defaultPageSize,
            },
        },
    });

    // Loading state
    if (isLoading) {
        return (
            <div className={cn("space-y-4", className)}>
                <div className="flex flex-col sm:flex-row gap-3 justify-between">
                    <Skeleton className="h-10 w-[250px]" />
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-24" />
                        <Skeleton className="h-10 w-24" />
                    </div>
                </div>
                <div className="rounded-md border">
                    <Table>
                        <TableSkeleton rowCount={5} />
                    </Table>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("space-y-4", className)}>
            {/* Filter-Bereich */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
                {/* Suchfeld */}
                <div className="relative max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Nach Mitarbeiter filtern..."
                        value={(table.getColumn("mitarbeiter")?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn("mitarbeiter")?.setFilterValue(event.target.value)
                        }
                        className="pl-8"
                    />
                </div>

                {/* Spalten-Visibility-Menü */}
                <div className="flex flex-wrap items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="ml-auto h-8 gap-1">
                                <SlidersHorizontal className="h-3.5 w-3.5" />
                                <span>Spalten</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Angezeigte Spalten</DropdownMenuLabel>
                            {table
                                .getAllColumns()
                                .filter(
                                    (column) => column.getCanHide()
                                )
                                .map((column) => {
                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) =>
                                                column.toggleVisibility(value)
                                            }
                                        >
                                            {column.id === "erstelltVon" ? "Erstellt von" :
                                                column.id === "erstelltAm" ? "Erstellt am" :
                                                    column.id === "dauer" ? "Dauer" :
                                                        column.id}
                                        </DropdownMenuCheckboxItem>
                                    );
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Tabelle */}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={table.getAllColumns().length}
                                    className="h-24 text-center"
                                >
                                    Keine Krankmeldungen gefunden.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Paginierung */}
            {showPagination && (
                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Zeige {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} bis{" "}
                        {Math.min(
                            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
                            table.getFilteredRowModel().rows.length
                        )}{" "}
                        von {table.getFilteredRowModel().rows.length} Einträgen
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="h-8 gap-1"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            <span>Zurück</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="h-8 gap-1"
                        >
                            <span>Weiter</span>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}