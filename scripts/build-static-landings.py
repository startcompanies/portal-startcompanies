#!/usr/bin/env python3
"""Extract body + styles from static HTML for Angular LP components."""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOWNLOADS = Path.home() / "Downloads"


def extract(html_path: Path) -> tuple[str, str, str]:
    raw = html_path.read_text(encoding="utf-8", errors="replace")
    m = re.search(r"<style>(.*?)</style>", raw, re.DOTALL)
    css = m.group(1) if m else ""
    m2 = re.search(r"<body[^>]*>(.*?)</body>", raw, re.DOTALL)
    body = m2.group(1) if m2 else ""
    # Scripts at end of body
    scripts: list[str] = []
    for sm in re.finditer(r"<script[^>]*>(.*?)</script>", body, re.DOTALL):
        inner = sm.group(1).strip()
        if inner and "fbq" not in inner[:80]:
            scripts.append(sm.group(0))
    body_no_scripts = body
    for s in re.findall(r"<script[^>]*>.*?</script>", body, re.DOTALL):
        if "fbq" not in s[:120]:
            body_no_scripts = body_no_scripts.replace(s, "", 1)
    return css, body_no_scripts.strip(), "\n".join(scripts)


def prefix_selector(selector: str) -> str:
    """Agrega .lp-campaign a cada parte de un selector separado por comas."""
    parts = selector.split(",")
    prefixed_parts = []
    for part in parts:
        part = part.strip()
        if not part:
            continue
        # :root en CSS de componente Angular (encapsulación emulada) no coincide con el
        # documento real; las variables quedarían indefinidas. Usar .lp-campaign.
        if re.match(r"^:root\b", part):
            part = re.sub(r"^:root\b", ".lp-campaign", part, count=1)
            prefixed_parts.append(part)
            continue
        # No duplicar si ya tiene el prefijo
        if part.startswith(".lp-campaign"):
            prefixed_parts.append(part)
            continue
        # html y body se convierten en .lp-campaign
        if re.match(r"^html\b", part):
            part = re.sub(r"^html\b", ".lp-campaign", part)
            prefixed_parts.append(part)
            continue
        if re.match(r"^body\b", part):
            part = re.sub(r"^body\b", ".lp-campaign", part)
            prefixed_parts.append(part)
            continue
        # Todo lo demás: anteponer .lp-campaign
        prefixed_parts.append(f".lp-campaign {part}")
    return ", ".join(prefixed_parts)


def scope_css(css: str) -> str:
    """Prefija TODOS los selectores con .lp-campaign."""
    result = []
    i = 0
    length = len(css)

    while i < length:
        # Saltar espacios/saltos de línea sueltos
        m_ws = re.match(r"\s+", css[i:])
        if m_ws:
            result.append(m_ws.group(0))
            i += m_ws.end()
            continue

        # Comentarios CSS /* ... */
        m_comment = re.match(r"/\*.*?\*/", css[i:], re.DOTALL)
        if m_comment:
            result.append(m_comment.group(0))
            i += m_comment.end()
            continue

        # @keyframes / @font-face / @charset / @import — copiar bloque entero sin modificar
        m_noprefix = re.match(
            r"(@(?:keyframes|font-face|charset|import)\b[^{;]*)",
            css[i:],
            re.IGNORECASE,
        )
        if m_noprefix:
            header = m_noprefix.group(1)
            i += m_noprefix.end()
            # @charset / @import terminan en ; sin bloque
            if css[i:i+1] == ";":
                result.append(header + ";")
                i += 1
                continue
            # Bloque { ... } posiblemente anidado
            if css[i:i+1] == "{":
                result.append(header + "{")
                i += 1
                depth = 1
                while i < length and depth > 0:
                    if css[i] == "{":
                        depth += 1
                    elif css[i] == "}":
                        depth -= 1
                    if depth > 0:
                        result.append(css[i])
                    i += 1
                result.append("}")
            continue

        # @media / @supports — prefijar selectores internos recursivamente
        m_media = re.match(
            r"(@(?:media|supports)\b[^{]*)\{",
            css[i:],
            re.IGNORECASE,
        )
        if m_media:
            result.append(m_media.group(1) + "{")
            i += m_media.end()
            # Extraer contenido interno hasta el } de cierre del @media
            depth = 1
            inner_chars = []
            while i < length and depth > 0:
                if css[i] == "{":
                    depth += 1
                elif css[i] == "}":
                    depth -= 1
                if depth > 0:
                    inner_chars.append(css[i])
                i += 1
            inner = "".join(inner_chars)
            result.append(scope_css(inner))
            result.append("}")
            continue

        # Regla normal: selector { declaraciones }
        # Capturar el selector (todo hasta el primer {)
        m_sel = re.match(r"([^{@/]+)\{", css[i:], re.DOTALL)
        if m_sel:
            selector_raw = m_sel.group(1)
            i += m_sel.end()
            # Extraer las declaraciones hasta el } de cierre
            depth = 1
            decl_chars = []
            while i < length and depth > 0:
                if css[i] == "{":
                    depth += 1
                elif css[i] == "}":
                    depth -= 1
                if depth > 0:
                    decl_chars.append(css[i])
                i += 1
            declarations = "".join(decl_chars)
            prefixed = prefix_selector(selector_raw.strip())
            result.append(f"{prefixed} {{{declarations}}}")
            continue

        # Caracter no reconocido — pasar tal cual
        result.append(css[i])
        i += 1

    return "".join(result)


def fix_assets(html: str) -> str:
    html = html.replace("Logo Start Companies.webp", "/assets/logo.webp")
    html = html.replace('href="privacidad.html"', 'href="/aviso-de-privacidad"')
    html = html.replace('href="terminos.html"', 'href="/terminos-y-condiciones"')
    # Angular 17+ trata @ en plantillas como sintaxis de control flow
    html = html.replace("@matiasbottero", "&#64;matiasbottero")
    return html


LP_RESET_PREFIX = """\
/* ── LP CAMPAÑA: reset de estilos globales del portal ─────────────────────
   Este bloque se antepone al CSS del HTML original y garantiza que Bootstrap,
   Poppins y otros estilos globales no interfieran. Se genera automáticamente. ── */

/* Fuente: ganar al Poppins !important global */
.lp-campaign, .lp-campaign *, .lp-campaign *::before, .lp-campaign *::after {
  font-family: 'DM Sans', system-ui, sans-serif !important;
  box-sizing: border-box;
}

/* Host: neutralizar flex del app-layout */
app-landing-presentacion, app-landing-abre-tu-llc, app-landing-abre-tu-llc-google,
app-landing-llc-7-dias, app-landing-asesoria-llc, app-landing-presentacion-youtube,
app-landing-agendar {
  display: block !important;
  flex: unset !important;
  min-height: unset !important;
}

/* Fondo y altura: cubrir toda la pantalla con el color propio de cada LP */
.lp-campaign {
  min-height: 100vh !important;
  background: var(--dark) !important;
}

/* Headings LP: solo márgenes (font-size unset !important pisaba .sec-title y h2 del bloque final) */
.lp-campaign h1, .lp-campaign h2, .lp-campaign h3,
.lp-campaign h4, .lp-campaign h5, .lp-campaign h6 {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}

/* Reset Bootstrap .navbar — sin padding/background !important (los define el bloque NAVBAR) */
.lp-campaign .navbar {
  flex-wrap: nowrap !important;
  border: none !important;
}

/* Reset Bootstrap links (excluir CTAs con estilos propios) */
.lp-campaign a:not(.nav-cta):not(.faq-cta-btn):not(.rev-cta):not(.btn-blue):not(.wa-btn):not(.btn-gold) {
  color: inherit !important;
  text-decoration: none !important;
}

/* Reset Bootstrap paragraphs */
.lp-campaign p {
  margin-bottom: 0 !important;
}

"""


def main():
    if len(sys.argv) < 3:
        print("Usage: build-static-landings.py <source.html> <out_dir>")
        sys.exit(1)
    src = Path(sys.argv[1])
    out = Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)
    css, body, _scripts = extract(src)
    css = scope_css(css)
    # Por si quedó algún :root sin pasar por prefix_selector
    css = re.sub(r":root\s*\{", ".lp-campaign {", css)
    # Anteponer el bloque de reset para que tenga prioridad sobre los estilos globales
    css = LP_RESET_PREFIX + css
    body = fix_assets(body)
    body = f'<div class="lp-campaign" #root>\n{body}\n</div>'
    (out / "generated-part.html").write_text(body, encoding="utf-8")
    (out / "generated-part.css").write_text(css, encoding="utf-8")
    print(f"Wrote {out}/generated-part.html + .css from {src}")


if __name__ == "__main__":
    main()
