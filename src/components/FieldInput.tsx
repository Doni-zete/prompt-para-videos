import type { ToolField } from "../tools/types";

interface Props {
  field: ToolField;
  value: string;
  onChange: (value: string) => void;
}

export function FieldInput({ field, value, onChange }: Props) {
  const id = `f-${field.id}`;
  return (
    <div className="field">
      <label htmlFor={id}>
        {field.label}
        {field.required && <span className="req"> *</span>}
      </label>
      {field.kind === "select" ? (
        <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : field.kind === "textarea" ? (
        <textarea id={id} rows={3} value={value} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input id={id} type="text" value={value} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />
      )}
      {field.help && <p className="field-help">{field.help}</p>}
    </div>
  );
}
