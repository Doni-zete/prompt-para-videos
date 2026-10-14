import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, FileSpreadsheet, Plus, Save, Trash2, Upload, X } from "lucide-react";
import { Modal } from "../../components/Modal";
import { useToast } from "../../context/ToastContext";
import { usePersistentState } from "../../hooks/usePersistentState";
import { downloadBytes, saveBytesReplacing } from "../lib/baixar";
import { STATUS_COLORS } from "../lib/cores";
import { readTableFile, serializeCsv, type TableFile } from "../lib/csv";
import {
  EMPTY_GRADE, MAX_COLS, MAX_ROWS, STATUSES, addColumn, addRow, detectStatusColumns, exportGrade, fillWeekDefaults, gradeFromRows, gradeStats, modeloGrade, removeColumn, removeRow, setCell, statusOfText,
  type Grade, type GridCell,
} from "../lib/grade";
import { Donut, StatusBar, StatusLegend } from "./Charts";

const PAGE = 50;

/** Aba "Importar/Exportar Planilha": abre Excel ou CSV, edita na tela, colore os status e exporta de volta em Excel. */
export function PlanilhaTab() {
  const toast = useToast();
  const [grade, setGrade] = usePersistentState<Grade>("progresso:planilha", EMPTY_GRADE);
  const [page, setPage] = useState(0);
  const [pending, setPending] = useState<{ name: string; file: TableFile; sheet: number } | null>(null);
  const [newCol, setNewCol] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setGrade((current) => fillWeekDefaults(current)); }, [setGrade]);

  const has = grade.rows.length > 0;
  const header = has ? grade.rows[0] : [];
  const body = has ? grade.rows.length - 1 : 0;
  const pages = Math.max(1, Math.ceil(body / PAGE));
  const cur = Math.min(page, pages - 1);
  const statusCols = useMemo(() => new Set(has ? detectStatusColumns(grade.rows) : []), [grade.rows, has]);
  const stats = useMemo(() => (has ? gradeStats(grade) : null), [grade, has]);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    try {
      const t = readTableFile(file.name, new Uint8Array(await file.arrayBuffer()));
      const first = Math.max(0, t.sheets.findIndex((s) => s.rows.length));
      setPending({ name: file.name, file: t, sheet: first });
    } catch (e) {
      toast((e as Error).message || "Não consegui ler o arquivo. Use .xlsx ou .csv.", "error");
    }
  };
  const confirmImport = () => {
    if (!pending) return;
    try {
      const s = pending.file.sheets[pending.sheet];
      setGrade(gradeFromRows(s.name, s.rows));
      setPage(0);
      toast(`Planilha “${pending.name}” importada.`);
      setPending(null);
    } catch (e) {
      toast((e as Error).message, "error");
    }
  };
  const exportar = () => {
    downloadBytes(exportGrade(grade), "planilha_editada.xlsx");
    toast("Planilha baixada em Excel, com os status coloridos.");
  };
  const salvarCsv = async () => {
    try {
      const savedName = await saveBytesReplacing(
        new TextEncoder().encode(serializeCsv(grade.rows)),
        "carregamento-programado.csv",
        "text/csv;charset=utf-8",
      );
      toast(`CSV salvo em ${savedName}. Para atualizar, feche-o em outros programas e escolha esse mesmo arquivo.`);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      if (error instanceof DOMException && error.name === "InvalidStateError") {
        toast("Feche o CSV em Excel ou outro programa e tente salvar novamente.", "error");
        return;
      }
      toast(error instanceof Error ? error.message : "Não foi possível salvar o CSV.", "error");
    }
  };
  const modelo = () => {
    downloadBytes(exportGrade(modeloGrade()), "modelo_planilha.xlsx");
    toast("Modelo baixado. Preencha e importe de volta.");
  };
  const loadModelo = () => {
    setGrade(modeloGrade());
    setPage(0);
  };

  const rowStart = 1 + cur * PAGE;
  const rowEnd = Math.min(grade.rows.length, rowStart + PAGE);
  const colName = (c: number) => String(header[c] ?? "").trim() || `Coluna ${c + 1}`;

  const cell = (r: number, c: number, v: GridCell | undefined) => {
    const label = `${colName(c)}, linha ${r}`;
    if (statusCols.has(c)) {
      const s = statusOfText(v);
      return (
        <select
          className={`pg-status ${s ? "is-set" : ""}`}
          style={s ? { background: STATUS_COLORS[s] } : undefined}
          value={s ?? ""}
          aria-label={label}
          onChange={(e) => setGrade((g) => setCell(g, r, c, e.target.value || null))}
        >
          <option value="">–</option>
          {STATUSES.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
      );
    }
    return (
      <input
        className="pg-cellinput"
        value={v === null || v === undefined ? "" : String(v)}
        aria-label={label}
        onChange={(e) => setGrade((g) => setCell(g, r, c, e.target.value === "" ? null : e.target.value))}
      />
    );
  };

  return (
    <div id="pg-panel-planilha" role="tabpanel" aria-labelledby="pg-tab-planilha" className="pg-planilha">
      <section className="panel" aria-labelledby="pg-pl-t">
        <h2 id="pg-pl-t" className="panel-title">Importar / Exportar Planilha</h2>
        <p className="muted pg-note">
          Abra uma planilha <strong>.xlsx</strong> ou <strong>.csv</strong> (por exemplo, a sua planilha de produção de conteúdo), edite aqui mesmo e baixe de volta em Excel. As colunas com <em>Concluído</em>, <em>Editando</em> e <em>Não começou</em> viram menus coloridos (verde, amarelo e vermelho).
        </p>
        <div className="row pg-tools">
          <button type="button" className="btn btn-primary" onClick={() => fileRef.current?.click()}><Upload size={14} /> Importar planilha</button>
          <button type="button" className="btn btn-ghost" onClick={exportar} disabled={!has}><FileSpreadsheet size={14} /> Exportar planilha (Excel)</button>
          <button type="button" className="btn btn-ghost" onClick={modelo}><Download size={14} /> Baixar modelo</button>
          {has && (
            <button type="button" className="btn btn-ghost" onClick={() => { setGrade(EMPTY_GRADE); setPage(0); }}><Trash2 size={14} /> Limpar planilha</button>
          )}
          <input ref={fileRef} type="file" accept=".xlsx,.csv,.txt,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" hidden aria-label="Escolher planilha Excel ou CSV" onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ""; }} />
        </div>
      </section>

      {!has || !stats ? (
        <section className="panel">
          <p className="empty-inline">Nenhuma planilha aberta ainda. Importe um arquivo ou comece pelo modelo de produção de conteúdo.</p>
          <div className="row"><button type="button" className="btn btn-ghost" onClick={loadModelo}><Plus size={14} /> Começar pelo modelo</button></div>
        </section>
      ) : (
        <>
          {stats.columns.length > 0 && (
            <section className="panel" aria-labelledby="pg-pl-res">
              <h2 id="pg-pl-res" className="panel-title">Resumo dos status</h2>
              <div className="pg-pl-sum">
                <div className="pg-pl-total">
                  <Donut pct={stats.pct} label="Concluído em todas as colunas de status" size={96} color={STATUS_COLORS["Concluído"]} />
                  <p><strong>{stats.pct}%</strong> concluído<br /><span className="muted">{stats.counts["Concluído"]} de {stats.total} células</span></p>
                </div>
                <ul className="pg-pl-cols">
                  {stats.columns.map((c) => (
                    <li key={c.col}>
                      <span className="pg-pl-colname">{c.title}</span>
                      <StatusBar counts={c.counts} label={c.title} />
                      <span className="pg-pl-colnums">{STATUSES.map((s) => `${c.counts[s]} ${s.toLowerCase()}`).join(" · ")}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <StatusLegend />
            </section>
          )}

          <section className="panel" aria-labelledby="pg-pl-grid">
            <div className="pg-bar-head">
              <h2 id="pg-pl-grid" className="panel-title">{grade.name ? `Planilha: ${grade.name}` : "Planilha"} <span className="muted">({body} {body === 1 ? "linha" : "linhas"})</span></h2>
              <div className="row">
                <button type="button" className="btn btn-ghost" onClick={() => { void salvarCsv(); }} disabled={!has} title="Feche o CSV se estiver aberto em outro programa antes de salvar novamente"><Save size={14} /> Salvar CSV</button>
                <button type="button" className="btn btn-ghost" onClick={() => setGrade(addRow)} disabled={body >= MAX_ROWS}><Plus size={14} /> Linha</button>
              </div>
            </div>
            <div className="pg-scroll pg-grid-scroll" tabIndex={0} role="group" aria-label="Planilha rolável">
              <table className="pg-table pg-sheet">
                <caption className="sr-only">Planilha editável</caption>
                <thead>
                  <tr>
                    <th scope="col" className="pg-sheet-n">#</th>
                    {header.map((_, c) => (
                      <th key={c} scope="col">
                        <div className="pg-sheet-h">
                          <input className="pg-cellinput pg-headinput" value={header[c] === null || header[c] === undefined ? "" : String(header[c])} aria-label={`Título da coluna ${c + 1}`} onChange={(e) => setGrade((g) => setCell(g, 0, c, e.target.value === "" ? null : e.target.value))} />
                          <button type="button" className="icon-btn" onClick={() => setGrade((g) => removeColumn(g, c))} disabled={header.length <= 1} aria-label={`Excluir coluna ${colName(c)}`}><X size={12} /></button>
                        </div>
                      </th>
                    ))}
                    <th scope="col"><span className="sr-only">Ações</span></th>
                  </tr>
                </thead>
                <tbody>
                  {grade.rows.slice(rowStart, rowEnd).map((row, i) => {
                    const r = rowStart + i;
                    return (
                      <tr key={r}>
                        <th scope="row" className="pg-sheet-n">{r}</th>
                        {header.map((_, c) => <td key={c}>{cell(r, c, row[c])}</td>)}
                        <td><button type="button" className="icon-btn" onClick={() => setGrade((g) => removeRow(g, r))} aria-label={`Excluir linha ${r}`}><Trash2 size={13} /></button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {pages > 1 && (
              <div className="row pg-pager">
                <button type="button" className="btn btn-ghost" onClick={() => setPage(cur - 1)} disabled={cur === 0} aria-label="Página anterior"><ChevronLeft size={14} /></button>
                <span>Página {cur + 1} de {pages}</span>
                <button type="button" className="btn btn-ghost" onClick={() => setPage(cur + 1)} disabled={cur >= pages - 1} aria-label="Próxima página"><ChevronRight size={14} /></button>
              </div>
            )}
            <form className="pg-add" onSubmit={(e) => { e.preventDefault(); if (!newCol.trim()) return; setGrade((g) => addColumn(g, newCol.trim())); setNewCol(""); }}>
              <input value={newCol} onChange={(e) => setNewCol(e.target.value)} placeholder="Nova coluna, por exemplo: Kwai" aria-label="Nome da nova coluna" maxLength={40} disabled={header.length >= MAX_COLS} />
              <button type="submit" className="btn btn-ghost" disabled={!newCol.trim() || header.length >= MAX_COLS}><Plus size={14} /> Coluna</button>
            </form>
          </section>
        </>
      )}

      <Modal
        open={!!pending}
        onClose={() => setPending(null)}
        title="Importar planilha"
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setPending(null)}>Cancelar</button>
            <button type="button" className="btn btn-primary" onClick={confirmImport}>Importar</button>
          </>
        }
      >
        {pending && (
          <div className="stack">
            <p>Arquivo: <strong>{pending.name}</strong></p>
            {pending.file.sheets.length > 1 && (
              <label className="field">
                <span>Qual aba importar?</span>
                <select value={pending.sheet} onChange={(e) => setPending({ ...pending, sheet: Number(e.target.value) })}>
                  {pending.file.sheets.map((s, i) => <option key={i} value={i}>{s.name} ({s.rows.length} linhas)</option>)}
                </select>
              </label>
            )}
            <p className="muted">{pending.file.sheets[pending.sheet].rows.length} linhas na aba escolhida. A primeira linha vira o cabeçalho.{has ? " A planilha que está aberta aqui será substituída." : ""}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
