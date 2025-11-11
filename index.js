import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "http://localhost:5173", // Asegúrate de que el puerto de Vite esté aquí
      "https://alamedaboti.vercel.app",
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS: origen no permitido"));
    }
  },
  credentials: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
};

app.use(cors(corsOptions));
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

// --- LOGIN (Modificado) ---
app.post("/login", async (req, res) => {
  const { email, password } = req.body; // Se eliminó fingerprint

  // 1️⃣ Iniciar sesión
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return res.status(401).json({ error: "Correo o contraseña incorrectos" });
  }

  // 2️⃣ Se eliminó toda la lógica de la huella digital

  // 3️⃣ Devolver el usuario si el inicio de sesión es exitoso
  res.json({ message: "Inicio de sesión exitoso", user: data.user });
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
