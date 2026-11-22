# Simulador Clínico

Aplicación web interactiva de simulación de casos clínicos diseñada para estudiantes de medicina. Permite practicar el razonamiento clínico de principio a fin y recibir una devolución estructurada basada en guías de práctica clínica.

**[Abrir aplicación en vivo →](https://sofiatorruella3.github.io/clinic-mastery-quest/)**

---

## Características principales

- **13 aparatos y sistemas:** Cardiovascular, Respiratorio, Digestivo, Nefrourológico, Neurológico, Endocrino-metabólico, Hematológico, Infectología, Reumatológico / Osteoarticular, Ginecoobstétrico, Dermatología, Otorrinolaringología y Oftalmología.
- **3 niveles de dificultad:** Baja, Moderada y Difícil, variando la presentación clínica, comorbilidades y diagnósticos diferenciales.
- **Flujo clínico en 6 etapas:**
  1. **Anamnesis:** entrevista conversacional interactiva con el paciente.
  2. **Examen físico:** solicitud de maniobras y signos con valores concretos.
  3. **Estudios complementarios:** pedido e interpretación de laboratorio e imágenes.
  4. **Diagnóstico presuntivo.**
  5. **Tratamiento.**
  6. **Seguimiento.**
- **Devolución basada en guías:** al finalizar cada caso se genera un puntaje y un análisis por etapa indicando aciertos, errores, aspectos omitidos, conductas a evitar y las guías de práctica clínica de referencia.
- **Historial de prácticas:** guarda localmente en el navegador los casos completados para revisarlos cuando quieras.

## Tecnologías

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

Para generar la compilación de producción:

```bash
npm run build
```

## Despliegue

El sitio se compila y publica automáticamente en **GitHub Pages** mediante GitHub Actions (`.github/workflows/deploy.yml`) en cada push a la rama `main`.
