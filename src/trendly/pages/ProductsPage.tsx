import { useState } from "react";
import { Link } from "react-router-dom";
import { Images, Info, Plus, Trash2, Upload } from "lucide-react";
import { Modal } from "../../components/Modal";
import { useToast } from "../../context/ToastContext";
import { media } from "../../lib/media";
import { TrendlyMedia } from "../components/TrendlyMedia";
import type { Demand } from "../data/products";
import { useProducts } from "../hooks/useProducts";

/** Produtos em alta: a lista do passo "Selecione o Produto Viral". As fotos vêm de public/media/products/<id>. */
export default function ProductsPage() {
  const { products, add, update, remove, importLines } = useProducts();
  const toast = useToast();
  const [importOpen, setImportOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [text, setText] = useState("");
  const [name, setName] = useState("");

  const doImport = () => {
    const n = importLines(text);
    if (!n) return toast("Nenhuma linha válida encontrada.", "error");
    toast(`${n} ${n === 1 ? "produto importado" : "produtos importados"}.`);
    setText("");
    setImportOpen(false);
  };
  const doAdd = () => {
    if (!name.trim()) return toast("Digite o nome do produto.", "error");
    const id = add(name);
    toast(`Produto criado. Foto: public/media/products/${id}.jpg`);
    setName("");
    setAddOpen(false);
  };

  return (
    <section>
      <header className="tl-gallery-head">
        <div>
          <h1>Produtos em <em>alta</em></h1>
          <p>Monte a sua lista de produtos virais. Ela aparece no passo “Selecione o Produto Viral” de cada vídeo.</p>
        </div>
        <div className="row">
          <Link className="tl-ghost-pill" to="/trendly/midia"><Images size={14} /> Mapa de mídia</Link>
          <button type="button" className="tl-ghost-pill" onClick={() => setImportOpen(true)}><Upload size={14} /> Importar lista</button>
          <button type="button" className="btn btn-primary" onClick={() => setAddOpen(true)}><Plus size={14} /> Adicionar produto</button>
        </div>
      </header>

      <div className="tl-note tl-note-info">
        <Info size={15} aria-hidden="true" />
        <div>
          O app não busca vendas do TikTok Shop sozinho: você cadastra os produtos ou cola uma lista (por exemplo, exportada do Kalodata ou do FastMoss). A foto de cada produto é o arquivo <code>public/media/products/&lt;código&gt;.jpg</code> (o código aparece em cada card). Os itens “exemplo” vieram com o app e não são dados reais. A lista fica salva só neste navegador.
        </div>
      </div>

      {products.length === 0 ? (
        <div className="tl-empty">
          <h3>Sua lista está vazia</h3>
          <p>Adicione produtos para usá-los nos vídeos.</p>
        </div>
      ) : (
        <div className="tl-avatar-grid">
          {products.map((p, i) => {
            const found = media.resolve("products", [p.id]);
            const has = !!found;
            return (
              <article className="tl-avatar-card" key={p.id}>
                <TrendlyMedia autoplay category="products" names={[p.id]} title={p.name || p.id} ratio="ratio-avatar" badge={<span className="tl-badge">{i < 3 ? `#${i + 1} VIRAL` : "Em Alta"}</span>}>
                  <div className="tl-cover-art tl-cover-avatar"><span>Sem foto</span></div>
                </TrendlyMedia>
                <div className="tl-avatar-fields">
                  <input value={p.name} placeholder="Nome do produto" maxLength={120} aria-label={`Nome do produto ${i + 1}`} onChange={(e) => update(p.id, { name: e.target.value })} />
                  <select value={p.demand} aria-label={`Demanda do produto ${i + 1}`} onChange={(e) => update(p.id, { demand: e.target.value as Demand })}>
                    <option value="alta">Alta Demanda</option>
                    <option value="em-alta">Em Alta</option>
                    <option value="">Sem selo</option>
                  </select>
                  <p className={`tw-file-status ${has ? "ok" : ""}`}>{has ? (found?.kind === "video" ? "Vídeo encontrado" : "Foto encontrada") : "Sem foto ainda"}</p>
                  {!has && <code className="tw-file">public/media/products/{p.id}.jpg (ou .mp4)</code>}
                  {p.example && <span className="tw-example">exemplo</span>}
                  <button type="button" className="btn btn-quiet danger" onClick={() => remove(p.id)}><Trash2 size={14} /> Excluir da lista</button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Adicionar produto"
        footer={<><button type="button" className="btn btn-ghost" onClick={() => setAddOpen(false)}>Cancelar</button><button type="button" className="btn btn-primary" onClick={doAdd}>Adicionar</button></>}
      >
        <div className="field">
          <label htmlFor="np-name">Nome do produto</label>
          <input id="np-name" value={name} maxLength={120} placeholder="Ex.: Garrafa térmica 1 litro" onChange={(e) => setName(e.target.value)} />
          <p className="field-help">O nome vira o código do arquivo da foto (ex.: garrafa-termica-1-litro.jpg).</p>
        </div>
      </Modal>

      <Modal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Importar lista de produtos"
        footer={<><button type="button" className="btn btn-ghost" onClick={() => setImportOpen(false)}>Cancelar</button><button type="button" className="btn btn-primary" onClick={doImport}>Importar</button></>}
      >
        <div className="stack">
          <p className="muted">Um produto por linha. Opcional: coloque “;alta” ou “;em-alta” depois do nome.</p>
          <textarea rows={8} value={text} aria-label="Lista de produtos" placeholder={"Calça feminina cintura alta;alta\nCapinha de celular estampada;em-alta\nGarrafa térmica 1 litro"} onChange={(e) => setText(e.target.value)} />
        </div>
      </Modal>
    </section>
  );
}
