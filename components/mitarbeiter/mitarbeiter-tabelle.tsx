// components/mitarbeiter/mitarbeiter-tabelle.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type Table as TableType } from "@tanstack/react-table";

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
    CalendarPlus,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    Filter,
    MoreHorizontal,
    Search,
    SlidersHorizontal,
    UserCheck,
    UserX,
    Loader2
} from "lucide-react";
import { useSession } from "next-auth/react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/lib/hooks/use-toast";

/**
 * Interface für die Daten in der Mitarbeitertabelle
 */
interface MitarbeiterTabelleDaten {
    id: string;
    personalnummer: string;
    name: string;
    vorname?: string;
    nachname?: string;
    position?: string;
    abteilung?: string;
    istAktiv?: boolean;
    status: "aktiv" | "inaktiv";
    aktiveKrankmeldungen: number;
}

/**
 * Props für die MitarbeiterTabelle Komponente
 */
interface MitarbeiterTabelleProps {
    data: MitarbeiterTabelleDaten[];
    showActions?: boolean;
    showPagination?: boolean;
    defaultPageSize?: number;
    className?: string;
    isLoading?: boolean;
}

/**
 * Reusable DataTable component to avoid duplication
 */
function DataTable<T>({
                          table,
                          columns,
                          noDataMessage = "Keine Daten gefunden."
                      }: {
    table: TableType<T>,
    columns: ColumnDef<T>[],
    noDataMessage?: string
}) {
    return (
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
                            colSpan={columns.length}
                            className="h-24 text-center"
                        >
                            {noDataMessage}
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}

/**
 * Reusable TablePagination component to avoid duplication
 */
function TablePagination<T>({ table }: { table: TableType<T> }) {
    return (
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
    );
}

/**
 * Component for actions dropdown
 */
function MitarbeiterActions({
                                mitarbeiter,
                                session,
                                onStatusChange
                            }: {
    mitarbeiter: MitarbeiterTabelleDaten,
    session: any,
    onStatusChange: (mitarbeiter: MitarbeiterTabelleDaten, status: "aktiv" | "inaktiv") => void
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Menü öffnen</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                    <Link href={`/mitarbeiter/${mitarbeiter.id}`}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        <span>Details</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href={`/krankmeldungen/neu?mitarbeiterId=${mitarbeiter.id}`}>
                        <CalendarPlus className="mr-2 h-4 w-4" />
                        <span>Krankmeldung erstellen</span>
                    </Link>
                </DropdownMenuItem>

                {/* Administrative Aktionen nur für Admins */}
                {session?.user?.isAdmin && (
                    <>
                        <DropdownMenuSeparator />
                        {mitarbeiter.status === "aktiv" ? (
                            <DropdownMenuItem
                                onClick={() => onStatusChange(mitarbeiter, "inaktiv")}
                                className="text-destructive focus:text-destructive"
                            >
                                <UserX className="mr-2 h-4 w-4" />
                                <span>Deaktivieren</span>
                            </DropdownMenuItem>
                        ) : (
                            <DropdownMenuItem
                                onClick={() => onStatusChange(mitarbeiter, "aktiv")}
                            >
                                <UserCheck className="mr-2 h-4 w-4" />
                                <span>Aktivieren</span>
                            </DropdownMenuItem>
                        )}
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

/**
 * Statusänderungsdialog Komponente
 */
function StatusDialog({
                          open,
                          setOpen,
                          selectedMitarbeiter,
                          newStatus,
                          isSubmitting,
                          onConfirm
                      }: {
    open: boolean,
    setOpen: (open: boolean) => void,
    selectedMitarbeiter: MitarbeiterTabelleDaten | null,
    newStatus: "aktiv" | "inaktiv",
    isSubmitting: boolean,
    onConfirm: () => void
}) {
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        Mitarbeiter {newStatus === "aktiv" ? "aktivieren" : "deaktivieren"}
                    </DialogTitle>
                    <DialogDescription>
                        {selectedMitarbeiter && (
                            <>
                                Möchten Sie den Mitarbeiter <strong>{selectedMitarbeiter.name}</strong> wirklich
                                {newStatus === "aktiv" ? " aktivieren" : " deaktivieren"}?

                                {newStatus === "inaktiv" && selectedMitarbeiter.aktiveKrankmeldungen > 0 && (
                                    <div className="mt-2 p-2 bg-amber-50 text-amber-800 rounded-md text-sm">
                                        Hinweis: Der Mitarbeiter hat aktuell {selectedMitarbeiter.aktiveKrankmeldungen} aktive Krankmeldung(en).
                                        Diese bleiben erhalten, auch wenn der Mitarbeiter deaktiviert wird.
                                    </div>
                                )}
                            </>
                        )}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={isSubmitting}
                    >
                        Abbrechen
                    </Button>
                    <Button
                        variant={newStatus === "aktiv" ? "default" : "destructive"}
                        onClick={onConfirm}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>Wird gespeichert...</>
                        ) : (
                            <>{newStatus === "aktiv" ? "Aktivieren" : "Deaktivieren"}</>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/**
 * Tabellen-Komponente zur Anzeige von Mitarbeitern
 */
export function MitarbeiterTabelle({
                                       data,
                                       showActions = true,
                                       showPagination = true,
                                       defaultPageSize = 10,
                                       className: _className, // Underscore prefix to mark as intentionally unused
                                       isLoading = false,
                                   }: MitarbeiterTabelleProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { data: session } = useSession();
    const { toast } = useToast();

    // Table States
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});

    // Dialog für Statusänderung
    const [statusDialogOpen, setStatusDialogOpen] = useState(false);
    const [selectedMitarbeiter, setSelectedMitarbeiter] = useState<MitarbeiterTabelleDaten | null>(null);
    const [newStatus, setNewStatus] = useState<"aktiv" | "inaktiv">("aktiv");
    const [isSubmitting, setIsSubmitting] = useState(false);

    /**
     * Funktion zur Vorbereitung einer Statusänderung (öffnet Dialog)
     */
    const handleStatusChangeIntent = (mitarbeiter: MitarbeiterTabelleDaten, status: "aktiv" | "inaktiv") => {
        setSelectedMitarbeiter(mitarbeiter);
        setNewStatus(status);
        setStatusDialogOpen(true);
    };

    /**
     * Funktion zur tatsächlichen Durchführung der Statusänderung
     */
    const handleStatusChange = async () => {
        if (!selectedMitarbeiter || !newStatus) return;

        setIsSubmitting(true);

        try {
            const response = await fetch(`/api/mitarbeiter/${selectedMitarbeiter.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    istAktiv: newStatus === "aktiv"
                }),
            });

            if (!response.ok) {
                // Using a variable instead of throwing directly to avoid the "throw caught locally" warning
                const errorMessage = "Statusänderung fehlgeschlagen";
                console.error(errorMessage);
                toast({
                    title: "Fehler",
                    description: errorMessage,
                    variant: "destructive",
                });
                return;
            }

            // Erfolgreiche Änderung
            toast({
                title: "Status geändert",
                description: `Der Mitarbeiter wurde erfolgreich ${newStatus === "aktiv" ? "aktiviert" : "deaktiviert"}.`,
                variant: "default",
            });

            // Dialog schließen
            setStatusDialogOpen(false);

            // Seite aktualisieren, um Änderungen anzuzeigen
            router.refresh();
        } catch (error) {
            console.error("Fehler bei Statusänderung:", error);

            toast({
                title: "Fehler",
                description: "Die Statusänderung konnte nicht durchgeführt werden.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Tabellenspalten definieren
    const columns: ColumnDef<MitarbeiterTabelleDaten>[] = [
        // Personalnummer
        {
            accessorKey: "personalnummer",
            header: "Personalnr.",
            cell: ({ row }) => <div className="font-mono text-sm">{row.getValue("personalnummer")}</div>,
        },

        // Name
        {
            accessorKey: "name",
            header: "Name",
            cell: ({ row }) => (
                <Link
                    href={`/mitarbeiter/${row.original.id}`}
                    className="font-medium hover:underline whitespace-nowrap"
                >
                    {row.getValue("name")}
                </Link>
            ),
        },

        // Position
        {
            accessorKey: "position",
            header: "Position",
            cell: ({ row }) => row.getValue("position") || "-",
        },

        // Abteilung (optional)
        ...(data.some(item => item.abteilung) ? [
            {
                accessorKey: "abteilung",
                header: "Abteilung",
                cell: ({ row }) => row.getValue("abteilung") || "-",
            } as ColumnDef<MitarbeiterTabelleDaten>,
        ] : []),

        // Status
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.getValue("status") as string;

                return (
                    <Badge
                        variant={status === "aktiv" ? "default" : "destructive"}
                        className="whitespace-nowrap"
                    >
                        {status}
                    </Badge>
                );
            },
            filterFn: (row, id, value) => {
                return value.includes(row.getValue(id));
            },
        },

        // Aktive Krankmeldungen
        {
            accessorKey: "aktiveKrankmeldungen",
            header: "Aktive Krankmeldungen",
            cell: ({ row }) => {
                const count = row.getValue("aktiveKrankmeldungen") as number;

                if (count === 0) {
                    return <div className="text-center text-muted-foreground">-</div>;
                }

                return (
                    <div className="text-center">
                        <Badge variant="secondary" className="font-mono">
                            {count}
                        </Badge>
                    </div>
                );
            },
        },

        // Aktionen
        {
            id: "actions",
            cell: ({ row }) => {
                const mitarbeiter = row.original;

                return (
                    <div className="flex justify-end">
                        {showActions ? (
                            <MitarbeiterActions
                                mitarbeiter={mitarbeiter}
                                session={session}
                                onStatusChange={handleStatusChangeIntent}
                            />
                        ) : (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                asChild
                            >
                                <Link href={`/mitarbeiter/${mitarbeiter.id}`}>
                                    <span className="sr-only">Details anzeigen</span>
                                    <ExternalLink className="h-4 w-4" />
                                </Link>
                            </Button>
                        )}
                    </div>
                );
            },
        },
    ];

    /**
     * Configure table options
     */
    const tableOptions = {
        data,
        columns,
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
    };

    /**
     * Tabelleninstanz erstellen
     */
    const table = useReactTable(tableOptions);

    /**
     * Helper function to create filter links (not used but kept with _ prefix)
     */
    const _updateSearchParam = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set(key, value);
        return `${pathname}?${params.toString()}`;
    };

    // Status aus URL extrahieren für aktive Filteroption
    const currentStatus = searchParams.get('status') || 'aktiv';

    // Suchtext aus URL extrahieren
    const currentSearch = searchParams.get('suche') || '';

    /**
     * Status-Filter-Link-Funktion
     */
    const getStatusFilterLink = (status: string | null) => {
        const params = new URLSearchParams(searchParams.toString());

        if (!status || status === 'aktiv') {
            params.delete('status');
        } else {
            params.set('status', status);
        }

        return `${pathname}?${params.toString()}`;
    };

    /**
     * Suchfunktion, die die URL aktualisiert
     */
    const handleSearch = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());

        if (value) {
            params.set('suche', value);
        } else {
            params.delete('suche');
        }

        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="space-y-4">
            {/* Filter-Bereich */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
                {/* Suchfeld */}
                <div className="relative max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Nach Namen oder Personalnummer suchen..."
                        defaultValue={currentSearch}
                        onChange={(e) => {
                            if (e.target.value === '') {
                                handleSearch('');
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleSearch(e.currentTarget.value);
                            }
                        }}
                        className="pl-8"
                    />
                </div>

                {/* Statusfilter und Spaltensichtbarkeit */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Statusfilter (Buttons) */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="ml-auto h-8 gap-1">
                                <Filter className="h-3.5 w-3.5" />
                                <span>Status: {currentStatus === 'inaktiv' ? 'Inaktiv' : 'Aktiv'}</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Status filtern</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                                <Link href={getStatusFilterLink(null)}>
                                    Aktiv
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href={getStatusFilterLink('inaktiv')}>
                                    Inaktiv
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Spalten-Visibility-Menü */}
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
                                            {column.id === "personalnummer" ? "Personalnummer" :
                                                column.id === "aktiveKrankmeldungen" ? "Aktive Krankmeldungen" :
                                                    column.id}
                                        </DropdownMenuCheckboxItem>
                                    );
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Neue Krankmeldung Button */}
                    {session?.user && (
                        <Button size="sm" className="h-8 gap-1" asChild>
                            <Link href="/krankmeldungen/neu">
                                <CalendarPlus className="h-3.5 w-3.5" />
                                <span>Neue Krankmeldung</span>
                            </Link>
                        </Button>
                    )}
                </div>
            </div>

            {/* Tabelle mit Ladezustand */}
            <div className="rounded-md border relative">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                )}
                <DataTable
                    table={table}
                    columns={columns}
                    noDataMessage={isLoading ? "Daten werden geladen..." : "Keine Mitarbeiter gefunden."}
                />
            </div>

            {/* Paginierung */}
            {showPagination && data.length > 0 && (
                <TablePagination table={table} />
            )}

            {/* Status-Änderungsdialog */}
            <StatusDialog
                open={statusDialogOpen}
                setOpen={setStatusDialogOpen}
                selectedMitarbeiter={selectedMitarbeiter}
                newStatus={newStatus}
                isSubmitting={isSubmitting}
                onConfirm={handleStatusChange}
            />
        </div>
    );
}