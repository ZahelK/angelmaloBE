import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Conexión Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Ruta para guardar datos
app.get("/", (req, res) => {
  res.send("✅ Servidor backend funcionando correctamente");
});

app.get("/api/test", (req, res) => {
  res.json({ message: "✅ Backend conectado correctamente" });
});

app.post("/api/form", async (req, res) => {
  const { nombre, rut, correo, numero } = req.body;

  const { data, error } = await supabase
    .from("usuarios")
    .insert([{ nombre, rut, correo, numero }]);

  if (error) {
    console.error("❌ Error al insertar:", error);
    return res.status(400).json({ error: error.message });
  }

  res.json({ success: true, data });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Servidor en puerto ${PORT}`));

async function testSupabase() {
  try {
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .limit(1);
    if (error) throw error;
    console.log("✅ Conexión correcta a Supabase");
    console.log("Ejemplo de datos:", data);
  } catch (err) {
    console.error("❌ Error al conectar con Supabase:", err.message);
  }
}

testSupabase();
