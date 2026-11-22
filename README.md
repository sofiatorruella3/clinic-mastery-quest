# Simulador ClÃ­nico

AplicaciÃ³n web interactiva de simulaciÃ³n de casos clÃ­nicos diseÃ±ada para estudiantes de medicina. Permite practicar el razonamiento clÃ­nico de principio a fin y recibir una devoluciÃ³n estructurada basada en guÃ­as de prÃ¡ctica clÃ­nica.

**[Abrir aplicaciÃ³n en vivo â†’](https://sofiatorruella3.github.io/clinic-mastery-quest/)**

---

## CaracterÃ­sticas principales

- **13 aparatos y sistemas:** Cardiovascular, Respiratorio, Digestivo, NefrourolÃ³gico, NeurolÃ³gico, Endocrino-metabÃ³lico, HematolÃ³gico, InfectologÃ­a, ReumatolÃ³gico / Osteoarticular, GinecoobstÃ©trico, DermatologÃ­a, OtorrinolaringologÃ­a y OftalmologÃ­a.
- **3 niveles de dificultad:** Baja, Moderada y DifÃ­cil, variando la presentaciÃ³n clÃ­nica, comorbilidades y diagnÃ³sticos diferenciales.
- **Flujo clÃ­nico en 6 etapas:**
  1. **Anamnesis:** entrevista conversacional interactiva con el paciente.
  2. **Examen fÃ­sico:** solicitud de maniobras y signos con valores concretos.
  3. **Estudios complementarios:** pedido e interpretaciÃ³n de laboratorio e imÃ¡genes.
  4. **DiagnÃ³stico presuntivo.**
  5. **Tratamiento.**
  6. **Seguimiento.**
- **DevoluciÃ³n basada en guÃ­as:** al finalizar cada caso se genera un puntaje y un anÃ¡lisis por etapa indicando aciertos, errores, aspectos omitidos, conductas a evitar y las guÃ­as de prÃ¡ctica clÃ­nica de referencia.
- **Historial de prÃ¡cticas:** guarda localmente en el navegador los casos completados para revisarlos cuando quieras.

## TecnologÃ­as

- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vite.dev/)
- [TanStack Router](https://tanstack.com/router) & [TanStack Query](https://tanstack.com/query)
- [Tailwind CSS](https://tailwindcss.com/) + [Radix UI](https://www.radix-ui.com/)

## Desarrollo local

Requisitos: [Node.js](https://nodejs.org/) (o [Bun](https://bun.sh/)).

```bash
git clone https://github.com/sofiatorruella3/clinic-mastery-quest.git
cd clinic-mastery-quest
npm install
npm run dev
```

Para generar la compilaciÃ³n de producciÃ³n:

```bash
npm run build
```

## Despliegue

El sitio se compila y publica automÃ¡ticamente en **GitHub Pages** mediante GitHub Actions (`.github/workflows/deploy.yml`) en cada push a la rama `main`.
