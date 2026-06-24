import React, { useEffect, useState } from "react";

// Input numerico que se comporta como campo de texto: da pra apagar tudo,
// digitar livremente (sem "01") e usar as setas. Emite numero via onChange.
export default function NumberField({ value, onChange, ...rest }) {
  const [draft, setDraft] = useState(value === "" || value == null ? "" : String(value));

  useEffect(() => {
    // sincroniza se o valor externo mudou e nao bate com o que esta digitado
    if (Number(draft) !== Number(value)) {
      setDraft(value === "" || value == null ? "" : String(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      type="number"
      value={draft}
      onChange={(event) => {
        const v = event.target.value;
        setDraft(v);
        if (v === "") return;
        const n = Number(v);
        if (!Number.isNaN(n)) onChange(n);
      }}
      {...rest}
    />
  );
}
