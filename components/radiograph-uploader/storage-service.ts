import { db } from "../../lib/db"; // Importar la conexión desde db.ts
import type { FileItem } from ".";

// Función para generar URL de vista previa para un archivo
export function generatePreviewUrl(file: File): string {
  return URL.createObjectURL(file)
}

// Obtener archivos de un paciente
export async function loadPatientFiles(patientId: string) {
  const res = await fetch(`/api/archivos?patientId=${patientId}`);
  if (!res.ok) throw new Error("Error al cargar archivos");
  return res.json();
}

// Guardar archivo
export async function saveFileItem(file: any) {
  // Cambia el envío de JSON por FormData para soportar archivos binarios
  const formData = new FormData();
  formData.append("file", file.file); // file.file debe ser un objeto File real
  formData.append("patientId", file.patientId);
  if (file.tag) formData.append("tag", file.tag);
  if (file.description) formData.append("description", file.description);

  const res = await fetch("/api/archivos", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Error al guardar archivo");
  return res.json();
}

// Eliminar archivo
export async function deleteFileItem(patientId: string, fileId: string) {
  const res = await fetch(`/api/archivos?id=${fileId}&patientId=${patientId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Error al eliminar archivo");
  return res.json();
}

// Función para actualizar la etiqueta de un archivo en la base de datos
export async function updateFileTag(patientId: string, fileId: string, newTag: string): Promise<void> {
  const res = await fetch(`/api/archivos?patientId=${patientId}&id=${fileId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tag: newTag }),
  });
  if (!res.ok) throw new Error("Error al actualizar etiqueta");
  console.log(`Etiqueta actualizada para el archivo: ${fileId}`);
}

// Función para renombrar un archivo en la base de datos
export async function renameFileItem(patientId: string, fileId: string, newName: string): Promise<void> {
  const res = await fetch(`/api/archivos?patientId=${patientId}&id=${fileId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: newName }),
  });
  if (!res.ok) throw new Error("Error al renombrar archivo");
  console.log(`Archivo renombrado en la base de datos: ${fileId}`);
}
