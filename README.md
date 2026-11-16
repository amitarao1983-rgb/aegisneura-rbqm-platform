# Rodent DILI app

Reads liver histopathology fields from rats and other rodents and scores a drug-induced liver injury pattern for preclinical studies.

Upload a PNG, JPEG, WEBP, or TIFF field, add the species, strain, sex, study, animal, dose group, and stain, then run the reader. The result is an INHAND-style call with stain measurements and lesion grades. Synthetic practice fields are included. Whole-slide SVS and NDPI files are not supported.

The scorer is a placeholder (`predictFromFeatures` in `src/lib/dili/predict.ts`). A veterinary pathologist confirms every call before it is used in a study report.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). `npm run dev` uses webpack so the slide reader can load images on Windows.

## API

| Endpoint | Description |
|----------|-------------|
| `POST /api/dili/predict` | Multipart liver field (`file` plus species, strain, sex, studyId, animalId, doseGroup, dose, stain) |
| `GET /api/dili/cases` | Recent reads |
| `GET /api/dili/cases/[id]` | One read |
| `GET /api/dili/cases/[id]/image` | Stored slide image |
| `DELETE /api/dili/cases/[id]` | Remove a read |
