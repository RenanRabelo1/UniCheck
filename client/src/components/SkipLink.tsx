import type { MouseEvent } from "react";

/** O endereço guarda a tela atual, então o atalho move o foco sem trocar o "#" da página. */
export function SkipLink() {
  function skip(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();
    document.getElementById("conteudo")?.focus();
  }

  return (
    <a className="skip-link" href="#conteudo" onClick={skip}>
      Pular para o conteúdo
    </a>
  );
}
