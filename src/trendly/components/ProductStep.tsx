import { useRef } from "react";
import { Link } from "react-router-dom";
import { Check, Flame, Plus, UploadCloud, X } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { ACCEPTED_IMAGES, prepareImage, type PreparedImage } from "../../lib/gemini";
import { MediaView } from "../../components/MediaView";
import { media } from "../../lib/media";
import type { Product } from "../data/products";

export type ProductSource = "own" | "catalog" | null;

export interface ProductState {
  source: ProductSource;
  productId: string | null;
  ownImages: PreparedImage[];
  ownName: string;
  ownDetails: string;
}

function Thumb({ product }: { product: Product }) {
  const photo = media.resolve("products", [product.id]);
  if (photo) return <MediaView item={photo} title={product.name || "Produto"} autoplay decorative />;
  const hue = (product.name.charCodeAt(0) * 53) % 360;
  return <span className="tw-prod-ph" style={{ background: `linear-gradient(160deg, hsl(${hue} 40% 28%), #0b0b0e)` }} aria-hidden="true" />;
}

interface Props {
  products: Product[];
  value: ProductState;
  onChange: (patch: Partial<ProductState>) => void;
}

export function ProductStep({ products, value, onChange }: Props) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = async (files: File[]) => {
    const room = 3 - value.ownImages.length;
    const added: PreparedImage[] = [];
    for (const f of files.slice(0, Math.max(room, 0))) {
      try {
        added.push(await prepareImage(f));
      } catch (e) {
        toast(e instanceof Error ? e.message : "Não consegui ler a imagem.", "error");
      }
    }
    if (added.length) onChange({ source: "own", productId: null, ownImages: [...value.ownImages, ...added] });
  };

  const removeOwn = (id: string) => {
    const left = value.ownImages.filter((i) => i.id !== id);
    onChange({ ownImages: left, source: left.length ? "own" : null });
  };

  return (
    <div className="tw-stack">
      <p className="tw-lede">Escolha o produto que será o foco do seu vídeo. A IA vai adaptar o roteiro e as interações para destacar os melhores ângulos e benefícios deste item:</p>

      <div className={`tw-own ${value.source === "own" ? "on" : ""}`}>
        <div className="tw-own-row">
          <span className="tw-own-ic" aria-hidden="true">
            <UploadCloud size={18} />
          </span>
          <div className="tw-own-text">
            <strong>usar meu próprio produto</strong>
            <span>faça upload de uma foto — a IA gera o vídeo completo</span>
          </div>
          <button type="button" className="tw-mini-btn" onClick={() => inputRef.current?.click()} disabled={value.ownImages.length >= 3}>
            <Plus size={13} /> adicionar
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_IMAGES.join(",")}
            multiple
            hidden
            aria-label="Adicionar foto do meu produto"
            onChange={(e) => {
              void addFiles(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
        </div>
        {value.ownImages.length > 0 && (
          <div className="tw-own-body">
            <div className="tw-own-thumbs">
              {value.ownImages.map((img) => (
                <div className="tw-own-thumb" key={img.id}>
                  <img src={img.previewUrl} alt={img.name} />
                  <button type="button" onClick={() => removeOwn(img.id)} aria-label={`Remover ${img.name}`}>
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
            <div className="tw-own-fields">
              <input value={value.ownName} placeholder="Nome do produto" aria-label="Nome do produto" onChange={(e) => onChange({ ownName: e.target.value })} />
              <input value={value.ownDetails} placeholder="Detalhes reais (opcional)" aria-label="Detalhes do produto" onChange={(e) => onChange({ ownDetails: e.target.value })} />
            </div>
          </div>
        )}
      </div>

      <p className="tw-or">ou escolha um produto em alta</p>

      {products.length === 0 ? (
        <p className="tw-hint">
          Sua lista está vazia. Cadastre produtos em <Link to="/trendly/produtos">Produtos</Link>.
        </p>
      ) : (
        <div className="tw-prod-grid" role="radiogroup" aria-label="Produtos em alta">
          {products.map((p, i) => {
            const on = value.source === "catalog" && value.productId === p.id;
            return (
              <button key={p.id} type="button" role="radio" aria-checked={on} className={`tw-prod ${on ? "on" : ""}`} onClick={() => onChange({ source: "catalog", productId: p.id })}>
                <span className="tw-prod-img">
                  <Thumb product={p} />
                  <span className="tw-rank">
                    {i < 3 ? `#${i + 1} VIRAL` : (
                      <>
                        <Flame size={11} aria-hidden="true" /> Em Alta
                      </>
                    )}
                  </span>
                  {on && (
                    <span className="tw-check" aria-hidden="true">
                      <Check size={13} />
                    </span>
                  )}
                </span>
                <span className="tw-prod-name">{p.name.trim() || "Sem nome"}</span>
                {p.demand === "alta" && <span className="tw-demand">Alta Demanda</span>}
                {p.example && <span className="tw-example">exemplo</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
