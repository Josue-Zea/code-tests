const cassandra = require('cassandra-driver');
const { performance } = require('perf_hooks');
const { Readable } = require('stream');
const config = require('./config.js');
const fs = require('fs');
const keyspace = 'files';
let contactPoints = [`${config.DATABASE}`];
// let authProvider = new cassandra.auth.PlainTextAuthProvider('cassandra', 'cassandra');
let client = new cassandra.Client({
  contactPoints,
  keyspace,
  localDataCenter: 'datacenter1',
  // authProvider,
  socketOptions: {
    readTimeout: 3600000,
    // readTimeout: 0,
  },
});

const generarID = () => {
  return Math.floor(Math.random() * 1000000) + 1;
}

const splitPdf = (filePath, chunkSize = 15 * 1024 * 1024) => {
  return new Promise((resolve, reject) => {
    // Leer el archivo en memoria
    fs.readFile(filePath, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      // Obtener el tamaño total del archivo
      const fileSize = data.length;
      // Calcular el número total de pedazos
      const totalChunks = Math.ceil(fileSize / chunkSize);
      // Array para almacenar los pedazos del archivo
      const fileChunks = [];
      // Dividir el archivo en pedazos de 10MB y guardarlos en el array
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min((i + 1) * chunkSize, fileSize); // Asegurarse de no exceder el tamaño del archivo
        const chunk = data.slice(start, end);
        fileChunks.push(chunk);
      }
      // Resolver la promesa con el array de pedazos
      resolve(fileChunks);
    });
  });
};

const saveMetadata = async (idPdf, name, size) => {
  await client.execute(
    "INSERT INTO documentos (id, name, size) VALUES (?, ?, ?)",
    [idPdf, name, size]
  );
}

const clearDb = async () => {
  await client.execute(
    "truncate table documentos; truncate table pdfs;",
    []
  );
}

const saveChunk = async (id, chunk_number, chunk) => {
  await client.execute(
    "INSERT INTO pdfs (id_pdf, chunk, data) VALUES (?, ?, ?)",
    [id, chunk_number, chunk],
    { prepare: true }
  );
}

const savePdfInDatabase = async (namePdf) => {
  // Carga el archivo PDF.
  const pdfFile = fs.readFileSync(namePdf);

  // Divide el PDF en pedazos de 1 MB.
  const chunks = await splitPdf(namePdf);

  // Generamos el id del nuevo pdf
  const id = `${generarID()}`;

  // Guarda los pedazos del PDF en la tabla de datos.
  for (let i = 0; i < chunks.length; i++) {
    await saveChunk(id, i + 1, chunks[i]);
  }

  // Guarda los metadatos del PDF en la tabla de metadatos.
  await saveMetadata(id, namePdf, pdfFile.length);
}

const getPdfChunks = async (idPdf) => {
  const query = "SELECT data FROM pdfs WHERE id_pdf = ? ORDER BY chunk ASC";
  const result = await client.execute(query, [idPdf]);

  if (result.hasError) {
    throw new Error(result.error);
  }

  return result.rows;
}

const sendPdfResponse = async (id, res) => {
  const chunks = await getPdfChunks(id);

  // Crear un stream de lectura que emite los fragmentos del PDF
  const pdfStream = new Readable({
    read() {
      chunks.forEach(chunk => this.push(chunk.data));
      this.push(null); // Fin del stream
    }
  });

  // Configurar los encabezados de la respuesta
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=${id}.pdf`);

  // Puede ser útil configurar otros encabezados aquí

  // Pipe el stream al objeto de respuesta
  pdfStream.pipe(res);
}

const express = require("express");
var timeout = require('connect-timeout');

const app = express();
app.use(timeout('500s'));

const err = (error) => {
  console.log(error);
}

app.get("/", async (req, res) => {
  res.send("Hola, mundo!");
});

app.get("/cleardb", async (req, res) => {//100 MB
  const startTime = performance.now();
  try {
    await clearDb();
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    res.setHeader('X-Response-Time', responseTime / 1000);
    res.send("CLEARDB");
  } catch (error) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    res.setHeader('X-Response-Time', responseTime / 1000);
    err(error);
    res.send(`CLEARDB ${error}`);
  }
});

app.get("/loadpdf/:name", async (req, res) => {//100 MB
  const startTime = performance.now();
  const name = req.params.name;
  try {
    await savePdfInDatabase(`${name}`);
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    res.setHeader('X-Response-Time', responseTime / 1000);
    res.send("PDF1 exitoso");
  } catch (error) {
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    res.setHeader('X-Response-Time', responseTime / 1000);
    err(error);
    res.send(`PDF1 fail ${error}`);
  }
});

app.get("/getpdf/:id", async (req, res) => {
  const id = req.params.id;
  try {
    await sendPdfResponse(id, res);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

// Escucha en el puerto 3000
app.listen(config.PORT, () => {
  console.log(`Servidor escuchando en el puerto ${config.PORT}`);
});