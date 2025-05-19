import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ResultSetHeader } from "mysql2";

interface Patient {
  id: number;
  name: string;
  age: number;
  sex: string | null;
  otherSex: string | null;
  birthdate: string | null;
  nationality: string | null;
  occupation: string | null;
  doctor: string | null;
  origin: string | null;
  residence: string | null;
  address: string | null;
  religion: string | null;
  email: string | null;
  phone: string | null;
  additionalPhones: string | null;
  guardian: string | null;
  birthWeight: string | null;
  birthHeight: string | null;
  birthType: string | null;
  otherBirthType: string | null;
  lastDentalExam: string | null;
  consultationReason: string | null;
  treatmentInterest: string | null;
  hereditaryDiseases: string | null;
  newHereditaryDisease: string | null;
  hereditaryNotes: string | null;
  personalHabits: string | null;
  newPersonalHabit: string | null;
  housingType: string | null;
  feeding: string | null;
  smoking: boolean | null;
  smokingDate: string | null;
  alcohol: boolean | null;
  alcoholDate: string | null;
  immunization: boolean | null;
  hobbies: string | null;
  sexualLife: string | null;
  healthConditions: string | null;
  orthodonticConsultation: boolean | null;
  orthodonticDate: string | null;
  orthodonticReason: string | null;
  biteProblems: string | null;
  dentalComments: string | null;
  systems: string | null;
  bloodPressure: string | null;
  respiratoryRate: string | null;
  pulse: string | null;
  temperature: string | null;
  regionalObservations: string | null;
  oralExploration: string | null;
  specialObservations: string | null;
  additionalInfo: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      // Consulta para un paciente específico
      const [rows] = await db.query<Patient[]>(
        `SELECT * FROM patients WHERE id = ?`,
        [id]
      );

      if (Array.isArray(rows) && rows.length > 0) {
        return NextResponse.json(rows[0]);
      } else {
        return NextResponse.json({ error: "Paciente no encontrado" }, { status: 404 });
      }
    } else {
      // Búsqueda global
      const search = searchParams.get("search")?.trim();
      if (search) {
        const [rows] = await db.query<Patient[]>(`
          SELECT * FROM patients
          WHERE name LIKE ? OR guardian LIKE ?
          ORDER BY id DESC
        `, [`%${search}%`, `%${search}%`]);

        return NextResponse.json({
          patients: rows,
          total: Array.isArray(rows) ? rows.length : 0
        });
      }

      // Paginación
      const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 100);
      const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));

      // Obtener total de pacientes
      const [totalRows] = await db.query<{ total: number }[]>(
        "SELECT COUNT(*) as total FROM patients"
      );
      const total = totalRows[0]?.total || 0;

      // Obtener pacientes paginados
      const [rows] = await db.query<Patient[]>(`
        SELECT * FROM patients
        ORDER BY id DESC
        LIMIT ? OFFSET ?
      `, [limit, offset]);

      return NextResponse.json({ patients: rows, total });
    }
  } catch (error) {
    console.error("Error en GET /api/patients:", error);
    return NextResponse.json(
      { error: "Error al obtener pacientes", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      age,
      guardian,
      phone,
      email = null,
      sex = null,
      birthdate = null,
      additionalPhones = null,
      // Puedes agregar más campos según necesites
    } = body;

    // Validación de campos obligatorios
    if (!name || !guardian || !age || !phone) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios: nombre, tutor, edad y teléfono" },
        { status: 400 }
      );
    }

    // Insertar nuevo paciente
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO patients (
        name, age, guardian, phone, email, sex, birthdate, additionalPhones,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [name, age, guardian, phone, email, sex, birthdate,
        additionalPhones ? JSON.stringify(additionalPhones) : null]
    );

    return NextResponse.json({
      success: true,
      id: result.insertId,
      message: "Paciente registrado correctamente"
    });

  } catch (error) {
    console.error("Error en POST /api/patients:", error);
    return NextResponse.json(
      { error: "Error al registrar paciente", details: error.message },
      { status: 500 }
    );
  }
}