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

// ... (después de la conexión de supabase)

// MIDDLEWARE DE AUTENTICACIÓN
const checkAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "No se proveyó un token (No header)" });
  }

  const token = authHeader.split(" ")[1]; // "Bearer TOKEN" -> "TOKEN"

  if (!token) {
    return res.status(401).json({ error: "Token mal formado" });
  }

  // Aquí Supabase verifica el token
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }

  // ¡Éxito! El token es válido.
  // Adjuntamos el usuario a la request para usarlo en la ruta
  req.user = user;
  next(); // Pasa a la siguiente función (la ruta)
};

// ... (tus rutas públicas como /login, /api/form, etc.)
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
  const { email, password } = req.body; 

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error || !data.user) {
    return res.status(401).json({ error: "Correo o contraseña incorrectos" });
  }

  // ¡CAMBIO CLAVE!
  // Devuelve el usuario Y la sesión completa.
  // data.session contiene el access_token (el JWT)
  res.json({ 
    message: "Inicio de sesión exitoso", 
    user: data.user,
    session: data.session // <-- AÑADE ESTO
  });
});


// --- RUTAS PROTEGIDAS ---
// Ahora puedes crear rutas que SOLO usuarios logueados pueden consumir.

// Ejemplo de ruta protegida:
app.get("/api/dashboard-data", checkAuth, (req, res) => {
  // Gracias al middleware checkAuth, este código solo se ejecuta
  // si el token es válido.

  // Además, tenemos acceso al usuario desde req.user
  console.log("Usuario que hace la petición:", req.user.email);
  
  res.json({ 
    message: `Hola ${req.user.email}, esta es tu información secreta.`,
    data: [
      { id: 1, item: "Dato secreto 1" },
      { id: 2, item: "Dato secreto 2" }
    ]
  });
});


// ... (resto de tu código, como app.listen)




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
