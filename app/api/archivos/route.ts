import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import path from "path"
import { promises as fs } from "fs"

// Tipos permitidos
const ALLOWED_MIME_TYPES = [
    'image/png',
    'image/jpeg',
    'image/gif',
    'application/pdf'
]

// GET: Obtener archivos de un paciente
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const patientId = searchParams.get("patientId")

    if (!patientId) {
        return NextResponse.json({ error: "ID de paciente requerido" }, { status: 400 })
    }

    try {
        const [rows] = await db.query(
            `SELECT 
        id, 
        name, 
        type, 
        size, 
        url, 
        tag, 
        uploadDate, 
        description 
      FROM archivos 
      WHERE patientId = ? 
      ORDER BY uploadDate DESC`,
            [patientId]
        )

        return NextResponse.json(rows)
    } catch (error: any) {
        return NextResponse.json(
            { error: "Error al obtener archivos", details: error.message },
            { status: 500 }
        )
    }
}

// POST: Subir nuevo archivo
export async function POST(req: Request) {
    try {
        const formData = await req.formData()
        const file = formData.get('file') as File
        const patientId = formData.get('patientId') as string
        const tag = formData.get('tag') as string
        const description = formData.get('description') as string

        // Validaciones
        if (!file || !patientId) {
            return NextResponse.json(
                { error: "Archivo y ID de paciente son requeridos" },
                { status: 400 }
            )
        }



        // Guardar archivo en /public/archivos
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const fileName = `${Date.now()}_${file.name.replace(/\s/g, "_")}`
        const filePath = path.join(process.cwd(), "public", "archivos", fileName)
        await fs.writeFile(filePath, buffer)

        // URL local
        const url = `/archivos/${fileName}`

        const fileData = {
            id: crypto.randomUUID(),
            name: file.name,
            type: file.type,
            size: file.size,
            url,
            tag: tag || null,
            uploadDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
            patientId,
            description: description || null
        }

        // Guardar metadatos en la base de datos
        await db.query(
            `INSERT INTO archivos 
(id, name, type, size, url, tag, uploadDate, patientId, description) 
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                fileData.id,
                fileData.name,
                fileData.type,
                fileData.size,
                fileData.url,
                fileData.tag,
                fileData.uploadDate,
                fileData.patientId,
                fileData.description
            ]
        )

        return NextResponse.json({ success: true, file: fileData })
    } catch (error: any) {
        return NextResponse.json(
            { error: "Error al subir archivo", details: error.message },
            { status: 500 }
        )
    }
}

// DELETE: Eliminar archivo
export async function DELETE(req: Request) {
    const { searchParams } = new URL(req.url)
    const fileId = searchParams.get("id")
    const patientId = searchParams.get("patientId")

    if (!fileId || !patientId) {
        return NextResponse.json(
            { error: "ID de archivo y paciente son requeridos" },
            { status: 400 }
        )
    }

    try {
        // Primero obtener la URL del archivo para eliminarlo del almacenamiento
        const [rows] = await db.query(
            "SELECT url FROM archivos WHERE id = ? AND patientId = ?",
            [fileId, patientId]
        )

        const files = rows as any[]
        if (files.length === 0) {
            return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 })
        }

        // Eliminar el archivo físico del almacenamiento
        const fileUrl = files[0].url // Ejemplo: /archivos/imagen.png
        if (fileUrl) {
            const filePath = path.join(process.cwd(), "public", fileUrl)
            try {
                await fs.unlink(filePath)
            } catch (err) {
                // Si el archivo no existe, solo loguea el error pero no detiene el flujo
                console.warn("No se pudo eliminar el archivo físico:", err)
            }
        }

        // Eliminar el registro de la base de datos
        await db.query(
            "DELETE FROM archivos WHERE id = ? AND patientId = ?",
            [fileId, patientId]
        )

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json(
            { error: "Error al eliminar archivo", details: error.message },
            { status: 500 }
        )
    }
}

// PUT: Actualizar archivo
export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, patientId, name, tag } = body;

        if (!id || !patientId) {
            return NextResponse.json(
                { error: "ID de archivo y paciente son requeridos" },
                { status: 400 }
            );
        }

        // Solo actualiza los campos enviados
        let setClause = [];
        let values: any[] = [];

        if (typeof name === "string" && name.length > 0) {
            setClause.push("name = ?");
            values.push(name);
        }
        if (typeof tag === "string" && tag.length > 0) {
            setClause.push("tag = ?");
            values.push(tag);
        }

        if (setClause.length === 0) {
            return NextResponse.json(
                { error: "No hay campos para actualizar" },
                { status: 400 }
            );
        }

        values.push(id, patientId);

        await db.query(
            `UPDATE archivos SET ${setClause.join(", ")} WHERE id = ? AND patientId = ?`,
            values
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json(
            { error: "Error al actualizar archivo", details: error.message },
            { status: 500 }
        );
    }
}