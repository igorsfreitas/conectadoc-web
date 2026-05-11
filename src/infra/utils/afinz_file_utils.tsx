export abstract class AfinzFileUtils {
  static downloadPDF(pdf: string, customFileName: string = "afinz_item.pdf") {
    const linkSource = `data:application/pdf;base64,${pdf}`;
    const downloadLink = document.createElement("a");
    downloadLink.href = linkSource;
    downloadLink.download = `${customFileName}_${new Date().toISOString()}.pdf`;
    downloadLink.target = "_blank";
    downloadLink.click();
  }

  static printFilePDF(base64pdf: string) {
    const byteChars = atob(base64pdf);
    const byteNumbers = Array.from(byteChars, (c) => c.charCodeAt(0));
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "application/pdf" });
    const blobUrl = URL.createObjectURL(blob);

    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = blobUrl;
    document.body.appendChild(iframe);

    iframe.onload = () => {
      const win = iframe.contentWindow;
      if (!win) return;

      const cleanup = () => {
        if (iframe.parentNode) {
          document.body.removeChild(iframe);
          URL.revokeObjectURL(blobUrl);
        }
      };

      const onAfterPrint = () => {
        cleanup();
        win.removeEventListener("afterprint", onAfterPrint);
        window.removeEventListener("focus", onFocus);
      };
      const onFocus = () => {
        setTimeout(() => {
          cleanup();
          win.removeEventListener("afterprint", onAfterPrint);
          window.removeEventListener("focus", onFocus);
        }, 300);
      };

      win.addEventListener("afterprint", onAfterPrint);
      window.addEventListener("focus", onFocus);

      win.focus();
      win.print();
    };
  }

  /**
   * Abre o conteúdo de um elemento HTML em uma nova janela com os estilos atuais
   * e aciona o diálogo de impressão (Salvar como PDF).
   *
   * @param rootId ID do elemento a ser impresso (ex: "pdf-root")
   * @param title  Título da aba e do PDF
   */
  static async printElementAsPdf(rootId: string, title = "Documento") {
    const el = document.getElementById(rootId);
    if (!el) {
      console.warn(`Elemento com id "${rootId}" não encontrado.`);
      return;
    }

    el.style.setProperty("display", "block");

    const win = window.open("", "_blank", "width=900,height=1200");
    if (!win) return;

    const styles = Array.from(
      document.querySelectorAll("link[rel='stylesheet'], style"),
    )
      .map((node) => node.outerHTML)
      .join("\n");

    win.document.write(`<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8"/>
  <title>${title}</title>
  ${styles}
  <style>
    @media print {
      .sectionDivider {
        break-before: page;
        page-break-before: always;
        border: none;
        margin: 0;
      }
    }
  </style>
</head>
<body>${el.outerHTML}</body>
</html>`);

    win.document.close();

    await new Promise((resolve) => setTimeout(resolve, 300));

    win.focus();
    win.print();

    el.style.setProperty("display", "none");
  }
}
