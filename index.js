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

// --- LOGIN ---
app.post("/login", async (req, res) => {
  const { email, password, fingerprint } = req.body;

  // 1️⃣ Iniciar sesión
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user)
    return res.status(401).json({ error: "Correo o contraseña incorrectos" });

  const user = data.user;

  // 2️⃣ Buscar si ya hay una huella registrada
  const { data: existing, error: selectErr } = await supabase
    .from("device_fingerprints")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (selectErr && selectErr.code !== "PGRST116") {
    return res.status(500).json({ error: "Error al verificar dispositivo" });
  }

  // 3️⃣ Si no hay huella → registrar la actual
  if (!existing) {
    const { error: insertErr } = await supabase
      .from("device_fingerprints")
      .insert({ user_id: user.id, fingerprint });

    if (insertErr) return res.status(500).json({ error: "Error al registrar dispositivo" });
    return res.json({ message: "Primer acceso desde este dispositivo autorizado", user });
  }

  // 4️⃣ Si ya hay huella, verificar coincidencia
  if (existing.fingerprint !== fingerprint) {
    return res
      .status(403)
      .json({ error: "Acceso bloqueado: este usuario solo puede iniciar sesión desde su dispositivo autorizado." });
  }

  res.json({ message: "Inicio de sesión exitoso", user });
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
