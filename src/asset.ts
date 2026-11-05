// Filer i public/ serveres under basePath (/julequiz/), som Vite ikke selv sætter foran
// håndskrevne stier.
export const asset = (path: string) => import.meta.env.BASE_URL + path.replace(/^\//, "");
