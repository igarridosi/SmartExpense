"use client";

import { useState, useCallback, useRef, type DragEvent, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parseCsv, readFileAsText, type CsvParseResult } from "@/lib/utils/csv-parser";
import { importExpensesAction } from "@/actions/csv-import.actions";
import type { CsvExpensePayload } from "@/types/csv-import";
import type { ImportResult } from "@/types/csv-import";
import {
  AlertTriangle,
  Check,
  CircleCheck,
  FileSpreadsheet,
  Paperclip,
  Trash2,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";

interface CsvImportFormProps {
  baseCurrency: string;
}

type ImportPhase = "upload" | "preview" | "importing" | "results";

export function CsvImportForm({ baseCurrency }: CsvImportFormProps) {
  const [phase, setPhase] = useState<ImportPhase>("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [parseResult, setParseResult] = useState<CsvParseResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- File handling ---
  const handleFile = useCallback(
    async (file: File) => {
      setError("");

      if (!file.name.endsWith(".csv")) {
        setError("Solo se aceptan archivos .csv");
        return;
      }

      // Max 5MB
      if (file.size > 5 * 1024 * 1024) {
        setError("El archivo no puede superar 5MB");
        return;
      }

      try {
        const text = await readFileAsText(file);
        const result = parseCsv(text, baseCurrency);

        if (result.totalRows === 0) {
          setError("El archivo CSV está vacío o no tiene filas de datos");
          return;
        }

        setFileName(file.name);
        setParseResult(result);
        setPhase("preview");
      } catch {
        setError("Error al procesar el archivo CSV");
      }
    },
    [baseCurrency]
  );

  // --- Drag & Drop ---
  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  // --- Import ---
  const handleImport = useCallback(async () => {
    if (!parseResult) return;

    setPhase("importing");

    const payloads: CsvExpensePayload[] = parseResult.validRows.map((row) => ({
      expense_date: row.expense_date,
      amount: row.amount,
      currency: row.currency,
      category: row.category,
      defaults_applied: row.defaults_applied,
    }));

    try {
      const result = await importExpensesAction(payloads);
      result.discarded = parseResult.discardedRows.length;
      setImportResult(result);
      setPhase("results");
    } catch {
      setError("Error al importar los gastos");
      setPhase("preview");
    }
  }, [parseResult]);

  // --- Reset ---
  const handleReset = useCallback(() => {
    setPhase("upload");
    setFileName("");
    setParseResult(null);
    setImportResult(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {phase === "upload" && (
        <UploadZone
          isDragging={isDragging}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onFileInput={handleFileInput}
          fileInputRef={fileInputRef}
        />
      )}

      {phase === "preview" && parseResult && (
        <PreviewPanel
          fileName={fileName}
          parseResult={parseResult}
          onImport={handleImport}
          onCancel={handleReset}
        />
      )}

      {phase === "importing" && <ImportingSpinner />}

      {phase === "results" && importResult && parseResult && (
        <ResultsPanel
          importResult={importResult}
          onDone={handleReset}
        />
      )}

      {/* Format reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-gray-500">
            Formato CSV esperado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <code className="block rounded bg-gray-100 p-3 text-xs text-gray-700">
            date,amount,currency,category,description
            <br />
            2026-01-15,45.50,USD,Alimentación,Almuerzo de trabajo
            <br />
            2026-01-16,120.00,EUR,Transporte,Uber al aeropuerto
          </code>
          <p className="mt-2 text-xs text-gray-500">
            Los campos con datos inválidos se corregirán automáticamente. Las
            filas sin monto válido serán descartadas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

/** Drag & drop zone for CSV file upload */
function UploadZone({
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileInput,
  fileInputRef,
}: {
  isDragging: boolean;
  onDragOver: (e: DragEvent) => void;
  onDragLeave: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
  onFileInput: (e: ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={`
        flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-12
        transition-colors cursor-pointer
        ${isDragging
          ? "border-blue-400 bg-blue-50"
          : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
        }
      `}
      onClick={() => fileInputRef.current?.click()}
    >
      <FileSpreadsheet className="h-12 w-12 text-zinc-500" aria-hidden="true" />
      <p className="text-sm font-medium text-gray-700">
        Arrastra tu archivo CSV aquí
      </p>
      <p className="text-xs text-gray-500">o haz clic para seleccionar</p>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={onFileInput}
        aria-label="Seleccionar archivo CSV para importar"
        className="hidden"
      />
    </div>
  );
}

/** Preview of parsed CSV data before importing */
function PreviewPanel({
  fileName,
  parseResult,
  onImport,
  onCancel,
}: {
  fileName: string;
  parseResult: CsvParseResult;
  onImport: () => void;
  onCancel: () => void;
}) {
  const { validRows, discardedRows, totalRows, defaultsCount } = parseResult;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                <span className="inline-flex items-center gap-1.5">
                  <Paperclip className="h-4 w-4 text-zinc-500" aria-hidden="true" />
                  {fileName}
                </span>
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {totalRows} filas detectadas
              </p>
            </div>
            <div className="flex gap-4 text-center">
              <StatBadge
                label="Válidos"
                count={validRows.length}
                color="green"
              />
              <StatBadge
                label="Con defaults"
                count={defaultsCount}
                color="yellow"
              />
              <StatBadge
                label="Descartados"
                count={discardedRows.length}
                color="red"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Valid rows preview */}
      {validRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Vista previa ({validRows.length} gastos a importar)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 pr-3">#</th>
                    <th className="pb-2 pr-3">Fecha</th>
                    <th className="pb-2 pr-3 text-right">Monto</th>
                    <th className="pb-2 pr-3">Moneda</th>
                    <th className="pb-2 pr-3">Categoría</th>
                    <th className="pb-2 pr-3">Descripción</th>
                    <th className="pb-2">Ajustes</th>
                  </tr>
                </thead>
                <tbody>
                  {validRows.slice(0, 100).map((row, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-2 pr-3 text-gray-400">{i + 1}</td>
                      <td className="py-2 pr-3">{row.expense_date}</td>
                      <td className="py-2 pr-3 text-right font-mono">
                        {row.amount.toFixed(2)}
                      </td>
                      <td className="py-2 pr-3">{row.currency}</td>
                      <td className="py-2 pr-3">{row.category}</td>
                      <td className="py-2 pr-3 max-w-[150px] truncate">
                        {row.description}
                      </td>
                      <td className="py-2">
                        {row.defaults_applied.length > 0 ? (
                          <span
                            className="text-amber-600"
                            title={row.defaults_applied.join(", ")}
                          >
                            <span className="inline-flex items-center gap-1">
                              <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                              {row.defaults_applied.length}
                            </span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-emerald-600">
                            <Check className="h-4 w-4" aria-hidden="true" />
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {validRows.length > 100 && (
                <p className="mt-2 text-xs text-gray-500 text-center">
                  Mostrando 100 de {validRows.length} filas
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Discarded rows */}
      {discardedRows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-red-600">
              Filas descartadas ({discardedRows.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-xs text-gray-600">
              {discardedRows.map((row, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-red-500">
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <span>{row.discard_reason}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button onClick={onImport} disabled={validRows.length === 0}>
          Importar {validRows.length} gastos
        </Button>
        <Button variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

/** Spinner shown during import */
function ImportingSpinner() {
  return (
    <div className="flex flex-col items-center gap-4 py-16">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
      <p className="text-sm text-gray-600">Importando gastos...</p>
      <p className="text-xs text-gray-400">
        Esto puede tardar unos segundos según la cantidad de filas
      </p>
    </div>
  );
}

/** Results summary after import completes */
function ResultsPanel({
  importResult,
  onDone,
}: {
  importResult: ImportResult;
  onDone: () => void;
}) {
  const { inserted, defaulted, errors, discarded } = importResult;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Resultado de la importación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <ResultStat
              label="Importados"
              count={inserted}
              icon={CircleCheck}
              color="green"
            />
            <ResultStat
              label="Con ajustes"
              count={defaulted}
              icon={AlertTriangle}
              color="yellow"
            />
            <ResultStat
              label="Errores"
              count={errors}
              icon={XCircle}
              color="red"
            />
            <ResultStat
              label="Descartados"
              count={discarded}
              icon={Trash2}
              color="gray"
            />
          </div>
        </CardContent>
      </Card>

      {/* Error details */}
      {errors > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-red-600">
              Errores de inserción
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-xs text-gray-600">
              {importResult.details
                .filter((d) => !d.success)
                .map((d) => (
                  <li key={d.rowIndex} className="flex gap-2">
                    <span className="text-red-500">Fila {d.rowIndex + 1}:</span>
                    <span>{d.error}</span>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Defaults details */}
      {defaulted > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-amber-600">
              Ajustes aplicados automáticamente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-xs text-gray-600">
              {importResult.details
                .filter((d) => d.success && d.defaults_applied.length > 0)
                .slice(0, 20)
                .map((d) => (
                  <li key={d.rowIndex} className="flex gap-2">
                    <span className="text-amber-500">
                      Fila {d.rowIndex + 1}:
                    </span>
                    <span>{d.defaults_applied.join(", ")}</span>
                  </li>
                ))}
              {importResult.details.filter(
                (d) => d.success && d.defaults_applied.length > 0
              ).length > 20 && (
                <li className="text-gray-400">
                  ... y más filas con ajustes
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}

      <Button onClick={onDone}>Importar otro archivo</Button>
    </div>
  );
}

// ============================================================
// Helper micro-components
// ============================================================

function StatBadge({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: "green" | "yellow" | "red";
}) {
  const colors = {
    green: "bg-green-100 text-green-700",
    yellow: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
  };

  return (
    <div className={`rounded-lg px-3 py-1.5 ${colors[color]}`}>
      <p className="text-lg font-bold">{count}</p>
      <p className="text-[10px]">{label}</p>
    </div>
  );
}

function ResultStat({
  label,
  count,
  icon,
  color,
}: {
  label: string;
  count: number;
  icon: LucideIcon;
  color: "green" | "yellow" | "red" | "gray";
}) {
  const Icon = icon;

  const colors = {
    green: "bg-green-50 border-green-200",
    yellow: "bg-amber-50 border-amber-200",
    red: "bg-red-50 border-red-200",
    gray: "bg-gray-50 border-gray-200",
  };

  return (
    <div
      className={`flex flex-col items-center gap-1 rounded-lg border p-4 ${colors[color]}`}
    >
      <Icon className="h-5 w-5 text-zinc-600" aria-hidden="true" />
      <span className="text-2xl font-bold">{count}</span>
      <span className="text-xs text-gray-600">{label}</span>
    </div>
  );
}
